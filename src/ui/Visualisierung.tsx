import { Group, Paper, Select, Slider, Table, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { euro, zahl } from '../format';
import { stuetzstellen, wirkungJeVorhaben, wirkungskurve } from '../kern/beitragswirkung';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import Hinweis from './Hinweis';

type Eigenschaften = { daten: Rundendaten };

const HOEHE = 300;
const BREITE = 900;
const RAND = { oben: 18, rechts: 20, unten: 42, links: 84 };

export default function Visualisierung({ daten }: Eigenschaften) {
  const werte = useMemo(() => berechneVorhabenwerte(daten), [daten]);
  const [gewaehlt, setGewaehlt] = useState(daten.vorhaben[0]?.id ?? '');

  // Bis zum Achtfachen des größten Einzelbeitrags der Runde — weit genug, um
  // das Abflachen der Kurve zu zeigen.
  const groessterBeitrag = Math.max(...daten.beitraege.map((b) => b.betragCent), 1_000);
  const hoechster = Math.round((groessterBeitrag * 8) / 100) * 100;
  const [betragCent, setBetragCent] = useState(Math.round(groessterBeitrag / 100) * 100);

  const vorhabenId = daten.vorhaben.some((v) => v.id === gewaehlt)
    ? gewaehlt
    : (daten.vorhaben[0]?.id ?? '');

  const kurve = useMemo(
    () => wirkungskurve(daten, vorhabenId, stuetzstellen(hoechster)),
    [daten, vorhabenId, hoechster],
  );

  const jeVorhaben = useMemo(
    () => wirkungJeVorhaben(daten, betragCent),
    [daten, betragCent],
  );

  const punktJetzt = useMemo(
    () => wirkungskurve(daten, vorhabenId, [betragCent])[0],
    [daten, vorhabenId, betragCent],
  );

  const titel = new Map(daten.vorhaben.map((v) => [v.id, v.titel]));
  const koepfe = new Map(werte.map((w) => [w.vorhabenId, w.beitragendeAnzahl]));

  const yMax = Math.max(...kurve.map((p) => p.zuteilungCent), 1) * 1.08;
  const xZu = (cent: number) =>
    RAND.links + (cent / hoechster) * (BREITE - RAND.links - RAND.rechts);
  const yZu = (cent: number) =>
    HOEHE - RAND.unten - (cent / yMax) * (HOEHE - RAND.oben - RAND.unten);

  const pfad = kurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xZu(p.betragCent).toFixed(1)} ${yZu(p.zuteilungCent).toFixed(1)}`)
    .join(' ');

  const yMarken = [0, 0.25, 0.5, 0.75, 1].map((a) => a * yMax);
  const xMarken = [0, 0.25, 0.5, 0.75, 1].map((a) => a * hoechster);

  const sortiert = [...jeVorhaben].sort((a, b) => b.zuwachsCent - a.zuwachsCent);
  const staerkste = sortiert[0];
  const schwaechste = sortiert[sortiert.length - 1];

  return (
    <>
      <section className="abschnitt" aria-labelledby="ueberschrift-sicht">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-sicht">
            Aus Sicht der Beitragenden
          </Title>
        </div>

        <p className="leitsatz">
          Dieselbe Runde, andere Frage: Was bewirkt <em>mein</em> Beitrag? Die Kurve zeigt, wie
          sich die Zuteilung eines Vorhabens ändert, wenn eine weitere Person mit dem
          eingestellten Betrag mitträgt. Sie flacht ab, weil die Wurzel große Beträge dämpft —
          der zehnte Euro wiegt weniger als der erste.
        </p>

        <p className="notiz notiz--ocker">
          <strong>Nachrechnung, keine Vorhersage.</strong> Diese Runde ist abgeschlossen; jeder
          Punkt der Kurve ist eine vollständige Neuberechnung mit dem zusätzlichen Beitrag. In
          einer <em>laufenden</em> Runde ließe sich das nicht zusagen: Bei gedeckeltem Topf hängt
          die Wirkung eines Beitrags von allen übrigen ab und stünde erst am Rundenende fest. Der
          Prototyp weist dort deshalb nur Verhältnisse aus, keine Beträge.
        </p>

        <Paper withBorder p="lg" radius="sm" bg="white">
          <Group align="flex-start" grow wrap="wrap" mb="lg">
            <Select
              label="Vorhaben"
              data={daten.vorhaben.map((v) => ({ value: v.id, label: v.titel }))}
              value={vorhabenId}
              onChange={(w) => w && setGewaehlt(w)}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                Mein Beitrag: <span className="mono">{euro(betragCent)}</span>
              </Text>
              <Slider
                color="amt.9"
                min={0}
                max={hoechster}
                step={Math.max(100, Math.round(hoechster / 400 / 100) * 100)}
                value={betragCent}
                onChange={setBetragCent}
                label={(c) => euro(c)}
                aria-label="Höhe des eigenen Beitrags"
              />
            </div>
          </Group>

          <div className="tabellenrahmen" style={{ padding: '12px 0 0' }}>
            <svg
              viewBox={`0 0 ${BREITE} ${HOEHE}`}
              className="kurve"
              role="img"
              aria-label={
                `Zuteilung an „${titel.get(vorhabenId)}“ in Abhängigkeit vom eigenen Beitrag. ` +
                `Bei ${euro(betragCent)} beträgt sie ${euro(punktJetzt.zuteilungCent)}, ` +
                `das sind ${euro(punktJetzt.zuwachsCent)} mehr als ohne diesen Beitrag.`
              }
            >
              {yMarken.map((y) => (
                <g key={y}>
                  <line
                    x1={RAND.links}
                    x2={BREITE - RAND.rechts}
                    y1={yZu(y)}
                    y2={yZu(y)}
                    className="kurve__gitter"
                  />
                  <text x={RAND.links - 10} y={yZu(y) + 4} className="kurve__marke" textAnchor="end">
                    {euro(y)}
                  </text>
                </g>
              ))}
              {xMarken.map((x) => (
                <text
                  key={x}
                  x={xZu(x)}
                  y={HOEHE - RAND.unten + 20}
                  className="kurve__marke"
                  textAnchor="middle"
                >
                  {euro(x)}
                </text>
              ))}

              <path d={pfad} className="kurve__linie" />

              <line
                x1={xZu(betragCent)}
                x2={xZu(betragCent)}
                y1={RAND.oben}
                y2={HOEHE - RAND.unten}
                className="kurve__lot"
              />
              <circle cx={xZu(betragCent)} cy={yZu(punktJetzt.zuteilungCent)} r="6" className="kurve__punkt" />

              <text
                x={RAND.links - 10}
                y={RAND.oben - 4}
                className="kurve__achse"
                textAnchor="end"
              >
                Zuteilung
              </text>
              <text
                x={BREITE - RAND.rechts}
                y={HOEHE - 6}
                className="kurve__achse"
                textAnchor="end"
              >
                mein Beitrag
              </text>
            </svg>
          </div>

          <Group gap="xl" mt="lg" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                Zuteilung ohne meinen Beitrag
              </Text>
              <Text className="mono" fz="1.25rem">
                {euro(punktJetzt.zuteilungCent - punktJetzt.zuwachsCent)}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                Zuteilung mit meinem Beitrag
              </Text>
              <Text className="mono" fz="1.25rem" fw={600} c="amt.9">
                {euro(punktJetzt.zuteilungCent)}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                Zuwachs durch {euro(betragCent)}
              </Text>
              <Text className="mono" fz="1.25rem" fw={600} c="amt.9">
                {punktJetzt.zuwachsCent > 0 ? '+' : ''}
                {euro(punktJetzt.zuwachsCent)}
              </Text>
            </div>
            {betragCent > 0 && punktJetzt.zuwachsCent > 0 && (
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                  <Hinweis text="Zuwachs geteilt durch den eigenen Beitrag. Ein Wert über 1 heißt: Der Fördertopf legt mehr nach, als selbst gegeben wurde.">
                    Je eingesetztem Euro
                  </Hinweis>
                </Text>
                <Text className="mono" fz="1.25rem">
                  {zahl(punktJetzt.zuwachsCent / betragCent, 2)} ×
                </Text>
              </div>
            )}
          </Group>
        </Paper>
      </section>

      <section className="abschnitt" aria-labelledby="ueberschrift-wohin">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-wohin">
            Derselbe Betrag, acht Vorhaben
          </Title>
        </div>

        <p className="leitsatz">
          {euro(betragCent)} bewirken nicht überall dasselbe. Bei „{titel.get(staerkste.vorhabenId)}
          “ sind es {euro(staerkste.zuwachsCent)}, bei „{titel.get(schwaechste.vorhabenId)}“ nur{' '}
          {euro(schwaechste.zuwachsCent)} — bei identischem Einsatz.
        </p>
        <p className="leitsatz">
          Der Grund lässt sich ausrechnen: Ein zusätzlicher Beitrag <em>c</em> erhöht den
          Bemessungswert eines Vorhabens um <span className="mono">2 · W · √c</span>, wobei{' '}
          <span className="mono">W</span> die bereits vorhandene Wurzelsumme ist. Je größer sie,
          desto mehr bewirkt der Beitrag — und sie wächst vor allem mit der{' '}
          <strong>Zahl</strong> der Beitragenden, weil die Wurzel große Einzelbeträge dämpft.
          Deshalb wiegt eine weitere Person dort schwer, wo viele wenig geben.
        </p>

        <div className="tabellenrahmen">
          <Table withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Vorhaben</Table.Th>
                <Table.Th ta="right">Bisherige Beitragende</Table.Th>
                <Table.Th ta="right">Zuteilung ohne</Table.Th>
                <Table.Th ta="right">Zuteilung mit</Table.Th>
                <Table.Th ta="right">Zuwachs</Table.Th>
                <Table.Th>
                  <span className="nur-vorlesen">Zuwachs als Balken</span>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortiert.map((w) => (
                <Table.Tr
                  key={w.vorhabenId}
                  className={w.vorhabenId === vorhabenId ? 'zeile--offen' : undefined}
                >
                  <Table.Th scope="row" fw={500}>
                    {titel.get(w.vorhabenId)}
                  </Table.Th>
                  <Table.Td className="zahl">{koepfe.get(w.vorhabenId)}</Table.Td>
                  <Table.Td className="zahl zahl--still">{euro(w.ohneCent)}</Table.Td>
                  <Table.Td className="zahl">{euro(w.mitCent)}</Table.Td>
                  <Table.Td className="zahl zahl--amt">
                    {w.zuwachsCent > 0 ? '+' : ''}
                    {euro(w.zuwachsCent)}
                  </Table.Td>
                  <Table.Td>
                    <span className="balken" style={{ minWidth: 120 }}>
                      <span
                        className="balken__fuellung"
                        style={{
                          width: `${Math.max(0, (w.zuwachsCent / Math.max(1, staerkste.zuwachsCent)) * 100)}%`,
                        }}
                      />
                    </span>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <p className="notiz">
          Vorhaben, deren Zuteilung bereits an einer Obergrenze steht, zeigen einen Zuwachs von
          null: Dort ändert ein weiterer Beitrag die Zuteilung in dieser Runde nicht mehr. Auch
          das ist eine Aussage über das Verfahren, kein Rechenfehler.
        </p>
      </section>
    </>
  );
}
