// Prüfsumme über die Eingangsdaten.
//
// Zusammen mit der Formelversion ist sie die Reproduzierbarkeitsaussage der
// Nachweismappe: gleiche Prüfsumme + gleiche Formelversion ⇒ gleiches Ergebnis.

import { sortiereBeitraege } from './qf';
import type { Rundendaten } from './typen';

/** Rekursiv Objektschlüssel alphabetisch sortieren, Arrays in gegebener Reihenfolge belassen. */
function mitSortiertenSchluesseln(wert: unknown): unknown {
  if (Array.isArray(wert)) return wert.map(mitSortiertenSchluesseln);
  if (wert !== null && typeof wert === 'object') {
    const eingang = wert as Record<string, unknown>;
    const ausgang: Record<string, unknown> = {};
    for (const schluessel of Object.keys(eingang).sort()) {
      ausgang[schluessel] = mitSortiertenSchluesseln(eingang[schluessel]);
    }
    return ausgang;
  }
  return wert;
}

/**
 * Kanonische JSON-Darstellung: Schlüssel alphabetisch, keine Leerzeichen,
 * Vorhaben nach id, Beiträge nach der Sortierregel aus FORMEL.md Abschnitt 6.
 */
export function kanonischeDarstellung(daten: Rundendaten): string {
  const normalisiert = {
    runde: daten.runde,
    vorhaben: [...daten.vorhaben].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    beitraege: sortiereBeitraege(daten.beitraege),
  };
  return JSON.stringify(mitSortiertenSchluesseln(normalisiert));
}

/** SHA-256 über die kanonische Darstellung, als Hex. */
export async function pruefsumme(daten: Rundendaten): Promise<string> {
  const bytes = new TextEncoder().encode(kanonischeDarstellung(daten));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
