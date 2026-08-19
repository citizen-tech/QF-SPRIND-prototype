import { describe, expect, it } from 'vitest';
import { gini } from '../src/kern/kennzahlen';
import { berechneQf, berechneVorhabenwerte, sortiereBeitraege } from '../src/kern/qf';
import { kanonischeDarstellung, pruefsumme } from '../src/kern/pruefsumme';
import type { Beitrag, Rundendaten, Vorhaben } from '../src/kern/typen';
import { aufCentRunden, fuelleNachRangfolge, verteileNachGewicht } from '../src/kern/verteilung';
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

function daten(
  vorhabenListe: Vorhaben[],
  beitraege: Beitrag[],
  poolCent: number,
  hoechstbetragJeVorhabenCent: number | null = null,
): Rundendaten {
  return {
    runde: {
      id: 'test',
      formelVersion: FORMEL_VERSION,
      zweck: 'Test',
      zeitraum: { von: '2026-10-01', bis: '2026-12-31' },
      poolCent,
      hoechstbetragJeVorhabenCent,
      zulassungskriterien: [],
    },
    vorhaben: vorhabenListe,
    beitraege,
  };
}

describe('Zusammenfassung je Person', () => {
  it('addiert Mehrfachbeiträge derselben Person vor der Wurzelziehung', () => {
    // 500 € in zwei Zahlungen zu 250 € dürfen keinen Bemessungswert erzeugen.
    const d = daten([vorhaben('A')], [beitrag('A', 'b-01', 25_000), beitrag('A', 'b-01', 25_000)], 100_000);
    const [a] = berechneVorhabenwerte(d);

    expect(a.beitraegeAnzahl).toBe(2);
    expect(a.beitragendeAnzahl).toBe(1);
    expect(a.eigenCent).toBe(50_000);
    expect(a.rohEuro).toBe(0);
    expect(berechneQf(d).zuteilungCent.get('A')).toBe(0);
  });

  it('gibt Aufspalten keinen Vorteil gegenüber einer einzigen Zahlung', () => {
    const einmal = daten(
      [vorhaben('A'), vorhaben('B')],
      [beitrag('A', 'b-01', 10_000), beitrag('A', 'b-02', 10_000), beitrag('B', 'b-03', 10_000), beitrag('B', 'b-04', 10_000)],
      100_000,
    );
    const gesplittet = daten(
      [vorhaben('A'), vorhaben('B')],
      [
        beitrag('A', 'b-01', 5_000),
        beitrag('A', 'b-01', 5_000),
        beitrag('A', 'b-02', 2_500),
        beitrag('A', 'b-02', 7_500),
        beitrag('B', 'b-03', 10_000),
        beitrag('B', 'b-04', 10_000),
      ],
      100_000,
    );

    expect(berechneQf(gesplittet).zuteilungCent.get('A')).toBe(
      berechneQf(einmal).zuteilungCent.get('A'),
    );
  });
});

describe('Deckelherkunft', () => {
  it('weist den Kostenplan als bindende Grenze aus', () => {
    const d = daten(
      [vorhaben('A', 30_000)],
      [beitrag('A', 'b-01', 10_000), beitrag('A', 'b-02', 10_000)],
      100_000,
      60_000,
    );
    const [a] = berechneVorhabenwerte(d);
    expect(a.deckelCent).toBe(10_000); // 300 € Kostenplan − 200 € Beiträge
    expect(a.deckelGrund).toBe('kostenplan');
  });

  it('weist den Höchstbetrag als bindende Grenze aus', () => {
    const d = daten(
      [vorhaben('A', 1_000_000)],
      [beitrag('A', 'b-01', 10_000), beitrag('A', 'b-02', 10_000)],
      100_000,
      60_000,
    );
    const [a] = berechneVorhabenwerte(d);
    expect(a.deckelCent).toBe(60_000);
    expect(a.deckelGrund).toBe('hoechstbetrag');
  });

  it('kappt bei bereits durch Beiträge gedecktem Kostenplan auf null', () => {
    const d = daten([vorhaben('A', 10_000)], [beitrag('A', 'b-01', 8_000), beitrag('A', 'b-02', 8_000)], 100_000);
    const [a] = berechneVorhabenwerte(d);
    expect(a.deckelCent).toBe(0);
    expect(berechneQf(d).zuteilungCent.get('A')).toBe(0);
  });
});

