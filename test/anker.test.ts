// Die vier von Hand nachgerechneten Ankerfälle aus dem Bauplan, Abschnitt 7.
// Diese Werte sind verifiziert. Trifft der Code sie nicht, ist der Code falsch.

import { describe, expect, it } from 'vitest';
import { berechneQf, berechneVorhabenwerte } from '../src/kern/qf';
import type { Beitrag, Rundendaten, Vorhaben } from '../src/kern/typen';
import { aufCentRunden } from '../src/kern/verteilung';
import { FORMEL_VERSION } from '../src/kern/version';

function vorhaben(id: string, beantragtCent = 1_000_000): Vorhaben {
  return {
    id,
    titel: `Vorhaben ${id}`,
    traeger: `Träger ${id}`,
    beantragtCent,
    eingangZeitpunkt: '2026-07-01T00:00:00.000Z',
    jurypunkte: 50,
  };
}

function beitrag(vorhabenId: string, beitragendeId: string, betragCent: number): Beitrag {
  return {
    vorhabenId,
    beitragendeId,
    betragCent,
    zeitpunkt: '2026-07-01T00:00:00.000Z',
    merkmal: { region: 'Testregion', altersgruppe: '30-44' },
  };
}

function runde(poolCent: number, hoechstbetragJeVorhabenCent: number | null): Rundendaten['runde'] {
  return {
    id: 'anker',
    formelVersion: FORMEL_VERSION,
    zweck: 'Ankertest',
    zeitraum: { von: '2026-10-01', bis: '2026-12-31' },
    poolCent,
    hoechstbetragJeVorhabenCent,
    zulassungskriterien: [],
  };
}

// Anker 1 und 2 teilen sich dieselben Beiträge:
// A: 1 €, 1 €, 1 €, 1 €  ·  B: 4 €, 4 €
const beitraegeAB: Beitrag[] = [
  beitrag('A', 'b-01', 100),
  beitrag('A', 'b-02', 100),
  beitrag('A', 'b-03', 100),
  beitrag('A', 'b-04', 100),
  beitrag('B', 'b-05', 400),
  beitrag('B', 'b-06', 400),
];

describe('Anker 1 — Köpfe schlagen Euro', () => {
  const daten: Rundendaten = {
    runde: runde(100_000, null), // Pool 1.000,00 €, kein Höchstbetrag
    vorhaben: [vorhaben('A'), vorhaben('B')],
    beitraege: beitraegeAB,
  };

  it('berechnet die Grundwerte wie in der Tabelle', () => {
    const [a, b] = berechneVorhabenwerte(daten);

    expect(a.eigenCent).toBe(400);
    expect(a.wurzelsumme).toBeCloseTo(4, 12);
    expect(a.quadrat).toBeCloseTo(16, 12);
    expect(a.rohEuro).toBeCloseTo(12, 12);

    expect(b.eigenCent).toBe(800);
    expect(b.wurzelsumme).toBeCloseTo(4, 12);
    expect(b.quadrat).toBeCloseTo(16, 12);
    expect(b.rohEuro).toBeCloseTo(8, 12);
  });

  it('teilt 600,00 € auf A und 400,00 € auf B zu', () => {
    const ergebnis = berechneQf(daten);
    expect(ergebnis.zuteilungCent.get('A')).toBe(60_000);
    expect(ergebnis.zuteilungCent.get('B')).toBe(40_000);
    expect(ergebnis.iterationen).toBe(1);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(0);
  });

  it('A sammelt halb so viel Geld wie B und erhält anderthalbmal so viel', () => {
    const [a, b] = berechneVorhabenwerte(daten);
    const ergebnis = berechneQf(daten);
    expect(a.eigenCent * 2).toBe(b.eigenCent);
    expect(ergebnis.zuteilungCent.get('A')!).toBe(
      1.5 * ergebnis.zuteilungCent.get('B')!,
    );
  });
});

