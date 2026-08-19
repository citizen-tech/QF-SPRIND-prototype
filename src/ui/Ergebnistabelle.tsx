import { Badge, Button, Group, Table, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { euro, prozent, zahl } from '../format';
import type { Hebelanzeige } from '../kern/hebel';
import { PROBEBEITRAG_CENT } from '../kern/hebel';
import type { Kopplungsverfahren } from '../kern/paarweise';
import type { Vorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { VERFAHREN } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  werte: readonly Vorhabenwerte[];
  verfahren: Record<VerfahrenId, Verfahrensergebnis>;
  hebel: Hebelanzeige;
  kopplung: Kopplungsverfahren | null;
  zeigeVergleich: boolean;
  zeigeKopplung: boolean;
};

const VERGLEICHSSPALTEN: VerfahrenId[] = ['giesskanne', 'windhund', 'jury', 'anteilig'];

function deckelText(w: Vorhabenwerte): string {
  switch (w.deckelGrund) {
    case 'hoechstbetrag':
      return 'Höchstbetrag erreicht';
    case 'kostenplan':
      return 'Kostenplan ausgeschöpft';
    case 'beide':
      return 'Höchstbetrag und Kostenplan erreicht';
    default:
      return 'gedeckelt';
  }
}

function deckelHerkunft(w: Vorhabenwerte): string {
  switch (w.deckelGrund) {
    case 'hoechstbetrag':
      return 'Höchstbetrag je Vorhaben';
    case 'kostenplan':
      return 'Kostenplan abzüglich Beitragssumme';
    case 'beide':
      return 'Höchstbetrag und Kostenplan gleichauf';
    default:
      return 'keine Obergrenze wirksam';
  }
}

/**
 * Die Aussage der Seite als Zeichen: Köpfe, Euro und Zuteilung übereinander,
 * jeweils am Größten der Runde gemessen. Wo der Euro-Balken lang und der
 * Kopf-Balken kurz ist, fällt die Zuteilung klein aus — und umgekehrt.
 */
function Dreibalken({
  koepfe,
  euroAnteil,
  zuteilung,
  beschreibung,
}: {
  koepfe: number;
  euroAnteil: number;
  zuteilung: number;
  beschreibung: string;
}) {
  const spur = (anteil: number, stark = false) => (
    <span className={`dreibalken__spur${stark ? ' dreibalken__spur--stark' : ''}`}>
      <span
        className={`dreibalken__wert${stark ? ' dreibalken__wert--amt' : ''}`}
        style={{ width: `${Math.max(0, Math.min(100, anteil * 100))}%` }}
      />
    </span>
  );

  return (
    <span className="dreibalken" role="img" aria-label={beschreibung}>
      <span className="dreibalken__name" aria-hidden="true">
        Köpfe
      </span>
      {spur(koepfe)}
      <span className="dreibalken__name" aria-hidden="true">
        Euro
      </span>
      {spur(euroAnteil)}
      <span className="dreibalken__name" aria-hidden="true">
        Zut.
      </span>
      {spur(zuteilung, true)}
    </span>
  );
}

export default function Ergebnistabelle({
  daten,
  werte,
  verfahren,
  hebel,
  kopplung,
  zeigeVergleich,
  zeigeKopplung,
}: Eigenschaften) {
  const [offen, setOffen] = useState<ReadonlySet<string>>(new Set());

  const qf = verfahren.qf;
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const schritteNachId = new Map(qf.schritte.map((s) => [s.id, s]));
  const maxKoepfe = Math.max(1, ...werte.map((w) => w.beitragendeAnzahl));
  const maxEuro = Math.max(1, ...werte.map((w) => w.eigenCent));
  const maxZuteilung = Math.max(1, ...qf.schritte.map((s) => s.endbetragCent));
  const gesamtbemessungswert = werte.reduce((a, w) => a + w.rohEuro, 0);
  const bezug = hebel.bezugVorhabenId
    ? daten.vorhaben.find((v) => v.id === hebel.bezugVorhabenId)
    : undefined;

  const spaltenzahl =
    5 + (zeigeVergleich ? VERGLEICHSSPALTEN.length : 0) + (zeigeKopplung && kopplung ? 1 : 0);

  const alleOffen = offen.size === daten.vorhaben.length;

  function umschalten(id: string) {
    setOffen((bisher) => {
      const naechster = new Set(bisher);
      if (naechster.has(id)) naechster.delete(id);
      else naechster.add(id);
      return naechster;
    });
  }

  return (
    <>
      <Group justify="space-between" align="baseline" mb="xs">
        <Text size="sm" c="dimmed" maw="62ch">
          Aufgeklappt zeigt jede Zeile ihr vollständiges Rechenprotokoll, die Wirkung eines
          weiteren Beitrags und die pseudonymisierte Beitragsliste.
        </Text>
        <Button
          variant="default"
          size="compact-sm"
          onClick={() =>
            setOffen(alleOffen ? new Set() : new Set(daten.vorhaben.map((v) => v.id)))
          }
        >
          {alleOffen ? 'Alle einklappen' : 'Alle aufklappen'}
        </Button>
      </Group>

      <div className="tabellenrahmen">
        <Table highlightOnHover={false} withRowBorders>
          <Table.Caption style={{ captionSide: 'top', textAlign: 'left', padding: '12px 16px' }}>
            Zuteilung nach der Bemessungsregel {daten.runde.formelVersion}. Fördertopf{' '}
            {euro(daten.runde.poolCent)}, verteilt in {qf.iterationen}{' '}
            {qf.iterationen === 1 ? 'Durchlauf' : 'Durchläufen'}. Gesamtbemessungswert{' '}
            {zahl(gesamtbemessungswert, 2)}.
          </Table.Caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Vorhaben</Table.Th>
              <Table.Th ta="right">Beitragende</Table.Th>
              <Table.Th ta="right">Beitragssumme</Table.Th>
              <Table.Th ta="right">Quadratic Funding</Table.Th>
              <Table.Th>Köpfe · Euro · Zuteilung</Table.Th>
              {zeigeVergleich &&
                VERGLEICHSSPALTEN.map((id) => (
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
              {zeigeKopplung && kopplung && <Table.Th ta="right">Mit Kopplungsabschlag</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {daten.vorhaben.map((vorhaben) => {
              const w = werteNachId.get(vorhaben.id)!;
              const schritt = schritteNachId.get(vorhaben.id)!;
              const istOffen = offen.has(vorhaben.id);
              const hebelwert = hebel.werte.get(vorhaben.id)!;
              const anteilBemessung =
                gesamtbemessungswert > 0 ? w.rohEuro / gesamtbemessungswert : 0;

              return [
                <Table.Tr key={vorhaben.id} className={istOffen ? 'zeile--offen' : undefined}>
                  <Table.Th scope="row" fw={500} miw={260}>
                    <button
                      type="button"
                      className="aufklapp"
                      aria-expanded={istOffen}
                      aria-controls={`detail-${vorhaben.id}`}
                      onClick={() => umschalten(vorhaben.id)}
                    >
                      <span className="aufklapp__pfeil" aria-hidden="true">
                        ▶
                      </span>
                      <span>
                        {vorhaben.titel}
                        <span className="traeger">{vorhaben.traeger}</span>
                        {schritt.gedeckelt && (
                          <Badge
                            mt={4}
                            size="xs"
                            variant="light"
                            color="ocker"
                            styles={{ root: { textTransform: 'none' } }}
                          >
                            {deckelText(w)}
                          </Badge>
                        )}
                      </span>
                    </button>
                  </Table.Th>
                  <Table.Td className="zahl">{w.beitragendeAnzahl}</Table.Td>
                  <Table.Td className="zahl zahl--still">{euro(w.eigenCent)}</Table.Td>
                  <Table.Td className="zahl zahl--amt">{euro(schritt.endbetragCent)}</Table.Td>
                  <Table.Td>
                    <Dreibalken
                      koepfe={w.beitragendeAnzahl / maxKoepfe}
                      euroAnteil={w.eigenCent / maxEuro}
                      zuteilung={schritt.endbetragCent / maxZuteilung}
                      beschreibung={
                        `${w.beitragendeAnzahl} Beitragende, ${euro(w.eigenCent)} eingesammelt, ` +
                        `${euro(schritt.endbetragCent)} zugeteilt`
                      }
                    />
                  </Table.Td>
                  {zeigeVergleich &&
                    VERGLEICHSSPALTEN.map((id) => {
                      const betrag = verfahren[id].zuteilungCent.get(vorhaben.id) ?? 0;
                      return (
                        <Table.Td key={id} className="zahl zahl--still">
                          {euro(betrag)}
                        </Table.Td>
                      );
                    })}
                  {zeigeKopplung && kopplung && (
                    <Table.Td className="zahl zahl--still">
                      {euro(kopplung.zuteilungCent.get(vorhaben.id) ?? 0)}
                    </Table.Td>
                  )}
                </Table.Tr>,

                istOffen && (
                  <Table.Tr key={`${vorhaben.id}-detail`} className="detailzeile">
                    <Table.Td colSpan={spaltenzahl} id={`detail-${vorhaben.id}`}>
                      <div className="detail">
                        <div>
                          <Title order={4} mb="xs">
                            Rechenprotokoll
                          </Title>
                          <dl className="rechenschritte">
                            <dt>Beitragende Personen</dt>
                            <dd>{w.beitragendeAnzahl}</dd>

                            <dt>Einzelbeiträge</dt>
                            <dd>{w.beitraegeAnzahl}</dd>

                            <dt>Beitragssumme E</dt>
                            <dd>{euro(w.eigenCent)}</dd>

                            <dt>Summe der Wurzeln W</dt>
                            <dd>{zahl(w.wurzelsumme, 6)}</dd>

                            <dt>Q = W²</dt>
                            <dd>{zahl(w.quadrat, 6)}</dd>

                            <dt>Bemessungswert R = max(0, Q − E)</dt>
                            <dd>{zahl(w.rohEuro, 6)}</dd>

                            <dt>Anteil am Gesamtbemessungswert</dt>
                            <dd>{prozent(anteilBemessung, 3)}</dd>

                            <dt>Kostenplan</dt>
                            <dd>{euro(vorhaben.beantragtCent)}</dd>

                            <dt>Obergrenze der Zuteilung</dt>
                            <dd>
                              {euro(w.deckelCent)}
                              <span className="traeger">{deckelHerkunft(w)}</span>
                            </dd>

                            <dt>Verhältnismäßige Zuteilung vor Kürzung</dt>
                            <dd>{euro(Math.round(schritt.vorlaeufigCent))}</dd>

                            <dt>Auf Obergrenze gekürzt</dt>
                            <dd>
                              {schritt.gedeckelt
                                ? `ja, im ${schritt.fixiertInDurchlauf}. Durchlauf`
                                : 'nein'}
                            </dd>

                            <dt className="ergebnis">Zuteilung nach Rundung</dt>
                            <dd className="ergebnis">{euro(schritt.endbetragCent)}</dd>
                          </dl>

                          <Title order={4} mt="lg" mb={6}>
                            Ein weiterer Beitrag von {euro(PROBEBEITRAG_CENT)}
                          </Title>
                          <Text size="sm" maw="52ch">
                            {schritt.gedeckelt || hebelwert.zuwachsCent <= 0 ? (
                              <Text span c="dimmed" inherit>
                                Obergrenze erreicht — ein weiterer Beitrag erhöht die Zuteilung
                                in dieser Runde nicht.
                              </Text>
                            ) : hebelwert.verhaeltnis === null || !bezug ? (
                              <Text span c="dimmed" inherit>
                                nicht bestimmbar
                              </Text>
                            ) : (
                              <>
                                zählt hier{' '}
                                <Text span fw={600} inherit>
                                  {zahl(hebelwert.verhaeltnis, 1)}-mal so stark
                                </Text>{' '}
                                wie bei „{bezug.titel}“. Bewusst ohne Euro-Angabe: Bei
                                gedeckeltem Topf hinge eine Eurozahl von allen übrigen Beiträgen
                                der Runde ab und wäre am Rundenende falsch.
                              </>
                            )}
                          </Text>
                        </div>

                        <div>
                          <Title order={4} mb={4}>
                            Beiträge ({w.beitragendeAnzahl}{' '}
                            {w.beitragendeAnzahl === 1 ? 'Person' : 'Personen'})
                          </Title>
                          <Text size="xs" c="dimmed" mb="xs" maw="52ch">
                            Kennungen sind Pseudonyme. Mehrfachbeiträge derselben Person sind vor
                            der Wurzelziehung addiert.
                          </Text>
                          <div className="beitragsliste">
                            <Table stickyHeader>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Kennung</Table.Th>
                                  <Table.Th ta="right">Beitrag</Table.Th>
                                  <Table.Th ta="right">Wurzel</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {w.posten.map((posten) => (
                                  <Table.Tr key={posten.beitragendeId}>
                                    <Table.Td className="mono" fz="xs">
                                      {posten.beitragendeId}
                                    </Table.Td>
                                    <Table.Td className="zahl">{euro(posten.betragCent)}</Table.Td>
                                    <Table.Td className="zahl zahl--still">
                                      {zahl(posten.wurzel, 6)}
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                                {w.posten.length === 0 && (
                                  <Table.Tr>
                                    <Table.Td colSpan={3}>
                                      <Text size="xs" c="dimmed">
                                        Für dieses Vorhaben liegt kein Beitrag vor.
                                      </Text>
                                    </Table.Td>
                                  </Table.Tr>
                                )}
                              </Table.Tbody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ),
              ];
            })}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr>
              <Table.Th scope="row">Summe</Table.Th>
              <Table.Td className="zahl">{qf.kennzahlen.beitragendeGesamt}</Table.Td>
              <Table.Td className="zahl">
                {euro(werte.reduce((a, w) => a + w.eigenCent, 0))}
              </Table.Td>
              <Table.Td className="zahl zahl--amt">
                {euro([...qf.zuteilungCent.values()].reduce((a, b) => a + b, 0))}
              </Table.Td>
              <Table.Td />
              {zeigeVergleich &&
                VERGLEICHSSPALTEN.map((id) => (
                  <Table.Td key={id} className="zahl">
                    {euro([...verfahren[id].zuteilungCent.values()].reduce((a, b) => a + b, 0))}
                  </Table.Td>
                ))}
              {zeigeKopplung && kopplung && (
                <Table.Td className="zahl">
                  {euro([...kopplung.zuteilungCent.values()].reduce((a, b) => a + b, 0))}
                </Table.Td>
              )}
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </div>
    </>
  );
}
