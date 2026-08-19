// Relative Hebelanzeige.
//
// Bewusst OHNE Euro-Angabe: Bei gedeckeltem Topf hängt der Grenzmatch eines
// Beitrags von allen übrigen Beiträgen der Runde ab. Eine angezeigte Eurozahl
// wäre im Regelfall zu hoch und am Rundenende falsch. Das Verhältnis zu einem
// benannten Bezugsvorhaben ist gegen spätere Verschiebungen unempfindlich.

import { berechneQf, berechneVorhabenwerte } from './qf';
import type { Beitrag, Rundendaten } from './typen';

/** Betrag des Probebeitrags, mit dem der Hebel gemessen wird. */
export const PROBEBEITRAG_CENT = 1_000;

const PROBE_PERSON = 'probe-hebel';

export type Hebelwert = {
  vorhabenId: string;
  /** Zuwachs der Zuteilung dieses Vorhabens durch den Probebeitrag, in Cent. */
  zuwachsCent: number;
  /** Vielfaches des Zuwachses beim Bezugsvorhaben. Null, wenn nicht bestimmbar. */
  verhaeltnis: number | null;
};

export type Hebelanzeige = {
  /** Vorhaben, an dem gemessen wird. Null, wenn kein geeignetes existiert. */
  bezugVorhabenId: string | null;
  werte: Map<string, Hebelwert>;
};

function mitProbebeitrag(daten: Rundendaten, vorhabenId: string): Rundendaten {
  const probe: Beitrag = {
    vorhabenId,
    beitragendeId: PROBE_PERSON,
    betragCent: PROBEBEITRAG_CENT,
    zeitpunkt: `${daten.runde.zeitraum.von}T00:00:00.000Z`,
    merkmal: { region: 'nicht angegeben', altersgruppe: 'nicht angegeben' },
  };
  return { ...daten, beitraege: [...daten.beitraege, probe] };
}

/**
 * Misst je Vorhaben, wie stark ein zusätzlicher Beitrag wirkt, und setzt das ins
 * Verhältnis zum Bezugsvorhaben.
 *
 * Bezugsvorhaben ist das von den meisten Personen getragene Vorhaben, dessen
 * Zuteilung **nicht** an einem Höchstbetrag steht. Ein gedeckeltes Vorhaben
 * reagiert auf zusätzliche Beiträge nicht mehr; als Bezug wäre es unbrauchbar.
 */
export function berechneHebel(daten: Rundendaten): Hebelanzeige {
  const grundwerte = berechneVorhabenwerte(daten);
  const basis = berechneQf(daten, grundwerte);

  const zuwachs = new Map<string, number>();
  for (const v of daten.vorhaben) {
    const erhoeht = berechneQf(mitProbebeitrag(daten, v.id));
    zuwachs.set(
      v.id,
      (erhoeht.zuteilungCent.get(v.id) ?? 0) - (basis.zuteilungCent.get(v.id) ?? 0),
    );
  }

  const gedeckelt = new Set(basis.schritte.filter((s) => s.gedeckelt).map((s) => s.id));
  const bezug = [...grundwerte]
    .filter((w) => !gedeckelt.has(w.vorhabenId) && (zuwachs.get(w.vorhabenId) ?? 0) > 0)
    .sort((a, b) => {
      if (b.beitragendeAnzahl !== a.beitragendeAnzahl) {
        return b.beitragendeAnzahl - a.beitragendeAnzahl;
      }
      return a.vorhabenId < b.vorhabenId ? -1 : 1;
    })[0];

  const bezugZuwachs = bezug ? (zuwachs.get(bezug.vorhabenId) ?? 0) : 0;

  const werte = new Map<string, Hebelwert>();
  for (const v of daten.vorhaben) {
    const eigen = zuwachs.get(v.id) ?? 0;
    werte.set(v.id, {
      vorhabenId: v.id,
      zuwachsCent: eigen,
      verhaeltnis: bezugZuwachs > 0 ? eigen / bezugZuwachs : null,
    });
  }

  return { bezugVorhabenId: bezug ? bezug.vorhabenId : null, werte };
}
