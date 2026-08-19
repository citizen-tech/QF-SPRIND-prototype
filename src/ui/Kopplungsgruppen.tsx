import { Accordion, Table, Text } from '@mantine/core';
import { prozent, zahl } from '../format';
import type { Kopplungsergebnis } from '../kern/paarweise';

export default function Kopplungsgruppen({ kopplung }: { kopplung: Kopplungsergebnis }) {
  return (
    <Accordion variant="separated" mt="md">
      <Accordion.Item value="gruppen">
        <Accordion.Control>
          Kopplungsabschlag nach Merkmalskombination ({kopplung.merkmalsgruppen.length} Gruppen)
        </Accordion.Control>
        <Accordion.Panel>
          <p className="notiz notiz--ocker" style={{ marginTop: 0 }}>
            <strong>Vereinfachtes Zusatzverfahren, nicht Bestandteil der Bemessungsregel.</strong>{' '}
            Paarweise Beschränkung mit Kopplungsparameter M = {kopplung.parameterM}, <em>nicht</em>{' '}
            das vollständige Connection-Oriented Cluster Match. Quelle: Vitalik Buterin, „Pairwise
            coordination subsidies“, ethresear.ch 2019 — <em>nicht</em> aus Buterin/Hitzig/Weyl, wo
            das Verfahren nicht vorkommt. M ist gewählt, nicht aus den Daten abgeleitet.
          </p>

          <Text size="sm" c="dimmed" mb="xs" maw="80ch">
            Ausgewertet werden nur Beitragspaare, deren beide Personen dieselbe Region und
            Altersgruppe angegeben haben. Ausgewiesen wird ausschließlich die Gruppenzugehörigkeit,
            nie eine einzelne Person.
          </Text>

          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Region</Table.Th>
                  <Table.Th>Altersgruppe</Table.Th>
                  <Table.Th ta="right">Personen</Table.Th>
                  <Table.Th ta="right">Paarwert ohne Abschlag</Table.Th>
                  <Table.Th ta="right">mit Abschlag</Table.Th>
                  <Table.Th ta="right">Abschlag</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {kopplung.merkmalsgruppen.map((gruppe) => (
                  <Table.Tr key={`${gruppe.region}|${gruppe.altersgruppe}`}>
                    <Table.Th scope="row" fw={500}>
                      {gruppe.region}
                    </Table.Th>
                    <Table.Td>{gruppe.altersgruppe}</Table.Td>
                    <Table.Td className="zahl">{gruppe.beitragendeAnzahl}</Table.Td>
                    <Table.Td className="zahl zahl--still">
                      {zahl(gruppe.paarwertUngedaempft, 1)}
                    </Table.Td>
                    <Table.Td className="zahl zahl--still">
                      {zahl(gruppe.paarwertGedaempft, 1)}
                    </Table.Td>
                    <Table.Td className="zahl zahl--amt">{prozent(gruppe.abschlag)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <p className="notiz">
            Ein hoher Abschlag ist <strong>kein Nachweis einer Absprache</strong>. Er zeigt an,
            dass Beitragende dieser Merkmalskombination auffällig häufig dieselben Vorhaben
            gemeinsam getragen haben. Das kann eine Absprache sein — oder eine Nachbarschaft, ein
            Verein, ein Betrieb. Das Verfahren wertet zudem große Einzelbeiträge stärker ab als
            kleine, weil die Kopplungsgröße mit der Beitragshöhe wächst. Als Anhaltspunkt für eine
            Prüfung geeignet, als Grundlage einer Entscheidung nicht.
          </p>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
