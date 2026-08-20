import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMemo } from 'react';
import { euro } from '../format';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Simulationseinstellungen, Vorhabenrolle } from '../kern/simulation';
import {
  AUSGANGSRUNDEN,
  erzeugeRunde,
  PROGRAMMTYPEN,
  programmVon,
  ROLLENNAMEN,
  vorhabenvorgabe,
  zufaelligeVorhaben,
} from '../kern/simulation';
import Hinweis, { ERKLAERUNG } from './Hinweis';
import {
  centZuSchieber,
  schieberZuCent,
  TOPF_MARKEN,
  TOPF_MAX_CENT,
  TOPF_MIN_CENT,
} from './topfschieber';

type Eigenschaften = {
  entwurf: Simulationseinstellungen;
  /** Wurde schon einmal gerechnet? Vor dem ersten Lauf ist dies die ganze Seite. */
  ersterLauf: boolean;
  rundenwerteAbweichend: boolean;
  onEntwurf: (naechster: Simulationseinstellungen) => void;
  onStarten: () => void;
  onAuswuerfeln: () => void;
  onZuruecksetzen: () => void;
  laeuft: boolean;
};

const ROLLEN: Vorhabenrolle[] = ['normal', 'wenige-grosse', 'absprache'];

export default function Einrichtung({
  entwurf,
  ersterLauf,
  rundenwerteAbweichend,
  onEntwurf,
  onStarten,
  onAuswuerfeln,
  onZuruecksetzen,
  laeuft,
}: Eigenschaften) {
  const setze = (teil: Partial<Simulationseinstellungen>) => onEntwurf({ ...entwurf, ...teil });

  /** Programmwechsel zieht die Vorhaben nach: andere Titel, gleicher Seed. */
  const programmWechseln = (zweck: string) =>
    onEntwurf({ ...entwurf, zweck, vorhaben: zufaelligeVorhaben(entwurf.seed, { ...entwurf, zweck }) });

  const setzeVorhaben = (
    index: number,
    teil: Partial<Simulationseinstellungen['vorhaben'][number]>,
  ) => setze({ vorhaben: entwurf.vorhaben.map((v, i) => (i === index ? { ...v, ...teil } : v)) });

  const vorhabenHinzufuegen = () => {
    const index = entwurf.vorhaben.length;
    setze({
      vorhaben: [
        ...entwurf.vorhaben,
        {
          ...vorhabenvorgabe(index, 'normal', entwurf.programmtyp, entwurf.zweck),
          id: `v-${index + 1}`,
        },
      ],
    });
  };

  const vorhabenEntfernen = (index: number) =>
    setze({
      vorhaben: entwurf.vorhaben
        .filter((_, i) => i !== index)
        .map((v, i) => ({ ...v, id: `v-${i + 1}` })),
    });

  const welt = PROGRAMMTYPEN[entwurf.programmtyp];
  const programm = programmVon(entwurf.programmtyp, entwurf.zweck);
  const ohneVorhaben = entwurf.vorhaben.length === 0;
  const ohneHoechstbetrag = entwurf.hoechstbetragJeVorhabenCent === null;
  const abspracheVorhaben = entwurf.vorhaben.filter((v) => v.rolle === 'absprache').length;

  /**
   * Die tatsächliche Aufnahmefähigkeit der Runde.
   *
   * Sie wird nicht geschätzt, sondern gerechnet: Die Runde wird probeweise
   * erzeugt und die Obergrenzen werden summiert. Der frühere Näherungswert
   * "Vorhabenzahl mal Höchstbetrag" übersah die zweite Grenze — den Kostenplan
   * abzüglich der Beiträge. Gerade bei hohen Beiträgen ist sie die bindende:
   * Was die Beitragenden schon aufgebracht haben, kann nicht noch einmal
   * zugeteilt werden.
   */
  const aufnahme = useMemo(() => {
    if (entwurf.vorhaben.length === 0) return null;
    const werte = berechneVorhabenwerte(erzeugeRunde(entwurf));
    const summe = werte.reduce((a, w) => a + w.deckelCent, 0);
    const durchKostenplan = werte.filter(
      (w) => w.deckelGrund === 'kostenplan' || w.deckelGrund === 'beide',
    ).length;
    return { summe, durchKostenplan };
  }, [entwurf]);

  const topfUeberschreitetAufnahme = aufnahme !== null && entwurf.poolCent > aufnahme.summe;

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-einrichtung">
      <div className="abschnitt__kopf">
        <Title order={2} id="ueberschrift-einrichtung">
          Runde einrichten
        </Title>
      </div>

      <p className="leitsatz">
        {ersterLauf
          ? 'Legen Sie die Runde fest und starten Sie die Simulation. Der Seed steuert den Zufall vollständig: Gleicher Seed und gleiche Einstellungen erzeugen dieselbe Runde und damit dieselbe Prüfsumme. Zufällig ist nur, wie die Runde zustande kommt — nie, was daraus gerechnet wird.'
          : 'Änderungen wirken erst, wenn die Simulation erneut gestartet wird.'}
      </p>

      <Paper withBorder p="lg" radius="sm" bg="white">
        <Stack gap="lg">
          <div>
            <Title order={3} mb="sm">
              Programm und Topf
            </Title>
            <Group align="flex-start" grow wrap="wrap">
              <Select
                label="Programm"
                data={welt.programme.map((p) => ({ value: p.zweck, label: p.name }))}
                value={entwurf.zweck}
                onChange={(wert) => wert && programmWechseln(wert)}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
              <Box>
                <NumberInput
                  label={<Hinweis text={ERKLAERUNG.foerdertopf}>Fördertopf</Hinweis>}
                  suffix=" €"
                  thousandSeparator="."
                  decimalSeparator=","
                  min={TOPF_MIN_CENT / 100}
                  max={TOPF_MAX_CENT / 100}
                  step={100}
                  value={entwurf.poolCent / 100}
                  onChange={(wert) => setze({ poolCent: Math.round(Number(wert) * 100) })}
                />
                <Slider
                  mt={10}
                  mb={22}
                  size="sm"
                  color="amt.9"
                  label={(stellung) => euro(schieberZuCent(stellung))}
                  aria-label="Fördertopf, logarithmischer Schieber"
                  min={0}
                  max={100}
                  step={0.5}
                  marks={TOPF_MARKEN}
                  value={centZuSchieber(entwurf.poolCent)}
                  onChange={(stellung) => setze({ poolCent: schieberZuCent(stellung) })}
                  styles={{ markLabel: { fontSize: '0.68rem' } }}
                />
              </Box>
              <Box>
                <NumberInput
                  label={
                    <Hinweis text={ERKLAERUNG.hoechstbetrag}>Höchstbetrag je Vorhaben</Hinweis>
                  }
                  suffix=" €"
                  thousandSeparator="."
                  decimalSeparator=","
                  min={50}
                  max={TOPF_MAX_CENT / 100}
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
                      hoechstbetragJeVorhabenCent: e.currentTarget.checked
                        ? null
                        : AUSGANGSRUNDEN[entwurf.programmtyp].hoechstbetragJeVorhabenCent,
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

            {topfUeberschreitetAufnahme && aufnahme && (
              <Alert color="ocker" variant="light" mt="md" role="status">
                Diese {entwurf.vorhaben.length} Vorhaben können zusammen höchstens{' '}
                {euro(aufnahme.summe)} aufnehmen. {euro(entwurf.poolCent - aufnahme.summe)} des
                Fördertopfs bleiben also zwangsläufig liegen.{' '}
                {aufnahme.durchKostenplan > 0
                  ? `Bei ${aufnahme.durchKostenplan} von ${entwurf.vorhaben.length} Vorhaben ist nicht der Höchstbetrag die Grenze, sondern der Kostenplan: Zuteilung und Beiträge zusammen dürfen ihn nicht überschreiten. Abhilfe: höhere Kostenpläne, niedrigere Beiträge, mehr Vorhaben oder ein kleinerer Topf.`
                  : 'Abhilfe: mehr Vorhaben, ein höherer Höchstbetrag oder ein kleinerer Topf.'}
              </Alert>
            )}
          </div>

          <Divider />

          <div>
            <Title order={3} mb="sm">
              Beitragende
            </Title>
            <Group align="flex-start" grow wrap="wrap">
              <NumberInput
                label={
                  <Hinweis text={ERKLAERUNG.personen}>
                    {welt.beitragendeWort} insgesamt
                  </Hinweis>
                }
                min={5}
                max={2000}
                step={5}
                value={entwurf.beitragendeGesamt}
                onChange={(wert) => setze({ beitragendeGesamt: Number(wert) })}
              />
              <NumberInput
                label={<Hinweis text={ERKLAERUNG.betragsspanne}>Beitrag von</Hinweis>}
                suffix=" €"
                thousandSeparator="."
                decimalSeparator=","
                min={1}
                max={TOPF_MAX_CENT / 100}
                value={entwurf.betragMinCent / 100}
                onChange={(wert) => setze({ betragMinCent: Math.round(Number(wert) * 100) })}
              />
              <NumberInput
                label="Beitrag bis"
                suffix=" €"
                thousandSeparator="."
                decimalSeparator=","
                min={1}
                max={TOPF_MAX_CENT / 100}
                value={entwurf.betragMaxCent / 100}
                onChange={(wert) => setze({ betragMaxCent: Math.round(Number(wert) * 100) })}
              />
              <NumberInput
                label={<Hinweis text={ERKLAERUNG.absprachegruppe}>Absprachegruppe</Hinweis>}
                description={abspracheVorhaben >= 2 ? undefined : 'ohne Wirkung'}
                min={0}
                max={100}
                value={entwurf.abspracheGroesse}
                onChange={(wert) => setze({ abspracheGroesse: Number(wert) })}
              />
              <NumberInput
                label={<Hinweis text={ERKLAERUNG.seed}>Seed</Hinweis>}
                min={1}
                step={1}
                value={entwurf.seed}
                onChange={(wert) => setze({ seed: Math.max(1, Math.floor(Number(wert))) })}
              />
            </Group>
          </div>

          <Divider />

          <div>
            <Title order={3} mb="xs">
              Vorhaben ({entwurf.vorhaben.length})
            </Title>

            {/* Der Würfelknopf trägt hier dieselbe Farbe wie "Simulation starten":
                beides sind Schritte, die die lesende Person auslöst. Die
                Nebenhandlung daneben bleibt zurückhaltend. */}
            <Group gap="sm" mb="md" wrap="wrap">
              <Hinweis text={ERKLAERUNG.wuerfeln}>
                <Button onClick={onAuswuerfeln} disabled={laeuft}>
                  Vorhaben auswürfeln
                </Button>
              </Hinweis>
              <Button variant="default" onClick={vorhabenHinzufuegen} disabled={laeuft}>
                Einzelnes Vorhaben hinzufügen
              </Button>
              <Text size="sm" c="var(--tinte-lese)">
                Titel passend zum Programm „{programm.name}“, Kostenpläne passend zum
                Fördertopf.
              </Text>
            </Group>

            <div className="tabellenrahmen">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Vorhaben</Table.Th>
                    <Table.Th>Träger</Table.Th>
                    <Table.Th>
                      <Hinweis text={ERKLAERUNG.kostenplan}>Kostenplan</Hinweis>
                    </Table.Th>
                    <Table.Th>
                      <Hinweis text={ERKLAERUNG.zuspruch}>Zuspruch</Hinweis>
                    </Table.Th>
                    <Table.Th>
                      <Hinweis text={ERKLAERUNG.jurypunkte}>Jurypunkte</Hinweis>
                    </Table.Th>
                    <Table.Th>
                      <Hinweis text={ERKLAERUNG.muster}>Muster</Hinweis>
                    </Table.Th>
                    <Table.Th>
                      <span className="nur-vorlesen">Entfernen</span>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ohneVorhaben && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Text size="sm" c="var(--tinte-lese)" py="sm">
                          Noch keine Vorhaben. „Vorhaben auswürfeln“ legt einen vollständigen
                          Satz an, passend zum Programm und zum Fördertopf.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {entwurf.vorhaben.map((v, index) => (
                    <Table.Tr
                      key={v.id}
                      className="zeile--eintritt"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <Table.Td miw={250}>
                        <Select
                          aria-label={`Titel des Vorhabens ${index + 1}`}
                          data={programm.titel as string[]}
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
                          data={welt.traeger as string[]}
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
                          max={TOPF_MAX_CENT / 100}
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

          </div>

          <Group>
            <Button size="md" onClick={onStarten} loading={laeuft} disabled={ohneVorhaben}>
              {ersterLauf ? 'Simulation starten' : 'Simulation erneut starten'}
            </Button>
            <Button
              variant="default"
              onClick={onZuruecksetzen}
              disabled={!rundenwerteAbweichend || laeuft}
            >
              Rundenwerte zurücksetzen
            </Button>
            <Text size="sm" c="var(--tinte-lese)">
              {ohneVorhaben
                ? 'Würfeln Sie zuerst die Vorhaben aus.'
                : `${euro(entwurf.poolCent)} auf ${entwurf.vorhaben.length} Vorhaben, rund ${entwurf.beitragendeGesamt} Beitragende.`}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </section>
  );
}
