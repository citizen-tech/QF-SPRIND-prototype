// Baut das Nachweisobjekt. Dasselbe Objekt trägt die Druckansicht und den
// JSON-Download — was gedruckt wird, steht auch in der Datei.

import type { Vorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { VERFAHREN, VERFAHREN_IDS } from '../kern/vergleich';
import { begruendung } from './begruendung';

export const HINWEIS_PROBEBERECHNUNG =
  'Diese Zusammenstellung dokumentiert eine simulierte Runde und weist damit eine ' +
  'Probeberechnung aus, keine Festlegung. Vorhaben, Träger und Beiträge sind synthetisch ' +
  'erzeugt; die Eingangsgrößen wurden für diese Vorführung gewählt.';

export const HINWEIS_PROTOTYP =
  'Prototyp — synthetische Daten — kein Verwaltungsakt. ' +
  'Diese Zusammenstellung dient allein der Demonstration der Nachrechenbarkeit. ' +
  'Sie ist kein Zuwendungsbescheid und begründet keinen Anspruch.';

export type Mappenzeile = {
  vorhabenId: string;
  titel: string;
  traeger: string;
  beantragtCent: number;
  beitragendeAnzahl: number;
  beitragssummeCent: number;
  wurzelsumme: number;
  quadrat: number;
  bemessungswert: number;
  anteilAmBemessungswert: number;
  deckelCent: number;
  deckelGrund: Vorhabenwerte['deckelGrund'];
  vorlaeufigCent: number;
  gedeckelt: boolean;
  fixiertInDurchlauf: number | null;
  zuteilungCent: number;
  begruendung: string;
};

export type Nachweismappe = {
  erzeugtAm: string;
  hinweis: string;
  istProbeberechnung: boolean;
  hinweisProbeberechnung: string;
  formelVersion: string;
  pruefsummeEingangsdaten: string;
  runde: Rundendaten['runde'];
  /** Wie die beiden Merkmalsfelder in diesem Programmtyp heißen. */
  merkmalsnamen: { region: string; altersgruppe: string };
  bemessungsregel: {
    kurzfassung: string[];
    verweis: string;
  };
  zuteilungen: Mappenzeile[];
  summen: {
    poolCent: number;
    zugeteiltCent: number;
    nichtAusgeschoepftCent: number;
    iterationen: number;
    gesamtbemessungswert: number;
  };
  vergleichsrechnung: {
    verfahren: VerfahrenId;
    bezeichnung: string;
    regel: string;
    modelliert: boolean;
    zuteilungCent: Record<string, number>;
    iterationen: number;
    nichtAusgeschoepftCent: number;
    kennzahlen: Verfahrensergebnis['kennzahlen'];
  }[];
  modellierungshinweis: string;
  eingangsdatenPseudonymisiert: {
    vorhaben: Rundendaten['vorhaben'];
    beitraege: Rundendaten['beitraege'];
  };
  reproduzierbarkeit: {
    formelVersion: string;
    pruefsummeEingangsdaten: string;
    anleitung: string[];
  };
};

const KURZFASSUNG = [
  'Die Beiträge werden je Beitragendem zusammengefasst.',
  'Aus jedem zusammengefassten Beitrag wird die Quadratwurzel gezogen (Beträge in Euro).',
  'Die Wurzeln werden addiert und die Summe quadriert.',
  'Abzüglich der Beitragssumme ergibt sich der Bemessungswert des Vorhabens.',
  'Der Fördertopf wird im Verhältnis der Bemessungswerte verteilt.',
  'Überschreitet eine Zuteilung den Höchstbetrag des Vorhabens, wird sie darauf gekürzt; der freiwerdende Betrag wird auf die übrigen Vorhaben weiterverteilt, bis keine Kürzung mehr anfällt.',
  'Der Höchstbetrag eines Vorhabens ist der kleinere Wert aus dem Höchstbetrag je Vorhaben und dem Kostenplan abzüglich der Beitragssumme.',
  'Die Rundung auf Cent erfolgt nach dem Verfahren des größten Restes; bei Gleichstand entscheidet die kleinere Kennung.',
];

const ANLEITUNG = [
  'Die Eingangsdaten liegen dieser Zusammenstellung im Anhang bei.',
  'Die Bemessungsregel ist in der Datei FORMEL.md in der genannten Fassung veröffentlicht.',
  'Die Prüfsumme ist der SHA-256-Wert über die sortierte Darstellung der Eingangsdaten. Stimmen Fassungsnummer und Prüfsumme überein, ist das Ergebnis identisch.',
  'Jede einzelne Zuteilung lässt sich mit den Angaben im Rechenprotokoll mit Taschenrechner oder Tabellenkalkulation nachrechnen.',
];

export function baueNachweismappe(argumente: {
  daten: Rundendaten;
  werte: readonly Vorhabenwerte[];
  verfahren: Record<VerfahrenId, Verfahrensergebnis>;
  pruefsumme: string;
  erzeugtAm: string;
  merkmalsnamen: { region: string; altersgruppe: string };
}): Nachweismappe {
  const { daten, werte, verfahren, pruefsumme, erzeugtAm, merkmalsnamen } = argumente;

  const qf = verfahren.qf;
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const schritteNachId = new Map(qf.schritte.map((s) => [s.id, s]));
  const gesamtbemessungswert = werte.reduce((a, w) => a + w.rohEuro, 0);

  const zuteilungen: Mappenzeile[] = daten.vorhaben.map((vorhaben) => {
    const w = werteNachId.get(vorhaben.id)!;
    const schritt = schritteNachId.get(vorhaben.id)!;
    return {
      vorhabenId: vorhaben.id,
      titel: vorhaben.titel,
      traeger: vorhaben.traeger,
      beantragtCent: vorhaben.beantragtCent,
      beitragendeAnzahl: w.beitragendeAnzahl,
      beitragssummeCent: w.eigenCent,
      wurzelsumme: w.wurzelsumme,
      quadrat: w.quadrat,
      bemessungswert: w.rohEuro,
      anteilAmBemessungswert: gesamtbemessungswert > 0 ? w.rohEuro / gesamtbemessungswert : 0,
      deckelCent: w.deckelCent,
      deckelGrund: w.deckelGrund,
      vorlaeufigCent: schritt.vorlaeufigCent,
      gedeckelt: schritt.gedeckelt,
      fixiertInDurchlauf: schritt.fixiertInDurchlauf,
      zuteilungCent: schritt.endbetragCent,
      begruendung: begruendung({
        runde: daten.runde,
        vorhaben,
        werte: w,
        schritt,
        gesamtbemessungswert,
        pruefsumme,
      }),
    };
  });

  const zugeteiltCent = zuteilungen.reduce((a, z) => a + z.zuteilungCent, 0);

  return {
    erzeugtAm,
    hinweis: HINWEIS_PROTOTYP,
    // Jede hier gerechnete Runde ist simuliert. Der Hinweis gilt deshalb immer,
    // nicht nur bei Abweichung von irgendwelchen Voreinstellungen.
    istProbeberechnung: true,
    hinweisProbeberechnung: HINWEIS_PROBEBERECHNUNG,
    formelVersion: daten.runde.formelVersion,
    pruefsummeEingangsdaten: pruefsumme,
    runde: daten.runde,
    merkmalsnamen,
    bemessungsregel: { kurzfassung: KURZFASSUNG, verweis: 'FORMEL.md' },
    zuteilungen,
    summen: {
      poolCent: daten.runde.poolCent,
      zugeteiltCent,
      nichtAusgeschoepftCent: qf.nichtAusgeschoepftCent,
      iterationen: qf.iterationen,
      gesamtbemessungswert,
    },
    vergleichsrechnung: VERFAHREN_IDS.map((id) => {
      const e = verfahren[id];
      const zuteilungCent: Record<string, number> = {};
      for (const v of daten.vorhaben) zuteilungCent[v.id] = e.zuteilungCent.get(v.id) ?? 0;
      return {
        verfahren: id,
        bezeichnung: VERFAHREN[id].bezeichnung,
        regel: VERFAHREN[id].regel,
        modelliert: VERFAHREN[id].modelliert,
        zuteilungCent,
        iterationen: e.iterationen,
        nichtAusgeschoepftCent: e.nichtAusgeschoepftCent,
        kennzahlen: e.kennzahlen,
      };
    }),
    modellierungshinweis:
      'Windhundverfahren und Jury-Ranking sind modellierte Vergleichsregeln, keine ' +
      'gemessenen Verfahren: volle Zuteilung in Rangfolge bis zur Erschöpfung des Topfes.',
    eingangsdatenPseudonymisiert: {
      vorhaben: daten.vorhaben,
      beitraege: daten.beitraege,
    },
    reproduzierbarkeit: {
      formelVersion: daten.runde.formelVersion,
      pruefsummeEingangsdaten: pruefsumme,
      anleitung: ANLEITUNG,
    },
  };
}
