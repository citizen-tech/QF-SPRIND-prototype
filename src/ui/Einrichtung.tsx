import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { euro } from '../format';
import type { Simulationseinstellungen, Vorhabenrolle } from '../kern/simulation';
import {
  PROGRAMME,
  ROLLENNAMEN,
  TRAEGER,
  VORHABENTITEL,
  vorhabenvorgabe,
} from '../kern/simulation';

type Eigenschaften = {
  entwurf: Simulationseinstellungen;
  /** Wurde schon einmal gerechnet? Vor dem ersten Lauf ist dies die ganze Seite. */
  ersterLauf: boolean;
  vomStandardAbweichend: boolean;
  onEntwurf: (naechster: Simulationseinstellungen) => void;
  onStarten: () => void;
  onZuruecksetzen: () => void;
};

const ROLLEN: Vorhabenrolle[] = ['normal', 'wenige-grosse', 'allein', 'absprache'];

export default function Einrichtung({
  entwurf,
  ersterLauf,
  vomStandardAbweichend,
  onEntwurf,
  onStarten,
  onZuruecksetzen,
}: Eigenschaften) {
  const setze = (teil: Partial<Simulationseinstellungen>) => onEntwurf({ ...entwurf, ...teil });

  const setzeVorhaben = (
    index: number,
    teil: Partial<Simulationseinstellungen['vorhaben'][number]>,
  ) => setze({ vorhaben: entwurf.vorhaben.map((v, i) => (i === index ? { ...v, ...teil } : v)) });

  const vorhabenHinzufuegen = () => {
    const index = entwurf.vorhaben.length;
    setze({
      vorhaben: [...entwurf.vorhaben, { ...vorhabenvorgabe(index), id: `v-${index + 1}` }],
    });
  };

  const vorhabenEntfernen = (index: number) =>
    setze({
      vorhaben: entwurf.vorhaben
        .filter((_, i) => i !== index)
        .map((v, i) => ({ ...v, id: `v-${i + 1}` })),
    });

  const ohneHoechstbetrag = entwurf.hoechstbetragJeVorhabenCent === null;
  const abspracheVorhaben = entwurf.vorhaben.filter((v) => v.rolle === 'absprache').length;

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-einrichtung">
      <div className="abschnitt__kopf">
        <Title order={2} id="ueberschrift-einrichtung">
          Runde einrichten
        </Title>
      </div>

      <Text c="dimmed" maw="74ch" mb="lg">
        {ersterLauf
          ? 'Legen Sie die Runde fest und starten Sie die Simulation. Der Seed steuert den Zufall vollständig: Gleicher Seed und gleiche Einstellungen erzeugen dieselbe Runde und damit dieselbe Prüfsumme. Zufällig ist nur, wie die Runde zustande kommt — nie, was daraus gerechnet wird.'
          : 'Änderungen wirken erst, wenn die Simulation erneut gestartet wird.'}
      </Text>

      <Paper withBorder p="lg" radius="sm" bg="white">
        <Stack gap="lg">
          <div>
            <Title order={3} mb="sm">
              Programm und Topf
            </Title>
            <Group align="flex-start" grow wrap="wrap">
              <Select
                label="Programm"
                data={PROGRAMME.map((p) => ({ value: p.zweck, label: p.name }))}
                value={entwurf.zweck}
                onChange={(wert) => wert && setze({ zweck: wert })}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
              <NumberInput
                label="Fördertopf"
                suffix=" €"
                thousandSeparator="."
                decimalSeparator=","
                min={100}
                max={100_000}
                step={100}
                value={entwurf.poolCent / 100}
                onChange={(wert) => setze({ poolCent: Math.round(Number(wert) * 100) })}
              />
              <Box>
                <NumberInput
                  label="Höchstbetrag je Vorhaben"
                  suffix=" €"
                  thousandSeparator="."
                  decimalSeparator=","
                  min={50}
                  max={50_000}
                  step={50}
                  disabled={ohneHoechstbetrag}
                  value={ohneHoechstbetrag ? '' : entwurf.hoechstbetragJeVorhabenCent! / 100}
                  onChange={(wert) =>
                    setze({ hoechstbetragJeVorhabenCent: Math.round(Number(wert) * 100) })
                  }
                />
                <Checkbox
                  mt={6}
                  size="xs"
                  label="ohne Höchstbetrag rechnen"
                  checked={ohneHoechstbetrag}
                  onChange={(e) =>
                    setze({
                      hoechstbetragJeVorhabenCent: e.currentTarget.checked ? null : 60_000,
                    })
                  }
                />
              </Box>
            </Group>

            <Group align="flex-start" grow wrap="wrap" mt="md">
              <TextInput
                label="Förderzeitraum von"
                type="date"
                value={entwurf.zeitraumVon}
                onChange={(e) => setze({ zeitraumVon: e.currentTarget.value })}
              />
              <TextInput
                label="Förderzeitraum bis"
                type="date"
                value={entwurf.zeitraumBis}
                onChange={(e) => setze({ zeitraumBis: e.currentTarget.value })}
              />
            </Group>
          </div>

          <Divider />

          <div>
            <Title order={3} mb="sm">
              Beitragende
            </Title>
            <Group align="flex-start" grow wrap="wrap">
              <NumberInput
                label="Personen insgesamt"
                min={5}
                max={2000}
                step={5}
                value={entwurf.beitragendeGesamt}
                onChange={(wert) => setze({ beitragendeGesamt: Number(wert) })}
              />
              <NumberInput
                label="Beitrag von"
                suffix=" €"
                decimalSeparator=","
                min={1}
                max={500}
                value={entwurf.betragMinCent / 100}
                onChange={(wert) => setze({ betragMinCent: Math.round(Number(wert) * 100) })}
              />
              <NumberInput
                label="Beitrag bis"
                suffix=" €"
                decimalSeparator=","
                min={1}
                max={500}
                value={entwurf.betragMaxCent / 100}
                onChange={(wert) => setze({ betragMaxCent: Math.round(Number(wert) * 100) })}
              />
              <NumberInput
                label="Absprachegruppe"
                description={
                  abspracheVorhaben >= 2
                    ? `trägt ${abspracheVorhaben} Vorhaben geschlossen mit`
                    : 'braucht mindestens zwei so gekennzeichnete Vorhaben'
                }
                min={0}
                max={100}
                value={entwurf.abspracheGroesse}
                onChange={(wert) => setze({ abspracheGroesse: Number(wert) })}
              />
              <NumberInput
                label="Seed"
                description="steuert den Zufall vollständig"
                min={1}
                step={1}
                value={entwurf.seed}
                onChange={(wert) => setze({ seed: Math.max(1, Math.floor(Number(wert))) })}
              />
            </Group>
          </div>

          <Divider />

          <div>
            <Group justify="space-between" align="baseline" mb="sm">
              <Title order={3}>Vorhaben ({entwurf.vorhaben.length})</Title>
              <Button variant="default" size="compact-sm" onClick={vorhabenHinzufuegen}>
                Vorhaben hinzufügen
              </Button>
            </Group>

            <div className="tabellenrahmen">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Vorhaben</Table.Th>
                    <Table.Th>Träger</Table.Th>
                    <Table.Th>Kostenplan</Table.Th>
                    <Table.Th>Zuspruch</Table.Th>
                    <Table.Th>Jurypunkte</Table.Th>
                    <Table.Th>Muster</Table.Th>
                    <Table.Th>
                      <span className="nur-vorlesen">Entfernen</span>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {entwurf.vorhaben.map((v, index) => (
                    <Table.Tr key={v.id}>
                      <Table.Td miw={250}>
                        <Select
                          aria-label={`Titel des Vorhabens ${index + 1}`}
                          data={VORHABENTITEL as unknown as string[]}
                          value={v.titel}
                          onChange={(wert) => wert && setzeVorhaben(index, { titel: wert })}
                          allowDeselect={false}
                          size="xs"
                          comboboxProps={{ withinPortal: true }}
                        />
                      </Table.Td>
                      <Table.Td miw={200}>
                        <Select
                          aria-label={`Träger des Vorhabens ${index + 1}`}
                          data={TRAEGER as unknown as string[]}
                          value={v.traeger}
                          onChange={(wert) => wert && setzeVorhaben(index, { traeger: wert })}
                          allowDeselect={false}
                          size="xs"
                          comboboxProps={{ withinPortal: true }}
                        />
                      </Table.Td>
                      <Table.Td w={124}>
                        <NumberInput
                          aria-label={`Kostenplan des Vorhabens ${index + 1}`}
                          suffix=" €"
                          thousandSeparator="."
                          decimalSeparator=","
                          min={10}
                          max={50_000}
                          step={10}
                          size="xs"
                          value={v.beantragtCent / 100}
                          onChange={(wert) =>
                            setzeVorhaben(index, {
                              beantragtCent: Math.round(Number(wert) * 100),
                            })
                          }
                        />
                      </Table.Td>
                      <Table.Td w={84}>
                        <NumberInput
                          aria-label={`Zuspruch für Vorhaben ${index + 1}`}
                          min={1}
                          max={10}
                          size="xs"
                          value={v.zuspruch}
                          onChange={(wert) => setzeVorhaben(index, { zuspruch: Number(wert) })}
                        />
                      </Table.Td>
                      <Table.Td w={90}>
                        <NumberInput
                          aria-label={`Jurypunkte für Vorhaben ${index + 1}`}
                          min={0}
                          max={100}
                          size="xs"
                          value={v.jurypunkte}
                          onChange={(wert) => setzeVorhaben(index, { jurypunkte: Number(wert) })}
                        />
                      </Table.Td>
                      <Table.Td miw={215}>
                        <Select
                          aria-label={`Muster für Vorhaben ${index + 1}`}
                          data={ROLLEN.map((rolle) => ({
                            value: rolle,
                            label: ROLLENNAMEN[rolle],
                          }))}
                          value={v.rolle}
                          onChange={(wert) =>
                            wert && setzeVorhaben(index, { rolle: wert as Vorhabenrolle })
                          }
                          allowDeselect={false}
                          size="xs"
                          comboboxProps={{ withinPortal: true }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="Vorhaben entfernen" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label={`Vorhaben ${index + 1} entfernen`}
                            disabled={entwurf.vorhaben.length <= 2}
                            onClick={() => vorhabenEntfernen(index)}
                          >
                            ✕
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            <p className="notiz">
              <strong>Zuspruch</strong> steuert, wie viele Personen beitragen, nicht wie viel
              Geld zusammenkommt. <strong>Muster</strong> setzt gezielt die Fälle, an denen sich
              die Verfahren unterscheiden: „Wenige große Beiträge“ sammelt viel Geld von wenigen
              Köpfen, „Nur eine beitragende Person“ führt zu einer Zuteilung von null, und die
              Absprachegruppe trägt alle so gekennzeichneten Vorhaben geschlossen mit.
            </p>
          </div>

          <Group>
            <Button size="md" onClick={onStarten}>
              {ersterLauf ? 'Simulation starten' : 'Simulation erneut starten'}
            </Button>
            <Button variant="default" onClick={onZuruecksetzen} disabled={!vomStandardAbweichend}>
              Auf Ausgangswerte zurücksetzen
            </Button>
            <Text size="sm" c="dimmed">
              {euro(entwurf.poolCent)} auf {entwurf.vorhaben.length} Vorhaben, rund{' '}
              {entwurf.beitragendeGesamt} Beitragende.
            </Text>
          </Group>
        </Stack>
      </Paper>
    </section>
  );
}
