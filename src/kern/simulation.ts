// Deterministischer Erzeuger für Förderrunden.
//
// Gleicher Seed und gleiche Einstellungen ⇒ bytegleiche Runde. Kein Math.random,
// kein Date.now. Derselbe Erzeuger läuft im Browser und in tools/seed.ts.

import type { Beitrag, Rundendaten, Vorhaben } from './typen';
import { FORMEL_VERSION } from './version';

export const STANDARD_SEED = 20260819;

// --- Zufallszahlen -------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Hinterlegte Namen ---------------------------------------------------

export const PROGRAMME = [
  {
    name: 'Verkehrssicherheit und Aufenthaltsqualität',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Verkehrssicherheit und Aufenthaltsqualität ' +
      'im öffentlichen Raum, Berlin, Durchführung Oktober bis Dezember 2026.',
  },
  {
    name: 'Nachbarschaft und Begegnung',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Stärkung nachbarschaftlicher Begegnung ' +
      'im Quartier, Berlin, Durchführung Oktober bis Dezember 2026.',
  },
  {
    name: 'Klimaanpassung im Quartier',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Klimaanpassung und Begrünung im ' +
      'Wohnumfeld, Berlin, Durchführung Oktober bis Dezember 2026.',
  },
  {
    name: 'Digitale Teilhabe vor Ort',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur digitalen Teilhabe in Stadtteilzentren, ' +
      'Berlin, Durchführung Oktober bis Dezember 2026.',
  },
] as const;

export const VORHABENTITEL = [
  'Material für eine Kartierungsaktion zu Gehwegschäden',
  'Anschaffung eines mobilen Verkehrszählgeräts',
  'Entsiegelungs- und Pflanzaktion am Quartiersplatz',
  'Workshop zur Schulwegsicherheit',
  'Übersetzung von Infomaterial zur Verkehrssicherheit',
  'Wetterschutz an der Haltestelle Nordstraße',
  'Offene Reparaturwerkstatt für Fahrräder',
  'Beleuchtung des Wegs zwischen Park und Bahnhof',
  'Sitzbänke und Schattenplätze am Wochenmarkt',
  'Trinkbrunnen im Stadtteilpark',
  'Verkehrsberuhigung vor der Grundschule',
  'Lastenrad zum Verleih für Initiativen',
  'Nachbarschaftsgarten auf der Brachfläche',
  'Barrierefreier Zugang zum Gemeinschaftsraum',
  'Fahrradbügel an der Bibliothek',
  'Straßenfest zur Vorstellung der Vorhaben',
  'Werkzeugbibliothek im Stadtteilzentrum',
  'Beschilderung eines sicheren Schulwegs',
  'Regenwasserspeicher für die Baumscheiben',
  'Sprachmittlung bei Nachbarschaftstreffen',
] as const;

export const TRAEGER = [
  'Initiative Gehwegcheck e. V.',
  'Verkehrswende Nordkiez e. V.',
  'Quartiersgrün Süd e. V.',
  'Elternnetzwerk Ostkiez e. V.',
  'Nachbarschaftsforum West e. V.',
  'Initiative Haltestelle Nord e. V.',
  'Radwerkstatt Kiezmitte e. V.',
  'Wegelicht Initiative e. V.',
  'Marktplatz Miteinander e. V.',
  'Stadtteilwerkstatt Ost e. V.',
  'Schulweg sicher e. V.',
  'Lastenrad für alle e. V.',
  'Gartenkollektiv Brache e. V.',
  'Barrierefrei im Kiez e. V.',
  'Bibliotheksfreunde Nord e. V.',
  'Straßenfest Initiative e. V.',
  'Werkzeugring Mitte e. V.',
  'Elterninitiative Südkiez e. V.',
  'Regenwasser Kiez e. V.',
  'Sprachbrücke Nachbarschaft e. V.',
] as const;

export const REGIONEN = ['Berlin-Nord', 'Berlin-Ost', 'Berlin-Süd', 'Berlin-West'] as const;
export const ALTERSGRUPPEN = ['unter 30', '30-44', '45-59', '60 und älter'] as const;

const REGION_GEWICHTE = [40, 25, 20, 15];
const ALTER_GEWICHTE = [30, 35, 22, 13];

// --- Einstellungen -------------------------------------------------------

