// Der Seed ist in der Oberfläche eine Zusage: gleicher Seed und gleiche
// Einstellungen ⇒ gleiche Runde ⇒ gleiche Prüfsumme.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import { pruefsumme } from '../src/kern/pruefsumme';
import { berechneVorhabenwerte } from '../src/kern/qf';
import {
  erzeugeRunde,
  PROGRAMMTYPEN,
  STANDARD_EINSTELLUNGEN,
  STANDARD_EINSTELLUNGEN_BUND,
  vorhabenvorgabe,
  zufaelligeVorhaben,
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

  it('setzt die Rolle "Wenige große Beiträge" um', () => {
    const daten = erzeugeRunde({
      ...STANDARD_EINSTELLUNGEN,
      vorhaben: [vorhabenvorgabe(0), vorhabenvorgabe(1), vorhabenvorgabe(2, 'wenige-grosse')],
    });
    const werte = berechneVorhabenwerte(daten);
    const gross = werte.find((w) => w.vorhabenId === 'v-3')!;
    const breit = werte.find((w) => w.vorhabenId === 'v-1')!;
    expect(gross.beitragendeAnzahl).toBe(3);
    // Der einzelne Beitrag ist ein Vielfaches eines gewöhnlichen …
    expect(gross.eigenCent / gross.beitragendeAnzahl).toBeGreaterThan(
      (breit.eigenCent / breit.beitragendeAnzahl) * 5,
    );
    // … und trotzdem fällt der Bemessungswert kleiner aus, weil Köpfe zählen.
    expect(gross.rohEuro).toBeLessThan(breit.rohEuro);
  });
});

