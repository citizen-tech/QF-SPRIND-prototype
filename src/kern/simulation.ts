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
    titel: [
      'Material für eine Kartierungsaktion zu Gehwegschäden',
      'Anschaffung eines mobilen Verkehrszählgeräts',
      'Workshop zur Schulwegsicherheit',
      'Übersetzung von Infomaterial zur Verkehrssicherheit',
      'Wetterschutz an der Haltestelle Nordstraße',
      'Offene Reparaturwerkstatt für Fahrräder',
      'Beleuchtung des Wegs zwischen Park und Bahnhof',
      'Verkehrsberuhigung vor der Grundschule',
      'Lastenrad zum Verleih für Initiativen',
      'Fahrradbügel an der Bibliothek',
      'Beschilderung eines sicheren Schulwegs',
      'Sitzbänke und Schattenplätze am Wochenmarkt',
    ],
  },
  {
    name: 'Nachbarschaft und Begegnung',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Stärkung nachbarschaftlicher Begegnung ' +
      'im Quartier, Berlin, Durchführung Oktober bis Dezember 2026.',
    titel: [
      'Straßenfest zur Vorstellung der Vorhaben',
      'Werkzeugbibliothek im Stadtteilzentrum',
      'Nachbarschaftsgarten auf der Brachfläche',
      'Sprachmittlung bei Nachbarschaftstreffen',
      'Barrierefreier Zugang zum Gemeinschaftsraum',
      'Offene Reparaturwerkstatt für Fahrräder',
      'Lastenrad zum Verleih für Initiativen',
      'Trinkbrunnen im Stadtteilpark',
      'Sitzbänke und Schattenplätze am Wochenmarkt',
      'Übersetzung von Infomaterial zur Verkehrssicherheit',
      'Fassadenbegrünung am Nachbarschaftshaus',
      'Verschattung des Spielplatzes',
    ],
  },
  {
    name: 'Klimaanpassung im Quartier',
    zweck:
      'Ehrenamtlich getragene Vorhaben zur Klimaanpassung und Begrünung im ' +
      'Wohnumfeld, Berlin, Durchführung Oktober bis Dezember 2026.',
    titel: [
      'Entsiegelungs- und Pflanzaktion am Quartiersplatz',
      'Regenwasserspeicher für die Baumscheiben',
      'Nachbarschaftsgarten auf der Brachfläche',
      'Trinkbrunnen im Stadtteilpark',
      'Sitzbänke und Schattenplätze am Wochenmarkt',
      'Baumpflanzungen entlang der Hauptstraße',
      'Fassadenbegrünung am Nachbarschaftshaus',
      'Verschattung des Spielplatzes',
      'Entsiegelung des Hinterhofs',
      'Regentonnen für die Gemeinschaftsflächen',
    ],
  },
  {
    name: 'Barrierefreiheit und sichere Wege',
    zweck:
      'Ehrenamtlich getragene Vorhaben für barrierefreie und sichere Wege im Quartier, ' +
      'Berlin, Durchführung Oktober bis Dezember 2026.',
    titel: [
      'Material für eine Kartierungsaktion zu Gehwegschäden',
      'Barrierefreier Zugang zum Gemeinschaftsraum',
      'Beschilderung eines sicheren Schulwegs',
      'Beleuchtung des Wegs zwischen Park und Bahnhof',
      'Verkehrsberuhigung vor der Grundschule',
      'Wetterschutz an der Haltestelle Nordstraße',
      'Workshop zur Schulwegsicherheit',
      'Fahrradbügel an der Bibliothek',
      'Sitzbänke und Schattenplätze am Wochenmarkt',
      'Sprachmittlung bei Nachbarschaftstreffen',
    ],
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
  'Baumpflanzungen entlang der Hauptstraße',
  'Fassadenbegrünung am Nachbarschaftshaus',
  'Verschattung des Spielplatzes',
  'Entsiegelung des Hinterhofs',
  'Regentonnen für die Gemeinschaftsflächen',
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
  'Baumpaten Hauptstraße e. V.',
  'Grünfassade Nachbarschaftshaus e. V.',
  'Spielplatzinitiative Mitte e. V.',
  'Hinterhofgrün e. V.',
  'Regenwasser Gemeinschaft e. V.',
] as const;

export const REGIONEN = ['Berlin-Nord', 'Berlin-Ost', 'Berlin-Süd', 'Berlin-West'] as const;
export const ALTERSGRUPPEN = ['unter 30', '30-44', '45-59', '60 und älter'] as const;