/** Rolle eines Vorhabens im Datensatz. Erzeugt die Muster, die der Vergleich zeigen soll. */
export type Vorhabenrolle =
  | 'normal' // viele kleine Beiträge
  | 'wenige-grosse' // wenige, große Beiträge — verliert unter QF
  | 'allein' // genau eine beitragende Person — erhält null
  | 'absprache'; // wird von der Absprachegruppe geschlossen mitgetragen

export const ROLLENNAMEN: Record<Vorhabenrolle, string> = {
  normal: 'Breite Unterstützung',
  'wenige-grosse': 'Wenige große Beiträge',
  allein: 'Nur eine beitragende Person',
  absprache: 'Wird von der Absprachegruppe getragen',
};

export type Vorhabenvorgabe = {
  id: string;
  titel: string;
  traeger: string;
  beantragtCent: number;
  jurypunkte: number;
  /** Relativer Zuspruch, 1 bis 10. Bestimmt, wie viele Personen beitragen. */
  zuspruch: number;
  rolle: Vorhabenrolle;
};

export type Simulationseinstellungen = {
  seed: number;
  zweck: string;
  zeitraumVon: string;
  zeitraumBis: string;
  poolCent: number;
  hoechstbetragJeVorhabenCent: number | null;
  /** Angestrebte Zahl verschiedener beitragender Personen. */
  beitragendeGesamt: number;
  betragMinCent: number;
  betragMaxCent: number;
  /** Größe der abgesprochen auftretenden Gruppe. 0 schaltet sie ab. */
  abspracheGroesse: number;
  vorhaben: Vorhabenvorgabe[];
  zulassungskriterien: string[];
};

export const STANDARD_ZULASSUNGSKRITERIEN = [
  'Träger ist ein eingetragener Verein mit Sitz in Berlin.',
  'Das Vorhaben wird ehrenamtlich getragen und ist nicht auf Gewinnerzielung gerichtet.',
  'Die Durchführung liegt vollständig im Förderzeitraum.',
  'Ein Kostenplan liegt vor; die beantragte Summe ist nachvollziehbar aufgeschlüsselt.',
  'Mindestens ein Beitrag einer beitragsberechtigten Person liegt vor.',
];

/** Vorgabe für ein Vorhaben an Position `index`, aus den hinterlegten Namen. */
export function vorhabenvorgabe(index: number, rolle: Vorhabenrolle = 'normal'): Vorhabenvorgabe {
  return {
    id: `v-${index + 1}`,
    titel: VORHABENTITEL[index % VORHABENTITEL.length],
    traeger: TRAEGER[index % TRAEGER.length],
    beantragtCent: 100_000,
    jurypunkte: 50,
    zuspruch: 5,
    rolle,
  };
}

/** Die Ausgangsrunde des Prototyps. Erzeugt src/daten/runde-demo.json. */
export const STANDARD_EINSTELLUNGEN: Simulationseinstellungen = {
  seed: STANDARD_SEED,
  zweck: PROGRAMME[0].zweck,
  zeitraumVon: '2026-10-01',
  zeitraumBis: '2026-12-31',
  poolCent: 250_000,
  hoechstbetragJeVorhabenCent: 60_000,
  beitragendeGesamt: 180,
  betragMinCent: 500,
  betragMaxCent: 1_200,
  abspracheGroesse: 12,
  zulassungskriterien: STANDARD_ZULASSUNGSKRITERIEN,
  vorhaben: [
    { ...vorhabenvorgabe(0), beantragtCent: 100_000, jurypunkte: 74, zuspruch: 10 },
    {
      ...vorhabenvorgabe(1, 'wenige-grosse'),
      beantragtCent: 100_000,
      jurypunkte: 92,
      zuspruch: 1,
    },
    { ...vorhabenvorgabe(2), beantragtCent: 100_000, jurypunkte: 88, zuspruch: 9 },
    { ...vorhabenvorgabe(3), beantragtCent: 80_000, jurypunkte: 81, zuspruch: 6 },
    { ...vorhabenvorgabe(4, 'allein'), beantragtCent: 20_000, jurypunkte: 44, zuspruch: 1 },
    { ...vorhabenvorgabe(5, 'absprache'), beantragtCent: 70_000, jurypunkte: 63, zuspruch: 3 },
    { ...vorhabenvorgabe(6, 'absprache'), beantragtCent: 65_000, jurypunkte: 69, zuspruch: 2 },
    { ...vorhabenvorgabe(7), beantragtCent: 60_000, jurypunkte: 57, zuspruch: 5 },
  ],
};

