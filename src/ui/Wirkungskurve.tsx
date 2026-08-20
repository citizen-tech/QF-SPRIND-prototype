import { Slider, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import { euro, zahl } from '../format';
import { stuetzstellen, wirkungskurve } from '../kern/beitragswirkung';
import type { Rundendaten } from '../kern/typen';

const BREITE = 360;
const HOEHE = 150;
const RAND = { oben: 18, rechts: 10, unten: 24, links: 10 };
const STUETZSTELLEN = 21;

/**
 * Wirkung eines zusätzlichen Beitrags auf die Zuteilung eines Vorhabens.
 *
 * Die Beträge sind exakt, nicht geschätzt: Die Runde ist gerechnet und
 * abgeschlossen, jeder Punkt der Kurve ist eine vollständige Neuberechnung mit
 * dem zusätzlichen Beitrag.
 *
 * Aufgetragen ist der Zuwachs gegenüber der Runde ohne diesen Beitrag, nicht die
 * Zuteilung selbst. Die Zuteilung liegt bei Bund und Ländern im Millionenbereich;
 * eine Veränderung um einige Tausend Euro wäre in ihrem Maßstab eine gerade Linie.
 *
 * Der Regler beginnt bei einem typischen Beitrag dieser Runde. Ein fester
 * Probebetrag wäre in der einen Welt richtig und in der anderen sinnlos.
 *
 * Die Kurve kann wieder fallen. Das ist kein Rechenfehler, sondern der
 * Kostenplan: Zuteilung und Beiträge zusammen dürfen ihn nicht überschreiten
 * (FORMEL.md Abschnitt 3). Ab dem Scheitelpunkt ersetzt jeder weitere Beitrag
 * einen Euro Zuteilung, statt einen hinzuzufügen. Der abfallende Teil wird
 * deshalb mitgezeichnet und nicht abgeschnitten.
 */
export default function Wirkungskurve({
  daten,
  vorhabenId,
  typischCent,
}: {
  daten: Rundendaten;
  vorhabenId: string;
  /** Ausgangswert des Reglers — ein typischer Beitrag dieser Runde. */
  typischCent: number;
}) {
  const hoechster = typischCent * 4;
  const [betragCent, setBetragCent] = useState(typischCent);

  const kurve = useMemo(
    () => wirkungskurve(daten, vorhabenId, stuetzstellen(hoechster, STUETZSTELLEN)),
    [daten, vorhabenId, hoechster],
  );
  const jetzt = useMemo(
    () => wirkungskurve(daten, vorhabenId, [betragCent])[0],
    [daten, vorhabenId, betragCent],
  );

  const scheitel = kurve.reduce((a, b) => (b.zuwachsCent > a.zuwachsCent ? b : a));
  const faellt = scheitel.betragCent < hoechster;

  const oben = Math.max(scheitel.zuwachsCent, 1);
  const unten = Math.min(...kurve.map((p) => p.zuwachsCent), 0);
  const spanne = oben - unten;
  const x = (c: number) => RAND.links + (c / hoechster) * (BREITE - RAND.links - RAND.rechts);
  const y = (c: number) => RAND.oben + ((oben - c) / spanne) * (HOEHE - RAND.oben - RAND.unten);
  const nulllinie = y(0);

  const punkte = kurve.map((p) => `${x(p.betragCent).toFixed(1)} ${y(p.zuwachsCent).toFixed(1)}`);
  const linie = `M${punkte.join(' L')}`;
  const flaeche =
    `${linie} L${x(hoechster).toFixed(1)} ${nulllinie.toFixed(1)} ` +
    `L${x(0).toFixed(1)} ${nulllinie.toFixed(1)} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        className="kurve kurve--klein"
        role="img"
        aria-label={
          `Zuwachs der Zuteilung in Abhängigkeit von einem zusätzlichen Beitrag. ` +
          `Bei ${euro(betragCent)} beträgt er ${euro(jetzt.zuwachsCent)}.`
        }
      >
        <line
          x1={RAND.links}
          x2={BREITE - RAND.rechts}
          y1={nulllinie}
          y2={nulllinie}
          className="kurve__gitter"
        />
        <path d={flaeche} className="kurve__flaeche" />
        <path d={linie} className="kurve__linie" />
        {faellt && (
          <line
            x1={x(scheitel.betragCent)}
            x2={x(scheitel.betragCent)}
            y1={RAND.oben}
            y2={HOEHE - RAND.unten}
            className="kurve__scheitel"
          />
        )}
        <line
          x1={x(betragCent)}
          x2={x(betragCent)}
          y1={RAND.oben - 6}
          y2={HOEHE - RAND.unten}
          className="kurve__lot"
        />
        <circle cx={x(betragCent)} cy={y(jetzt.zuwachsCent)} r="4.5" className="kurve__punkt" />
        <text x={RAND.links} y={RAND.oben - 7} className="kurve__marke">
          + {euro(scheitel.zuwachsCent)}
        </text>
        {unten < 0 && (
          <text x={RAND.links} y={nulllinie - 4} className="kurve__marke">
            0 €
          </text>
        )}
        <text x={RAND.links} y={HOEHE - 6} className="kurve__marke">
          0 €
        </text>
        <text x={BREITE - RAND.rechts} y={HOEHE - 6} className="kurve__marke" textAnchor="end">
          {euro(hoechster)}
        </text>
      </svg>

      <Text size="sm" fw={500} mt="xs" mb={2}>
        Beitrag: <span className="mono">{euro(betragCent)}</span>
      </Text>
      <Slider
        color="amt.9"
        min={0}
        max={hoechster}
        step={Math.max(1, Math.round(typischCent / 10))}
        value={betragCent}
        onChange={setBetragCent}
        label={(wert) => euro(wert)}
        maw={340}
        aria-label="Höhe des zusätzlichen Beitrags"
      />

      <Text size="sm" mt="sm" maw="52ch">
        Dieser Beitrag hätte dem Vorhaben{' '}
        <Text span fw={600} className="mono" c="amt.9" inherit>
          {jetzt.zuwachsCent > 0 ? '+' : ''}
          {euro(jetzt.zuwachsCent)}
        </Text>{' '}
        mehr aus dem Fördertopf gebracht — zulasten der übrigen Vorhaben. Der Topf selbst
        bleibt unverändert.
      </Text>

      {jetzt.zuwachsCent > 0 && betragCent > 0 && (
        <Text size="xs" c="var(--tinte-lese)" mt={4} maw="52ch">
          Das sind {zahl(jetzt.zuwachsCent / betragCent, 2)} € Verschiebung je eingesetztem
          Euro. Der Wert fällt mit steigendem Beitrag, weil in die Bemessung die Wurzel des
          Beitrags eingeht.
        </Text>
      )}

      {faellt && (
        <Text size="xs" c="var(--ocker)" mt={4} maw="52ch">
          Ab <span className="mono">{euro(scheitel.betragCent)}</span> fällt die Kurve: Dort
          ist der Kostenplan ausgeschöpft. Zuteilung und Beiträge zusammen dürfen ihn nicht
          überschreiten — jeder weitere Beitrag ersetzt von da an einen Euro Zuteilung, statt
          einen hinzuzufügen.
        </Text>
      )}
    </div>
  );
}