describe('Ausgewürfelte Vorhaben sind plausibel', () => {
  // Der Würfelknopf muss brauchbare Runden liefern. Eine Runde, in der jedes
  // Vorhaben von einer einzigen Person getragen wird oder in der alle Verfahren
  // dasselbe ergeben, wäre als Demonstration wertlos.
  const seeds = Array.from({ length: 60 }, (_, i) => (i + 1) * 7919);
  const runden = seeds.map((seed) => {
    const einstellungen: Simulationseinstellungen = {
      ...STANDARD_EINSTELLUNGEN,
      seed,
      vorhaben: zufaelligeVorhaben(seed, STANDARD_EINSTELLUNGEN),
    };
    const daten = erzeugeRunde(einstellungen);
    const werte = berechneVorhabenwerte(daten);
    return { einstellungen, daten, werte, verfahren: alleVerfahren(daten, werte) };
  });

  it('ist aus dem Seed reproduzierbar', () => {
    const a = zufaelligeVorhaben(4711, STANDARD_EINSTELLUNGEN);
    const b = zufaelligeVorhaben(4711, STANDARD_EINSTELLUNGEN);
    const c = zufaelligeVorhaben(4712, STANDARD_EINSTELLUNGEN);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('lässt die Rundenwerte unangetastet', () => {
    for (const { einstellungen } of runden) {
      expect(einstellungen.poolCent).toBe(STANDARD_EINSTELLUNGEN.poolCent);
      expect(einstellungen.beitragendeGesamt).toBe(STANDARD_EINSTELLUNGEN.beitragendeGesamt);
      expect(einstellungen.hoechstbetragJeVorhabenCent).toBe(
        STANDARD_EINSTELLUNGEN.hoechstbetragJeVorhabenCent,
      );
      expect(einstellungen.betragMinCent).toBe(STANDARD_EINSTELLUNGEN.betragMinCent);
      expect(einstellungen.betragMaxCent).toBe(STANDARD_EINSTELLUNGEN.betragMaxCent);
    }
  });

  it('richtet die Kostenpläne am Fördertopf aus', () => {
    // Ohne Höchstbetrag begrenzt nichts die Aufnahmefähigkeit: Ein doppelt so
    // großer Topf muss dann auch größere Spielräume erzeugen.
    const ohneDeckel = { ...STANDARD_EINSTELLUNGEN, hoechstbetragJeVorhabenCent: null };
    const eng = zufaelligeVorhaben(2024, ohneDeckel);
    const weit = zufaelligeVorhaben(2024, { ...ohneDeckel, poolCent: ohneDeckel.poolCent * 2 });
    const summe = (liste: typeof eng) => liste.reduce((a, v) => a + v.beantragtCent, 0);
    expect(summe(weit)).toBeGreaterThan(summe(eng));
  });

  it('legt bei begrenzendem Höchstbetrag mehr Vorhaben an', () => {
    // Wenn ein einzelnes Vorhaben nur wenig aufnehmen kann, braucht ein großer
    // Topf mehr Bewerber, um überhaupt knapp zu sein.
    const wenigeAufnahme = zufaelligeVorhaben(2024, {
      ...STANDARD_EINSTELLUNGEN,
      hoechstbetragJeVorhabenCent: 30_000,
    });
    const vieleAufnahme = zufaelligeVorhaben(2024, {
      ...STANDARD_EINSTELLUNGEN,
      hoechstbetragJeVorhabenCent: 150_000,
    });
    expect(wenigeAufnahme.length).toBeGreaterThanOrEqual(vieleAufnahme.length);
  });

  it('bleibt im vorgesehenen Zuschnitt', () => {
    for (const { daten } of runden) {
      expect(daten.vorhaben.length).toBeGreaterThanOrEqual(6);
      expect(daten.vorhaben.length).toBeLessThanOrEqual(PROGRAMMTYPEN.buerger.titel.length);
      const personen = new Set(daten.beitraege.map((b) => b.beitragendeId)).size;
      expect(personen).toBeGreaterThanOrEqual(100);
      expect(personen).toBeLessThanOrEqual(280);
    }
  });

  it('würfelt nur Titel des gewählten Programms', () => {
    // Wer "Klimaanpassung" wählt, darf kein Verkehrszählgerät bekommen.
    for (const programm of PROGRAMMTYPEN.buerger.programme) {
      const basis = { ...STANDARD_EINSTELLUNGEN, zweck: programm.zweck };
      for (const seed of [11, 2027, 99_991]) {
        for (const v of zufaelligeVorhaben(seed, basis)) {
          expect(programm.titel).toContain(v.titel);
        }
      }
    }
    for (const programm of PROGRAMMTYPEN.bund.programme) {
      const basis = { ...STANDARD_EINSTELLUNGEN_BUND, zweck: programm.zweck };
      for (const seed of [11, 2027, 99_991]) {
        for (const v of zufaelligeVorhaben(seed, basis)) {
          expect(programm.titel).toContain(v.titel);
        }
      }
    }
  });

  it('hält für jedes Programm genug Titel bereit', () => {
    // Sonst müsste der Würfel Titel doppelt vergeben oder die Runde verkleinern.
    for (const welt of [PROGRAMMTYPEN.buerger, PROGRAMMTYPEN.bund]) {
      for (const programm of welt.programme) {
        expect(programm.titel.length).toBeGreaterThanOrEqual(10);
        expect(new Set(programm.titel).size).toBe(programm.titel.length);
      }
      expect(welt.traeger.length).toBeGreaterThanOrEqual(
        Math.max(...welt.programme.map((pr) => pr.titel.length)),
      );
    }
  });

  it('vergibt Titel und Träger ohne Doppelung', () => {
    for (const { daten } of runden) {
      expect(new Set(daten.vorhaben.map((v) => v.titel)).size).toBe(daten.vorhaben.length);
      expect(new Set(daten.vorhaben.map((v) => v.traeger)).size).toBe(daten.vorhaben.length);
    }
  });

  it('lässt kein Vorhaben mit einer einzigen beitragenden Seite entstehen', () => {
    // Ein solches Vorhaben erhält null und liest sich in der Gegenüberstellung
    // wie ein Nachteil des Verfahrens, obwohl es nur die Regel anwendet.
    for (const { werte } of runden) {
      expect(werte.every((w) => w.beitragendeAnzahl > 1)).toBe(true);
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

describe('Programmtyp "Bund und Länder"', () => {
  // Dieselbe Bemessungsregel, vier Größenordnungen höher. Der Prototyp behauptet
  // Skalierbarkeit — das muss auch rechnerisch tragen.
  const runden = Array.from({ length: 40 }, (_, i) => {
    const seed = (i + 1) * 6151;
    const einstellungen: Simulationseinstellungen = {
      ...STANDARD_EINSTELLUNGEN_BUND,
      seed,
      vorhaben: zufaelligeVorhaben(seed, STANDARD_EINSTELLUNGEN_BUND),
    };
    const daten = erzeugeRunde(einstellungen);
    const werte = berechneVorhabenwerte(daten);
    return { daten, werte, verfahren: alleVerfahren(daten, werte) };
  });

  it('verwendet die Namen und Merkmale der Bundeswelt', () => {
    const daten = erzeugeRunde(STANDARD_EINSTELLUNGEN_BUND);
    for (const v of daten.vorhaben) {
      expect(PROGRAMMTYPEN.bund.titel).toContain(v.titel);
      expect(PROGRAMMTYPEN.bund.traeger).toContain(v.traeger);
    }
    for (const b of daten.beitraege) {
      expect(PROGRAMMTYPEN.bund.regionen).toContain(b.merkmal.region);
      expect(PROGRAMMTYPEN.bund.gruppen).toContain(b.merkmal.altersgruppe);
    }
  });

  it('trennt die beiden Welten vollständig', () => {
    const buerger = erzeugeRunde(STANDARD_EINSTELLUNGEN);
    const bund = erzeugeRunde(STANDARD_EINSTELLUNGEN_BUND);
    const titelBuerger = new Set(buerger.vorhaben.map((v) => v.titel));
    for (const v of bund.vorhaben) expect(titelBuerger.has(v.titel)).toBe(false);
  });

  it('rechnet mit derselben Fassung der Bemessungsregel', () => {
    const buerger = erzeugeRunde(STANDARD_EINSTELLUNGEN);
    const bund = erzeugeRunde(STANDARD_EINSTELLUNGEN_BUND);
    expect(bund.runde.formelVersion).toBe(buerger.runde.formelVersion);
  });

  it('schöpft den Topf aus und erreicht mehr Stellen als das Windhundverfahren', () => {
    for (const { verfahren } of runden) {
      expect(verfahren.qf.nichtAusgeschoepftCent).toBe(0);
      expect(verfahren.qf.kennzahlen.beitragendeMitTreffer).toBeGreaterThan(
        verfahren.windhund.kennzahlen.beitragendeMitTreffer,
      );
    }
  });

  it('bevorzugt auch hier die Zahl der Stellen vor der Höhe der Beiträge', () => {
    // Das Vorhaben mit den wenigsten Beitragenden erhält unter "anteilig nach
    // Beitragssumme" mehr als unter Quadratic Funding.
    for (const { werte, verfahren } of runden) {
      const wenigste = [...werte].sort((a, b) => a.beitragendeAnzahl - b.beitragendeAnzahl)[0];
      if (wenigste.beitragendeAnzahl > 3) continue;
      expect(verfahren.anteilig.zuteilungCent.get(wenigste.vorhabenId)!).toBeGreaterThan(
        verfahren.qf.zuteilungCent.get(wenigste.vorhabenId)!,
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
