import { Accordion, Badge, Table, Text, Title } from '@mantine/core';
import { euro, prozent, zahl } from '../format';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { MODELLIERUNGSHINWEIS, VERFAHREN, VERFAHREN_IDS } from '../kern/vergleich';

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
      erklaerung:
        'Personen, von denen mindestens ein unterstütztes Vorhaben eine Zuteilung erhält.',
      wert: (e) => `${e.kennzahlen.beitragendeMitTreffer} von ${e.kennzahlen.beitragendeGesamt}`,
      hervorheben: true,
    },
    {
      name: 'Geförderte Vorhaben',
      erklaerung: 'Vorhaben mit einer Zuteilung größer als null.',
      wert: (e) => `${e.kennzahlen.gefoerderteVorhaben} von ${daten.vorhaben.length}`,
    },
    {
      name: 'Median der Zuteilung',
      erklaerung: 'Median über alle zugelassenen Vorhaben, Nullzuteilungen eingeschlossen.',
      wert: (e) => euro(e.kennzahlen.medianZuteilungCent),
    },
    {
      name: 'Konzentration (Gini)',
      erklaerung: '0 bedeutet Gleichverteilung, 1 vollständige Konzentration.',
      wert: (e) => zahl(e.kennzahlen.gini, 3),
    },
    {
      name: 'Beitragseuro auf Geförderte',
      erklaerung: 'Anteil der eingesammelten Beitragseuro, der auf Vorhaben mit Zuteilung entfällt.',
      wert: (e) => prozent(e.kennzahlen.anteilBeitragEurosAufGefoerderte),
    },
    {
      name: 'Nicht ausgeschöpft',
      erklaerung: 'Differenz zwischen Fördertopf und Summe der Zuteilungen.',
      wert: (e) => euro(e.kennzahlen.nichtAusgeschoepftCent),
    },
    {
      name: 'Durchläufe',
      erklaerung: 'Zahl der Durchläufe im Verteilverfahren.',
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

      <Text c="dimmed" maw="76ch" mb="md">
        Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe Topf,
        dieselben Höchstbeträge, fünf Verteilregeln. Die erste Zeile ist die aussagekräftigste:
        Sie zählt, wie viele Menschen am Ergebnis beteiligt sind.
      </Text>

      <div className="tabellenrahmen">
        <Table withRowBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Kennzahl</Table.Th>
              {VERFAHREN_IDS.map((id) => (
                <Table.Th key={id} ta="right">
                  {VERFAHREN[id].bezeichnung}
                  {VERFAHREN[id].modelliert && (
                    <>
                      <br />
                      <Badge
                        size="xs"
                        variant="outline"
                        color="ocker"
                        styles={{ root: { borderStyle: 'dashed', textTransform: 'none' } }}
                      >
                        modelliert
                      </Badge>
                    </>
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {zeilen.map((zeile) => (
              <Table.Tr key={zeile.name}>
                <Table.Th scope="row" fw={500} miw={240}>
                  {zeile.name}
                  <span className="traeger">{zeile.erklaerung}</span>
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

      <Accordion variant="separated" mt="md">
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
