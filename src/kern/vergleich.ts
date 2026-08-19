// Die fünf Verteilregeln auf denselben Daten, demselben Topf, denselben
// Höchstbeträgen. Wirtschaftlichkeit ist ein Vergleichsbegriff — ohne
// Grundlinie keine Aussage.

import { berechneKennzahlen, type Kennzahlen } from './kennzahlen';
import { alsVerteileintraege, berechneVorhabenwerte, type Vorhabenwerte } from './qf';
import type { Rundendaten } from './typen';
import { fuelleNachRangfolge, verteileNachGewicht, type Verteilergebnis } from './verteilung';

export const VERFAHREN_IDS = ['qf', 'giesskanne', 'windhund', 'jury', 'anteilig'] as const;
export type VerfahrenId = (typeof VERFAHREN_IDS)[number];

export type Verfahrensbeschreibung = {
  id: VerfahrenId;
  bezeichnung: string;
  regel: string;
  /** Modellierte Annahme statt gemessenem Verfahren — muss in der Oberfläche ausgewiesen werden. */
  modelliert: boolean;
};

export const VERFAHREN: Record<VerfahrenId, Verfahrensbeschreibung> = {
  qf: {
    id: 'qf',
    bezeichnung: 'Quadratic Funding (gedeckelt)',
    regel:
      'Gewicht ist der Rohbedarf: Quadrat der Wurzelsumme der Einzelbeiträge abzüglich der Beitragssumme. Zählt Köpfe, nicht Euro.',
    modelliert: false,
  },
  giesskanne: {
    id: 'giesskanne',
    bezeichnung: 'Gießkanne',
    regel:
      'Gleicher Betrag je zugelassenem Vorhaben. Überschuss aus gedeckelten Vorhaben wird auf die übrigen weiterverteilt.',
    modelliert: false,
  },
  windhund: {
    id: 'windhund',
    bezeichnung: 'Windhundverfahren',
    regel:
      'Reihenfolge nach Antragseingang. Jedes Vorhaben erhält seinen Höchstbetrag, bis der Topf erschöpft ist.',
    modelliert: true,
  },
  jury: {
    id: 'jury',
    bezeichnung: 'Jury-Ranking',
    regel:
      'Reihenfolge nach Jurypunkten absteigend. Jedes Vorhaben erhält seinen Höchstbetrag, bis der Topf erschöpft ist.',
    modelliert: true,
  },
  anteilig: {
    id: 'anteilig',
    bezeichnung: 'Anteilig nach Beitragssumme',
    regel: 'Gewicht ist die eingesammelte Beitragssumme. Zählt Euro, nicht Köpfe.',
    modelliert: false,
  },
};

export const MODELLIERUNGSHINWEIS =
  'Modelliert: volle Zuteilung in Rangfolge bis zur Erschöpfung des Topfes. ' +
  'Windhundverfahren und Jury-Ranking sind angenommene Vergleichsregeln, keine gemessenen Verfahren.';

export type Verfahrensergebnis = Verteilergebnis & {
  verfahren: VerfahrenId;
  kennzahlen: Kennzahlen;
};

function rangfolgeErgebnis(
  daten: Rundendaten,
  werte: readonly Vorhabenwerte[],
  reihenfolge: readonly string[],
): Verteilergebnis {
  const deckelNachId = new Map(werte.map((w) => [w.vorhabenId, w.deckelCent]));
  return fuelleNachRangfolge(
    reihenfolge.map((id) => ({ id, deckelCent: deckelNachId.get(id) ?? 0 })),
    daten.runde.poolCent,
  );
}

function windhundReihenfolge(daten: Rundendaten): string[] {
  return [...daten.vorhaben]
    .sort((a, b) => {
      if (a.eingangZeitpunkt !== b.eingangZeitpunkt) {
        return a.eingangZeitpunkt < b.eingangZeitpunkt ? -1 : 1;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map((v) => v.id);
}

function juryReihenfolge(daten: Rundendaten): string[] {
  return [...daten.vorhaben]
    .sort((a, b) => {
      if (a.jurypunkte !== b.jurypunkte) return b.jurypunkte - a.jurypunkte;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map((v) => v.id);
}

export function berechneVerfahren(
  daten: Rundendaten,
  verfahren: VerfahrenId,
  werte: readonly Vorhabenwerte[],
): Verfahrensergebnis {
  const pool = daten.runde.poolCent;
  let ergebnis: Verteilergebnis;

  switch (verfahren) {
    case 'qf':
      ergebnis = verteileNachGewicht(alsVerteileintraege(werte, (w) => w.rohEuro), pool);
      break;
    case 'giesskanne':
      ergebnis = verteileNachGewicht(alsVerteileintraege(werte, () => 1), pool);
      break;
    case 'anteilig':
      ergebnis = verteileNachGewicht(alsVerteileintraege(werte, (w) => w.eigenEuro), pool);
      break;
    case 'windhund':
      ergebnis = rangfolgeErgebnis(daten, werte, windhundReihenfolge(daten));
      break;
    case 'jury':
      ergebnis = rangfolgeErgebnis(daten, werte, juryReihenfolge(daten));
      break;
  }

  return {
    ...ergebnis,
    verfahren,
    kennzahlen: berechneKennzahlen(daten, ergebnis.zuteilungCent, ergebnis.nichtAusgeschoepftCent),
  };
}

export function alleVerfahren(
  daten: Rundendaten,
  werte?: readonly Vorhabenwerte[],
): Record<VerfahrenId, Verfahrensergebnis> {
  const grundwerte = werte ?? berechneVorhabenwerte(daten);
  const ausgang = {} as Record<VerfahrenId, Verfahrensergebnis>;
  for (const id of VERFAHREN_IDS) ausgang[id] = berechneVerfahren(daten, id, grundwerte);
  return ausgang;
}