const REGION_GEWICHTE = [40, 25, 20, 15];
const ALTER_GEWICHTE = [30, 35, 22, 13];

// --- Zweiter Programmtyp: Bund und Länder --------------------------------
//
// Dieselbe Bemessungsregel, vier Größenordnungen höher. Beitragende sind dann
// nicht Bürgerinnen und Bürger, sondern Länder, Kommunen und ihre
// Zusammenschlüsse, die aus dem eigenen Haushalt beisteuern.
//
// Alle Namen sind erkennbar generisch. Reale Landesbetriebe oder Zweckverbände
// stehen hier bewusst nicht — die Daten sollen als synthetisch erkennbar
// bleiben.

export const PROGRAMME_BUND = [
  {
    name: 'Digitalisierungsbudget',
    zweck:
      'Gemeinsam finanzierte Digitalisierungsvorhaben mit deutschlandweiter Wirkung, ' +
      'Umsetzung im Haushaltsjahr 2027.',
    titel: [
      'Anbindung kommunaler Fachverfahren an die Registermodernisierung',
      'Einheitlicher Bezahldienst für Verwaltungsleistungen',
      'Bundesweites Postfach für Unternehmensmeldungen',
      'Nachnutzbare Antragsstrecke für Wohngeld',
      'Offene Schnittstelle für Kfz-Zulassungsdaten',
      'Gemeinsame Basiskomponente Identitätsnachweis',
      'Digitale Antragsstrecke für Elterngeld',
      'Automatisierte Aktenführung im Bauordnungswesen',
      'Standardisierung der Meldedatenübermittlung',
      'Cloud-Bereitstellung für Landesrechenzentren',
      'Barrierefreier Zugang zu Verwaltungsportalen',
      'Gemeinsames Datenschutz-Cockpit der Länder',
      'Nachnutzung einer Fachanwendung für Gewerbeanzeigen',
      'Schnittstelle zwischen Justiz- und Meldewesen',
      'Gemeinsames Portal für Fördermittelanträge',
      'Einheitliche Schnittstelle für Statistikmeldungen',
      'Nachnutzbare Komponente für Terminvergabe',
    ],
  },
  {
    name: 'Nachnutzbare Fachverfahren',
    zweck:
      'Vorhaben zur Entwicklung nachnutzbarer Fachverfahren für die Verwaltung von Bund, ' +
      'Ländern und Kommunen, Umsetzung im Haushaltsjahr 2027.',
    titel: [
      'Nachnutzbare Antragsstrecke für Wohngeld',
      'Digitale Antragsstrecke für Elterngeld',
      'Nachnutzung einer Fachanwendung für Gewerbeanzeigen',
      'Nachnutzbare Komponente für Terminvergabe',
      'Automatisierte Aktenführung im Bauordnungswesen',
      'Einheitlicher Bezahldienst für Verwaltungsleistungen',
      'Bundesweites Postfach für Unternehmensmeldungen',
      'Barrierefreier Zugang zu Verwaltungsportalen',
      'Anbindung kommunaler Fachverfahren an die Registermodernisierung',
      'Cloud-Bereitstellung für Landesrechenzentren',
      'Gemeinsames Portal für Fördermittelanträge',
    ],
  },
  {
    name: 'Registermodernisierung',
    zweck:
      'Vorhaben zur Anbindung und Vereinheitlichung öffentlicher Register, ' +
      'Umsetzung im Haushaltsjahr 2027.',
    titel: [
      'Anbindung kommunaler Fachverfahren an die Registermodernisierung',
      'Standardisierung der Meldedatenübermittlung',
      'Offene Schnittstelle für Kfz-Zulassungsdaten',
      'Gemeinsame Basiskomponente Identitätsnachweis',
      'Schnittstelle zwischen Justiz- und Meldewesen',
      'Gemeinsames Datenschutz-Cockpit der Länder',
      'Bundesweites Postfach für Unternehmensmeldungen',
      'Nachnutzung einer Fachanwendung für Gewerbeanzeigen',
      'Einheitliche Schnittstelle für Statistikmeldungen',
      'Nachnutzbare Antragsstrecke für Wohngeld',
    ],
  },
] as const;