describe('Anker 2 — der Deckel greift, eine Iteration', () => {
  const daten: Rundendaten = {
    runde: runde(100_000, 55_000), // Höchstbetrag je Vorhaben 550,00 €
    vorhaben: [vorhaben('A'), vorhaben('B')],
    beitraege: beitraegeAB,
  };

  it('fixiert A auf 550,00 € und verteilt den Rest auf B', () => {
    const ergebnis = berechneQf(daten);
    expect(ergebnis.zuteilungCent.get('A')).toBe(55_000);
    expect(ergebnis.zuteilungCent.get('B')).toBe(45_000);
    expect(ergebnis.iterationen).toBe(2);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(0);
  });

  it('weist A als gedeckelt aus, B nicht', () => {
    const ergebnis = berechneQf(daten);
    const a = ergebnis.schritte.find((s) => s.id === 'A')!;
    const b = ergebnis.schritte.find((s) => s.id === 'B')!;
    expect(a.gedeckelt).toBe(true);
    expect(a.fixiertInDurchlauf).toBe(1);
    expect(a.vorlaeufigCent).toBeCloseTo(60_000, 6); // ungedeckelter Wert des Durchlaufs
    expect(b.gedeckelt).toBe(false);
    expect(b.fixiertInDurchlauf).toBe(null);
  });
});

describe('Anker 3 — Rundung', () => {
  it('gibt den Restcent an das Vorhaben mit der kleinsten id', () => {
    const daten: Rundendaten = {
      runde: runde(1_000, null), // Pool 10,00 €
      vorhaben: [vorhaben('v-1'), vorhaben('v-2'), vorhaben('v-3')],
      beitraege: [
        // drei identische Vorhaben: je zwei Beiträge à 1 € ⇒ identisches roh
        beitrag('v-1', 'b-01', 100),
        beitrag('v-1', 'b-02', 100),
        beitrag('v-2', 'b-03', 100),
        beitrag('v-2', 'b-04', 100),
        beitrag('v-3', 'b-05', 100),
        beitrag('v-3', 'b-06', 100),
      ],
    };

    const ergebnis = berechneQf(daten);
    expect(ergebnis.zuteilungCent.get('v-1')).toBe(334);
    expect(ergebnis.zuteilungCent.get('v-2')).toBe(333);
    expect(ergebnis.zuteilungCent.get('v-3')).toBe(333);

    const summe = [...ergebnis.zuteilungCent.values()].reduce((a, b) => a + b, 0);
    expect(summe).toBe(1_000);
  });

  it('aufCentRunden trifft die Zielsumme exakt', () => {
    const verteilt = aufCentRunden(
      [
        { id: 'v-1', euro: 10 / 3 },
        { id: 'v-2', euro: 10 / 3 },
        { id: 'v-3', euro: 10 / 3 },
      ],
      1_000,
    );
    expect([...verteilt.values()]).toEqual([334, 333, 333]);
  });

  it('lässt bereits ganzzahlige Centbeträge unverändert', () => {
    // 412,17 € · 100 ergibt in Binärdarstellung 41216.999999999993.
    const verteilt = aufCentRunden(
      [
        { id: 'v-1', euro: 41_217 / 100 },
        { id: 'v-2', euro: 58_783 / 100 },
      ],
      100_000,
    );
    expect(verteilt.get('v-1')).toBe(41_217);
    expect(verteilt.get('v-2')).toBe(58_783);
  });
});

describe('Anker 4 — Alleinbeitragende', () => {
  it('erhält 0 € Matching, ohne dass die übrigen Vorhaben gestört werden', () => {
    const daten: Rundendaten = {
      runde: runde(100_000, null),
      vorhaben: [vorhaben('A'), vorhaben('B'), vorhaben('C')],
      beitraege: [...beitraegeAB, beitrag('C', 'b-07', 50_000)], // ein Beitrag über 500 €
    };

    const werte = berechneVorhabenwerte(daten);
    const c = werte.find((w) => w.vorhabenId === 'C')!;
    expect(c.eigenCent).toBe(50_000);
    expect(c.rohEuro).toBeCloseTo(0, 12);

    const ergebnis = berechneQf(daten, werte);
    expect(ergebnis.zuteilungCent.get('C')).toBe(0);
    expect(ergebnis.zuteilungCent.get('A')).toBe(60_000);
    expect(ergebnis.zuteilungCent.get('B')).toBe(40_000);
  });
});
