import { Accordion, Table, Text, Title } from '@mantine/core';
import { euro, prozent, zahl } from '../format';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { MODELLIERUNGSHINWEIS, VERFAHREN, VERFAHREN_IDS } from '../kern/vergleich';
import Hinweis, { ERKLAERUNG } from './Hinweis';
import Spaltenkopf from './Spaltenkopf';

type Eigenschaften = {
  daten: Rundendaten;
  verfahren: Record<VerfahrenId, Verfahrensergebnis>;
};

export default function Kennzahlenblock({ daten, verfahren }: Eigenschaften) {
  const zeilen: {
    name: string;
    erklaerung: string;
    wert: (e: Verfahrensergebnis) => string;
    hervorheben?: boolean;
  }[] = [
    {
      name: 'Erreichte Beitragende',
      erklaerung: ERKLAERUNG.kennErreichte,
      wert: (e) => `${e.kennzahlen.beitragendeMitTreffer} von ${e.kennzahlen.beitragendeGesamt}`,
      hervorheben: true,
    },
    {
      name: 'Geförderte Vorhaben',
      erklaerung: ERKLAERUNG.kennGefoerdert,
      wert: (e) => `${e.kennzahlen.gefoerderteVorhaben} von ${daten.vorhaben.length}`,
    },
    {
      name: 'Median der Zuteilung',
      erklaerung: ERKLAERUNG.kennMedian,
      wert: (e) => euro(e.kennzahlen.medianZuteilungCent),
    },
    {
      name: 'Konzentration (Gini)',
      erklaerung: ERKLAERUNG.kennGini,
      wert: (e) => zahl(e.kennzahlen.gini, 3),
    },
    {
      name: 'Beitragseuro auf Geförderte',
      erklaerung: ERKLAERUNG.kennAnteil,
      wert: (e) => prozent(e.kennzahlen.anteilBeitragEurosAufGefoerderte),
    },
    {
      name: 'Nicht ausgeschöpft',
      erklaerung: ERKLAERUNG.kennRest,
      wert: (e) => euro(e.kennzahlen.nichtAusgeschoepftCent),
    },
    {
      name: 'Durchläufe',
      erklaerung: ERKLAERUNG.kennDurchlaeufe,
      wert: (e) => String(e.iterationen),
    },
  ];

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-kennzahlen">
      <div className="abschnitt__kopf">
        <Title order={2} id="ueberschrift-kennzahlen">
          Was die Verfahren unterscheidet
        </Title>
      </div>

      <p className="leitsatz">
        Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe Topf,
        dieselben Höchstbeträge, fünf Verteilregeln. Die erste Zeile ist die aussagekräftigste:
        Sie zählt, wie viele Menschen am Ergebnis beteiligt sind.
      </p>

      <div className="tabellenrahmen">
        <Table withRowBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Kennzahl</Table.Th>
              {VERFAHREN_IDS.map((id) => (
                <Table.Th key={id} ta="right">
                  <Spaltenkopf verfahren={id} />
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {zeilen.map((zeile) => (
              <Table.Tr key={zeile.name}>
                <Table.Th scope="row" fw={500} miw={240}>
                  <Hinweis text={zeile.erklaerung}>{zeile.name}</Hinweis>
                </Table.Th>
                {VERFAHREN_IDS.map((id) => (
                  <Table.Td
                    key={id}
                    className={
                      zeile.hervorheben && id === 'qf' ? 'zahl zahl--amt' : 'zahl'
                    }
                  >
                    {zeile.wert(verfahren[id])}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <p className="notiz notiz--ocker">{MODELLIERUNGSHINWEIS}</p>

      <Accordion variant="separated" mt="md" chevronPosition="left">
        <Accordion.Item value="regeln">
          <Accordion.Control>Die fünf Verteilregeln im Wortlaut</Accordion.Control>
          <Accordion.Panel>
            <dl style={{ margin: 0 }}>
              {VERFAHREN_IDS.map((id) => (
                <div key={id} style={{ marginBottom: '14px' }}>
                  <dt>
                    <Text fw={600} size="sm">
                      {VERFAHREN[id].bezeichnung}
                    </Text>
                  </dt>
                  <dd style={{ margin: 0 }}>
                    <Text size="sm" c="dimmed" maw="80ch">
                      {VERFAHREN[id].regel}
                    </Text>
                  </dd>
                </div>
              ))}
            </dl>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </section>
  );
}
