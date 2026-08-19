// Erzeugt das eingefrorene Rechenergebnis test/golden/runde-demo.json.
//
// Der Golden-Test vergleicht bytegleich. Ändert sich das Ergebnis, ist das kein
// Anlass, diese Datei neu zu schreiben, sondern die Formelversion in
// src/kern/version.ts zu erhöhen und FORMEL.md zu ergänzen. Erst danach wird
// hier neu erzeugt: npm run golden

import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { berechneQfMitKopplung, KOPPLUNGSPARAMETER_M } from '../src/kern/paarweise';
import { pruefsumme } from '../src/kern/pruefsumme';
import { berechneVorhabenwerte } from '../src/kern/qf';
import type { Rundendaten } from '../src/kern/typen';
import { alleVerfahren, VERFAHREN_IDS } from '../src/kern/vergleich';
import { FORMEL_VERSION } from '../src/kern/version';

function alsObjekt(karte: ReadonlyMap<string, number>): Record<string, number> {
  const ausgang: Record<string, number> = {};
  for (const schluessel of [...karte.keys()].sort()) ausgang[schluessel] = karte.get(schluessel)!;
  return ausgang;
}

export async function erzeugeGolden(daten: Rundendaten) {
  const werte = berechneVorhabenwerte(daten);
  const verfahren = alleVerfahren(daten, werte);
  const kopplung = berechneQfMitKopplung(daten, werte, KOPPLUNGSPARAMETER_M);

  const ergebnisse: Record<string, unknown> = {};
  for (const id of VERFAHREN_IDS) {
    const e = verfahren[id];
    ergebnisse[id] = {
      zuteilungCent: alsObjekt(e.zuteilungCent),
      iterationen: e.iterationen,
      nichtAusgeschoepftCent: e.nichtAusgeschoepftCent,
      kennzahlen: e.kennzahlen,
    };
  }

  return {
    formelVersion: FORMEL_VERSION,
    pruefsummeEingangsdaten: await pruefsumme(daten),
    grundwerte: werte.map((w) => ({
      vorhabenId: w.vorhabenId,
      beitraegeAnzahl: w.beitraegeAnzahl,
      beitragendeAnzahl: w.beitragendeAnzahl,
      eigenCent: w.eigenCent,
      wurzelsumme: w.wurzelsumme,
      quadrat: w.quadrat,
      rohEuro: w.rohEuro,
      deckelCent: w.deckelCent,
      deckelGrund: w.deckelGrund,
    })),
    verfahren: ergebnisse,
    kopplung: {
      parameterM: KOPPLUNGSPARAMETER_M,
      zuteilungCent: alsObjekt(kopplung.zuteilungCent),
      rohEuro: alsObjekt(kopplung.kopplung.rohEuro),
      merkmalsgruppen: kopplung.kopplung.merkmalsgruppen,
    },
  };
}

const istHauptmodul =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (istHauptmodul) {
  const daten = (await import('../src/daten/runde-demo.json', { with: { type: 'json' } })).default;
  const ziel = fileURLToPath(new URL('../test/golden/runde-demo.json', import.meta.url));
  writeFileSync(ziel, `${JSON.stringify(await erzeugeGolden(daten as Rundendaten), null, 2)}\n`, 'utf8');
  process.stdout.write(`geschrieben: ${ziel}\n`);
}
