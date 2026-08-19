// Erzeugt Begründungstexte je Zuteilung in Verwaltungsdeutsch.
//
// Die Texte behaupten nichts, was die Rechnung nicht hergibt. Sie stellen fest,
// wie bemessen wurde — sie bewilligen nicht.

import { euro, kurzePruefsumme, prozent, zahl } from '../format';
import type { Vorhabenwerte } from '../kern/qf';
import type { Runde, Vorhaben } from '../kern/typen';
import type { Verteilschritt } from '../kern/verteilung';

export type Begruendungsdaten = {
  runde: Runde;
  vorhaben: Vorhaben;
  werte: Vorhabenwerte;
  schritt: Verteilschritt;
  /** Summe der Bemessungswerte aller zugelassenen Vorhaben. */
  gesamtbemessungswert: number;
  pruefsumme: string;
};

function satzZumHoechstbetrag(d: Begruendungsdaten): string {
  const { runde, werte, schritt } = d;

  if (schritt.endbetragCent === 0) return '';

  if (schritt.gedeckelt) {
    if (werte.deckelGrund === 'kostenplan') {
      return (
        `Die Zuteilung ist auf ${euro(werte.deckelCent)} begrenzt, weil Zuteilung und ` +
        `Beitragssumme zusammen den Kostenplan von ${euro(d.vorhaben.beantragtCent)} nicht ` +
        `überschreiten dürfen.`
      );
    }
    if (werte.deckelGrund === 'beide') {
      return (
        `Die Zuteilung ist auf ${euro(werte.deckelCent)} begrenzt; Höchstbetrag je Vorhaben ` +
        `und die Grenze aus dem Kostenplan fallen hier zusammen.`
      );
    }
    return (
      `Die Zuteilung ist auf den Höchstbetrag je Vorhaben von ` +
      `${euro(runde.hoechstbetragJeVorhabenCent ?? werte.deckelCent)} begrenzt.`
    );
  }

  if (runde.hoechstbetragJeVorhabenCent !== null) {
    return (
      `Der Höchstbetrag je Vorhaben von ${euro(runde.hoechstbetragJeVorhabenCent)} wurde ` +
      `nicht erreicht.`
    );
  }
  return 'Ein Höchstbetrag je Vorhaben ist für diese Runde nicht festgelegt.';
}

export function begruendung(d: Begruendungsdaten): string {
  const { vorhaben, werte, schritt, runde, gesamtbemessungswert, pruefsumme } = d;
  const saetze: string[] = [];

  if (schritt.endbetragCent === 0 && werte.beitragendeAnzahl <= 1) {
    saetze.push(
      `Dem Vorhaben „${vorhaben.titel}“ (Träger: ${vorhaben.traeger}) wird kein Betrag ` +
        `zugeteilt.`,
    );
    saetze.push(
      werte.beitragendeAnzahl === 0
        ? 'Für das Vorhaben liegt kein Beitrag vor.'
        : `Das Vorhaben wurde von einer einzelnen Person mit ${euro(werte.eigenCent)} ` +
          `mitgetragen.`,
    );
    saetze.push(
      'Die Bemessungsregel bemisst die Mitträgerschaft durch mehrere Personen. Bei ' +
        'höchstens einer beitragenden Person ist der Bemessungswert null; daraus folgt ' +
        'eine Zuteilung von null. Das ist der von der Regel vorgesehene Fall und kein ' +
        'Rechenfehler.',
    );
  } else {
    saetze.push(
      `Dem Vorhaben „${vorhaben.titel}“ (Träger: ${vorhaben.traeger}) werden ` +
        `${euro(schritt.endbetragCent)} zugeteilt.`,
    );
    saetze.push(
      `Die Zuteilung folgt der veröffentlichten Bemessungsregel in der Fassung ` +
        `${runde.formelVersion}.`,
    );
    saetze.push(
      `Das Vorhaben wurde von ${werte.beitragendeAnzahl} beitragenden Personen mit ` +
        `insgesamt ${euro(werte.eigenCent)} mitgetragen.`,
    );
    const anteil = gesamtbemessungswert > 0 ? werte.rohEuro / gesamtbemessungswert : 0;
    saetze.push(
      `Daraus ergibt sich ein Bemessungswert von ${zahl(werte.rohEuro, 2)}; das entspricht ` +
        `einem Anteil von ${prozent(anteil)} am Gesamtbemessungswert aller zugelassenen ` +
        `Vorhaben.`,
    );
    if (schritt.fixiertInDurchlauf !== null && schritt.fixiertInDurchlauf > 0) {
      saetze.push(
        `Die verhältnismäßige Verteilung hätte im ${schritt.fixiertInDurchlauf}. Durchlauf ` +
          `${euro(Math.round(schritt.vorlaeufigCent))} ergeben.`,
      );
    }
    const hoechstbetragSatz = satzZumHoechstbetrag(d);
    if (hoechstbetragSatz) saetze.push(hoechstbetragSatz);
  }

  saetze.push(
    `Die Berechnung ist anhand der veröffentlichten Regel und der Eingangsdaten mit der ` +
      `Prüfsumme ${kurzePruefsumme(pruefsumme)} vollständig nachvollziehbar.`,
  );

  return saetze.join(' ');
}
