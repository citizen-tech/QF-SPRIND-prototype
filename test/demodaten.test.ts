// Prüft, dass die drei Muster aus dem Bauplan tatsächlich in den Demodaten
// stecken. Ohne sie zeigt die Oberfläche nichts.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import { berechneKopplung, KOPPLUNGSPARAMETER_M } from '../src/kern/paarweise';
import { berechneVorhabenwerte } from '../src/kern/qf';
import type { Rundendaten } from '../src/kern/typen';
import { alleVerfahren } from '../src/kern/vergleich';

const daten = demodaten as Rundendaten;
const werte = berechneVorhabenwerte(daten);
const verfahren = alleVerfahren(daten, werte);
const nachId = new Map(werte.map((w) => [w.vorhabenId, w]));

describe('Zuschnitt der Demorunde', () => {
  it('hält sich an den vorgegebenen Rahmen', () => {
    expect(daten.vorhaben).toHaveLength(8);
    expect(daten.runde.poolCent).toBe(250_000);
    expect(daten.runde.hoechstbetragJeVorhabenCent).toBe(60_000);

    const beitragende = new Set(daten.beitraege.map((b) => b.beitragendeId));
    expect(beitragende.size).toBeGreaterThanOrEqual(170);
    expect(beitragende.size).toBeLessThanOrEqual(190);

    const summeCent = daten.beitraege.reduce((a, b) => a + b.betragCent, 0);
    expect(summeCent).toBeGreaterThanOrEqual(150_000);
    expect(summeCent).toBeLessThanOrEqual(210_000);

    for (const v of daten.vorhaben) {
      expect(v.beantragtCent).toBeGreaterThanOrEqual(20_000);
      expect(v.beantragtCent).toBeLessThanOrEqual(100_000);
    }
  });

  it('enthält keinen Beitragenden doppelt im selben Vorhaben', () => {
    for (const w of werte) expect(w.beitraegeAnzahl).toBe(w.beitragendeAnzahl);
  });
});

describe('Muster 1 — wenige große Beiträge verlieren gegen viele kleine', () => {
  it('gibt dem geldstärksten Vorhaben mit den wenigsten Köpfen wenig', () => {
    const wenigeKoepfe = [...werte].sort((a, b) => a.beitragendeAnzahl - b.beitragendeAnzahl)[0];
    expect(wenigeKoepfe.beitragendeAnzahl).toBeLessThanOrEqual(5);

    // Es gibt ein Vorhaben mit weniger Geld, aber deutlich mehr Köpfen,
    // das unter QF mehr erhält — und unter "anteilig nach Euro" weniger.
    const gegenstueck = werte.find(
      (w) => w.eigenCent < wenigeKoepfe.eigenCent && w.beitragendeAnzahl > 20,
    )!;
    expect(gegenstueck).toBeDefined();

    const qf = verfahren.qf.zuteilungCent;
    const anteilig = verfahren.anteilig.zuteilungCent;
    expect(qf.get(gegenstueck.vorhabenId)!).toBeGreaterThan(qf.get(wenigeKoepfe.vorhabenId)!);
    expect(anteilig.get(gegenstueck.vorhabenId)!).toBeLessThan(
      anteilig.get(wenigeKoepfe.vorhabenId)!,
    );
  });
});

describe('Muster 2 — der Deckel greift und die Iteration wird sichtbar', () => {
  it('deckelt mindestens ein Vorhaben unter QF', () => {
    const gedeckelt = verfahren.qf.schritte.filter((s) => s.gedeckelt);
    expect(gedeckelt.length).toBeGreaterThanOrEqual(1);
    expect(verfahren.qf.iterationen).toBeGreaterThanOrEqual(2);
  });

  it('zeigt beide Deckelgründe mindestens einmal', () => {
    const gruende = new Set(werte.map((w) => w.deckelGrund));
    expect(gruende.has('hoechstbetrag')).toBe(true);
    expect(gruende.has('kostenplan')).toBe(true);
  });
});

describe('Muster 3 — Absprachegruppe', () => {
  it('enthält eine geschlossene Gruppe, die ausschließlich dieselben zwei Vorhaben trägt', () => {
    const vorhabenJePerson = new Map<string, Set<string>>();
    for (const b of daten.beitraege) {
      const menge = vorhabenJePerson.get(b.beitragendeId) ?? new Set<string>();
      menge.add(b.vorhabenId);
      vorhabenJePerson.set(b.beitragendeId, menge);
    }

    const gruppen = new Map<string, number>();
    for (const menge of vorhabenJePerson.values()) {
      if (menge.size !== 2) continue;
      const schluessel = [...menge].sort().join('+');
      gruppen.set(schluessel, (gruppen.get(schluessel) ?? 0) + 1);
    }

    const groesste = [...gruppen.values()].sort((a, b) => b - a)[0];
    expect(groesste).toBeGreaterThanOrEqual(12);
  });

  it('wird durch den Kopplungsabschlag sichtbar abgewertet', () => {
    const kopplung = berechneKopplung(daten, KOPPLUNGSPARAMETER_M);
    const spitze = kopplung.merkmalsgruppen[0];

    const zweite = kopplung.merkmalsgruppen[1];

    // Die am stärksten abgewertete Merkmalsgruppe hebt sich klar vom Rest ab.
    expect(spitze.abschlag).toBeGreaterThan(0.45);
    expect(spitze.abschlag).toBeGreaterThan(zweite.abschlag * 1.25);

    // Und sie bündelt ein Vielfaches des gekoppelten Paarwerts der nächsten
    // Gruppe — das ist das eigentliche Signal, nicht der Prozentsatz allein.
    expect(spitze.paarwertUngedaempft).toBeGreaterThan(zweite.paarwertUngedaempft * 2);
  });
});

describe('Kein Vorhaben mit einer einzigen beitragenden Person', () => {
  it('lässt jedes Vorhaben von mehr als einer Person tragen', () => {
    // Der Sonderfall ist in test/anker.test.ts belegt. In den Demodaten hat er
    // nichts verloren: Er erhielte null und läse sich in der Gegenüberstellung
    // wie ein Nachteil des Verfahrens.
    for (const w of werte) expect(w.beitragendeAnzahl).toBeGreaterThan(1);
    for (const w of werte) {
      expect(verfahren.qf.zuteilungCent.get(w.vorhabenId)!).toBeGreaterThan(0);
    }
  });
});

describe('Der Vergleich trägt eine Aussage', () => {
  it('unterscheidet die Verfahren in der Zahl erreichter Personen deutlich', () => {
    const qf = verfahren.qf.kennzahlen.beitragendeMitTreffer;
    const windhund = verfahren.windhund.kennzahlen.beitragendeMitTreffer;
    expect(qf).toBeGreaterThan(windhund * 1.5);
  });

  it('schöpft den Topf in jedem Verfahren vollständig aus', () => {
    for (const e of Object.values(verfahren)) expect(e.nichtAusgeschoepftCent).toBe(0);
  });

  it('hält jede Zuteilung innerhalb von Höchstbetrag und Kostenplan', () => {
    for (const e of Object.values(verfahren)) {
      for (const [vorhabenId, betrag] of e.zuteilungCent) {
        const w = nachId.get(vorhabenId)!;
        expect(betrag).toBeLessThanOrEqual(w.deckelCent);
        expect(betrag + w.eigenCent).toBeLessThanOrEqual(
          daten.vorhaben.find((v) => v.id === vorhabenId)!.beantragtCent,
        );
      }
    }
  });
});
