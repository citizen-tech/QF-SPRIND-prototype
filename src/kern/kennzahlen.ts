// Kennzahlen je Verfahren. Alle Verfahren werden mit denselben Kennzahlen
// beschrieben, sonst ist die Gegenüberstellung nicht aussagekräftig.

import type { Rundendaten } from './typen';

export type Kennzahlen = {
  gefoerderteVorhaben: number; // Zuteilung > 0
  medianZuteilungCent: number; // Median über alle zugelassenen Vorhaben, Nullen eingeschlossen
  gini: number; // Konzentration der Zuteilung, 0..1
  beitragendeMitTreffer: number; // Personen mit mindestens einem geförderten unterstützten Vorhaben
  beitragendeGesamt: number;
  anteilBeitragEurosAufGefoerderte: number; // 0..1
  nichtAusgeschoepftCent: number;
};

/** Gini-Koeffizient über nichtnegative Werte. Leere oder durchweg leere Verteilung → 0. */
export function gini(werte: readonly number[]): number {
  const n = werte.length;
  if (n === 0) return 0;
  const sortiert = [...werte].sort((a, b) => a - b);
  const summe = sortiert.reduce((a, b) => a + b, 0);
  if (summe === 0) return 0;
  let gewichtet = 0;
  for (let i = 0; i < n; i++) gewichtet += (2 * (i + 1) - n - 1) * sortiert[i];
  return gewichtet / (n * summe);
}

function median(werte: readonly number[]): number {
  if (werte.length === 0) return 0;
  const sortiert = [...werte].sort((a, b) => a - b);
  const mitte = Math.floor(sortiert.length / 2);
  if (sortiert.length % 2 === 1) return sortiert[mitte];
  return Math.round((sortiert[mitte - 1] + sortiert[mitte]) / 2);
}

export function berechneKennzahlen(
  daten: Rundendaten,
  zuteilungCent: ReadonlyMap<string, number>,
  nichtAusgeschoepftCent: number,
): Kennzahlen {
  const betraege = daten.vorhaben.map((v) => zuteilungCent.get(v.id) ?? 0);
  const gefoerdert = new Set(
    daten.vorhaben.filter((v) => (zuteilungCent.get(v.id) ?? 0) > 0).map((v) => v.id),
  );

  const alleBeitragende = new Set<string>();
  const beitragendeMitTreffer = new Set<string>();
  let beitragEurosGesamtCent = 0;
  let beitragEurosAufGefoerderteCent = 0;

  for (const b of daten.beitraege) {
    alleBeitragende.add(b.beitragendeId);
    beitragEurosGesamtCent += b.betragCent;
    if (gefoerdert.has(b.vorhabenId)) {
      beitragendeMitTreffer.add(b.beitragendeId);
      beitragEurosAufGefoerderteCent += b.betragCent;
    }
  }

  return {
    gefoerderteVorhaben: gefoerdert.size,
    medianZuteilungCent: median(betraege),
    gini: gini(betraege),
    beitragendeMitTreffer: beitragendeMitTreffer.size,
    beitragendeGesamt: alleBeitragende.size,
    anteilBeitragEurosAufGefoerderte:
      beitragEurosGesamtCent > 0 ? beitragEurosAufGefoerderteCent / beitragEurosGesamtCent : 0,
    nichtAusgeschoepftCent,
  };
}
