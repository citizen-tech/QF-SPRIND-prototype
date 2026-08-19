// Gemeinsame Verteilroutinen. Alle fünf Vergabeverfahren laufen über genau zwei
// Funktionen — verteileNachGewicht und fuelleNachRangfolge — plus die eine
// Rundungsfunktion aufCentRunden. Keine getrennten Implementierungen je Verfahren.

import { HOECHSTZAHL_DURCHLAEUFE } from './version';

export type Verteileintrag = {
  id: string;
  /** Relatives Gewicht. Nur Verhältnisse zählen, die Einheit ist gleichgültig. */
  gewicht: number;
  /** Höchstbetrag dieses Eintrags in Cent, bereits ganzzahlig und ≥ 0. */
  deckelCent: number;
};

export type Verteilschritt = {
  id: string;
  /** Rang in der Reihenfolge, nur bei rangfolgebasierten Verfahren gesetzt. */
  rang: number | null;
  /** Gewicht, nur bei gewichtsbasierten Verfahren gesetzt. */
  gewicht: number | null;
  /** Anteil am Gesamtgewicht aller Einträge (nicht nur der freien). */
  anteilAmGewicht: number | null;
  /** Zuteilung vor Anwendung des Deckels, in Cent (ungerundet). */
  vorlaeufigCent: number;
  deckelCent: number;
  gedeckelt: boolean;
  /** Durchlauf, in dem der Eintrag auf den Deckel fixiert wurde. */
  fixiertInDurchlauf: number | null;
  endbetragCent: number;
};

export type Verteilergebnis = {
  zuteilungCent: Map<string, number>;
  iterationen: number;
  nichtAusgeschoepftCent: number;
  schritte: Verteilschritt[];
};

/**
 * Verteilt zielCent exakt auf die Einträge, proportional zu anteilEuro.
 * Größte-Reste-Verfahren, Gleichstand → aufsteigende id.
 *
 * Die Multiplikation euro*100 kann durch die Binärdarstellung minimal unter dem
 * beabsichtigten Centwert liegen (412.17 * 100 = 41216.999999999993). Ohne
 * Toleranz würde ein bereits ganzzahlig fixierter Betrag um einen Cent
 * abgeschnitten. Die Toleranz ist ein fester Wert und damit deterministisch.
 */
const CENT_TOLERANZ = 1e-9;

export function aufCentRunden(
  eintraege: { id: string; euro: number }[],
  zielCent: number,
): Map<string, number> {
  const zeilen = eintraege.map((e) => {
    const roh = e.euro * 100;
    const ganz = Math.floor(roh + CENT_TOLERANZ);
    return { id: e.id, ganz, rest: Math.max(0, roh - ganz) };
  });

  const summe = zeilen.reduce((a, z) => a + z.ganz, 0);
  const restcent = zielCent - summe;

  // Erst nach id sortieren, dann stabil nach Rest: bei gleichem Rest
  // entscheidet damit die kleinere id.
  const nachId = [...zeilen].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (restcent > 0) {
    const reihenfolge = [...nachId].sort((a, b) => b.rest - a.rest);
    for (let i = 0; i < restcent && i < reihenfolge.length; i++) reihenfolge[i].ganz += 1;
  } else if (restcent < 0) {
    const reihenfolge = [...nachId].sort((a, b) => a.rest - b.rest);
    for (let i = 0; i < -restcent && i < reihenfolge.length; i++) reihenfolge[i].ganz -= 1;
  }

  return new Map(zeilen.map((z) => [z.id, z.ganz]));
}

/**
 * Gewichtsproportionale Verteilung mit Höchstbeträgen, iteratives Verfahren
 * nach FORMEL.md Abschnitt 3.
 *
 * Genutzt von: Quadratic Funding (Gewicht = Rohbedarf), Gießkanne (Gewicht = 1),
 * anteilig nach Beitragssumme (Gewicht = Beitragssumme).
 */
