// Die Visualisierung sagt zu, eine abgeschlossene Runde exakt nachzurechnen.
// Diese Tests halten fest, dass sie das tut.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import {
  stuetzstellen,
  typischerBeitragCent,
  wirkungJeVorhaben,
  wirkungskurve,
} from '../src/kern/beitragswirkung';
import { berechneQf, berechneVorhabenwerte } from '../src/kern/qf';
import {
  AUSGANGSRUNDEN,
  erzeugeRunde,
  zufaelligeVorhaben,
  type Rundenrahmen,
} from '../src/kern/simulation';
import { seitenlaenge } from '../src/ui/QfQuadrat';
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

describe('Typischer Beitrag der Runde', () => {
  // Ein fester Probebetrag von 10 € war in der Bürgerwelt richtig und bei Bund
  // und Ländern sinnlos: Dort maß er nur noch die Steigung der Wurzelfunktion
  // nahe null und meldete das Zweihundertfache des Einsatzes als Wirkung. Die
  // beiden folgenden Tests halten fest, dass der Messbetrag zur Runde passt und
  // die gemessene Wirkung damit in einer belegbaren Größenordnung bleibt.

  const runden = (['buerger', 'bund'] as const).flatMap((typ) =>
    [1, 7, 23, 42, 99].map((seed) => {
      const rahmen: Rundenrahmen = { ...AUSGANGSRUNDEN[typ] };
      return {
        typ,
        seed,
        daten: erzeugeRunde({
          ...AUSGANGSRUNDEN[typ],
          seed,
          vorhaben: zufaelligeVorhaben(seed, rahmen),
        }),
      };
    }),
  );

  it('liegt im mittleren Bereich der tatsächlichen Beiträge', () => {
    for (const { typ, seed, daten: runde } of runden) {
      const betrag = typischerBeitragCent(runde);
      const sortiert = runde.beitraege.map((b) => b.betragCent).sort((a, b) => a - b);
      const rang = sortiert.filter((c) => c <= betrag).length / sortiert.length;
      expect(rang, `${typ}/${seed}`).toBeGreaterThan(0.25);
      expect(rang, `${typ}/${seed}`).toBeLessThan(0.75);
    }
  });

  it('führt zu einer Wirkung in belegbarer Größenordnung', () => {
    for (const { typ, seed, daten: runde } of runden) {
      const betrag = typischerBeitragCent(runde);
      for (const s of berechneQf(runde).schritte) {
        if (s.gedeckelt) continue;
        const [punkt] = wirkungskurve(runde, s.id, [betrag]);
        // Weniger als das Zehnfache des Einsatzes. Der alte feste Probebetrag
        // lieferte bei Bund und Ländern rund das Zweihundertfache.
        expect(punkt.zuwachsCent / betrag, `${typ}/${seed}/${s.id}`).toBeLessThan(10);
      }
    }
  });

  it('ergibt eine Kurve, die steigt und danach nicht wieder ansteigt', () => {
    // Die Zeichnung trägt den Zuwachs von null an auf und setzt genau diese
    // Form voraus: erst steigend und abflachend, dann höchstens fallend.
    //
    // Der fallende Teil ist kein Rechenfehler, sondern der Kostenplan: Ist er
    // ausgeschöpft, ersetzt jeder weitere Beitrag einen Euro Zuteilung. Deshalb
    // wird auf einen Scheitelpunkt geprüft und nicht auf Monotonie.
    for (const { typ, seed, daten: runde } of runden) {
      const betrag = typischerBeitragCent(runde);
      const offen = berechneQf(runde).schritte.find((s) => !s.gedeckelt);
      if (!offen) continue;
      const punkte = wirkungskurve(runde, offen.id, stuetzstellen(betrag * 4, 21));
      expect(punkte[0].zuwachsCent, `${typ}/${seed}`).toBe(0);

      const scheitel = punkte.reduce((a, b, i) => (b.zuwachsCent > punkte[a].zuwachsCent ? i : a), 0);
      for (let i = 1; i <= scheitel; i++) {
        expect(punkte[i].zuwachsCent, `${typ}/${seed} steigend`).toBeGreaterThanOrEqual(
          punkte[i - 1].zuwachsCent,
        );
      }
      for (let i = 2; i <= scheitel; i++) {
        const vorher = punkte[i - 1].zuwachsCent - punkte[i - 2].zuwachsCent;
        const nachher = punkte[i].zuwachsCent - punkte[i - 1].zuwachsCent;
        // Toleranz von zwei Cent für die Rundung auf ganze Cent.
        expect(nachher, `${typ}/${seed} abflachend`).toBeLessThanOrEqual(vorher + 2);
      }
      for (let i = scheitel + 1; i < punkte.length; i++) {
        expect(punkte[i].zuwachsCent, `${typ}/${seed} fallend`).toBeLessThanOrEqual(
          punkte[i - 1].zuwachsCent,
        );
      }
    }
  });

  it('fällt nur, wenn der Kostenplan ausgeschöpft ist', () => {
    // Sichert die Erklärung, die neben der Kurve steht: Hinter jedem fallenden
    // Abschnitt steht die Regel „Zuteilung + Beiträge ≤ Kostenplan“.
    for (const { typ, seed, daten: runde } of runden) {
      const betrag = typischerBeitragCent(runde);
      for (const s of berechneQf(runde).schritte) {
        if (s.gedeckelt) continue;
        const punkte = wirkungskurve(runde, s.id, stuetzstellen(betrag * 4, 21));
        const scheitel = punkte.reduce((a, b, i) => (b.zuwachsCent > punkte[a].zuwachsCent ? i : a), 0);
        if (scheitel === punkte.length - 1) continue;

        const w = berechneVorhabenwerte(runde).find((x) => x.vorhabenId === s.id)!;
        const v = runde.vorhaben.find((x) => x.id === s.id)!;
        const letzter = punkte[punkte.length - 1];
        expect(letzter.zuteilungCent, `${typ}/${seed}/${s.id}`).toBe(
          v.beantragtCent - w.eigenCent - letzter.betragCent,
        );
      }
    }
  });
});

describe('QF-Quadrat', () => {
  // Das Bild darf nicht von der Formel abweichen: Die Seitenlänge des
  // gezeichneten Quadrats ist dieselbe Wurzelsumme, mit der der Kern rechnet.
  it('hat als Seitenlänge genau die Wurzelsumme des Vorhabens', () => {
    for (const w of berechneVorhabenwerte(daten)) {
      expect(seitenlaenge(w.posten.map((p) => p.betragEuro))).toBeCloseTo(w.wurzelsumme, 9);
    }
  });

  it('bildet Beitragssumme und Bemessungswert als Flächen ab', () => {
    for (const w of berechneVorhabenwerte(daten)) {
      const seite = seitenlaenge(w.posten.map((p) => p.betragEuro));
      const flaecheGesamt = seite * seite;
      const flaecheBeitraege = w.posten.reduce((a, p) => a + p.betragEuro, 0);

      expect(flaecheGesamt).toBeCloseTo(w.quadrat, 6);
      expect(flaecheBeitraege).toBeCloseTo(w.eigenEuro, 9);
      expect(flaecheGesamt - flaecheBeitraege).toBeCloseTo(w.rohEuro, 6);
    }
  });

  it('füllt das Quadrat bei einer einzigen Person vollständig aus', () => {
    const seite = seitenlaenge([64]);
    expect(seite * seite - 64).toBeCloseTo(0, 9);
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
