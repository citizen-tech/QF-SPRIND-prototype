// Die Beispielrunde der Erklärseite.
//
// Vier Vorhaben mit exakt derselben Beitragssumme von 400 €, aber verschieden
// vielen Beitragenden. Die Zahlen sind so gewählt, dass jeder Schritt von Hand
// nachrechenbar ist: Alle Wurzeln sind ganzzahlig (√400 = 20, √100 = 10,
// √25 = 5), und der Fördertopf ist genau die Hälfte der Summe aller
// Bemessungswerte — jede Zuteilung ist also der halbe Bemessungswert.
//
// Die Runde läuft durch denselben Rechenkern wie der Prototyp. Sie ist kein
// nachgebautes Beispiel, sondern eine echte, sehr kleine Förderrunde. Was hier
// steht, kann von der Rechenregel nicht abweichen.

import type { Beitrag, Rundendaten, Vorhaben } from './typen';
import { FORMEL_VERSION } from './version';

/** Fördertopf der Beispielrunde: 5.200 €, die Hälfte von ΣR = 10.400 €. */
export const BEISPIEL_POOL_CENT = 520_000;

export type Beispielvorhaben = {
  id: string;
  buchstabe: string;
  kurz: string;
  betraegeEuro: readonly number[];
};

/** Aufsteigend nach Zahl der Beitragenden — so wachsen die Quadrate von links nach rechts. */
export const BEISPIELE: readonly Beispielvorhaben[] = [
  { id: 'e-1', buchstabe: 'A', kurz: 'ein Beitrag über 400 €', betraegeEuro: [400] },
  { id: 'e-2', buchstabe: 'B', kurz: 'vier Beiträge zu je 100 €', betraegeEuro: [100, 100, 100, 100] },
  {
    id: 'e-3',
    buchstabe: 'C',
    kurz: 'zwei zu 100 €, acht zu 25 €',
    betraegeEuro: [100, 100, 25, 25, 25, 25, 25, 25, 25, 25],
  },
  {
    id: 'e-4',
    buchstabe: 'D',
    kurz: 'sechzehn Beiträge zu je 25 €',
    betraegeEuro: Array.from({ length: 16 }, () => 25),
  },
];

const ZEITPUNKT = '2026-01-15T12:00:00.000Z';

/** Die Beispielrunde als vollwertige Rundendaten. */
export function beispielrunde(): Rundendaten {
  const vorhaben: Vorhaben[] = BEISPIELE.map((b, i) => ({
    id: b.id,
    titel: `Vorhaben ${b.buchstabe}`,
    traeger: 'Beispielträger',
    // Weit über jeder möglichen Zuteilung: In diesem Beispiel soll allein der
    // Bemessungswert entscheiden, keine Obergrenze.
    beantragtCent: 10_000_000,
    eingangZeitpunkt: new Date(Date.parse(ZEITPUNKT) + i * 86_400_000).toISOString(),
    jurypunkte: 50,
  }));

  const beitraege: Beitrag[] = BEISPIELE.flatMap((b) =>
    b.betraegeEuro.map((euro, i) => ({
      vorhabenId: b.id,
      beitragendeId: `${b.id}-p${String(i + 1).padStart(2, '0')}`,
      betragCent: euro * 100,
      zeitpunkt: ZEITPUNKT,
      merkmal: { region: 'nicht angegeben', altersgruppe: 'nicht angegeben' },
    })),
  );

  return {
    runde: {
      id: 'beispiel-erklaerung',
      formelVersion: FORMEL_VERSION,
      zweck: 'Beispielrunde zur Erläuterung der Bemessungsregel.',
      zeitraum: { von: '2026-01-01', bis: '2026-12-31' },
      poolCent: BEISPIEL_POOL_CENT,
      hoechstbetragJeVorhabenCent: null,
      zulassungskriterien: [],
    },
    vorhaben,
    beitraege,
  };
}
