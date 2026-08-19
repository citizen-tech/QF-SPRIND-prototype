// Schreibt src/daten/runde-demo.json aus den Standardeinstellungen.
//
// Der Erzeuger selbst liegt in src/kern/simulation.ts, damit Browser und
// Befehlszeile dieselbe Runde erzeugen. Zweimaliger Lauf liefert bytegleiche
// Ausgabe.
//
// Aufruf: npm run seed

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { erzeugeRunde, STANDARD_EINSTELLUNGEN } from '../src/kern/simulation';

const daten = erzeugeRunde(STANDARD_EINSTELLUNGEN);
const ziel = fileURLToPath(new URL('../src/daten/runde-demo.json', import.meta.url));
writeFileSync(ziel, `${JSON.stringify(daten, null, 2)}\n`, 'utf8');

const summeCent = daten.beitraege.reduce((a, b) => a + b.betragCent, 0);
const personen = new Set(daten.beitraege.map((b) => b.beitragendeId));
process.stdout.write(
  [
    `geschrieben: ${ziel}`,
    `Seed:            ${STANDARD_EINSTELLUNGEN.seed}`,
    `Vorhaben:        ${daten.vorhaben.length}`,
    `Beiträge:        ${daten.beitraege.length}`,
    `Beitragende:     ${personen.size}`,
    `Beitragssumme:   ${(summeCent / 100).toFixed(2)} €`,
    '',
  ].join('\n'),
);
