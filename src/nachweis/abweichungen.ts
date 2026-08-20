// Was weicht an einer Runde von der Ausgangsrunde ihres Programmtyps ab?
//
// Die Nachweismappe weist eine solche Runde als Probeberechnung aus. Ein
// Hinweis, der eine Abweichung meldet, sie aber nicht benennen kann, ist
// wertlos — deshalb muss die Aufzählung jede Größe abdecken, die auch der
// Vergleich betrachtet. Der Test zu dieser Datei hält das fest.

import { datum, euro } from '../format';
import type { Simulationseinstellungen } from '../kern/simulation';
import { AUSGANGSRUNDEN, programmVon } from '../kern/simulation';

/**
 * Vergleicht die Rundenwerte, ohne Vorhaben und Seed: Beide werden gewürfelt
 * und sind der vorgesehene Gang, keine Abweichung.
 */
export function rundenwerteGleich(
  a: Simulationseinstellungen,
  b: Simulationseinstellungen,
): boolean {
  const ohne = (x: Simulationseinstellungen) => JSON.stringify({ ...x, vorhaben: [], seed: 0 });
  return ohne(a) === ohne(b);
}

export function abweichungenVonAusgangsrunde(e: Simulationseinstellungen): string[] {
  const s = AUSGANGSRUNDEN[e.programmtyp];
  if (rundenwerteGleich(e, s)) return [];

  const liste: string[] = [];

  if (e.zweck !== s.zweck) {
    liste.push(
      `Programm: „${programmVon(e.programmtyp, e.zweck).name}“ statt ` +
        `„${programmVon(s.programmtyp, s.zweck).name}“.`,
    );
  }

  if (e.zeitraumVon !== s.zeitraumVon || e.zeitraumBis !== s.zeitraumBis) {
    liste.push(
      `Förderzeitraum ${datum(e.zeitraumVon)} – ${datum(e.zeitraumBis)} statt ` +
        `${datum(s.zeitraumVon)} – ${datum(s.zeitraumBis)}.`,
    );
  }

  if (e.poolCent !== s.poolCent) {
    liste.push(`Fördertopf ${euro(e.poolCent)} statt ${euro(s.poolCent)}.`);
  }

  if (e.hoechstbetragJeVorhabenCent !== s.hoechstbetragJeVorhabenCent) {
    const wort = (cent: number | null) => (cent === null ? 'ohne Höchstbetrag' : euro(cent));
    liste.push(
      `Höchstbetrag je Vorhaben: ${wort(e.hoechstbetragJeVorhabenCent)} statt ` +
        `${wort(s.hoechstbetragJeVorhabenCent)}.`,
    );
  }

  if (e.beitragendeGesamt !== s.beitragendeGesamt) {
    liste.push(`${e.beitragendeGesamt} Beitragende statt ${s.beitragendeGesamt}.`);
  }

  if (e.betragMinCent !== s.betragMinCent || e.betragMaxCent !== s.betragMaxCent) {
    liste.push(
      `Beitragsspanne ${euro(e.betragMinCent)} bis ${euro(e.betragMaxCent)} statt ` +
        `${euro(s.betragMinCent)} bis ${euro(s.betragMaxCent)}.`,
    );
  }

  if (e.abspracheGroesse !== s.abspracheGroesse) {
    liste.push(
      e.abspracheGroesse === 0
        ? `Keine Absprachegruppe statt einer Gruppe aus ${s.abspracheGroesse} Beitragenden.`
        : `Absprachegruppe aus ${e.abspracheGroesse} Beitragenden statt ${s.abspracheGroesse}.`,
    );
  }

  if (e.zulassungskriterien.join('|') !== s.zulassungskriterien.join('|')) {
    liste.push('Die Zulassungskriterien weichen von der Ausgangsrunde ab.');
  }

  return liste;
}
