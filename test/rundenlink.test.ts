// Ein Link soll beim Empfänger dieselbe Runde erzeugen — und damit dieselbe
// Prüfsumme. Das ist die Reproduzierbarkeitsaussage des Prototyps, nur als
// Adresse.

import { describe, expect, it } from 'vitest';
import { pruefsumme } from '../src/kern/pruefsumme';
import { ausLink, nachLink } from '../src/kern/rundenlink';
import {
  erzeugeRunde,
  STANDARD_EINSTELLUNGEN,
  STANDARD_EINSTELLUNGEN_BUND,
  zufaelligeVorhaben,
  type Simulationseinstellungen,
} from '../src/kern/simulation';

function mitGewuerfeltenVorhaben(
  grundlage: Simulationseinstellungen,
  seed: number,
): Simulationseinstellungen {
  const mitSeed = { ...grundlage, seed };
  return { ...mitSeed, vorhaben: zufaelligeVorhaben(seed, mitSeed) };
}

describe('Runde als Link', () => {
  const faelle: [string, Simulationseinstellungen][] = [
    ['Bürgerbeteiligung, Ausgangsrunde', STANDARD_EINSTELLUNGEN],
    ['Bund und Länder, Ausgangsrunde', STANDARD_EINSTELLUNGEN_BUND],
    ['Bürgerbeteiligung, gewürfelt', mitGewuerfeltenVorhaben(STANDARD_EINSTELLUNGEN, 4711)],
    ['Bund und Länder, gewürfelt', mitGewuerfeltenVorhaben(STANDARD_EINSTELLUNGEN_BUND, 99_991)],
    [
      'abweichende Rundenwerte',
      {
        ...mitGewuerfeltenVorhaben(STANDARD_EINSTELLUNGEN, 815),
        poolCent: 1_234_500,
        hoechstbetragJeVorhabenCent: null,
        beitragendeGesamt: 275,
        abspracheGroesse: 0,
      },
    ],
  ];

  for (const [name, einstellungen] of faelle) {
    it(`stellt "${name}" unverändert wieder her`, () => {
      const zurueck = ausLink(nachLink(einstellungen));
      expect(zurueck).not.toBeNull();
      expect(JSON.stringify(zurueck)).toBe(JSON.stringify(einstellungen));
    });

    it(`liefert für "${name}" dieselbe Prüfsumme`, async () => {
      const zurueck = ausLink(nachLink(einstellungen))!;
      expect(await pruefsumme(erzeugeRunde(zurueck))).toBe(
        await pruefsumme(erzeugeRunde(einstellungen)),
      );
    });
  }

  it('gibt gewürfelte Vorhaben nicht mit, sondern leitet sie aus dem Seed ab', () => {
    const gewuerfelt = mitGewuerfeltenVorhaben(STANDARD_EINSTELLUNGEN, 20_260_820);
    const vonHand: Simulationseinstellungen = {
      ...gewuerfelt,
      vorhaben: gewuerfelt.vorhaben.map((v) => ({ ...v, jurypunkte: 7 })),
    };
    expect(nachLink(gewuerfelt).length).toBeLessThan(nachLink(vonHand).length);
  });

  it('überträgt von Hand geänderte Vorhaben vollständig', () => {
    const gewuerfelt = mitGewuerfeltenVorhaben(STANDARD_EINSTELLUNGEN, 606);
    const vonHand: Simulationseinstellungen = {
      ...gewuerfelt,
      vorhaben: gewuerfelt.vorhaben.map((v, i) => ({
        ...v,
        beantragtCent: 40_000 + i * 5_000,
        jurypunkte: 50 + i,
        zuspruch: ((i * 3) % 10) + 1,
      })),
    };
    expect(JSON.stringify(ausLink(nachLink(vonHand)))).toBe(JSON.stringify(vonHand));
  });

  it('bleibt kurz genug für eine Adresszeile', () => {
    for (const [, einstellungen] of faelle) {
      expect(nachLink(einstellungen).length).toBeLessThan(2000);
    }
  });

  it('weist Unsinn zurück, statt zu stürzen', () => {
    expect(ausLink('')).toBeNull();
    expect(ausLink('keine-gültige-nutzlast')).toBeNull();
    expect(ausLink(btoa('[99,0,1]'))).toBeNull();
    expect(ausLink(btoa('{"kein":"array"}'))).toBeNull();
  });
});
