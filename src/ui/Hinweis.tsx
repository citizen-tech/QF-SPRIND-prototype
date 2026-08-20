import { Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * Beschriftung mit Erklärzeichen. Ersetzt die früheren Erläuterungsabsätze:
 * Wer den Begriff kennt, wird nicht aufgehalten; wer ihn nicht kennt, bekommt
 * die Erklärung dort, wo sie gebraucht wird.
 */
export default function Hinweis({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="mit-hinweis">
      {children}
      <Tooltip
        label={text}
        multiline
        w={320}
        withArrow
        position="top"
        events={{ hover: true, focus: true, touch: true }}
        transitionProps={{ duration: 120 }}
      >
        <span className="hinweis-marke" tabIndex={0} role="note" aria-label={text}>
          ?
        </span>
      </Tooltip>
    </span>
  );
}

/** Die Erklärungen an einer Stelle, damit sie überall gleich lauten. */
export const ERKLAERUNG = {
  foerdertopf:
    'Der für die Runde bereitgestellte Betrag. Er ist die Obergrenze der Gesamtzuteilung und wird auf die Vorhaben verteilt.',
  hoechstbetrag:
    'Obergrenze der Zuteilung an ein einzelnes Vorhaben. Das Haushaltsrecht verlangt eine solche Grenze; ohne sie wäre die Förderung der Höhe nach unbestimmt.',
  personen:
    'Zahl der verschiedenen Personen, die in dieser Runde Geld beitragen. Quadratic Funding zählt Köpfe, nicht Euro — diese Zahl bestimmt daher das Ergebnis stärker als der Fördertopf.',
  betragsspanne:
    'Spanne der Einzelbeiträge. Der Betrag je Person wird zufällig daraus gezogen.',
  absprachegruppe:
    'Eine Gruppe, die geschlossen dieselben Vorhaben unterstützt und dadurch deren Zuteilung gemeinsam hochtreibt. Sie ist hier eingebaut, um den Kopplungsabschlag vorzuführen, und wirkt nur bei zwei Vorhaben mit dem Muster „Absprachegruppe“.',
  seed: 'Startwert des Zufallsgenerators. Gleicher Seed und gleiche Einstellungen erzeugen dieselbe Runde und damit dieselbe Prüfsumme. Zufällig ist nur, wie die Runde zustande kommt — nie, was daraus gerechnet wird.',
  kostenplan:
    'Die vom Träger beantragte Summe. Zuteilung und Bürgerbeiträge zusammen dürfen sie nicht überschreiten, weil eine Zuwendung die zuwendungsfähigen Ausgaben nicht übersteigen darf.',
  zuspruch:
    'Wie viele Personen beitragen, nicht wie viel Geld. 1 bedeutet wenig Zuspruch, 10 sehr viel. Der Wert verteilt die eingestellte Gesamtzahl der Beitragenden auf die Vorhaben.',
  jurypunkte:
    '0 bis 100. Wird ausschließlich für die Vergleichsrechnung „Jury-Ranking“ verwendet und geht nicht in die Bemessung ein.',
  muster:
    'Setzt gezielt die Fälle, an denen sich die Verfahren unterscheiden: breite Unterstützung, wenige große Beiträge oder Mitträgerschaft durch die Absprachegruppe.',
  wuerfeln:
    'Zieht einen neuen Seed und leitet daraus einen vollständigen Satz Vorhaben mit Titel, Träger, Kostenplan, Zuspruch, Jurypunkten und Muster ab. Die Rundenwerte darüber bleiben unverändert; die Kostenpläne richten sich nach ihnen, damit der Fördertopf knapp bleibt.',

  // Ergebnisteil
  foerderzeitraum:
    'Zeitraum, in dem die geförderten Vorhaben durchgeführt werden. Er hat auf die Bemessung keinen Einfluss und steht nur in der Nachweismappe.',
  fassung:
    'Fassung der Bemessungsregel. Ändert sich das Rechenergebnis bei gleicher Eingabe, muss diese Nummer steigen — eine über Runden hinweg wechselnde Formel verletzt den Gleichbehandlungsgrundsatz.',
  pruefsumme:
    'SHA-256 über die sortierten Eingangsdaten. Gleiche Prüfsumme und gleiche Fassung der Bemessungsregel bedeuten dasselbe Ergebnis — daran lässt sich eine Runde nachrechnen.',
  beitragendeGesamt:
    'Zahl der verschiedenen Personen, die in dieser Runde beigetragen haben.',

  // Spalten der Ergebnistabelle
  spalteBeitragende:
    'Wie viele Personen dieses Vorhaben mitgetragen haben. Quadratic Funding zählt Köpfe — diese Zahl bestimmt die Zuteilung stärker als die Beitragssumme.',
  spalteBeitragssumme:
    'Summe aller Beiträge an dieses Vorhaben. Sie geht in die Bemessung ein, wiegt aber deutlich weniger als die Zahl der Beitragenden.',
  spalteQf:
    'Zuteilung nach der Bemessungsregel: aus jedem Personenbeitrag die Wurzel, die Wurzeln addiert, das Ergebnis quadriert, abzüglich der Beitragssumme — davon der Anteil am Fördertopf, begrenzt durch Höchstbetrag und Kostenplan.',
  spalteDreibalken:
    'Drei Balken je Vorhaben, jeweils am größten Wert der Runde gemessen: wie viele Personen beitragen, wie viel Geld zusammenkam, und was zugeteilt wird. Ein langer Euro-Balken über einem kurzen Kopf-Balken führt zu einer kleinen Zuteilung — das ist der Kern des Verfahrens.',
  spalteKopplung:
    'Dieselbe Rechnung, aber mit Abschlag auf Beitragspaare, die über mehrere Vorhaben hinweg gemeinsam auftreten. Nachrangiges Zusatzverfahren, nicht Bestandteil der Bemessungsregel.',
  zeileAufklappen:
    'Zeigt das vollständige Rechenprotokoll dieses Vorhabens, die Wirkung eines weiteren Beitrags und die pseudonymisierte Beitragsliste.',

  // Schalter
  schalterVergleich:
    'Blendet vier herkömmliche Verteilregeln als zusätzliche Spalten ein: Gießkanne, Windhundverfahren, Jury-Ranking und anteilig nach Beitragssumme. Alle rechnen auf denselben Daten, demselben Topf und denselben Höchstbeträgen.',
  schalterKopplung:
    'Blendet ein nachrangiges Zusatzverfahren ein, das Beitragspaare abwertet, die über mehrere Vorhaben hinweg gemeinsam auftreten. Es ist nicht Bestandteil der Bemessungsregel und wirkt sich nicht auf die Nachweismappe aus.',

  // Kennzahlen
  kennErreichte:
    'Personen, von denen mindestens ein unterstütztes Vorhaben eine Zuteilung erhält. Die aussagekräftigste Zahl der Gegenüberstellung: Sie zeigt unmittelbar, wie viele Menschen am Ergebnis beteiligt sind.',
  kennGefoerdert: 'Vorhaben mit einer Zuteilung größer als null.',
  kennMedian:
    'Median über alle zugelassenen Vorhaben, Nullzuteilungen eingeschlossen. Anders als der Mittelwert bleibt er von einzelnen großen Zuteilungen unbeeindruckt.',
  kennGini:
    'Konzentrationsmaß der Zuteilung: 0 bedeutet Gleichverteilung, 1 vollständige Konzentration auf ein einziges Vorhaben.',
  kennAnteil:
    'Anteil der eingesammelten Beitragseuro, der auf Vorhaben mit einer Zuteilung entfällt. Ein niedriger Wert heißt: Viele Menschen haben Geld gegeben, ohne dass ihr Vorhaben etwas erhalten hat.',
  kennRest:
    'Differenz zwischen Fördertopf und Summe der Zuteilungen. Haushaltsrechtlich erheblich und kein Rundungsfehler.',
  kennDurchlaeufe:
    'Zahl der Durchläufe im Verteilverfahren. Mehr als einer bedeutet, dass mindestens ein Vorhaben auf seine Obergrenze gekürzt und der Rest weiterverteilt wurde.',
} as const;