describe('verteileNachGewicht', () => {
  it('schöpft den Topf nicht aus, wenn alle Vorhaben gedeckelt sind', () => {
    const ergebnis = verteileNachGewicht(
      [
        { id: 'A', gewicht: 1, deckelCent: 10_000 },
        { id: 'B', gewicht: 1, deckelCent: 10_000 },
      ],
      100_000,
    );
    expect(ergebnis.zuteilungCent.get('A')).toBe(10_000);
    expect(ergebnis.zuteilungCent.get('B')).toBe(10_000);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(80_000);
  });

  it('gibt Vorhaben ohne Gewicht nichts', () => {
    const ergebnis = verteileNachGewicht(
      [
        { id: 'A', gewicht: 0, deckelCent: 100_000 },
        { id: 'B', gewicht: 5, deckelCent: 100_000 },
      ],
      100_000,
    );
    expect(ergebnis.zuteilungCent.get('A')).toBe(0);
    expect(ergebnis.zuteilungCent.get('B')).toBe(100_000);
  });

  it('verteilt bei leerem Topf nichts', () => {
    const ergebnis = verteileNachGewicht([{ id: 'A', gewicht: 1, deckelCent: 100 }], 0);
    expect(ergebnis.zuteilungCent.get('A')).toBe(0);
    expect(ergebnis.iterationen).toBe(0);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(0);
  });

  it('hält die Summe der Zuteilungen exakt auf dem verteilten Betrag', () => {
    const eintraege = Array.from({ length: 17 }, (_, i) => ({
      id: `v-${String(i).padStart(2, '0')}`,
      gewicht: i + 1,
      deckelCent: 1_000_000,
    }));
    const ergebnis = verteileNachGewicht(eintraege, 999_983); // Primzahl, erzwingt Reste
    const summe = [...ergebnis.zuteilungCent.values()].reduce((a, b) => a + b, 0);
    expect(summe).toBe(999_983);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(0);
  });
});

describe('fuelleNachRangfolge', () => {
  it('füllt in Reihenfolge bis zur Erschöpfung', () => {
    const ergebnis = fuelleNachRangfolge(
      [
        { id: 'A', deckelCent: 60_000 },
        { id: 'B', deckelCent: 60_000 },
        { id: 'C', deckelCent: 60_000 },
      ],
      100_000,
    );
    expect(ergebnis.zuteilungCent.get('A')).toBe(60_000);
    expect(ergebnis.zuteilungCent.get('B')).toBe(40_000);
    expect(ergebnis.zuteilungCent.get('C')).toBe(0);
    expect(ergebnis.nichtAusgeschoepftCent).toBe(0);
  });
});

describe('aufCentRunden', () => {
  it('nimmt Cent zurück, wenn die Abrundung die Zielsumme überschreitet', () => {
    const verteilt = aufCentRunden(
      [
        { id: 'A', euro: 1 },
        { id: 'B', euro: 1 },
      ],
      199,
    );
    expect([...verteilt.values()].reduce((a, b) => a + b, 0)).toBe(199);
  });
});

describe('Determinismus', () => {
  const vorhabenListe = [vorhaben('A'), vorhaben('B'), vorhaben('C')];
  const beitraege = [
    beitrag('A', 'b-03', 700),
    beitrag('B', 'b-01', 1_300),
    beitrag('A', 'b-01', 500),
    beitrag('C', 'b-02', 900),
    beitrag('A', 'b-02', 1_100),
    beitrag('B', 'b-03', 400),
  ];

  it('liefert dasselbe Ergebnis unabhängig von der Eingabereihenfolge', () => {
    const a = berechneQf(daten(vorhabenListe, beitraege, 100_000));
    const b = berechneQf(daten(vorhabenListe, [...beitraege].reverse(), 100_000));
    expect([...a.zuteilungCent.entries()].sort()).toEqual([...b.zuteilungCent.entries()].sort());
  });

  it('sortiert Beiträge kanonisch', () => {
    const sortiert = sortiereBeitraege(beitraege);
    const schluessel = sortiert.map((b) => `${b.vorhabenId}|${b.beitragendeId}`);
    expect(schluessel).toEqual([...schluessel].sort());
  });

  it('erzeugt dieselbe Prüfsumme unabhängig von der Eingabereihenfolge', async () => {
    const a = await pruefsumme(daten(vorhabenListe, beitraege, 100_000));
    const b = await pruefsumme(daten([...vorhabenListe].reverse(), [...beitraege].reverse(), 100_000));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('ändert die Prüfsumme, sobald sich der Topf ändert', async () => {
    const a = await pruefsumme(daten(vorhabenListe, beitraege, 100_000));
    const b = await pruefsumme(daten(vorhabenListe, beitraege, 100_001));
    expect(a).not.toBe(b);
  });

  it('serialisiert Schlüssel alphabetisch und ohne Leerzeichen', () => {
    const text = kanonischeDarstellung(daten(vorhabenListe, beitraege, 100_000));
    expect(text).not.toMatch(/[\n\t] /);
    expect(text.indexOf('"beitraege"')).toBeLessThan(text.indexOf('"runde"'));
  });
});

describe('gini', () => {
  it('ist null bei Gleichverteilung', () => {
    expect(gini([100, 100, 100, 100])).toBeCloseTo(0, 12);
  });

  it('ist null bei durchweg leerer Verteilung', () => {
    expect(gini([0, 0, 0])).toBe(0);
  });

  it('nähert sich eins bei vollständiger Konzentration', () => {
    expect(gini([0, 0, 0, 0, 100])).toBeCloseTo(0.8, 12);
  });
});
