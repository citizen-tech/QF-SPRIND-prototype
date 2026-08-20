// Der Probeberechnungs-Hinweis meldete eine Abweichung, konnte sie aber nicht
// benennen, weil die Aufzählung weniger Größen abdeckte als der Vergleich.
// Diese Tests halten fest, dass beide dieselben Größen kennen.

import { describe, expect, it } from 'vitest';
import { abweichungenVonAusgangsrunde, rundenwerteGleich } from '../src/nachweis/abweichungen';
import type { Simulationseinstellungen } from '../src/kern/simulation';
import { AUSGANGSRUNDEN, PROGRAMMTYPEN } from '../src/kern/simulation';

const WELTEN: Simulationseinstellungen[] = [AUSGANGSRUNDEN.buerger, AUSGANGSRUNDEN.bund];

/** Je Rundenwert eine Abwandlung, die sich vom Ausgangswert unterscheidet. */
function abwandlungen(s: Simulationseinstellungen): [string, Simulationseinstellungen][] {
  const anderesProgramm = PROGRAMMTYPEN[s.programmtyp].programme.find((p) => p.zweck !== s.zweck)!;
  return [
    ['Programm', { ...s, zweck: anderesProgramm.zweck }],
    ['Zeitraum', { ...s, zeitraumVon: '2030-01-01' }],
    ['Fördertopf', { ...s, poolCent: s.poolCent * 2 + 100 }],
    ['Höchstbetrag', { ...s, hoechstbetragJeVorhabenCent: null }],
    ['Beitragende', { ...s, beitragendeGesamt: s.beitragendeGesamt + 7 }],
    ['Beitragsspanne unten', { ...s, betragMinCent: s.betragMinCent + 100 }],
    ['Beitragsspanne oben', { ...s, betragMaxCent: s.betragMaxCent * 4 }],
    ['Absprachegruppe', { ...s, abspracheGroesse: 0 }],
    ['Zulassungskriterien', { ...s, zulassungskriterien: ['Etwas anderes.'] }],
  ];
}

describe('Abweichungen von der Ausgangsrunde', () => {
  it('meldet für die Ausgangsrunde selbst nichts', () => {
    for (const s of WELTEN) expect(abweichungenVonAusgangsrunde(s)).toEqual([]);
  });

  it('lässt gewürfelte Vorhaben und einen neuen Seed unbeanstandet', () => {
    for (const s of WELTEN) {
      const gewuerfelt: Simulationseinstellungen = {
        ...s,
        seed: 4711,
        vorhaben: s.vorhaben.slice(0, 3),
      };
      expect(abweichungenVonAusgangsrunde(gewuerfelt)).toEqual([]);
      expect(rundenwerteGleich(gewuerfelt, s)).toBe(true);
    }
  });

  it('benennt jede einzelne Abweichung, statt allgemein zu bleiben', () => {
    for (const s of WELTEN) {
      for (const [name, abgewandelt] of abwandlungen(s)) {
        expect(rundenwerteGleich(abgewandelt, s), `${name} sollte als Abweichung gelten`).toBe(
          false,
        );
        const liste = abweichungenVonAusgangsrunde(abgewandelt);
        expect(liste.length, `${name} wird nicht benannt`).toBeGreaterThan(0);
        for (const satz of liste) expect(satz.length).toBeGreaterThan(10);
      }
    }
  });

  it('zählt mehrere Abweichungen einzeln auf', () => {
    const s = AUSGANGSRUNDEN.bund;
    const liste = abweichungenVonAusgangsrunde({
      ...s,
      poolCent: s.poolCent * 3,
      betragMinCent: 2_000_000,
      betragMaxCent: 100_000_000,
      beitragendeGesamt: 240,
    });
    expect(liste).toHaveLength(3);
  });

  it('nennt bei der Beitragsspanne beide Grenzen', () => {
    const s = AUSGANGSRUNDEN.bund;
    const [satz] = abweichungenVonAusgangsrunde({
      ...s,
      betragMinCent: 2_000_000,
      betragMaxCent: 100_000_000,
    });
    expect(satz).toContain('20.000,00 €');
    expect(satz).toContain('1.000.000,00 €');
  });
});