// --- Erzeugung -----------------------------------------------------------

const TAG_MS = 86_400_000;

export function erzeugeRunde(einstellungen: Simulationseinstellungen): Rundendaten {
  const zufall = mulberry32(einstellungen.seed);
  const ganzzahl = (min: number, max: number) =>
    min + Math.floor(zufall() * (max - min + 1));
  const gewichtet = <T>(werte: readonly T[], gewichte: readonly number[]): T => {
    const gesamt = gewichte.reduce((a, b) => a + b, 0);
    let ziel = zufall() * gesamt;
    for (let i = 0; i < werte.length; i++) {
      ziel -= gewichte[i];
      if (ziel <= 0) return werte[i];
    }
    return werte[werte.length - 1];
  };

  const vorgaben = einstellungen.vorhaben;
  const abspracheVorhaben = vorgaben.filter((v) => v.rolle === 'absprache');
  const abspracheAktiv = einstellungen.abspracheGroesse > 0 && abspracheVorhaben.length >= 2;
  const abspracheGroesse = abspracheAktiv ? einstellungen.abspracheGroesse : 0;

  // Zahl der neuen Personen je Vorhaben aus dem Zuspruch ableiten.
  const gewichtsumme = vorgaben.reduce((a, v) => {
    if (v.rolle === 'allein') return a;
    if (v.rolle === 'wenige-grosse') return a;
    return a + v.zuspruch;
  }, 0);

  const frischeGesamt = Math.max(
    0,
    einstellungen.beitragendeGesamt -
      abspracheGroesse -
      vorgaben.filter((v) => v.rolle === 'allein').length -
      vorgaben.filter((v) => v.rolle === 'wenige-grosse').length * 3,
  );

  const anzahlJeVorhaben = new Map<string, number>();
  for (const v of vorgaben) {
    if (v.rolle === 'allein') anzahlJeVorhaben.set(v.id, 1);
    else if (v.rolle === 'wenige-grosse') anzahlJeVorhaben.set(v.id, 3);
    else if (gewichtsumme > 0) {
      anzahlJeVorhaben.set(v.id, Math.max(2, Math.round((frischeGesamt * v.zuspruch) / gewichtsumme)));
    } else anzahlJeVorhaben.set(v.id, 2);
  }

  const benoetigt =
    [...anzahlJeVorhaben.values()].reduce((a, b) => a + b, 0) + abspracheGroesse;

  const personId = (nummer: number) => `b-${String(nummer).padStart(4, '0')}`;
  const alleIds = Array.from({ length: benoetigt }, (_, i) => personId(i + 1));

  // Absprachegruppe als zusammenhängender Block mitten in der Nummerierung,
  // damit sie nicht schon an der Kennung erkennbar ist.
  const abspracheStart = Math.max(0, Math.floor(benoetigt / 2) - Math.floor(abspracheGroesse / 2));
  const abspracheIds = alleIds.slice(abspracheStart, abspracheStart + abspracheGroesse);
  const abspracheMenge = new Set(abspracheIds);

  const uebrige = alleIds.filter((id) => !abspracheMenge.has(id));
  for (let i = uebrige.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [uebrige[i], uebrige[j]] = [uebrige[j], uebrige[i]];
  }

  const merkmalJePerson = new Map<string, { region: string; altersgruppe: string }>();
  // Die Absprachegruppe sitzt geschlossen in einer selteneren Merkmalskombination,
  // damit die Clusteransicht überhaupt etwas zu zeigen hat.
  for (const id of abspracheIds) {
    merkmalJePerson.set(id, { region: 'Berlin-Süd', altersgruppe: '60 und älter' });
  }
  for (const id of [...uebrige].sort()) {
    merkmalJePerson.set(id, {
      region: gewichtet(REGIONEN, REGION_GEWICHTE),
      altersgruppe: gewichtet(ALTERSGRUPPEN, ALTER_GEWICHTE),
    });
  }

  const beginn = Date.parse(`${einstellungen.zeitraumVon}T00:00:00.000Z`);
  const tageVorlauf = 92;
  const beitragszeitpunkt = () =>
    new Date(
      beginn - tageVorlauf * TAG_MS + ganzzahl(0, tageVorlauf - 1) * TAG_MS + ganzzahl(0, 1439) * 60_000,
    ).toISOString();

  const beitraege: Beitrag[] = [];
  let cursor = 0;

  const anlegen = (vorhabenId: string, beitragendeId: string, betragCent: number) => {
    beitraege.push({
      vorhabenId,
      beitragendeId,
      betragCent,
      zeitpunkt: beitragszeitpunkt(),
      merkmal: merkmalJePerson.get(beitragendeId)!,
    });
  };

  // Große Einzelbeiträge liegen deutlich über der normalen Spanne — sonst ist
  // das Muster "Euro schlagen Köpfe nicht" nicht sichtbar.
  const grossMin = Math.max(einstellungen.betragMaxCent * 8, 10_000);
  const grossMax = Math.max(grossMin + 3_000, einstellungen.betragMaxCent * 11);
  // Die Gruppe gibt geschlossen denselben, am oberen Rand liegenden Betrag.
  // Gerade die Gleichheit ist das Kopplungssignal, das der Abschlag aufgreift.
  const abspracheBetrag = einstellungen.betragMaxCent;

  for (const v of vorgaben) {
    const anzahl = anzahlJeVorhaben.get(v.id)!;
    const imVorhaben = new Set<string>();

    for (let i = 0; i < anzahl && cursor < uebrige.length; i++) {
      const id = uebrige[cursor++];
      imVorhaben.add(id);
      const betrag =
        v.rolle === 'wenige-grosse'
          ? ganzzahl(grossMin, grossMax)
          : ganzzahl(einstellungen.betragMinCent, einstellungen.betragMaxCent);
      anlegen(v.id, id, betrag);
    }

    if (v.rolle === 'absprache') {
      for (const id of abspracheIds) {
        if (imVorhaben.has(id)) continue;
        imVorhaben.add(id);
        anlegen(v.id, id, abspracheBetrag);
      }
    }
  }

  const eingangBasis = Date.parse(`${einstellungen.zeitraumVon}T00:00:00.000Z`) - 120 * TAG_MS;
  // Antragseingang bewusst gegenläufig zum Zuspruch: sonst zeigt der Vergleich
  // mit dem Windhundverfahren nichts.
  const nachZuspruch = [...vorgaben].sort((a, b) => {
    if (a.zuspruch !== b.zuspruch) return a.zuspruch - b.zuspruch;
    return a.id < b.id ? -1 : 1;
  });
  const eingangJeVorhaben = new Map<string, string>();
  nachZuspruch.forEach((v, index) => {
    eingangJeVorhaben.set(
      v.id,
      new Date(eingangBasis + index * 3 * TAG_MS + ganzzahl(0, 1439) * 60_000).toISOString(),
    );
  });

  const vorhaben: Vorhaben[] = vorgaben.map((v) => ({
    id: v.id,
    titel: v.titel,
    traeger: v.traeger,
    beantragtCent: v.beantragtCent,
    eingangZeitpunkt: eingangJeVorhaben.get(v.id)!,
    jurypunkte: v.jurypunkte,
  }));

  return {
    runde: {
      id: `runde-seed-${einstellungen.seed}`,
      formelVersion: FORMEL_VERSION,
      zweck: einstellungen.zweck,
      zeitraum: { von: einstellungen.zeitraumVon, bis: einstellungen.zeitraumBis },
      poolCent: einstellungen.poolCent,
      hoechstbetragJeVorhabenCent: einstellungen.hoechstbetragJeVorhabenCent,
      zulassungskriterien: einstellungen.zulassungskriterien,
    },
    vorhaben,
    beitraege: beitraege.sort((a, b) => {
      if (a.vorhabenId !== b.vorhabenId) return a.vorhabenId < b.vorhabenId ? -1 : 1;
      if (a.beitragendeId !== b.beitragendeId) return a.beitragendeId < b.beitragendeId ? -1 : 1;
      if (a.zeitpunkt !== b.zeitpunkt) return a.zeitpunkt < b.zeitpunkt ? -1 : 1;
      return a.betragCent - b.betragCent;
    }),
  };
}
