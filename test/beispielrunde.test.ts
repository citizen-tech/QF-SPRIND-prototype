// Die Erklärseite behauptet, ihre Beispielrunde sei ohne Taschenrechner
// nachrechenbar. Diese Tests halten die dort genannten Zahlen fest — sie sind
// von Hand gerechnet und dürfen sich nicht mit dem Rechenkern verschieben.

import { describe, expect, it } from 'vitest';
import { BEISPIELE, BEISPIEL_POOL_CENT, beispielrunde } from '../src/kern/beispielrunde';
import { berechneQf, berechneVorhabenwerte } from '../src/kern/qf';
import { seitenlaenge } from '../src/ui/QfQuadrat';

const daten = beispielrunde();
const werte = berechneVorhabenwerte(daten);
const nachId = new Map(werte.map((w) => [w.vorhabenId, w]));

/** Von Hand gerechnet: E, W, Q, R und Zuteilung in Euro. */
const VONHAND = [
  { id: 'e-1', e: 400, w: 20, q: 400, r: 0, zuteilung: 0 },
  { id: 'e-2', e: 400, w: 40, q: 1_600, r: 1_200, zuteilung: 600 },
  { id: 'e-3', e: 400, w: 60, q: 3_600, r: 3_200, zuteilung: 1_600 },
  { id: 'e-4', e: 400, w: 80, q: 6_400, r: 6_000, zuteilung: 3_000 },
];

describe('Beispielrunde der Erklärseite', () => {
  const qf = berechneQf(daten, werte);

  it('rechnet jeden Schritt so, wie er auf der Seite steht', () => {
    for (const soll of VONHAND) {
      const w = nachId.get(soll.id)!;
      expect(w.eigenEuro, soll.id).toBe(soll.e);
      expect(w.wurzelsumme, soll.id).toBe(soll.w);
      expect(w.quadrat, soll.id).toBe(soll.q);
      expect(w.rohEuro, soll.id).toBe(soll.r);
      expect(qf.zuteilungCent.get(soll.id), soll.id).toBe(soll.zuteilung * 100);
    }
  });

  it('hat bei allen Vorhaben dieselbe Beitragssumme — nur die Köpfe zählen', () => {
    expect(new Set(werte.map((w) => w.eigenCent)).size).toBe(1);
    expect(werte.map((w) => w.beitragendeAnzahl)).toEqual([1, 4, 10, 16]);
  });

  it('schöpft den Fördertopf aus, ohne dass eine Obergrenze greift', () => {
    expect([...qf.zuteilungCent.values()].reduce((a, b) => a + b, 0)).toBe(BEISPIEL_POOL_CENT);
    expect(qf.schritte.some((s) => s.gedeckelt)).toBe(false);
  });

  it('teilt genau den halben Bemessungswert zu — der Topf ist die Hälfte von ΣR', () => {
    const summeR = werte.reduce((a, w) => a + w.rohEuro, 0);
    expect(summeR).toBe(2 * (BEISPIEL_POOL_CENT / 100));
    for (const w of werte) {
      expect(qf.zuteilungCent.get(w.vorhabenId), w.vorhabenId).toBe(Math.round(w.rohEuro * 50));
    }
  });

  it('zeichnet dieselben Quadrate, mit denen der Kern rechnet', () => {
    for (const b of BEISPIELE) {
      expect(seitenlaenge(b.betraegeEuro), b.id).toBe(nachId.get(b.id)!.wurzelsumme);
    }
  });
});
