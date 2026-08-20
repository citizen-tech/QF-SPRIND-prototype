import { Badge } from '@mantine/core';
import type { VerfahrenId } from '../kern/vergleich';
import { MODELLIERUNGSHINWEIS, VERFAHREN } from '../kern/vergleich';
import Hinweis from './Hinweis';

/**
 * Kopfzelle für eine Verfahrensspalte.
 *
 * Die Marke "modelliert" steht über der Bezeichnung, und ihre Zeile wird auch
 * dann freigehalten, wenn keine Marke da ist. Andernfalls stünden die
 * Spaltennamen der modellierten Verfahren eine Zeile höher als die übrigen.
 */
export default function Spaltenkopf({ verfahren }: { verfahren: VerfahrenId }) {
  const beschreibung = VERFAHREN[verfahren];
  return (
    <span className="spaltenkopf">
      <span className="spaltenkopf__marke">
        {beschreibung.modelliert && (
          <Badge
            size="xs"
            variant="outline"
            color="ocker"
            styles={{ root: { borderStyle: 'dashed', textTransform: 'none' } }}
          >
            modelliert
          </Badge>
        )}
      </span>
      <Hinweis
        text={
          beschreibung.modelliert
            ? `${beschreibung.regel} ${MODELLIERUNGSHINWEIS}`
            : beschreibung.regel
        }
      >
        {beschreibung.bezeichnung}
      </Hinweis>
    </span>
  );
}
