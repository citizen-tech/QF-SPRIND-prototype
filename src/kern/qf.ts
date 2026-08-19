// Budgetbeschränktes Quadratic Funding.
//
// Determinismus-Regeln (FORMEL.md Abschnitt 6):
//   1. Kanonische Sortierung vor jeder Summierung.
//   2. Wurzelarithmetik in Euro, nicht in Cent.
//   3. Kein Math.random, kein Date.now.
//   4. Alle Rundungsschritte über aufCentRunden.

import type { Beitrag, Rundendaten, Vorhaben } from './typen';
import { verteileNachGewicht, type Verteileintrag, type Verteilergebnis } from './verteilung';

/** Kanonische Sortierung nach (vorhabenId, beitragendeId, zeitpunkt, betragCent). */
export function sortiereBeitraege(beitraege: readonly Beitrag[]): Beitrag[] {
  return [...beitraege].sort((a, b) => {
    if (a.vorhabenId !== b.vorhabenId) return a.vorhabenId < b.vorhabenId ? -1 : 1;
    if (a.beitragendeId !== b.beitragendeId) return a.beitragendeId < b.beitragendeId ? -1 : 1;
    if (a.zeitpunkt !== b.zeitpunkt) return a.zeitpunkt < b.zeitpunkt ? -1 : 1;
    return a.betragCent - b.betragCent;
  });
}

/** Beitragssumme einer Person an ein Vorhaben — die Größe, aus der die Wurzel gezogen wird. */
export type Beitragsposten = {
  beitragendeId: string;
  betragCent: number;
  betragEuro: number;
  wurzel: number;
};

export type Vorhabenwerte = {
  vorhabenId: string;
  /** Kanonisch sortierte Einzelbeiträge dieses Vorhabens. */
  beitraege: Beitrag[];
  /** Je Person zusammengefasste Beiträge, nach beitragendeId aufsteigend. */
  posten: Beitragsposten[];
  beitraegeAnzahl: number;
  /** Zahl der verschiedenen beitragenden Personen ("Köpfe"). */
  beitragendeAnzahl: number;
  eigenCent: number;
  eigenEuro: number;
  /** Summe der Wurzeln der Beitragsposten, in Wurzel-Euro. */
  wurzelsumme: number;
  /** Quadrat der Wurzelsumme. */
  quadrat: number;
  /** Ungedeckelter Matching-Bedarf in Euro: max(0, quadrat − eigen). */
  rohEuro: number;
  /** Höchstbetrag dieses Vorhabens in Cent. */
  deckelCent: number;
  /** Welche Grenze den Deckel bestimmt hat. */
  deckelGrund: 'hoechstbetrag' | 'kostenplan' | 'beide' | 'kein';
};

/**
 * Grundwerte je Vorhaben. Basis für alle fünf Verfahren — die Deckel gelten
 * überall gleich, nur das Gewicht unterscheidet sich.
 */
export function berechneVorhabenwerte(daten: Rundendaten): Vorhabenwerte[] {
  const sortiert = sortiereBeitraege(daten.beitraege);
  const jeVorhaben = new Map<string, Beitrag[]>();
  for (const b of sortiert) {
    const liste = jeVorhaben.get(b.vorhabenId);
    if (liste) liste.push(b);
    else jeVorhaben.set(b.vorhabenId, [b]);
  }

  const obergrenzeCent = daten.runde.hoechstbetragJeVorhabenCent;

  return daten.vorhaben.map((v: Vorhaben): Vorhabenwerte => {
    const beitraege = jeVorhaben.get(v.id) ?? [];

    // Mehrfachbeiträge derselben Person werden vor der Wurzelziehung addiert.
    // Andernfalls ließe sich durch Aufteilen einer Zahlung zusätzliches
    // Matching erzeugen (siehe FORMEL.md, Sonderfälle).
    const summeJePerson = new Map<string, number>();
    for (const b of beitraege) {
      summeJePerson.set(b.beitragendeId, (summeJePerson.get(b.beitragendeId) ?? 0) + b.betragCent);
    }

    const posten: Beitragsposten[] = [...summeJePerson.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([beitragendeId, betragCent]) => ({
        beitragendeId,
        betragCent,
        betragEuro: betragCent / 100,
        wurzel: Math.sqrt(betragCent / 100),
      }));

    let eigenCent = 0;
    let wurzelsumme = 0;
    for (const p of posten) {
      eigenCent += p.betragCent;
      wurzelsumme += p.wurzel;
    }
    const eigenEuro = eigenCent / 100;
    const quadrat = wurzelsumme * wurzelsumme;
    // Bei höchstens einer beitragenden Person ist der Rohbedarf mathematisch
    // exakt null; in der Binärdarstellung bliebe sonst ein Rest um 1e-13 stehen.
    const rohEuro = posten.length <= 1 ? 0 : Math.max(0, quadrat - eigenEuro);

    // Zuteilung + Eigenmittel dürfen den Kostenplan nicht überschreiten:
    // die Bürgerbeiträge sind bereits Drittmittel im Sinne der Finanzierung.
    const ausKostenplanCent = v.beantragtCent - eigenCent;
    const ausHoechstbetragCent = obergrenzeCent ?? Number.POSITIVE_INFINITY;
    const deckelCent = Math.max(0, Math.min(ausHoechstbetragCent, ausKostenplanCent));

    let deckelGrund: Vorhabenwerte['deckelGrund'] = 'kein';
    if (Number.isFinite(ausHoechstbetragCent) && ausHoechstbetragCent === ausKostenplanCent) {
      deckelGrund = 'beide';
    } else if (deckelCent === ausHoechstbetragCent) {
      deckelGrund = 'hoechstbetrag';
    } else if (deckelCent === ausKostenplanCent) {
      deckelGrund = 'kostenplan';
    }

    return {
      vorhabenId: v.id,
      beitraege,
      posten,
      beitraegeAnzahl: beitraege.length,
      beitragendeAnzahl: posten.length,
      eigenCent,
      eigenEuro,
      wurzelsumme,
      quadrat,
      rohEuro,
      deckelCent,
      deckelGrund,
    };
  });
}

/** Verteileinträge aus Grundwerten und einer Gewichtsfunktion. */
export function alsVerteileintraege(
  werte: readonly Vorhabenwerte[],
  gewicht: (w: Vorhabenwerte) => number,
): Verteileintrag[] {
  return werte.map((w) => ({ id: w.vorhabenId, gewicht: gewicht(w), deckelCent: w.deckelCent }));
}

/** Budgetbeschränktes Quadratic Funding: Gewicht = ungedeckelter Rohbedarf. */
export function berechneQf(daten: Rundendaten, werte?: readonly Vorhabenwerte[]): Verteilergebnis {
  const grundwerte = werte ?? berechneVorhabenwerte(daten);
  return verteileNachGewicht(
    alsVerteileintraege(grundwerte, (w) => w.rohEuro),
    daten.runde.poolCent,
  );
}
