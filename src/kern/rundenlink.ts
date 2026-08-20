// Eine Runde als Link.
//
// Der Seed bestimmt die Runde vollständig. Ein Link, der Seed und Einstellungen
// mitführt, erzeugt beim Empfänger dieselbe Runde und damit dieselbe Prüfsumme —
// die Reproduzierbarkeitsaussage des Prototyps als teilbare Adresse.
//
// Wurden die Vorhaben nicht von Hand geändert, genügt der Seed: Sie werden aus
// ihm neu abgeleitet und müssen nicht mitgeschickt werden. Nur bei Änderungen
// wandert die Liste als Zahlenfolge mit.

import type { Programmtyp, Simulationseinstellungen, Vorhabenrolle } from './simulation';
import { AUSGANGSRUNDEN, PROGRAMMTYPEN, programmVon, zufaelligeVorhaben } from './simulation';

const FASSUNG = 1;
const TYPEN: Programmtyp[] = ['buerger', 'bund'];
const ROLLEN: Vorhabenrolle[] = ['normal', 'wenige-grosse', 'absprache'];

/** Kompakte Fassung eines Vorhabens: nur Kennziffern, keine Klartexte. */
type Vorhabenzeile = [
  titelIndex: number,
  traegerIndex: number,
  beantragtCent: number,
  jurypunkte: number,
  zuspruch: number,
  rolleIndex: number,
];

type Nutzlast = [
  fassung: number,
  typIndex: number,
  seed: number,
  programmIndex: number,
  zeitraumVon: string,
  zeitraumBis: string,
  poolCent: number,
  hoechstbetragJeVorhabenCent: number | null,
  beitragendeGesamt: number,
  betragMinCent: number,
  betragMaxCent: number,
  abspracheGroesse: number,
  vorhaben: Vorhabenzeile[] | null,
];

function nachBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ausBase64Url(text: string): string {
  const aufgefuellt = text.replace(/-/g, '+').replace(/_/g, '/');
  return atob(aufgefuellt + '='.repeat((4 - (aufgefuellt.length % 4)) % 4));
}

/** Sind die Vorhaben genau die, die der Seed erzeugt? Dann reicht der Seed. */
function ausDemSeedAbleitbar(e: Simulationseinstellungen): boolean {
  return JSON.stringify(zufaelligeVorhaben(e.seed, e)) === JSON.stringify(e.vorhaben);
}

export function nachLink(e: Simulationseinstellungen): string {
  const welt = PROGRAMMTYPEN[e.programmtyp];
  const programmIndex = Math.max(
    0,
    welt.programme.findIndex((p) => p.zweck === e.zweck),
  );
  const titelpool = programmVon(e.programmtyp, e.zweck).titel;

  const nutzlast: Nutzlast = [
    FASSUNG,
    TYPEN.indexOf(e.programmtyp),
    e.seed,
    programmIndex,
    e.zeitraumVon,
    e.zeitraumBis,
    e.poolCent,
    e.hoechstbetragJeVorhabenCent,
    e.beitragendeGesamt,
    e.betragMinCent,
    e.betragMaxCent,
    e.abspracheGroesse,
    ausDemSeedAbleitbar(e)
      ? null
      : e.vorhaben.map((v) => [
          Math.max(0, titelpool.indexOf(v.titel)),
          Math.max(0, welt.traeger.indexOf(v.traeger)),
          v.beantragtCent,
          v.jurypunkte,
          v.zuspruch,
          Math.max(0, ROLLEN.indexOf(v.rolle)),
        ]),
  ];

  return nachBase64Url(JSON.stringify(nutzlast));
}

export function ausLink(text: string): Simulationseinstellungen | null {
  try {
    const roh = JSON.parse(ausBase64Url(text)) as unknown;
    if (!Array.isArray(roh) || roh[0] !== FASSUNG) return null;
    const [
      ,
      typIndex,
      seed,
      programmIndex,
      zeitraumVon,
      zeitraumBis,
      poolCent,
      hoechstbetrag,
      beitragendeGesamt,
      betragMinCent,
      betragMaxCent,
      abspracheGroesse,
      vorhabenroh,
    ] = roh as Nutzlast;

    const programmtyp = TYPEN[typIndex];
    if (!programmtyp) return null;
    const welt = PROGRAMMTYPEN[programmtyp];
    const programm = welt.programme[programmIndex] ?? welt.programme[0];

    const grundlage: Simulationseinstellungen = {
      ...AUSGANGSRUNDEN[programmtyp],
      seed,
      programmtyp,
      zweck: programm.zweck,
      zeitraumVon,
      zeitraumBis,
      poolCent,
      hoechstbetragJeVorhabenCent: hoechstbetrag,
      beitragendeGesamt,
      betragMinCent,
      betragMaxCent,
      abspracheGroesse,
      vorhaben: [],
    };

    const vorhaben =
      vorhabenroh === null
        ? zufaelligeVorhaben(seed, grundlage)
        : vorhabenroh.map((z, i) => ({
            id: `v-${i + 1}`,
            titel: programm.titel[z[0]] ?? programm.titel[0],
            traeger: welt.traeger[z[1]] ?? welt.traeger[0],
            beantragtCent: z[2],
            jurypunkte: z[3],
            zuspruch: z[4],
            rolle: ROLLEN[z[5]] ?? 'normal',
          }));

    return { ...grundlage, vorhaben };
  } catch {
    return null;
  }
}