export const VORHABENTITEL_BUND = [
  'Anbindung kommunaler Fachverfahren an die Registermodernisierung',
  'Einheitlicher Bezahldienst für Verwaltungsleistungen',
  'Bundesweites Postfach für Unternehmensmeldungen',
  'Nachnutzbare Antragsstrecke für Wohngeld',
  'Offene Schnittstelle für Kfz-Zulassungsdaten',
  'Gemeinsame Basiskomponente Identitätsnachweis',
  'Digitale Antragsstrecke für Elterngeld',
  'Automatisierte Aktenführung im Bauordnungswesen',
  'Standardisierung der Meldedatenübermittlung',
  'Cloud-Bereitstellung für Landesrechenzentren',
  'Barrierefreier Zugang zu Verwaltungsportalen',
  'Gemeinsames Datenschutz-Cockpit der Länder',
  'Nachnutzung einer Fachanwendung für Gewerbeanzeigen',
  'Schnittstelle zwischen Justiz- und Meldewesen',
  'Gemeinsames Portal für Fördermittelanträge',
  'Einheitliche Schnittstelle für Statistikmeldungen',
  'Nachnutzbare Komponente für Terminvergabe',
] as const;

export const TRAEGER_BUND = [
  'Landesrechenzentrum Nord',
  'Zweckverband Kommunale Datenverarbeitung Süd',
  'Landesamt für Digitalisierung West',
  'IT-Dienstleistungszentrum Ost',
  'Kommunaler Zweckverband Mitte',
  'Landesbetrieb Daten und Information Nordwest',
  'Rechenzentrum der Kommunen Südost',
  'Landesanstalt für Verwaltungsdigitalisierung Nordost',
  'Gemeinsames IT-Zentrum der Länder Südwest',
  'Kommunale Informationsverarbeitung Mittelland',
  'Landesagentur für digitale Verwaltung Oberland',
  'Zweckverband Digitalisierung Küste',
  'IT-Kooperation der Stadtstaaten',
  'Landesbetrieb Verwaltungs-IT Binnenland',
  'Gemeinsame Anstalt für Verwaltungssoftware',
  'Landesstelle für digitale Fachverfahren',
  'Kommunaler IT-Verbund Seenplatte',
] as const;

export const VERBUENDE = [
  'Verbund Nord',
  'Verbund Ost',
  'Verbund Süd',
  'Verbund West',
] as const;

export const EBENEN = [
  'Land',
  'Kommunaler Zusammenschluss',
  'Anstalt öffentlichen Rechts',
  'Bund',
] as const;

const VERBUND_GEWICHTE = [30, 25, 25, 20];
const EBENEN_GEWICHTE = [40, 30, 20, 10];

export type Programmtyp = 'buerger' | 'bund';

/**
 * Findet das Programm zu einem Zweck. Fällt auf das erste Programm des Typs
 * zurück, falls der Zweck von Hand geändert wurde.
 */
export function programmVon(typ: Programmtyp, zweck: string) {
  const welt = PROGRAMMTYPEN[typ];
  return welt.programme.find((p) => p.zweck === zweck) ?? welt.programme[0];
}

export type Programmtypbeschreibung = {
  id: Programmtyp;
  name: string;
  kurz: string;
  /** Wie die Beitragenden in der Oberfläche heißen. */
  beitragendeWort: string;
  /** Beschriftung der beiden Merkmalsfelder in dieser Welt. */
  merkmalsnamen: { region: string; altersgruppe: string };
  programme: readonly {
    readonly name: string;
    readonly zweck: string;
    readonly titel: readonly string[];
  }[];
  titel: readonly string[];
  traeger: readonly string[];
  regionen: readonly string[];
  regionGewichte: readonly number[];
  gruppen: readonly string[];
  gruppenGewichte: readonly number[];
};

