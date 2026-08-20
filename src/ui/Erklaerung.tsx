import { Group, Paper, Slider, Table, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { euro, zahl } from '../format';
import { BEISPIELE, BEISPIEL_POOL_CENT, beispielrunde } from '../kern/beispielrunde';
import { berechneQf, berechneVorhabenwerte } from '../kern/qf';
import QfQuadrat, { seitenlaenge } from './QfQuadrat';

/** Didaktisches Beispiel: immer dieselbe Summe, auf verschieden viele Köpfe verteilt. */
const BEISPIELSUMME_EURO = 64;
const HOECHSTE_KOEPFE = 16;

function Legende() {
  return (
    <Group gap="lg" wrap="wrap" mt="sm">
      <span className="legende">
        <span className="legende__feld legende__feld--beitrag" />
        Beitragssumme <span className="mono">E</span> — was die Beitragenden selbst gegeben haben
      </span>
      <span className="legende">
        <span className="legende__feld legende__feld--gesamt" />
        Bemessungswert <span className="mono">R</span> — die Fläche darüber hinaus
      </span>
    </Group>
  );
}

export default function Erklaerung() {
  const [koepfe, setKoepfe] = useState(8);

  // Beispiel: dieselbe Summe, gleichmäßig auf koepfe Personen verteilt.
  const beispiel = useMemo(
    () => Array.from({ length: koepfe }, () => BEISPIELSUMME_EURO / koepfe),
    [koepfe],
  );
  const beispielReferenz = seitenlaenge(
    Array.from({ length: HOECHSTE_KOEPFE }, () => BEISPIELSUMME_EURO / HOECHSTE_KOEPFE),
  );
  const beispielSeite = seitenlaenge(beispiel);
  const beispielQ = beispielSeite * beispielSeite;

  // Die vier Beispielvorhaben — durch denselben Rechenkern wie der Prototyp.
  const runde = useMemo(() => beispielrunde(), []);
  const werte = useMemo(() => berechneVorhabenwerte(runde), [runde]);
  const zuteilung = useMemo(() => berechneQf(runde, werte).zuteilungCent, [runde, werte]);
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const referenz = Math.max(...werte.map((w) => w.wurzelsumme), 1);
  const summeR = werte.reduce((a, w) => a + w.rohEuro, 0);

  return (
    <>
      <section className="abschnitt" aria-labelledby="ueberschrift-quadrat">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-quadrat">
            Die Formel als Bild
          </Title>
        </div>

        <p className="leitsatz">
          Quadratic Funding lässt sich zeichnen. Jeder Beitrag wird zu einem Quadrat mit der
          Seitenlänge <span className="mono">√c</span> — seine Fläche ist der Beitrag selbst.
          Legt man diese Quadrate auf die Diagonale, spannen sie ein großes Quadrat auf. Dessen
          Seitenlänge ist die Wurzelsumme <span className="mono">W</span>, seine Fläche der
          Gesamtfinanzierungswert <span className="mono">Q = W²</span>. Was über den Beiträgen
          hinaus in der Fläche liegt, ist der Bemessungswert{' '}
          <span className="mono">R = Q − E</span>.
        </p>

        <p className="leitsatz">
          Das sind genau die drei Größen aus Abschnitt 2.2 der veröffentlichten Rechenregel —
          nur als Bild statt als Formel. Die Darstellung stammt aus Miller, Weyl und Erichsen,
          „Beyond Collusion Resistance“ (2022), Abbildungen 1 bis 3.
        </p>

        <Paper withBorder p="lg" radius="sm" bg="white">
          <Title order={3}>Dieselbe Summe, verschieden viele Beitragende</Title>
          <Text size="sm" c="var(--tinte-lese)" mt={4} mb="lg">
            {euro(BEISPIELSUMME_EURO * 100)} kommen zusammen — immer. Nur die Zahl der
            Beitragenden ändert sich. Beide Quadrate stehen im selben Maßstab.
          </Text>

          <Group align="flex-end" gap="xl" wrap="wrap">
            <div>
              <QfQuadrat
                betraegeEuro={beispiel}
                referenzSeite={beispielReferenz}
                beschriftung={`${koepfe} Beitragende`}
              />
              <Text size="sm" ta="center" mt="xs" fw={500}>
                {koepfe} {koepfe === 1 ? 'Person' : 'Personen'} zu je{' '}
                <span className="mono">{euro(Math.round((BEISPIELSUMME_EURO / koepfe) * 100))}</span>
              </Text>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 280 }}>
              <Text size="sm" fw={500} mb={4}>
                Zahl der Beitragenden: <span className="mono">{koepfe}</span>
              </Text>
              <Slider
                color="amt.9"
                min={1}
                max={HOECHSTE_KOEPFE}
                step={1}
                value={koepfe}
                onChange={setKoepfe}
                marks={[1, 4, 8, 12, 16].map((v) => ({ value: v, label: String(v) }))}
                mb="xl"
                aria-label="Zahl der Beitragenden im Beispiel"
              />

              <dl className="rechenschritte" style={{ maxWidth: 420 }}>
                <dt>Beitragssumme E</dt>
                <dd>{euro(BEISPIELSUMME_EURO * 100)}</dd>
                <dt>Wurzelsumme W</dt>
                <dd>{zahl(beispielSeite, 2)}</dd>
                <dt>Gesamtfinanzierungswert Q = W²</dt>
                <dd>{zahl(beispielQ, 2)}</dd>
                <dt className="ergebnis">Bemessungswert R = Q − E</dt>
                <dd className="ergebnis">{zahl(beispielQ - BEISPIELSUMME_EURO, 2)}</dd>
              </dl>
            </div>
          </Group>

          <Legende />

          <p className="notiz">
            Bei einer einzigen Person ist das Quadrat genau so groß wie ihr Beitrag: Der
            Bemessungswert ist null, die Fläche ganz ausgefüllt. Mit jeder weiteren Person wächst
            die Fläche schneller als die Beitragssumme — und der Unterschied zwischen beiden ist
            das, was das Verfahren misst.
          </p>
        </Paper>
      </section>

      <section className="abschnitt" aria-labelledby="ueberschrift-beispiel">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-beispiel">
            Eine vollständige Runde von Hand
          </Title>
        </div>

        <p className="leitsatz">
          Vier Vorhaben, bei jedem kommen{' '}
          <span className="mono">{euro(werte[0].eigenCent)}</span> zusammen — nur von verschieden
          vielen Beitragenden. Der Fördertopf beträgt{' '}
          <span className="mono">{euro(BEISPIEL_POOL_CENT)}</span>, die Summe aller
          Bemessungswerte <span className="mono">{zahl(summeR, 0)}</span>. Der Topf ist also
          genau die Hälfte davon, und jede Zuteilung ist der halbe Bemessungswert. Alle Wurzeln
          sind ganzzahlig; die Runde lässt sich ohne Taschenrechner nachprüfen.
        </p>

        <div className="quadratreihe">
          {BEISPIELE.map((b) => {
            const w = werteNachId.get(b.id)!;
            return (
              <figure key={b.id} className="quadratreihe__eintrag">
                <QfQuadrat
                  betraegeEuro={b.betraegeEuro}
                  referenzSeite={referenz}
                  kantenlaenge={190}
                  beschriftung={`Vorhaben ${b.buchstabe}`}
                />
                <figcaption>
                  <Text size="sm" fw={500}>
                    Vorhaben {b.buchstabe}
                  </Text>
                  <Text size="xs" c="var(--tinte-lese)" mt={2}>
                    {b.kurz}
                  </Text>
                  <Text size="xs" className="mono" c="amt.9" mt={2}>
                    R = {zahl(w.rohEuro, 0)}
                  </Text>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <Legende />

        <div className="tabellenrahmen" style={{ marginTop: 24 }}>
          <Table withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Vorhaben</Table.Th>
                <Table.Th ta="right">Beitragende</Table.Th>
                <Table.Th ta="right">Beitragssumme E</Table.Th>
                <Table.Th ta="right">Wurzelsumme W</Table.Th>
                <Table.Th ta="right">Q = W²</Table.Th>
                <Table.Th ta="right">R = Q − E</Table.Th>
                <Table.Th ta="right">Zuteilung</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {BEISPIELE.map((b) => {
                const w = werteNachId.get(b.id)!;
                return (
                  <Table.Tr key={b.id}>
                    <Table.Th scope="row" fw={500}>
                      {b.buchstabe}
                      <span className="traeger">{b.kurz}</span>
                    </Table.Th>
                    <Table.Td className="zahl">{w.beitragendeAnzahl}</Table.Td>
                    <Table.Td className="zahl zahl--still">{euro(w.eigenCent)}</Table.Td>
                    <Table.Td className="zahl zahl--still">{zahl(w.wurzelsumme, 0)}</Table.Td>
                    <Table.Td className="zahl zahl--still">{zahl(w.quadrat, 0)}</Table.Td>
                    <Table.Td className="zahl">{zahl(w.rohEuro, 0)}</Table.Td>
                    <Table.Td className="zahl zahl--amt">
                      {euro(zuteilung.get(b.id) ?? 0)}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th scope="row">Summe</Table.Th>
                <Table.Td className="zahl">
                  {werte.reduce((a, w) => a + w.beitragendeAnzahl, 0)}
                </Table.Td>
                <Table.Td className="zahl">
                  {euro(werte.reduce((a, w) => a + w.eigenCent, 0))}
                </Table.Td>
                <Table.Td />
                <Table.Td />
                <Table.Td className="zahl">{zahl(summeR, 0)}</Table.Td>
                <Table.Td className="zahl zahl--amt">
                  {euro([...zuteilung.values()].reduce((a, b) => a + b, 0))}
                </Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </div>

        <p className="notiz">
          Vorhaben A bekommt nichts. Nicht weil 400 € zu wenig wären, sondern weil ein einzelner
          Beitrag keine geteilte Unterstützung belegt: Sein Quadrat ist vollständig von seinem
          eigenen Beitrag ausgefüllt, der Bemessungswert ist null. Vorhaben D sammelt dieselbe
          Summe von sechzehn Beitragenden und erhält das Fünffache von Vorhaben B.
        </p>

        <p className="notiz notiz--ocker">
          <strong>Ein Unterschied zur Lehrbuchfassung.</strong> Dort wird die ganze Fläche des
          Quadrats ausgezahlt, der Fördertopf müsste also beliebig groß sein — hier wären das{' '}
          {zahl(summeR, 0)} € statt der vorhandenen {zahl(BEISPIEL_POOL_CENT / 100, 0)} €. Bei
          einem gedeckelten Topf geht das nicht: Die Fläche über den Beiträgen dient dann als{' '}
          <em>Gewicht</em>, in dessen Verhältnis der vorhandene Topf aufgeteilt wird. Die Bilder
          zeigen also die Bemessung, nicht den Auszahlungsbetrag.
        </p>
      </section>
    </>
  );
}
