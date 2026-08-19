// Erzeugt src/daten/runde-demo.json mit festem Seed.
//
// Zweimaliger Lauf liefert bytegleiche Ausgabe. Kein Math.random, kein Date.now.
// Das Ergebnis ist eingecheckt; dieses Skript dient allein der Reproduzierbarkeit.
//
// Aufruf: npm run seed

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Beitrag, Rundendaten, Vorhaben } from '../src/kern/typen';
import { FORMEL_VERSION } from '../src/kern/version';

const SEED = 20260819;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zufall = mulberry32(SEED);

/** Ganzzahl aus [min, max]. */
function ganzzahl(min: number, max: number): number {
  return min + Math.floor(zufall() * (max - min + 1));
}

/** Auswahl nach Gewichten. */
function gewichtet<T>(eintraege: readonly (readonly [T, number])[]): T {
  const gesamt = eintraege.reduce((a, e) => a + e[1], 0);
  let ziel = zufall() * gesamt;
  for (const [wert, gewicht] of eintraege) {
    ziel -= gewicht;
    if (ziel <= 0) return wert;
  }
  return eintraege[eintraege.length - 1][0];
}

function mischen<T>(liste: readonly T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// ---------------------------------------------------------------------------
// Merkmale
// ---------------------------------------------------------------------------

const REGIONEN = [
  ['Berlin-Nord', 40],
  ['Berlin-Ost', 25],
  ['Berlin-Süd', 20],
  ['Berlin-West', 15],
] as const;

const ALTERSGRUPPEN = [
  ['unter 30', 30],
  ['30-44', 35],
  ['45-59', 22],
  ['60 und älter', 13],
] as const;

// Die Absprachegruppe sitzt geschlossen in einer seltenen Merkmalskombination,
// damit die Clusteransicht in Stufe 3 überhaupt etwas zu zeigen hat.
const ABSPRACHE_REGION = 'Berlin-Süd';
const ABSPRACHE_ALTERSGRUPPE = '60 und älter';
const ABSPRACHE_GROESSE = 12;

// ---------------------------------------------------------------------------
// Vorhaben
// ---------------------------------------------------------------------------

type Profil = {
  vorhaben: Vorhaben;
  /** Zahl neuer, bisher unbeteiligter beitragender Personen. */
  neu: number;
  /** Zahl bereits beteiligter Personen, die zusätzlich hier beitragen. */
  wiederkehrend: number;
  /** Spanne der Einzelbeträge in Cent. */
  betragCent: readonly [number, number];
  /** Erhält die Absprachegruppe. */
  absprache?: boolean;
};

// Antragseingang bestimmt die Windhund-Reihenfolge. Sie ist bewusst so gelegt,
// dass sie der QF-Rangfolge zuwiderläuft — sonst zeigt der Vergleich nichts.
const PROFILE: Profil[] = [
  {
    vorhaben: {
      id: 'v-1',
      titel: 'Material für eine Kartierungsaktion zu Gehwegschäden',
      traeger: 'Initiative Gehwegcheck e.V.',
      beantragtCent: 100_000,
      eingangZeitpunkt: '2026-06-24T09:15:00.000Z',
      jurypunkte: 74,
    },
    neu: 50,
    wiederkehrend: 5,
    betragCent: [500, 1000],
  },
  {
    vorhaben: {
      id: 'v-2',
      titel: 'Anschaffung eines mobilen Verkehrszählgeräts',
      traeger: 'Verkehrswende Nordkiez e.V.',
      beantragtCent: 100_000,
      eingangZeitpunkt: '2026-06-02T08:00:00.000Z',
      jurypunkte: 92,
    },
    neu: 3,
    wiederkehrend: 0,
    betragCent: [10_000, 13_000],
  },
  {
    vorhaben: {
      id: 'v-3',
      titel: 'Entsiegelungs- und Pflanzaktion am Quartiersplatz',
      traeger: 'Quartiersgrün Süd e.V.',
      beantragtCent: 100_000,
      eingangZeitpunkt: '2026-06-22T16:40:00.000Z',
      jurypunkte: 88,
    },
    neu: 42,
    wiederkehrend: 4,
    betragCent: [500, 1200],
  },
  {
    vorhaben: {
      id: 'v-4',
      titel: 'Workshop zur Schulwegsicherheit',
      traeger: 'Elternnetzwerk Ostkiez e.V.',
      beantragtCent: 80_000,
      eingangZeitpunkt: '2026-06-18T11:05:00.000Z',
      jurypunkte: 81,
    },
    neu: 30,
    wiederkehrend: 3,
    betragCent: [500, 900],
  },
  {
    vorhaben: {
      id: 'v-5',
      titel: 'Übersetzung von Infomaterial zur Verkehrssicherheit',
      traeger: 'Nachbarschaftsforum West e.V.',
      beantragtCent: 20_000,
      eingangZeitpunkt: '2026-06-04T13:20:00.000Z',
      jurypunkte: 44,
    },
    neu: 1,
    wiederkehrend: 0,
    betragCent: [2000, 2000],
  },
  {
    vorhaben: {
      id: 'v-6',
      titel: 'Wetterschutz an der Haltestelle Nordstraße',
      traeger: 'Initiative Haltestelle Nord e.V.',
      beantragtCent: 70_000,
      eingangZeitpunkt: '2026-06-07T10:30:00.000Z',
      jurypunkte: 63,
    },
    neu: 10,
    wiederkehrend: 0,
    betragCent: [500, 1000],
    absprache: true,
  },
  {
    vorhaben: {
      id: 'v-7',
      titel: 'Offene Reparaturwerkstatt für Fahrräder',
      traeger: 'Radwerkstatt Kiezmitte e.V.',
      beantragtCent: 65_000,
      eingangZeitpunkt: '2026-06-15T14:00:00.000Z',
      jurypunkte: 69,
    },
    neu: 8,
    wiederkehrend: 0,
    betragCent: [500, 1000],
    absprache: true,
  },
  {
    vorhaben: {
      id: 'v-8',
      titel: 'Beleuchtung des Wegs zwischen Park und Bahnhof',
      traeger: 'Wegelicht Initiative e.V.',
      beantragtCent: 60_000,
      eingangZeitpunkt: '2026-06-11T18:45:00.000Z',
      jurypunkte: 57,
    },
    neu: 23,
    wiederkehrend: 3,
    betragCent: [500, 1000],
  },
];

// ---------------------------------------------------------------------------
// Beitragende
// ---------------------------------------------------------------------------

const anzahlNeu = PROFILE.reduce((a, p) => a + p.neu, 0);
const gesamtPersonen = anzahlNeu + ABSPRACHE_GROESSE;

function personId(nummer: number): string {
  return `b-${String(nummer).padStart(4, '0')}`;
}

// Die Absprachegruppe erhält einen zusammenhängenden Block mitten in der
// Nummerierung, damit sie nicht schon an der id erkennbar ist.
const abspracheStart = 71;
const abspracheIds = Array.from({ length: ABSPRACHE_GROESSE }, (_, i) =>
  personId(abspracheStart + i),
);
const abspracheMenge = new Set(abspracheIds);

const uebrigeIds = mischen(
  Array.from({ length: gesamtPersonen }, (_, i) => personId(i + 1)).filter(
    (id) => !abspracheMenge.has(id),
  ),
);

const merkmalJePerson = new Map<string, { region: string; altersgruppe: string }>();
for (const id of abspracheIds) {
  merkmalJePerson.set(id, {
    region: ABSPRACHE_REGION,
    altersgruppe: ABSPRACHE_ALTERSGRUPPE,
  });
}
for (const id of [...uebrigeIds].sort()) {
  merkmalJePerson.set(id, {
    region: gewichtet(REGIONEN),
    altersgruppe: gewichtet(ALTERSGRUPPEN),
  });
}

// ---------------------------------------------------------------------------
// Beiträge
// ---------------------------------------------------------------------------

const ZEITRAUM_VON = Date.UTC(2026, 6, 1, 0, 0, 0); // 1. Juli 2026
const ZEITRAUM_TAGE = 92; // bis 30. September 2026

function zeitpunkt(): string {
  const versatzMs =
    ganzzahl(0, ZEITRAUM_TAGE - 1) * 86_400_000 + ganzzahl(0, 1439) * 60_000;
  return new Date(ZEITRAUM_VON + versatzMs).toISOString();
}

const beitraege: Beitrag[] = [];
let cursor = 0;
const bereitsBeteiligt: string[] = [];

function beitragAnlegen(vorhabenId: string, beitragendeId: string, betragCent: number): void {
  beitraege.push({
    vorhabenId,
    beitragendeId,
    betragCent,
    zeitpunkt: zeitpunkt(),
    merkmal: merkmalJePerson.get(beitragendeId)!,
  });
}

for (const profil of PROFILE) {
  const inDiesemVorhaben = new Set<string>();

  for (let i = 0; i < profil.neu; i++) {
    const id = uebrigeIds[cursor++];
    inDiesemVorhaben.add(id);
    bereitsBeteiligt.push(id);
    beitragAnlegen(profil.vorhaben.id, id, ganzzahl(profil.betragCent[0], profil.betragCent[1]));
  }

  for (let i = 0; i < profil.wiederkehrend; i++) {
    // Aus dem Kreis der bereits Beteiligten wählen, ohne Doppelung im Vorhaben.
    let versuche = 0;
    while (versuche < 50) {
      const kandidat = bereitsBeteiligt[ganzzahl(0, bereitsBeteiligt.length - 1)];
      if (!inDiesemVorhaben.has(kandidat)) {
        inDiesemVorhaben.add(kandidat);
        beitragAnlegen(
          profil.vorhaben.id,
          kandidat,
          ganzzahl(profil.betragCent[0], profil.betragCent[1]),
        );
        break;
      }
      versuche++;
    }
  }

  if (profil.absprache) {
    for (const id of abspracheIds) {
      inDiesemVorhaben.add(id);
      beitragAnlegen(profil.vorhaben.id, id, 1200); // gleicher Betrag, abgesprochen
    }
  }
}

// ---------------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------------

const daten: Rundendaten = {
  runde: {
    id: 'runde-2026-pilot',
    formelVersion: FORMEL_VERSION,
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Verkehrssicherheit und Aufenthaltsqualität ' +
      'im öffentlichen Raum, Berlin, Durchführung Oktober bis Dezember 2026.',
    zeitraum: { von: '2026-10-01', bis: '2026-12-31' },
    poolCent: 250_000,
    hoechstbetragJeVorhabenCent: 60_000,
    zulassungskriterien: [
      'Träger ist ein eingetragener Verein mit Sitz in Berlin.',
      'Das Vorhaben wird ehrenamtlich getragen und ist nicht auf Gewinnerzielung gerichtet.',
      'Die Durchführung liegt vollständig im Förderzeitraum.',
      'Ein Kostenplan liegt vor; die beantragte Summe ist nachvollziehbar aufgeschlüsselt.',
      'Mindestens ein Beitrag einer beitragsberechtigten Person liegt vor.',
    ],
  },
  vorhaben: PROFILE.map((p) => p.vorhaben),
  beitraege: beitraege.sort((a, b) => {
    if (a.vorhabenId !== b.vorhabenId) return a.vorhabenId < b.vorhabenId ? -1 : 1;
    if (a.beitragendeId !== b.beitragendeId) return a.beitragendeId < b.beitragendeId ? -1 : 1;
    if (a.zeitpunkt !== b.zeitpunkt) return a.zeitpunkt < b.zeitpunkt ? -1 : 1;
    return a.betragCent - b.betragCent;
  }),
};

const ziel = fileURLToPath(new URL('../src/daten/runde-demo.json', import.meta.url));
writeFileSync(ziel, `${JSON.stringify(daten, null, 2)}\n`, 'utf8');

const summeCent = daten.beitraege.reduce((a, b) => a + b.betragCent, 0);
const personen = new Set(daten.beitraege.map((b) => b.beitragendeId));
process.stdout.write(
  [
    `geschrieben: ${ziel}`,
    `Vorhaben:        ${daten.vorhaben.length}`,
    `Beiträge:        ${daten.beitraege.length}`,
    `Beitragende:     ${personen.size}`,
    `Beitragssumme:   ${(summeCent / 100).toFixed(2)} €`,
    '',
  ].join('\n'),
);