export const PROGRAMMTYPEN: Record<Programmtyp, Programmtypbeschreibung> = {
  buerger: {
    id: 'buerger',
    name: 'Bürgerbeteiligung',
    kurz: 'Ehrenamtliche Vorhaben, getragen von Bürgerinnen und Bürgern mit Beiträgen ab wenigen Euro.',
    beitragendeWort: 'Personen',
    merkmalsnamen: { region: 'Region', altersgruppe: 'Altersgruppe' },
    programme: PROGRAMME,
    titel: VORHABENTITEL,
    traeger: TRAEGER,
    regionen: REGIONEN,
    regionGewichte: REGION_GEWICHTE,
    gruppen: ALTERSGRUPPEN,
    gruppenGewichte: ALTER_GEWICHTE,
  },
  bund: {
    id: 'bund',
    name: 'Bund und Länder',
    kurz: 'Gemeinsam finanzierte Vorhaben, getragen von Ländern, Kommunen und ihren Zusammenschlüssen aus dem eigenen Haushalt.',
    beitragendeWort: 'Stellen',
    merkmalsnamen: { region: 'Regionalverbund', altersgruppe: 'Ebene' },
    programme: PROGRAMME_BUND,
    titel: VORHABENTITEL_BUND,
    traeger: TRAEGER_BUND,
    regionen: VERBUENDE,
    regionGewichte: VERBUND_GEWICHTE,
    gruppen: EBENEN,
    gruppenGewichte: EBENEN_GEWICHTE,
  },
};

// --- Einstellungen -------------------------------------------------------

/** Rolle eines Vorhabens im Datensatz. Erzeugt die Muster, die der Vergleich zeigen soll. */
export type Vorhabenrolle =
  | 'normal' // viele kleine Beiträge
  | 'wenige-grosse' // wenige, große Beiträge — verliert unter QF
  | 'absprache'; // wird von der Absprachegruppe geschlossen mitgetragen

export const ROLLENNAMEN: Record<Vorhabenrolle, string> = {
  normal: 'Breite Unterstützung',
  'wenige-grosse': 'Wenige große Beiträge',
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
  /** Welche Welt: Bürgerbeteiligung oder Bund und Länder. */
  programmtyp: Programmtyp;
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
export function vorhabenvorgabe(
  index: number,
  rolle: Vorhabenrolle = 'normal',
  typ: Programmtyp = 'buerger',
  zweck?: string,
): Vorhabenvorgabe {
  const welt = PROGRAMMTYPEN[typ];
  const titelpool = zweck ? programmVon(typ, zweck).titel : welt.titel;
  return {
    id: `v-${index + 1}`,
    titel: titelpool[index % titelpool.length],
    traeger: welt.traeger[index % welt.traeger.length],
    beantragtCent: typ === 'bund' ? 250_000_000 : 100_000,
    jurypunkte: 50,
    zuspruch: 5,
    rolle,
  };
}

export const ZULASSUNGSKRITERIEN_BUND = [
  'Antragsteller ist eine Stelle des Bundes, eines Landes oder ein kommunaler Zusammenschluss.',
  'Das Vorhaben ist nachnutzbar und entfaltet deutschlandweite Wirkung.',
  'Die Umsetzung liegt vollständig im Förderzeitraum.',
  'Ein Kostenplan liegt vor; die beantragte Summe ist nachvollziehbar aufgeschlüsselt.',
  'Mindestens eine beitragende Stelle beteiligt sich aus dem eigenen Haushalt.',
];

/** Die Ausgangsrunde des Prototyps. Erzeugt src/daten/runde-demo.json. */
export const STANDARD_EINSTELLUNGEN: Simulationseinstellungen = {
  seed: STANDARD_SEED,
  programmtyp: 'buerger',
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
    { ...vorhabenvorgabe(0, 'normal', 'buerger', PROGRAMME[0].zweck), beantragtCent: 100_000, jurypunkte: 74, zuspruch: 10 },
    {
      ...vorhabenvorgabe(1, 'wenige-grosse', 'buerger', PROGRAMME[0].zweck),
      beantragtCent: 100_000,
      jurypunkte: 92,
      zuspruch: 1,
    },
    { ...vorhabenvorgabe(2, 'normal', 'buerger', PROGRAMME[0].zweck), beantragtCent: 100_000, jurypunkte: 88, zuspruch: 9 },
    { ...vorhabenvorgabe(3, 'normal', 'buerger', PROGRAMME[0].zweck), beantragtCent: 80_000, jurypunkte: 81, zuspruch: 6 },
    { ...vorhabenvorgabe(4, 'normal', 'buerger', PROGRAMME[0].zweck), beantragtCent: 30_000, jurypunkte: 44, zuspruch: 2 },
    { ...vorhabenvorgabe(5, 'absprache', 'buerger', PROGRAMME[0].zweck), beantragtCent: 70_000, jurypunkte: 63, zuspruch: 3 },
    { ...vorhabenvorgabe(6, 'absprache', 'buerger', PROGRAMME[0].zweck), beantragtCent: 65_000, jurypunkte: 69, zuspruch: 2 },
    { ...vorhabenvorgabe(7, 'normal', 'buerger', PROGRAMME[0].zweck), beantragtCent: 60_000, jurypunkte: 57, zuspruch: 5 },
  ],
};

