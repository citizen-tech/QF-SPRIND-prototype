import { Alert, Button, Group, Paper, Table, Text, Title } from '@mantine/core';
import { datum, euro, prozent, zahl } from '../format';
import type { Nachweismappe } from './mappe';

type Eigenschaften = {
  mappe: Nachweismappe;
  onSchliessen: () => void;
};

function zeitpunkt(iso: string): string {
  const d = new Date(iso);
  const zwei = (n: number) => String(n).padStart(2, '0');
  return (
    `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}, ` +
    `${zwei(d.getHours())}:${zwei(d.getMinutes())} Uhr`
  );
}

function Kennwert({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
        {name}
      </Text>
      <Text className="mono" size="sm">
        {children}
      </Text>
    </div>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: '38px' }}>
      <Title order={2} mb="sm" style={{ borderBottom: '1px solid var(--tinte)', paddingBottom: 6 }}>
        {titel}
      </Title>
      {children}
    </section>
  );
}

export default function NachweismappeAnsicht({ mappe, onSchliessen }: Eigenschaften) {
  function herunterladen() {
    const blob = new Blob([JSON.stringify(mappe, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const verweis = document.createElement('a');
    verweis.href = url;
    verweis.download = `nachweismappe-${mappe.runde.id}-${mappe.formelVersion}.json`;
    document.body.appendChild(verweis);
    verweis.click();
    verweis.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="werkzeugleiste nicht-drucken">
        <div className="werkzeugleiste__inhalt">
          <Button variant="default" onClick={onSchliessen}>
            ← Zurück zur Berechnung
          </Button>
          <Group gap="sm">
            <Button variant="default" onClick={herunterladen}>
              Als JSON herunterladen
            </Button>
            <Button onClick={() => window.print()}>Drucken oder als PDF sichern</Button>
          </Group>
        </div>
      </div>

      <article className="mappe">
        <Paper withBorder p="lg" radius="sm" bg="white" style={{ borderColor: 'var(--tinte)' }}>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            lts="0.08em"
            c="ocker.9"
            mb="xs"
            className="mono"
          >
            Prototyp — synthetische Daten — kein Verwaltungsakt
          </Text>
          <Title order={1}>Nachweis der Bemessung</Title>
          <Text className="bescheid" mt="sm" maw="78ch">
            {mappe.runde.zweck}
          </Text>

          <Group gap="xl" mt="lg" wrap="wrap">
            <Kennwert name="Runde">{mappe.runde.id}</Kennwert>
            <Kennwert name="Förderzeitraum">
              {datum(mappe.runde.zeitraum.von)} – {datum(mappe.runde.zeitraum.bis)}
            </Kennwert>
            <Kennwert name="Erstellt am">{zeitpunkt(mappe.erzeugtAm)}</Kennwert>
            <Kennwert name="Fassung der Bemessungsregel">{mappe.formelVersion}</Kennwert>
            <Kennwert name="Fördertopf">{euro(mappe.summen.poolCent)}</Kennwert>
            <Kennwert name="Höchstbetrag je Vorhaben">
              {mappe.runde.hoechstbetragJeVorhabenCent === null
                ? 'nicht festgelegt'
                : euro(mappe.runde.hoechstbetragJeVorhabenCent)}
            </Kennwert>
          </Group>

          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em" mt="md">
            Prüfsumme der Eingangsdaten (SHA-256)
          </Text>
          <Text className="mono" size="xs" style={{ overflowWrap: 'anywhere' }}>
            {mappe.pruefsummeEingangsdaten}
          </Text>

          <p className="notiz" style={{ marginBottom: 0 }}>
            {mappe.hinweis}
          </p>

          {mappe.istProbeberechnung && (
            <Alert color="ocker" variant="light" mt="md" title="Probeberechnung, keine Festlegung">
              Die Eingangsgrößen weichen von der Ausgangsrunde ab:
              <ul style={{ margin: '6px 0 0', paddingLeft: '1.15em' }}>
                {mappe.abweichungen.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Paper>

        <Abschnitt titel="1. Bemessungsregel in Kurzfassung">
          <ol className="bescheid" style={{ maxWidth: '80ch', paddingLeft: '1.3em' }}>
            {mappe.bemessungsregel.kurzfassung.map((satz) => (
              <li key={satz} style={{ marginBottom: '4px' }}>
                {satz}
              </li>
            ))}
          </ol>
          <Text size="sm">
            Maßgeblich ist der vollständige Wortlaut in der Datei{' '}
            <strong>{mappe.bemessungsregel.verweis}</strong> in der Fassung {mappe.formelVersion}.
          </Text>
        </Abschnitt>

        <Abschnitt titel="2. Zuteilungstabelle">
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Vorhaben</Table.Th>
                  <Table.Th ta="right">Beitragende</Table.Th>
                  <Table.Th ta="right">Beitragssumme</Table.Th>
                  <Table.Th ta="right">Bemessungswert</Table.Th>
                  <Table.Th ta="right">Anteil</Table.Th>
                  <Table.Th ta="right">Zuteilung</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <Table.Tr key={zeile.vorhabenId}>
                    <Table.Th scope="row" fw={500}>
                      {zeile.titel}
                      <span className="traeger">{zeile.traeger}</span>
                    </Table.Th>
                    <Table.Td className="zahl">{zeile.beitragendeAnzahl}</Table.Td>
                    <Table.Td className="zahl">{euro(zeile.beitragssummeCent)}</Table.Td>
                    <Table.Td className="zahl">{zahl(zeile.bemessungswert, 2)}</Table.Td>
                    <Table.Td className="zahl">{prozent(zeile.anteilAmBemessungswert)}</Table.Td>
                    <Table.Td className="zahl zahl--amt">{euro(zeile.zuteilungCent)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th scope="row">Summe</Table.Th>
                  <Table.Td />
                  <Table.Td className="zahl">
                    {euro(mappe.zuteilungen.reduce((a, z) => a + z.beitragssummeCent, 0))}
                  </Table.Td>
                  <Table.Td className="zahl">{zahl(mappe.summen.gesamtbemessungswert, 2)}</Table.Td>
                  <Table.Td />
                  <Table.Td className="zahl">{euro(mappe.summen.zugeteiltCent)}</Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </div>
          <Text size="sm" mt="sm">
            Fördertopf {euro(mappe.summen.poolCent)}, zugeteilt {euro(mappe.summen.zugeteiltCent)},
            nicht ausgeschöpft <strong>{euro(mappe.summen.nichtAusgeschoepftCent)}</strong>. Die
            Verteilung erforderte {mappe.summen.iterationen}{' '}
            {mappe.summen.iterationen === 1 ? 'Durchlauf' : 'Durchläufe'}.
          </Text>
        </Abschnitt>

        <Abschnitt titel="3. Begründung je Zuteilung">
          {mappe.zuteilungen.map((zeile) => (
            <div className="begruendung" key={zeile.vorhabenId}>
              <Text fw={600} size="sm" mb={2}>
                {zeile.titel} — {euro(zeile.zuteilungCent)}
              </Text>
              <p className="bescheid" style={{ margin: 0 }}>
                {zeile.begruendung}
              </p>
            </div>
          ))}
        </Abschnitt>

        <Abschnitt titel="4. Vergleichsrechnung">
          <Text size="sm" maw="80ch" mb="sm">
            Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe Topf,
            dieselben Höchstbeträge, fünf Verteilregeln.
          </Text>
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Vorhaben</Table.Th>
                  {mappe.vergleichsrechnung.map((v) => (
                    <Table.Th key={v.verfahren} ta="right">
                      {v.bezeichnung}
                      {v.modelliert && <span className="traeger">modelliert</span>}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <Table.Tr key={zeile.vorhabenId}>
                    <Table.Th scope="row" fw={500}>
                      {zeile.titel}
                    </Table.Th>
                    {mappe.vergleichsrechnung.map((v) => (
                      <Table.Td key={v.verfahren} className="zahl">
                        {euro(v.zuteilungCent[zeile.vorhabenId] ?? 0)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <Title order={3} mt="lg" mb="xs">
            Kennzahlen
          </Title>
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Verfahren</Table.Th>
                  <Table.Th ta="right">Erreichte Beitragende</Table.Th>
                  <Table.Th ta="right">Geförderte Vorhaben</Table.Th>
                  <Table.Th ta="right">Median</Table.Th>
                  <Table.Th ta="right">Gini</Table.Th>
                  <Table.Th ta="right">Nicht ausgeschöpft</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.vergleichsrechnung.map((v) => (
                  <Table.Tr key={v.verfahren}>
                    <Table.Th scope="row" fw={500}>
                      {v.bezeichnung}
                    </Table.Th>
                    <Table.Td className="zahl">
                      {v.kennzahlen.beitragendeMitTreffer} von {v.kennzahlen.beitragendeGesamt}
                    </Table.Td>
                    <Table.Td className="zahl">{v.kennzahlen.gefoerderteVorhaben}</Table.Td>
                    <Table.Td className="zahl">{euro(v.kennzahlen.medianZuteilungCent)}</Table.Td>
                    <Table.Td className="zahl">{zahl(v.kennzahlen.gini, 3)}</Table.Td>
                    <Table.Td className="zahl">
                      {euro(v.kennzahlen.nichtAusgeschoepftCent)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
          <p className="notiz">{mappe.modellierungshinweis}</p>
        </Abschnitt>

        <Abschnitt titel="5. Rechenprotokoll">
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Vorhaben</Table.Th>
                  <Table.Th ta="right">Beitragssumme E</Table.Th>
                  <Table.Th ta="right">Wurzelsumme W</Table.Th>
                  <Table.Th ta="right">Q = W²</Table.Th>
                  <Table.Th ta="right">R = Q − E</Table.Th>
                  <Table.Th ta="right">Obergrenze</Table.Th>
                  <Table.Th ta="right">Vor Kürzung</Table.Th>
                  <Table.Th ta="right">Zuteilung</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <Table.Tr key={zeile.vorhabenId}>
                    <Table.Th scope="row" fw={500}>
                      {zeile.titel}
                    </Table.Th>
                    <Table.Td className="zahl">{euro(zeile.beitragssummeCent)}</Table.Td>
                    <Table.Td className="zahl">{zahl(zeile.wurzelsumme, 6)}</Table.Td>
                    <Table.Td className="zahl">{zahl(zeile.quadrat, 4)}</Table.Td>
                    <Table.Td className="zahl">{zahl(zeile.bemessungswert, 4)}</Table.Td>
                    <Table.Td className="zahl">{euro(zeile.deckelCent)}</Table.Td>
                    <Table.Td className="zahl">{euro(Math.round(zeile.vorlaeufigCent))}</Table.Td>
                    <Table.Td className="zahl zahl--amt">{euro(zeile.zuteilungCent)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Abschnitt>

        <Abschnitt titel="6. Eingangsdaten (pseudonymisiert)">
          <Title order={3} mb="xs">
            Vorhaben
          </Title>
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Kennung</Table.Th>
                  <Table.Th>Titel</Table.Th>
                  <Table.Th>Träger</Table.Th>
                  <Table.Th ta="right">Kostenplan</Table.Th>
                  <Table.Th>Antragseingang</Table.Th>
                  <Table.Th ta="right">Jurypunkte</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.eingangsdatenPseudonymisiert.vorhaben.map((v) => (
                  <Table.Tr key={v.id}>
                    <Table.Td className="mono" fz="xs">
                      {v.id}
                    </Table.Td>
                    <Table.Td>{v.titel}</Table.Td>
                    <Table.Td>{v.traeger}</Table.Td>
                    <Table.Td className="zahl">{euro(v.beantragtCent)}</Table.Td>
                    <Table.Td className="mono" fz="xs">
                      {datum(v.eingangZeitpunkt)}
                    </Table.Td>
                    <Table.Td className="zahl">{v.jurypunkte}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <Title order={3} mt="lg" mb="xs">
            Beiträge ({mappe.eingangsdatenPseudonymisiert.beitraege.length})
          </Title>
          <div className="tabellenrahmen">
            <Table withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Vorhaben</Table.Th>
                  <Table.Th>Kennung</Table.Th>
                  <Table.Th ta="right">Betrag</Table.Th>
                  <Table.Th>Zeitpunkt</Table.Th>
                  <Table.Th>{mappe.merkmalsnamen.region}</Table.Th>
                  <Table.Th>{mappe.merkmalsnamen.altersgruppe}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mappe.eingangsdatenPseudonymisiert.beitraege.map((b, index) => (
                  <Table.Tr key={`${b.vorhabenId}-${b.beitragendeId}-${index}`}>
                    <Table.Td className="mono" fz="xs">
                      {b.vorhabenId}
                    </Table.Td>
                    <Table.Td className="mono" fz="xs">
                      {b.beitragendeId}
                    </Table.Td>
                    <Table.Td className="zahl">{euro(b.betragCent)}</Table.Td>
                    <Table.Td className="mono" fz="xs">
                      {datum(b.zeitpunkt)}
                    </Table.Td>
                    <Table.Td>{b.merkmal.region}</Table.Td>
                    <Table.Td>{b.merkmal.altersgruppe}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Abschnitt>

        <Abschnitt titel="7. Reproduzierbarkeit">
          <Group gap="xl" wrap="wrap" mb="md">
            <Kennwert name="Fassung der Bemessungsregel">
              {mappe.reproduzierbarkeit.formelVersion}
            </Kennwert>
          </Group>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
            Prüfsumme der Eingangsdaten
          </Text>
          <Text className="mono" size="xs" mb="md" style={{ overflowWrap: 'anywhere' }}>
            {mappe.reproduzierbarkeit.pruefsummeEingangsdaten}
          </Text>

          <Title order={3} mb="xs">
            So wird nachgerechnet
          </Title>
          <ol className="bescheid" style={{ maxWidth: '80ch', paddingLeft: '1.3em' }}>
            {mappe.reproduzierbarkeit.anleitung.map((satz) => (
              <li key={satz} style={{ marginBottom: '4px' }}>
                {satz}
              </li>
            ))}
          </ol>
          <p className="notiz">{mappe.hinweis}</p>
        </Abschnitt>
      </article>
    </>
  );
}
