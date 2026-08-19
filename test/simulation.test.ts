// Der Seed ist in der Oberfläche eine Zusage: gleicher Seed und gleiche
// Einstellungen ⇒ gleiche Runde ⇒ gleiche Prüfsumme.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import { pruefsumme } from '../src/kern/pruefsumme';
import { berechneVorhabenwerte } from '../src/kern/qf';
import {
  erzeugeRunde,
  STANDARD_EINSTELLUNGEN,
  vorhabenvorgabe,
  zufaelligeEinstellungen,
  type Simulationseinstellungen,
} from '../src/kern/simulation';
import type { Rundendaten } from '../src/kern/typen';
import { alleVerfahren } from '../src/kern/vergleich';

describe('Determinismus des Erzeugers', () => {
  it('erzeugt bei gleichem Seed bytegleiche Runden', () => {
    const a = erzeugeRunde(STANDARD_EINSTELLUNGEN);
    const b = erzeugeRunde(STANDARD_EINSTELLUNGEN);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('reproduziert die eingecheckten Demodaten', () => {
    expect(JSON.stringify(erzeugeRunde(STANDARD_EINSTELLUNGEN), null, 2)).toBe(
      JSON.stringify(demodaten as Rundendaten, null, 2),
    );
  });

  it('liefert bei gleichem Seed dieselbe Prüfsumme', async () => {
    const a = await pruefsumme(erzeugeRunde(STANDARD_EINSTELLUNGEN));
    const b = await pruefsumme(erzeugeRunde({ ...STANDARD_EINSTELLUNGEN }));
    expect(a).toBe(b);
  });

  it('liefert bei anderem Seed eine andere Runde', async () => {
    const a = await pruefsumme(erzeugeRunde(STANDARD_EINSTELLUNGEN));
    const b = await pruefsumme(erzeugeRunde({ ...STANDARD_EINSTELLUNGEN, seed: 1 }));
    expect(a).not.toBe(b);
  });
});

describe('Einstellungen wirken', () => {
  it('übernimmt Topf und Höchstbetrag unverändert', () => {
    const daten = erzeugeRunde({
      ...STANDARD_EINSTELLUNGEN,
      poolCent: 500_000,
      hoechstbetragJeVorhabenCent: null,
    });
    expect(daten.runde.poolCent).toBe(500_000);
    expect(daten.runde.hoechstbetragJeVorhabenCent).toBe(null);
  });

  it('erzeugt so viele Vorhaben wie vorgegeben', () => {
    const vorhaben = [0, 1, 2].map((i) => vorhabenvorgabe(i));
    const daten = erzeugeRunde({ ...STANDARD_EINSTELLUNGEN, vorhaben });
    expect(daten.vorhaben).toHaveLength(3);
    expect(daten.vorhaben.map((v) => v.id)).toEqual(['v-1', 'v-2', 'v-3']);
  });

  it('hält sich an die vorgegebene Beitragsspanne', () => {
    const daten = erzeugeRunde({
      ...STANDARD_EINSTELLUNGEN,
      betragMinCent: 300,
      betragMaxCent: 700,
      // Rollen mit Sonderbeträgen ausschließen
      vorhaben: STANDARD_EINSTELLUNGEN.vorhaben.map((v) => ({ ...v, rolle: 'normal' as const })),
      abspracheGroesse: 0,
    });
    for (const b of daten.beitraege) {
      expect(b.betragCent).toBeGreaterThanOrEqual(300);
      expect(b.betragCent).toBeLessThanOrEqual(700);
    }
  });

  it('schaltet die Absprachegruppe ab, wenn ihre Größe null ist', () => {
    const daten = erzeugeRunde({ ...STANDARD_EINSTELLUNGEN, abspracheGroesse: 0 });
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
    expect(Math.max(0, ...gruppen.values())).toBeLessThan(5);
  });

  it('setzt die Rolle "Nur eine beitragende Person" um', () => {
    const daten = erzeugeRunde({
      ...STANDARD_EINSTELLUNGEN,
      vorhaben: [
        vorhabenvorgabe(0),
        vorhabenvorgabe(1),
        { ...vorhabenvorgabe(2, 'allein') },
      ],
    });
    const werte = berechneVorhabenwerte(daten);
    const allein = werte.find((w) => w.vorhabenId === 'v-3')!;
    expect(allein.beitragendeAnzahl).toBe(1);
    expect(allein.rohEuro).toBe(0);
  });
});

describe('Ausgewürfelte Runden sind plausibel', () => {
  // Der Würfelknopf muss brauchbare Runden liefern. Eine Runde, in der jedes
  // Vorhaben von einer einzigen Person getragen wird oder in der alle Verfahren
  // dasselbe ergeben, wäre als Demonstration wertlos.
  const seeds = Array.from({ length: 60 }, (_, i) => (i + 1) * 7919);
  const runden = seeds.map((seed) => {
    const einstellungen = zufaelligeEinstellungen(seed);
    const daten = erzeugeRunde(einstellungen);
    const werte = berechneVorhabenwerte(daten);
    return { einstellungen, daten, werte, verfahren: alleVerfahren(daten, werte) };
  });

  it('ist aus dem Seed reproduzierbar', () => {
    expect(JSON.stringify(zufaelligeEinstellungen(4711))).toBe(
      JSON.stringify(zufaelligeEinstellungen(4711)),
    );
    expect(JSON.stringify(zufaelligeEinstellungen(4711))).not.toBe(
      JSON.stringify(zufaelligeEinstellungen(4712)),
    );
  });

  it('bleibt im vorgesehenen Zuschnitt', () => {
    for (const { daten } of runden) {
      expect(daten.vorhaben.length).toBeGreaterThanOrEqual(6);
      expect(daten.vorhaben.length).toBeLessThanOrEqual(10);
      const personen = new Set(daten.beitraege.map((b) => b.beitragendeId)).size;
      expect(personen).toBeGreaterThanOrEqual(100);
      expect(personen).toBeLessThanOrEqual(280);
    }
  });

  it('lässt höchstens ein Vorhaben mit einer einzigen beitragenden Person zu', () => {
    for (const { werte } of runden) {
      expect(werte.filter((w) => w.beitragendeAnzahl <= 1).length).toBeLessThanOrEqual(1);
    }
  });

  it('trägt die meisten Vorhaben von mehr als einer Handvoll Personen', () => {
    for (const { werte } of runden) {
      const sortiert = [...werte.map((w) => w.beitragendeAnzahl)].sort((a, b) => a - b);
      expect(sortiert[Math.floor(sortiert.length / 2)]).toBeGreaterThanOrEqual(5);
    }
  });

  it('bemisst den Topf knapp genug, dass er ausgeschöpft wird', () => {
    // Ein Topf, der alles trägt, macht alle Verfahren gleich und die
    // Gegenüberstellung wertlos.
    for (const { verfahren } of runden) {
      expect(verfahren.qf.nichtAusgeschoepftCent).toBe(0);
    }
  });

  it('erreicht unter QF stets mehr Personen als unter dem Windhundverfahren', () => {
    for (const { verfahren } of runden) {
      expect(verfahren.qf.kennzahlen.beitragendeMitTreffer).toBeGreaterThan(
        verfahren.windhund.kennzahlen.beitragendeMitTreffer,
      );
    }
  });
});

describe('Robustheit gegen ungewöhnliche Einstellungen', () => {
  const grundlage: Simulationseinstellungen = STANDARD_EINSTELLUNGEN;

  it('kommt mit zwei Vorhaben und sehr wenigen Personen zurecht', () => {
    const daten = erzeugeRunde({
      ...grundlage,
      beitragendeGesamt: 5,
      abspracheGroesse: 0,
      vorhaben: [vorhabenvorgabe(0), vorhabenvorgabe(1)],
    });
    expect(daten.beitraege.length).toBeGreaterThan(0);
    for (const b of daten.beitraege) expect(b.merkmal.region).toBeTruthy();
  });

  it('verwendet jede Person höchstens einmal je Vorhaben', () => {
    const daten = erzeugeRunde(grundlage);
    const gesehen = new Set<string>();
    for (const b of daten.beitraege) {
      const schluessel = `${b.vorhabenId}|${b.beitragendeId}`;
      expect(gesehen.has(schluessel)).toBe(false);
      gesehen.add(schluessel);
    }
  });

  it('vergibt jedem Beitrag ein Merkmal', () => {
    const daten = erzeugeRunde(grundlage);
    for (const b of daten.beitraege) {
      expect(b.merkmal.region.length).toBeGreaterThan(0);
      expect(b.merkmal.altersgruppe.length).toBeGreaterThan(0);
    }
  });
});