/**
 * Ausgangsrunde für den Programmtyp "Bund und Länder".
 *
 * Größenordnung angelehnt an das Digitalisierungsbudget des IT-Planungsrats:
 * ein Vielfaches der Anträge steht dem verfügbaren Betrag gegenüber. Beitragende
 * sind hier keine Privatpersonen, sondern Länder, Kommunen und ihre
 * Zusammenschlüsse — entsprechend wenige, mit entsprechend hohen Beiträgen.
 */
export const STANDARD_EINSTELLUNGEN_BUND: Simulationseinstellungen = {
  seed: STANDARD_SEED,
  programmtyp: 'bund',
  zweck: PROGRAMME_BUND[0].zweck,
  zeitraumVon: '2027-01-01',
  zeitraumBis: '2027-12-31',
  poolCent: 800_000_000, // 8 Mio. €
  hoechstbetragJeVorhabenCent: 250_000_000, // 2,5 Mio. €
  // Beitragende sind hier Länder, Kommunen und ihre Zusammenschlüsse. Ihre Zahl
  // muss deutlich über der Zahl der Vorhaben liegen, sonst kann sich die
  // Mitträgerschaft gar nicht gegen wenige große Beiträge durchsetzen — das
  // Vorhaben "zwölf Länder mit kleinen Beträgen" braucht die zwölf.
  beitragendeGesamt: 110,
  betragMinCent: 500_000, // 5.000 €
  betragMaxCent: 8_000_000, // 80.000 €
  abspracheGroesse: 9,
  zulassungskriterien: ZULASSUNGSKRITERIEN_BUND,
  vorhaben: [
    { ...vorhabenvorgabe(0, 'normal', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 600_000_000, jurypunkte: 74, zuspruch: 10 },
    { ...vorhabenvorgabe(1, 'wenige-grosse', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 500_000_000, jurypunkte: 92, zuspruch: 1 },
    { ...vorhabenvorgabe(2, 'normal', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 550_000_000, jurypunkte: 88, zuspruch: 9 },
    { ...vorhabenvorgabe(3, 'normal', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 420_000_000, jurypunkte: 81, zuspruch: 6 },
    { ...vorhabenvorgabe(4, 'normal', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 200_000_000, jurypunkte: 44, zuspruch: 2 },
    { ...vorhabenvorgabe(5, 'absprache', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 380_000_000, jurypunkte: 63, zuspruch: 4 },
    { ...vorhabenvorgabe(6, 'absprache', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 340_000_000, jurypunkte: 69, zuspruch: 3 },
    { ...vorhabenvorgabe(7, 'normal', 'bund', PROGRAMME_BUND[0].zweck), beantragtCent: 300_000_000, jurypunkte: 57, zuspruch: 5 },
  ],
};

export const AUSGANGSRUNDEN: Record<Programmtyp, Simulationseinstellungen> = {
  buerger: STANDARD_EINSTELLUNGEN,
  bund: STANDARD_EINSTELLUNGEN_BUND,
};

// --- Zufällige, aber plausible Vorhaben ----------------------------------

/** Rundenwerte, aus denen sich die Vorhaben bemessen lassen. */
export type Rundenrahmen = Pick<
  Simulationseinstellungen,
  | 'programmtyp'
  | 'zweck'
  | 'poolCent'
  | 'hoechstbetragJeVorhabenCent'
  | 'beitragendeGesamt'
  | 'betragMinCent'
  | 'betragMaxCent'
  | 'abspracheGroesse'
>;

/**
 * Leitet einen plausiblen Satz Vorhaben aus einem Seed und den bereits
 * eingestellten Rundenwerten ab. Der Fördertopf, die Zahl der Beitragenden und
 * die Beitragsspanne bleiben unangetastet — gewürfelt werden nur die Vorhaben
 * und die Verteilung ihrer Werte.
 *
 * Die Bandbreiten sind bewusst eng. Eine Runde, in der jedes Vorhaben von einer
 * einzigen Person getragen wird, wäre zwar zufällig, aber als Demonstration
 * wertlos. Ebenso eine Runde, deren Topf für alle Vorhaben reicht: dann ergeben
 * alle Verfahren dasselbe und die Gegenüberstellung zeigt nichts.
 */
export function zufaelligeVorhaben(seed: number, rahmen: Rundenrahmen): Vorhabenvorgabe[] {
  // Eigener Zufallsstrom, damit Konfiguration und Beitragsverteilung nicht
  // aneinander gekoppelt sind.
  const zufall = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const ganzzahl = (min: number, max: number) => min + Math.floor(zufall() * (max - min + 1));
  const mische = <T>(liste: readonly T[]): T[] => {
    const kopie = [...liste];
    for (let i = kopie.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1));
      [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
    }
    return kopie;
  };

  const obergrenze = rahmen.hoechstbetragJeVorhabenCent ?? Number.POSITIVE_INFINITY;

  // Der Fördertopf soll knapp sein: Er darf nur 35 bis 55 Prozent dessen
  // decken, was die Runde aufnehmen könnte. Ein Topf, der für alle reicht,
  // macht sämtliche Verfahren gleich und die Gegenüberstellung wertlos.
  const deckungsgrad = 0.35 + zufall() * 0.2;
  const zielAufnahme = rahmen.poolCent / deckungsgrad;

  // Daraus folgt die Zahl der Vorhaben: Begrenzt der Höchstbetrag, was ein
  // einzelnes Vorhaben aufnehmen kann, braucht ein großer Topf entsprechend
  // mehr Bewerber, um überhaupt knapp zu sein.
  const mindestanzahl = Number.isFinite(obergrenze) ? Math.ceil(zielAufnahme / obergrenze) : 6;
  const welt = PROGRAMMTYPEN[rahmen.programmtyp];
  // Die Titel stammen aus dem gewählten Programm, nicht aus dem Programmtyp:
  // Wer "Klimaanpassung" wählt, soll keine Verkehrszählgeräte gewürfelt bekommen.
  const programm = programmVon(rahmen.programmtyp, rahmen.zweck);
  const anzahl = Math.min(programm.titel.length, Math.max(6, mindestanzahl));

  const titel = mische(programm.titel).slice(0, anzahl);
  const traeger = mische(welt.traeger).slice(0, anzahl);

  // Zuspruch als abfallende Reihe: wenige stark getragene Vorhaben, viele
  // mittlere. Gleichverteilter Zuspruch erzeugt eine langweilige Runde.
  const zuspruchReihe = Array.from({ length: anzahl }, (_, i) =>
    Math.max(1, Math.round(10 - (i * 8) / Math.max(1, anzahl - 1))),
  );
  const zuspruch = mische(zuspruchReihe);

  const rollen: Vorhabenrolle[] = Array.from({ length: anzahl }, () => 'normal');
  const freieIndizes = mische(Array.from({ length: anzahl }, (_, i) => i));
  let naechster = 0;

  // Genau ein Vorhaben mit wenigen großen Beiträgen — der Kontrast, um den es geht.
  rollen[freieIndizes[naechster++]] = 'wenige-grosse';

  // Absprachegruppe braucht genau zwei Vorhaben, sonst ist sie wirkungslos —
  // und nur dann, wenn in den Rundenwerten überhaupt eine Gruppe vorgesehen ist.
  const mitAbsprache = anzahl >= 5 && rahmen.abspracheGroesse > 0;
  if (mitAbsprache) {
    rollen[freieIndizes[naechster++]] = 'absprache';
    rollen[freieIndizes[naechster++]] = 'absprache';
  }

  const { betragMinCent, betragMaxCent, beitragendeGesamt } = rahmen;
  const abspracheGroesse = mitAbsprache ? rahmen.abspracheGroesse : 0;

  const wirksameRollen = rollen.map((r) => (r === 'absprache' && !mitAbsprache ? 'normal' : r));

  // Erwartete Beitragssumme je Vorhaben abschätzen, wie erzeugeRunde sie
  // später tatsächlich verteilt. Nur so lassen sich Kostenplan und Fördertopf
  // so bemessen, dass eine knappe — und damit aussagekräftige — Runde entsteht.
  const mittlererBetrag = (betragMinCent + betragMaxCent) / 2;
  const anzahlGross = wirksameRollen.filter((r) => r === 'wenige-grosse').length;
  const frischeGesamt = Math.max(0, beitragendeGesamt - abspracheGroesse - anzahlGross * 3);
  const gewichtsumme = wirksameRollen.reduce(
    (a, r, i) => (r === 'wenige-grosse' ? a : a + zuspruch[i]),
    0,
  );

  const eigenErwartet = wirksameRollen.map((rolle, i) => {
    // "wenige große Beiträge": drei Beitragende, Beträge weit über der Spanne.
    if (rolle === 'wenige-grosse') return 3 * betragMaxCent * 9.5;
    const koepfe = gewichtsumme > 0 ? (frischeGesamt * zuspruch[i]) / gewichtsumme : 2;
    const ausAbsprache = rolle === 'absprache' ? abspracheGroesse * betragMaxCent : 0;
    return koepfe * mittlererBetrag + ausAbsprache;
  });

  // Der Spielraum eines Vorhabens — Kostenplan abzüglich erwarteter
  // Beitragssumme — ist das, was ihm überhaupt zugeteilt werden kann. Die
  // Summe dieser Spielräume ist die Aufnahmefähigkeit der Runde.
  const hoechsteAufnahme = Number.isFinite(obergrenze) ? anzahl * obergrenze * 0.95 : Infinity;
  const aufnahme = Math.min(zielAufnahme, hoechsteAufnahme);

  // Spielräume mit Streuung verteilen, dann auf die Obergrenze kappen und den
  // Gesamtbetrag nachziehen, damit die Aufnahmefähigkeit trotz Kappung stimmt.
  const streuung = Array.from({ length: anzahl }, () => 0.6 + zufall() * 0.8);
  const streuungssumme = streuung.reduce((a, b) => a + b, 0);
  const spielraum = streuung.map((s) =>
    Math.min(obergrenze, Math.max(5_000, (aufnahme * s) / streuungssumme)),
  );

  // Rundungsschritt und Spanne skalieren mit der Größenordnung der Runde.
  const schritt = rahmen.programmtyp === 'bund' ? 5_000_000 : 5_000;
  const untergrenze = rahmen.programmtyp === 'bund' ? 20_000_000 : 20_000;
  const obergrenzeKostenplan = rahmen.programmtyp === 'bund' ? 3_000_000_000 : 300_000;
  const beantragt = eigenErwartet.map((eigen, i) =>
    Math.min(
      obergrenzeKostenplan,
      Math.max(untergrenze, Math.round((eigen + spielraum[i]) / schritt) * schritt),
    ),
  );

  return Array.from({ length: anzahl }, (_, i) => ({
    id: `v-${i + 1}`,
    titel: titel[i],
    traeger: traeger[i],
    beantragtCent: beantragt[i],
    jurypunkte: ganzzahl(40, 95),
    zuspruch: wirksameRollen[i] === 'wenige-grosse' ? 1 : zuspruch[i],
    rolle: wirksameRollen[i],
  }));
}

/** Neuer Seed für den Würfelknopf. Nur hier ist echter Zufall erlaubt. */
export function neuerSeed(): number {
  return 1 + Math.floor(Math.random() * 99_999_999);
}

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
  const gewichtsumme = vorgaben.reduce(
    (a, v) => (v.rolle === 'wenige-grosse' ? a : a + v.zuspruch),
    0,
  );

  const frischeGesamt = Math.max(
    0,
    einstellungen.beitragendeGesamt -
      abspracheGroesse -
      vorgaben.filter((v) => v.rolle === 'wenige-grosse').length * 3,
  );

  const anzahlJeVorhaben = new Map<string, number>();
  for (const v of vorgaben) {
    if (v.rolle === 'wenige-grosse') anzahlJeVorhaben.set(v.id, 3);
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

  const welt = PROGRAMMTYPEN[einstellungen.programmtyp];
  const merkmalJePerson = new Map<string, { region: string; altersgruppe: string }>();
  // Die Absprachegruppe sitzt geschlossen in einer selteneren Merkmalskombination,
  // damit die Clusteransicht überhaupt etwas zu zeigen hat.
  const abspracheMerkmal = {
    region: welt.regionen[welt.regionen.length - 2],
    altersgruppe: welt.gruppen[welt.gruppen.length - 1],
  };
  for (const id of abspracheIds) merkmalJePerson.set(id, abspracheMerkmal);
  for (const id of [...uebrige].sort()) {
    merkmalJePerson.set(id, {
      region: gewichtet(welt.regionen, welt.regionGewichte),
      altersgruppe: gewichtet(welt.gruppen, welt.gruppenGewichte),
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