export function verteileNachGewicht(
  eintraege: Verteileintrag[],
  poolCent: number,
): Verteilergebnis {
  const nachId = new Map(eintraege.map((e) => [e.id, e]));
  const gesamtgewicht = eintraege.reduce((a, e) => a + Math.max(0, e.gewicht), 0);

  let restpoolCent = poolCent;
  const frei = new Set(eintraege.filter((e) => e.gewicht > 0).map((e) => e.id));
  const fixiert = new Map<string, { betragCent: number; durchlauf: number }>();
  let vorlaeufig = new Map<string, number>();
  // Hält den vorläufigen Wert auch über die Fixierung hinaus fest — für das
  // Rechenprotokoll ist gerade der ungedeckelte Wert des Fixierungsdurchlaufs
  // die interessante Größe.
  const vorlaeufigProtokoll = new Map<string, number>();
  let iterationen = 0;
  let verteilungAbgeschlossen = false;

  while (iterationen < HOECHSTZAHL_DURCHLAEUFE) {
    if (frei.size === 0 || restpoolCent === 0) break;

    const freieIds = [...frei].sort();
    const summeGewicht = freieIds.reduce((a, id) => a + nachId.get(id)!.gewicht, 0);
    if (summeGewicht === 0) break;

    iterationen += 1;

    vorlaeufig = new Map();
    for (const id of freieIds) {
      const wert = (restpoolCent * nachId.get(id)!.gewicht) / summeGewicht;
      vorlaeufig.set(id, wert);
      vorlaeufigProtokoll.set(id, wert);
    }

    const ueberschreiter = freieIds.filter((id) => vorlaeufig.get(id)! > nachId.get(id)!.deckelCent);
    if (ueberschreiter.length === 0) {
      verteilungAbgeschlossen = true;
      break;
    }

    for (const id of ueberschreiter) {
      const deckelCent = nachId.get(id)!.deckelCent;
      fixiert.set(id, { betragCent: deckelCent, durchlauf: iterationen });
      restpoolCent -= deckelCent;
      frei.delete(id);
    }
  }

  const verteilterRestCent = verteilungAbgeschlossen ? restpoolCent : 0;
  const zielCent =
    [...fixiert.values()].reduce((a, f) => a + f.betragCent, 0) + verteilterRestCent;

  const rundungseingang = eintraege.map((e) => {
    const f = fixiert.get(e.id);
    if (f) return { id: e.id, euro: f.betragCent / 100 };
    if (verteilungAbgeschlossen && frei.has(e.id)) {
      return { id: e.id, euro: vorlaeufig.get(e.id)! / 100 };
    }
    return { id: e.id, euro: 0 };
  });

  const zuteilungCent = aufCentRunden(rundungseingang, zielCent);
  const summeZuteilung = [...zuteilungCent.values()].reduce((a, b) => a + b, 0);

  const schritte: Verteilschritt[] = eintraege.map((e) => {
    const f = fixiert.get(e.id);
    return {
      id: e.id,
      rang: null,
      gewicht: e.gewicht,
      anteilAmGewicht: gesamtgewicht > 0 ? Math.max(0, e.gewicht) / gesamtgewicht : 0,
      vorlaeufigCent: vorlaeufigProtokoll.get(e.id) ?? 0,
      deckelCent: e.deckelCent,
      gedeckelt: f !== undefined,
      fixiertInDurchlauf: f ? f.durchlauf : null,
      endbetragCent: zuteilungCent.get(e.id)!,
    };
  });

  return {
    zuteilungCent,
    iterationen,
    nichtAusgeschoepftCent: poolCent - summeZuteilung,
    schritte,
  };
}

/**
 * Volle Zuteilung in fester Rangfolge bis zur Erschöpfung des Topfes.
 * Genutzt von: Windhundverfahren, Jury-Ranking.
 *
 * Die Einträge müssen bereits in der maßgeblichen Reihenfolge übergeben werden.
 */
export function fuelleNachRangfolge(
  eintraege: { id: string; deckelCent: number }[],
  poolCent: number,
): Verteilergebnis {
  let restCent = poolCent;
  const zuteilungCent = new Map<string, number>();
  const schritte: Verteilschritt[] = [];

  eintraege.forEach((e, index) => {
    const betragCent = Math.max(0, Math.min(e.deckelCent, restCent));
    restCent -= betragCent;
    zuteilungCent.set(e.id, betragCent);
    schritte.push({
      id: e.id,
      rang: index + 1,
      gewicht: null,
      anteilAmGewicht: null,
      vorlaeufigCent: e.deckelCent,
      deckelCent: e.deckelCent,
      gedeckelt: betragCent === e.deckelCent && e.deckelCent > 0,
      fixiertInDurchlauf: null,
      endbetragCent: betragCent,
    });
  });

  return { zuteilungCent, iterationen: 1, nichtAusgeschoepftCent: restCent, schritte };
}
