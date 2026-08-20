// Die Visualisierung sagt zu, eine abgeschlossene Runde exakt nachzurechnen.
// Diese Tests halten fest, dass sie das tut.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import { stuetzstellen, wirkungJeVorhaben, wirkungskurve } from '../src/kern/beitragswirkung';
import { berechneQf, berechneVorhabenwerte } from '../src/kern/qf';
import type { Beitrag, Rundendaten } from '../src/kern/typen';

const daten = demodaten as Rundendaten;

function beitrag(vorhabenId: string, beitragendeId: string, betragCent: number): Beitrag {
  return {
    vorhabenId,
    beitragendeId,
    betragCent,
    zeitpunkt: '2026-07-01T00:00:00.000Z',
    merkmal: { region: 'Testregion', altersgruppe: '30-44' },
  };
}

describe('Wirkung eines Beitrags', () => {
  it('verändert bei einem Beitrag von null gar nichts', () => {
    for (const v of daten.vorhaben) {
      const [punkt] = wirkungskurve(daten, v.id, [0]);
      expect(punkt.zuwachsCent).toBe(0);
      expect(punkt.zuteilungCent).toBe(berechneQf(daten).zuteilungCent.get(v.id));
    }
  });

  it('rechnet die Runde vollständig neu, statt zu schätzen', () => {
    // Gegenprobe von Hand: dieselbe Runde mit demselben Beitrag, direkt gerechnet.
    const vorhabenId = daten.vorhaben[3].id;
    const betragCent = 5_000;
    const [punkt] = wirkungskurve(daten, vorhabenId, [betragCent]);

    const vonHand = berechneQf({
      ...daten,
      beitraege: [...daten.beitraege, beitrag(vorhabenId, 'probe-beitrag', betragCent)],
    });
    expect(punkt.zuteilungCent).toBe(vonHand.zuteilungCent.get(vorhabenId));
  });

  it('lässt den Fördertopf unverändert — der Zuwachs geht zulasten der übrigen', () => {
    const vorhabenId = daten.vorhaben[5].id;
    const mit = berechneQf({
      ...daten,
      beitraege: [...daten.beitraege, beitrag(vorhabenId, 'probe-beitrag', 20_000)],
    });
    const summe = [...mit.zuteilungCent.values()].reduce((a, b) => a + b, 0);
    expect(summe).toBe(daten.runde.poolCent);
  });

  it('bewirkt bei einem gedeckelten Vorhaben nichts mehr', () => {
    const qf = berechneQf(daten);
    const gedeckelt = qf.schritte.filter((s) => s.gedeckelt);
    expect(gedeckelt.length).toBeGreaterThan(0);
    for (const s of gedeckelt) {
      const [punkt] = wirkungskurve(daten, s.id, [10_000]);
      expect(punkt.zuwachsCent).toBeLessThanOrEqual(0);
    }
  });

  it('erhöht den Bemessungswert um genau 2 · Wurzelsumme · Wurzel(Beitrag)', () => {
    // Aus (W + √c)² − (E + c) = W² − E + 2·W·√c. Das ist der Grund, warum ein
    // Beitrag dort am meisten bewirkt, wo die Wurzelsumme schon groß ist — und
    // die wächst vor allem mit der Zahl der Beitragenden.
    const betragCent = 1_000;
    const vorher = berechneVorhabenwerte(daten);
    for (const v of daten.vorhaben) {
      const w = vorher.find((x) => x.vorhabenId === v.id)!;
      const nachher = berechneVorhabenwerte({
        ...daten,
        beitraege: [...daten.beitraege, beitrag(v.id, 'probe-beitrag', betragCent)],
      }).find((x) => x.vorhabenId === v.id)!;

      expect(nachher.rohEuro - w.rohEuro).toBeCloseTo(
        2 * w.wurzelsumme * Math.sqrt(betragCent / 100),
        6,
      );
    }
  });

  it('bewirkt bei größerer Wurzelsumme mehr — solange keine Obergrenze greift', () => {
    // Die Aussage der Visualisierung, an der Demorunde nachgemessen.
    const werte = new Map(berechneVorhabenwerte(daten).map((w) => [w.vorhabenId, w]));
    const wirksam = wirkungJeVorhaben(daten, 1_000).filter((w) => w.zuwachsCent > 0);
    expect(wirksam.length).toBeGreaterThanOrEqual(4);

    const nachZuwachs = [...wirksam].sort((a, b) => b.zuwachsCent - a.zuwachsCent);
    for (let i = 1; i < nachZuwachs.length; i++) {
      const vorne = werte.get(nachZuwachs[i - 1].vorhabenId)!.wurzelsumme;
      const hinten = werte.get(nachZuwachs[i].vorhabenId)!.wurzelsumme;
      expect(vorne).toBeGreaterThan(hinten);
    }
  });

  it('erfasst jedes Vorhaben genau einmal', () => {
    const wirkung = wirkungJeVorhaben(daten, 5_000);
    expect(wirkung).toHaveLength(daten.vorhaben.length);
    expect(new Set(wirkung.map((w) => w.vorhabenId)).size).toBe(daten.vorhaben.length);
    for (const w of wirkung) expect(w.mitCent - w.ohneCent).toBe(w.zuwachsCent);
  });

  it('führt den zusätzlichen Beitrag nicht in die Auswertung ein', () => {
    // Die gedachte Person darf die Kennzahlen der Runde nicht verändern.
    const vorher = berechneVorhabenwerte(daten).map((w) => w.beitragendeAnzahl);
    wirkungJeVorhaben(daten, 10_000);
    const nachher = berechneVorhabenwerte(daten).map((w) => w.beitragendeAnzahl);
    expect(nachher).toEqual(vorher);
  });
});

describe('Stützstellen', () => {
  it('beginnen bei null und enden beim Höchstwert', () => {
    const punkte = stuetzstellen(80_000, 17);
    expect(punkte).toHaveLength(17);
    expect(punkte[0]).toBe(0);
    expect(punkte[punkte.length - 1]).toBe(80_000);
    for (let i = 1; i < punkte.length; i++) expect(punkte[i]).toBeGreaterThan(punkte[i - 1]);
  });
});
