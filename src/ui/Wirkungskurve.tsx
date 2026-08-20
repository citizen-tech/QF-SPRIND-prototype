import { Text } from '@mantine/core';
import { useMemo } from 'react';
import { euro, zahl } from '../format';
import { stuetzstellen, wirkungskurve } from '../kern/beitragswirkung';
import type { Rundendaten } from '../kern/typen';

const BREITE = 320;
const HOEHE = 150;
const RAND = { oben: 8, rechts: 8, unten: 26, links: 8 };

/**
 * Wirkung eines zusätzlichen Beitrags auf die Zuteilung eines Vorhabens.
 *
 * Die Beträge sind exakt, nicht geschätzt: Die Runde ist gerechnet und
 * abgeschlossen, jeder Punkt der Kurve ist eine vollständige Neuberechnung mit
 * dem zusätzlichen Beitrag.
 */
export default function Wirkungskurve({
  daten,
  vorhabenId,
  betragCent,
}: {
  daten: Rundendaten;
  vorhabenId: string;
  betragCent: number;
}) {
  const hoechster = Math.max(betragCent * 6, 1_000);
  const kurve = useMemo(
    () => wirkungskurve(daten, vorhabenId, stuetzstellen(hoechster, 25)),
    [daten, vorhabenId, hoechster],
  );
  const jetzt = useMemo(
    () => wirkungskurve(daten, vorhabenId, [betragCent])[0],
    [daten, vorhabenId, betragCent],
  );

  const yMax = Math.max(...kurve.map((p) => p.zuteilungCent), 1) * 1.06;
  const yMin = Math.min(...kurve.map((p) => p.zuteilungCent)) * 0.98;
  const spanne = Math.max(1, yMax - yMin);
  const x = (c: number) => RAND.links + (c / hoechster) * (BREITE - RAND.links - RAND.rechts);
  const y = (c: number) =>
    HOEHE - RAND.unten - ((c - yMin) / spanne) * (HOEHE - RAND.oben - RAND.unten);

  const pfad = kurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.betragCent).toFixed(1)} ${y(p.zuteilungCent).toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        className="kurve kurve--klein"
        role="img"
        aria-label={
          `Zuteilung in Abhängigkeit von einem zusätzlichen Beitrag. Bei ${euro(betragCent)} ` +
          `steigt sie um ${euro(jetzt.zuwachsCent)}.`
        }
      >
        <path d={pfad} className="kurve__linie" />
        <line
          x1={x(betragCent)}
          x2={x(betragCent)}
          y1={RAND.oben}
          y2={HOEHE - RAND.unten}
          className="kurve__lot"
        />
        <circle cx={x(betragCent)} cy={y(jetzt.zuteilungCent)} r="4.5" className="kurve__punkt" />
        <text x={RAND.links} y={HOEHE - 8} className="kurve__marke">
          0 €
        </text>
        <text x={BREITE - RAND.rechts} y={HOEHE - 8} className="kurve__marke" textAnchor="end">
          {euro(hoechster)}
        </text>
      </svg>

      <Text size="sm" mt={4}>
        Ein zusätzlicher Beitrag von <span className="mono">{euro(betragCent)}</span> hätte die
        Zuteilung um{' '}
        <Text span fw={600} className="mono" c="amt.9" inherit>
          {jetzt.zuwachsCent > 0 ? '+' : ''}
          {euro(jetzt.zuwachsCent)}
        </Text>{' '}
        verändert
        {jetzt.zuwachsCent > 0 && betragCent > 0 && (
          <> — das {zahl(jetzt.zuwachsCent / betragCent, 2)}-fache des eigenen Einsatzes</>
        )}
        .
      </Text>
    </div>
  );
}
