import { describe, expect, it } from 'vitest';
import { berechneKopplung, berechneQfMitKopplung } from '../src/kern/paarweise';
import { berechneVorhabenwerte } from '../src/kern/qf';
import type { Beitrag, Rundendaten, Vorhaben } from '../src/kern/typen';
import { alleVerfahren, VERFAHREN, VERFAHREN_IDS } from '../src/kern/vergleich';
import { FORMEL_VERSION } from '../src/kern/version';

function vorhaben(
  id: string,
  eingangZeitpunkt: string,
  jurypunkte: number,
  beantragtCent = 1_000_000,
): Vorhaben {
  return { id, titel: `Vorhaben ${id}`, traeger: `Träger ${id}`, beantragtCent, eingangZeitpunkt, jurypunkte };
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

// A: vier kleine Beiträge (früh eingegangen, wenig Jurypunkte)
// B: zwei große Beiträge (spät eingegangen, viele Jurypunkte)
const grunddaten: Rundendaten = {
  runde: {
    id: 'test',
    formelVersion: FORMEL_VERSION,
    zweck: 'Test',
    zeitraum: { von: '2026-10-01', bis: '2026-12-31' },
    poolCent: 100_000,
    hoechstbetragJeVorhabenCent: null,
    zulassungskriterien: [],
  },
  vorhaben: [
    vorhaben('A', '2026-06-10T00:00:00.000Z', 20),
    vorhaben('B', '2026-06-01T00:00:00.000Z', 90),
  ],
  beitraege: [
    beitrag('A', 'b-01', 100),
    beitrag('A', 'b-02', 100),
    beitrag('A', 'b-03', 100),
    beitrag('A', 'b-04', 100),
    beitrag('B', 'b-05', 400),
    beitrag('B', 'b-06', 400),
  ],
};

describe('Vergleichsverfahren', () => {
  const werte = berechneVorhabenwerte(grunddaten);
  const v = alleVerfahren(grunddaten, werte);

  it('verteilt in jedem Verfahren höchstens den Topf', () => {
    for (const id of VERFAHREN_IDS) {
      const summe = [...v[id].zuteilungCent.values()].reduce((a, b) => a + b, 0);
      expect(summe).toBeLessThanOrEqual(grunddaten.runde.poolCent);
      expect(summe + v[id].nichtAusgeschoepftCent).toBe(grunddaten.runde.poolCent);
    }
  });

  it('überschreitet in keinem Verfahren einen Höchstbetrag', () => {
    const deckel = new Map(werte.map((w) => [w.vorhabenId, w.deckelCent]));
    for (const id of VERFAHREN_IDS) {
      for (const [vorhabenId, betrag_] of v[id].zuteilungCent) {
        expect(betrag_).toBeLessThanOrEqual(deckel.get(vorhabenId)!);
      }
    }
  });

  it('bevorzugt unter QF die Köpfe, unter "anteilig" die Euro', () => {
    expect(v.qf.zuteilungCent.get('A')).toBe(60_000);
    expect(v.qf.zuteilungCent.get('B')).toBe(40_000);
    // Beitragssummen 4 € gegen 8 € kehren das Verhältnis um.
    expect(v.anteilig.zuteilungCent.get('A')).toBe(33_333);
    expect(v.anteilig.zuteilungCent.get('B')).toBe(66_667);
  });

  it('verteilt unter Gießkanne gleich', () => {
    expect(v.giesskanne.zuteilungCent.get('A')).toBe(50_000);
    expect(v.giesskanne.zuteilungCent.get('B')).toBe(50_000);
  });

  it('folgt beim Windhundverfahren dem Antragseingang', () => {
    // B ist zuerst eingegangen und schöpft den Topf aus.
    expect(v.windhund.zuteilungCent.get('B')).toBe(100_000);
    expect(v.windhund.zuteilungCent.get('A')).toBe(0);
  });

  it('folgt beim Jury-Ranking den Punkten', () => {
    expect(v.jury.zuteilungCent.get('B')).toBe(100_000);
    expect(v.jury.zuteilungCent.get('A')).toBe(0);
  });

  it('weist Windhund und Jury als modelliert aus, die übrigen nicht', () => {
    expect(VERFAHREN.windhund.modelliert).toBe(true);
    expect(VERFAHREN.jury.modelliert).toBe(true);
    expect(VERFAHREN.qf.modelliert).toBe(false);
    expect(VERFAHREN.giesskanne.modelliert).toBe(false);
    expect(VERFAHREN.anteilig.modelliert).toBe(false);
  });

  it('zählt beitragende Personen mit Treffer je Verfahren', () => {
    expect(v.qf.kennzahlen.beitragendeGesamt).toBe(6);
    expect(v.qf.kennzahlen.beitragendeMitTreffer).toBe(6); // beide Vorhaben gefördert
    expect(v.windhund.kennzahlen.beitragendeMitTreffer).toBe(2); // nur B
  });
});

describe('Rangfolge bei Gleichstand', () => {
  it('entscheidet beim Windhundverfahren nach Kennung', () => {
    const daten: Rundendaten = {
      ...grunddaten,
      vorhaben: [
        vorhaben('B', '2026-06-01T00:00:00.000Z', 50),
        vorhaben('A', '2026-06-01T00:00:00.000Z', 50),
      ],
    };
    const v = alleVerfahren(daten);
    expect(v.windhund.zuteilungCent.get('A')).toBe(100_000);
    expect(v.jury.zuteilungCent.get('A')).toBe(100_000);
  });
});

describe('Paarweise Beschränkung', () => {
  it('stimmt ohne Abschlag mit der Standardformel überein', () => {
    const werte = berechneVorhabenwerte(grunddaten);
    // Sehr großes M ⇒ Faktor M/(M+k) geht gegen 1.
    const k = berechneKopplung(grunddaten, 1e12);
    for (const w of werte) {
      expect(k.rohEuro.get(w.vorhabenId)!).toBeCloseTo(w.rohEuro, 6);
      expect(k.ungedaempftEuro.get(w.vorhabenId)!).toBeCloseTo(w.rohEuro, 9);
    }
  });

  it('wertet eine Gruppe ab, die geschlossen dieselben Vorhaben trägt', () => {
    // Zwei Vorhaben mit je vier Beitragenden. Bei X sind es vier voneinander
    // unabhängige Personen, bei Y viermal dieselbe Gruppe, die auch bei Z auftritt.
    const daten: Rundendaten = {
      runde: { ...grunddaten.runde, poolCent: 100_000 },
      vorhaben: [
        vorhaben('X', '2026-06-01T00:00:00.000Z', 50),
        vorhaben('Y', '2026-06-01T00:00:00.000Z', 50),
        vorhaben('Z', '2026-06-01T00:00:00.000Z', 50),
      ],
      beitraege: [
        ...['u-1', 'u-2', 'u-3', 'u-4'].map((p) => beitrag('X', p, 1_000)),
        ...['g-1', 'g-2', 'g-3', 'g-4'].map((p) => beitrag('Y', p, 1_000)),
        ...['g-1', 'g-2', 'g-3', 'g-4'].map((p) => beitrag('Z', p, 1_000)),
      ],
    };

    const werte = berechneVorhabenwerte(daten);
    const standardX = werte.find((w) => w.vorhabenId === 'X')!.rohEuro;
    const standardY = werte.find((w) => w.vorhabenId === 'Y')!.rohEuro;
    expect(standardX).toBeCloseTo(standardY, 9); // ohne Abschlag gleichauf

    const k = berechneKopplung(daten, 20);
    expect(k.rohEuro.get('Y')!).toBeLessThan(k.rohEuro.get('X')!);

    const mit = berechneQfMitKopplung(daten, werte, 20);
    expect(mit.zuteilungCent.get('Y')!).toBeLessThan(mit.zuteilungCent.get('X')!);
  });

  it('gibt nur Gruppenzugehörigkeit aus, nie eine Einzelperson', () => {
    const k = berechneKopplung(grunddaten, 20);
    expect(k.merkmalsgruppen.length).toBeGreaterThan(0);
    for (const gruppe of k.merkmalsgruppen) {
      expect(gruppe.beitragendeAnzahl).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(gruppe)).not.toMatch(/b-\d/);
    }
  });
});
