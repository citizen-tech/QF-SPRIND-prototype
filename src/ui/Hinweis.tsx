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
    'Setzt gezielt die Fälle, an denen sich die Verfahren unterscheiden: breite Unterstützung, wenige große Beiträge, nur eine beitragende Person oder Mitträgerschaft durch die Absprachegruppe.',
  wuerfeln:
    'Zieht einen neuen Seed und leitet daraus sechs bis zehn Vorhaben mit Titel, Träger, Kostenplan, Zuspruch, Jurypunkten und Muster ab. Die Rundenwerte darüber bleiben unverändert; die Kostenpläne richten sich nach ihnen, damit der Fördertopf knapp bleibt.',
} as const;
