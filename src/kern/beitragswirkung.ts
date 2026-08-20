// Was ein einzelner Beitrag bewirkt — aus Sicht der beitragenden Person.
//
// WICHTIG ZUR EHRLICHKEIT: Diese Werte sind keine Vorhersage auf eine laufende
// Runde. Sie sind die Nachrechnung einer abgeschlossenen: Die Runde wird mit
// dem zusätzlichen Beitrag noch einmal vollständig durchgerechnet, und die
// Differenz zur Rechnung ohne ihn ist die Wirkung.
//
// Der Unterschied ist nicht kosmetisch. Bei gedeckeltem Topf hängt die Wirkung
// eines Beitrags von allen übrigen Beiträgen der Runde ab. Während einer
// laufenden Runde wäre eine angezeigte Eurozahl deshalb im Regelfall zu hoch
// und am Rundenende falsch. Über einer abgeschlossenen Runde ist sie exakt.

import { berechneQf } from './qf';
import type { Beitrag, Rundendaten } from './typen';

/** Pseudonym des gedachten Beitrags. Taucht in keiner Auswertung auf. */
const PROBE_PERSON = 'probe-beitrag';

function mitBeitrag(daten: Rundendaten, vorhabenId: string, betragCent: number): Rundendaten {
  if (betragCent <= 0) return daten;
  const probe: Beitrag = {
    vorhabenId,
    beitragendeId: PROBE_PERSON,
    betragCent,
    zeitpunkt: `${daten.runde.zeitraum.von}T00:00:00.000Z`,
    merkmal: { region: 'nicht angegeben', altersgruppe: 'nicht angegeben' },
  };
  return { ...daten, beitraege: [...daten.beitraege, probe] };
}

export type Wirkungspunkt = {
  betragCent: number;
  /** Zuteilung des betrachteten Vorhabens bei diesem Beitrag. */
  zuteilungCent: number;
  /** Zuwachs gegenüber der Runde ohne diesen Beitrag. */
  zuwachsCent: number;
};

/**
 * Zuteilung eines Vorhabens in Abhängigkeit von der Höhe eines zusätzlichen
 * Beitrags. Jeder Punkt ist eine vollständige Neuberechnung der Runde.
 */
export function wirkungskurve(
  daten: Rundendaten,
  vorhabenId: string,
  betraege: readonly number[],
): Wirkungspunkt[] {
  const ohne = berechneQf(daten).zuteilungCent.get(vorhabenId) ?? 0;
  return betraege.map((betragCent) => {
    const zuteilungCent =
      berechneQf(mitBeitrag(daten, vorhabenId, betragCent)).zuteilungCent.get(vorhabenId) ?? 0;
    return { betragCent, zuteilungCent, zuwachsCent: zuteilungCent - ohne };
  });
}

/** Gleichmäßig verteilte Stützstellen von null bis zum Höchstwert. */
export function stuetzstellen(hoechstbetragCent: number, anzahl = 33): number[] {
  return Array.from({ length: anzahl }, (_, i) =>
    Math.round((hoechstbetragCent * i) / (anzahl - 1)),
  );
}

/** Auf 1, 2 oder 5 mal eine Zehnerpotenz runden, damit runde Beträge dastehen. */
function aufLesbarenBetrag(cent: number): number {
  if (cent <= 0) return 0;
  const groesse = 10 ** Math.floor(Math.log10(cent));
  const anteil = cent / groesse;
  const stufe = anteil < 1.5 ? 1 : anteil < 3.5 ? 2 : anteil < 7.5 ? 5 : 10;
  return stufe * groesse;
}

/**
 * Ein typischer Beitrag dieser Runde: der Median aller Einzelbeiträge, auf einen
 * lesbaren Betrag gerundet.
 *
 * Warum kein fester Probebetrag: In der Bürgerwelt liegen Beiträge bei einigen
 * Euro, bei Bund und Ländern bei Zehntausenden. Ein fester Betrag von 10 € misst
 * dort nur noch die Steigung der Wurzelfunktion nahe null. Das Ergebnis ist
 * rechnerisch richtig, als Aussage über die Runde aber wertlos — es sagt „das
 * Zweihundertfache des Einsatzes“, wo in Wirklichkeit steht, dass der Einsatz
 * verschwindend klein gegenüber allem übrigen war.
 */
export function typischerBeitragCent(daten: Rundendaten): number {
  if (daten.beitraege.length === 0) return 1_000;
  const sortiert = daten.beitraege.map((b) => b.betragCent).sort((a, b) => a - b);
  return Math.max(1, aufLesbarenBetrag(sortiert[Math.floor(sortiert.length / 2)]));
}

export type Vorhabenwirkung = {
  vorhabenId: string;
  ohneCent: number;
  mitCent: number;
  zuwachsCent: number;
};

/**
 * Derselbe Betrag, jedem Vorhaben einzeln zugedacht. Das ist die eigentliche
 * Aussage des Verfahrens: Wo wenige viel geben, bewirkt ein weiterer Beitrag
 * wenig; wo viele wenig geben, bewirkt er viel.
 */
export function wirkungJeVorhaben(daten: Rundendaten, betragCent: number): Vorhabenwirkung[] {
  const ohne = berechneQf(daten).zuteilungCent;
  return daten.vorhaben.map((v) => {
    const ohneCent = ohne.get(v.id) ?? 0;
    const mitCent =
      berechneQf(mitBeitrag(daten, v.id, betragCent)).zuteilungCent.get(v.id) ?? ohneCent;
    return { vorhabenId: v.id, ohneCent, mitCent, zuwachsCent: mitCent - ohneCent };
  });
}
