// Eingefrorenes Rechenergebnis der Demorunde.
//
// Schlägt dieser Test fehl, hat sich das Rechenergebnis bei gleicher Eingabe
// geändert. Das ist kein Anlass, die Golden-Datei neu zu schreiben, sondern
// zuerst die Formelversion zu erhöhen und FORMEL.md zu ergänzen.

import { describe, expect, it } from 'vitest';
import demodaten from '../src/daten/runde-demo.json';
import golden from './golden/runde-demo.json';
import type { Rundendaten } from '../src/kern/typen';
import { erzeugeGolden } from '../tools/golden';
import { FORMEL_VERSION } from '../src/kern/version';

const daten = demodaten as Rundendaten;

describe('Golden-Test', () => {
  it('reproduziert das eingefrorene Ergebnis bytegleich', async () => {
    const jetzt = await erzeugeGolden(daten);
    expect(JSON.stringify(jetzt, null, 2)).toBe(JSON.stringify(golden, null, 2));
  });

  it('liefert bei zweimaligem Lauf dasselbe Ergebnis', async () => {
    const a = await erzeugeGolden(daten);
    const b = await erzeugeGolden(daten);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('trägt die Formelversion der Demodaten', () => {
    expect(golden.formelVersion).toBe(FORMEL_VERSION);
    expect(daten.runde.formelVersion).toBe(FORMEL_VERSION);
  });
});
