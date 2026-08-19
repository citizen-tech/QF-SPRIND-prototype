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
  type Simulationseinstellungen,
} from '../src/kern/simulation';
import type { Rundendaten } from '../src/kern/typen';

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
