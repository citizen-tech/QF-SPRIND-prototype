import {
  Alert,
  Button,
  Checkbox,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import logoCitizenTech from '../../assets/CT_LogotypeAndSign_Horiz_Black.svg';
import logoSprind from '../../assets/Sprind-logo.svg.webp';
import { datum, euro, kurzePruefsumme } from '../format';
import { berechneHebel } from '../kern/hebel';
import { berechneQfMitKopplung, KOPPLUNGSPARAMETER_M } from '../kern/paarweise';
import { pruefsumme as berechnePruefsumme } from '../kern/pruefsumme';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Simulationseinstellungen } from '../kern/simulation';
import type { Programmtyp } from '../kern/simulation';
import {
  AUSGANGSRUNDEN,
  erzeugeRunde,
  neuerSeed,
  PROGRAMMTYPEN,
  zufaelligeVorhaben,
} from '../kern/simulation';

const PROGRAMMTYP_IDS: Programmtyp[] = ['bund', 'buerger'];
import { alleVerfahren } from '../kern/vergleich';
import { FORMEL_VERSION } from '../kern/version';
import { baueNachweismappe } from '../nachweis/mappe';
import NachweismappeAnsicht from '../nachweis/Nachweismappe';
import Einrichtung from './Einrichtung';
import Ergebnistabelle from './Ergebnistabelle';
import Kennzahlenblock from './Kennzahlenblock';
import Hinweis, { ERKLAERUNG } from './Hinweis';
import Kopplungsgruppen from './Kopplungsgruppen';
import Simulationslauf, { LAUFDAUER_MS, LAUFSCHRITTE } from './Simulationslauf';

function gleich(a: Simulationseinstellungen, b: Simulationseinstellungen): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Vergleicht die Rundenwerte, ohne Vorhaben und Seed — die sind gewürfelt. */
function rundenwerteGleich(a: Simulationseinstellungen, b: Simulationseinstellungen): boolean {
  const ohne = (x: Simulationseinstellungen) => JSON.stringify({ ...x, vorhaben: [], seed: 0 });
  return ohne(a) === ohne(b);
}

export default function App() {
  // Null, bis ein Programmtyp gewählt ist. Die Seite führt Schritt für Schritt:
  // Programmtyp wählen, Runde einrichten, Vorhaben auswürfeln, Simulation starten.
  const [entwurf, setEntwurf] = useState<Simulationseinstellungen | null>(null);
  // Null bis zum ersten Knopfdruck: vorher wird nichts gerechnet und nichts gezeigt.
  const [angewandt, setAngewandt] = useState<Simulationseinstellungen | null>(null);

  // Läuft gerade eine Simulation? Die Rechnung selbst dauert Millisekunden;
  // die Schrittanzeige führt vor, was der Rechenkern tut.
  const [lauf, setLauf] = useState<{
    einstellungen: Simulationseinstellungen;
    schritt: number;
  } | null>(null);

  // Beide Zusatzspalten sind aus. Die Gegenüberstellung ist eine bewusste
  // Entscheidung der lesenden Person, keine Voreinstellung.
  const [zeigeVergleich, setZeigeVergleich] = useState(false);
  const [zeigeKopplung, setZeigeKopplung] = useState(false);
  const [mappeOffen, setMappeOffen] = useState(false);
  const scrollMerker = useRef(0);
  const [pruefsumme, setPruefsumme] = useState('');

  const daten = useMemo(() => (angewandt ? erzeugeRunde(angewandt) : null), [angewandt]);
  const werte = useMemo(() => (daten ? berechneVorhabenwerte(daten) : null), [daten]);
  const verfahren = useMemo(
    () => (daten && werte ? alleVerfahren(daten, werte) : null),
    [daten, werte],
  );
  const hebel = useMemo(() => (daten ? berechneHebel(daten) : null), [daten]);
  const kopplung = useMemo(
    () =>
      zeigeKopplung && daten && werte
        ? berechneQfMitKopplung(daten, werte, KOPPLUNGSPARAMETER_M)
        : null,
    [zeigeKopplung, daten, werte],
  );

  /**
   * Die Nachweismappe ersetzt den Seiteninhalt. Ohne Zutun behielte der Browser
   * die Scrollposition, und man landete mitten im Dokument.
   */
  useEffect(() => {
    if (mappeOffen) window.scrollTo(0, 0);
    else window.scrollTo(0, scrollMerker.current);
  }, [mappeOffen]);

  /**
   * Kein Router: Der Inhalt der Mappe hängt am Zustand im Arbeitsspeicher, ein
   * eigener Pfad wäre nach dem Neuladen leer. Ein Eintrag in der Verlaufsliste
   * genügt aber, damit der Zurück-Knopf des Browsers die Mappe schließt.
   */
  useEffect(() => {
    const beiZurueck = () => setMappeOffen(false);
    window.addEventListener('popstate', beiZurueck);
    return () => window.removeEventListener('popstate', beiZurueck);
  }, []);

  useEffect(() => {
    // Eine beim Neuladen übriggebliebene Marke entfernen — dahinter steht dann
    // keine gerechnete Runde mehr.
    if (window.location.hash === '#nachweismappe') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!lauf) return;
    if (lauf.schritt >= LAUFSCHRITTE.length) {
      setAngewandt(lauf.einstellungen);
      setLauf(null);
      return;
    }
    const kennung = setTimeout(
      () => setLauf((bisher) => (bisher ? { ...bisher, schritt: bisher.schritt + 1 } : null)),
      LAUFDAUER_MS / LAUFSCHRITTE.length,
    );
    return () => clearTimeout(kennung);
  }, [lauf]);

  useEffect(() => {
    if (!daten) {
      setPruefsumme('');
      return;
    }
    let verworfen = false;
    setPruefsumme('');
    berechnePruefsumme(daten).then((wert) => {
      if (!verworfen) setPruefsumme(wert);
    });
    return () => {
      verworfen = true;
    };
  }, [daten]);

  function mappeOeffnen() {
    scrollMerker.current = window.scrollY;
    setMappeOffen(true);
    window.history.pushState({ nachweismappe: true }, '', '#nachweismappe');
  }

  function mappeSchliessen() {
    // Über die Verlaufsliste zurück, damit Knopf und Browser-Zurück dasselbe tun.
    if (window.history.state?.nachweismappe) window.history.back();
    else setMappeOffen(false);
  }

  /**
   * Programmtyp wechseln heißt: die ganze Welt tauschen, nicht nur ein Etikett.
   * Die Vorhaben bleiben leer — sie werden im nächsten Schritt gewürfelt.
   */
  function programmtypWechseln(typ: Programmtyp) {
    setEntwurf({ ...AUSGANGSRUNDEN[typ], vorhaben: [] });
    setAngewandt(null);
  }

  const ausgangsrunde = entwurf ? AUSGANGSRUNDEN[entwurf.programmtyp] : null;
  const rundenwerteAbweichend =
    entwurf !== null && ausgangsrunde !== null && !rundenwerteGleich(entwurf, ausgangsrunde);
  const entwurfNichtAngewandt =
    angewandt !== null && entwurf !== null && !gleich(entwurf, angewandt);

  const abweichungen = useMemo(() => {
    if (!angewandt) return [];
    const s = AUSGANGSRUNDEN[angewandt.programmtyp];
    if (rundenwerteGleich(angewandt, s)) return [];
    const liste: string[] = [];
    if (angewandt.poolCent !== s.poolCent) {
      liste.push(`Fördertopf ${euro(angewandt.poolCent)} statt ${euro(s.poolCent)}.`);
    }
    if (angewandt.hoechstbetragJeVorhabenCent !== s.hoechstbetragJeVorhabenCent) {
      liste.push(
        `Höchstbetrag je Vorhaben: ${
          angewandt.hoechstbetragJeVorhabenCent === null
            ? 'ohne Höchstbetrag'
            : euro(angewandt.hoechstbetragJeVorhabenCent)
        }.`,
      );
    }
    if (angewandt.beitragendeGesamt !== s.beitragendeGesamt) {
      liste.push(`${angewandt.beitragendeGesamt} Beitragende statt ${s.beitragendeGesamt}.`);
    }
    if (liste.length === 0) liste.push('Die Einstellungen weichen von der Ausgangsrunde ab.');
    return liste;
  }, [angewandt]);

  if (mappeOffen && daten && werte && verfahren) {
    const mappe = baueNachweismappe({
      daten,
      werte,
      verfahren,
      pruefsumme,
      erzeugtAm: new Date().toISOString(),
      abweichungen,
      merkmalsnamen: PROGRAMMTYPEN[angewandt!.programmtyp].merkmalsnamen,
    });
    return <NachweismappeAnsicht mappe={mappe} onSchliessen={mappeSchliessen} />;
  }

  return (
    <>
      <div className="logoleiste">
        <div className="logoleiste__inhalt">
          <img
            className="logoleiste__eigen"
            src={logoCitizenTech}
            alt="CitizenTech"
            width={786}
            height={185}
          />
          <span className="logoleiste__bezug">
            <span className="logoleiste__bezugtext">Einreichung für</span>
            <img
              className="logoleiste__fremd"
              src={logoSprind}
              alt="SPRIND"
              width={3840}
              height={502}
            />
          </span>
        </div>
      </div>

      <header className="masthead">
        <div className="masthead__inhalt">
          <Title order={1}>Quadratic Funding für gedeckelte Fördertöpfe</Title>
          <p className="kopfsatz">
            Verteilt einen gedeckelten Fördertopf danach, wie viele Menschen ein Vorhaben
            mittragen — nicht danach, wer die größte Summe aufbringt. Das Werkzeug bemisst und
            dokumentiert; bescheiden tut die Behörde.
          </p>

          <div className="kennstreifen">
            <span className="kennstreifen__feld">
              <Hinweis text={ERKLAERUNG.fassung}>
                <span className="kennstreifen__name">Fassung</span>
              </Hinweis>
              <span className="kennstreifen__wert">{FORMEL_VERSION}</span>
            </span>
            <span className="kennstreifen__feld">
              <Hinweis text={ERKLAERUNG.seed}>
                <span className="kennstreifen__name">Seed</span>
              </Hinweis>
              <span className="kennstreifen__wert">{angewandt ? angewandt.seed : '—'}</span>
            </span>
            <span className="kennstreifen__feld" style={{ flex: 1 }}>
              <Hinweis text={ERKLAERUNG.pruefsumme}>
                <span className="kennstreifen__name">Prüfsumme</span>
              </Hinweis>
              <span className="kennstreifen__wert" title={pruefsumme || undefined}>
                {daten ? (pruefsumme ? kurzePruefsumme(pruefsumme) : 'wird berechnet …') : '—'}
              </span>
            </span>
            <span className="kennstreifen__feld">
              <span className="kennstreifen__name">Daten</span>
              <span className="kennstreifen__wert" style={{ color: 'var(--ocker)' }}>
                synthetisch
              </span>
            </span>
          </div>

          <Text size="sm" c="var(--tinte-still)" mt={10}>
            Prototyp mit synthetischen Demodaten. Kein Zahlungsverkehr, keine echten Vorhaben,
            keine echten Personen. Der Rechenkern ist derselbe, der später produktiv laufen soll.
          </Text>
        </div>
      </header>

      <main className="huelle">
        <section className="abschnitt" aria-labelledby="ueberschrift-programmtyp">
          <div className="abschnitt__kopf">
            <Title order={2} id="ueberschrift-programmtyp">
              Programmtyp
            </Title>
          </div>
          <p className="leitsatz">
            Dieselbe Bemessungsregel in derselben Fassung, vier Größenordnungen auseinander.
            Umgestellt wird nur, wer beiträgt und worum es geht — nicht, wie gerechnet wird.
          </p>
          <Radio.Group
            value={entwurf?.programmtyp ?? ''}
            onChange={(wert) => programmtypWechseln(wert as Programmtyp)}
            aria-label="Programmtyp"
          >
            <Group grow align="stretch" wrap="wrap" gap="md">
              {PROGRAMMTYP_IDS.map((id) => (
                <Radio.Card
                  key={id}
                  value={id}
                  className="typkarte"
                  radius="sm"
                  disabled={lauf !== null}
                >
                  <Group wrap="nowrap" align="flex-start" gap="sm" p="md">
                    <Radio.Indicator mt={3} />
                    <div>
                      <Text fw={600} size="md">
                        {PROGRAMMTYPEN[id].name}
                      </Text>
                      <Text size="sm" c="var(--tinte-lese)" mt={3}>
                        {PROGRAMMTYPEN[id].kurz}
                      </Text>
                    </div>
                  </Group>
                </Radio.Card>
              ))}
            </Group>
          </Radio.Group>
          {!entwurf && (
            <p className="leitsatz" style={{ marginTop: 12, marginBottom: 0 }}>
              Erst nach dieser Wahl lässt sich die Runde einrichten.
            </p>
          )}
        </section>

        {entwurf && ausgangsrunde && (
          <div className="auftritt">
            <Einrichtung
              entwurf={entwurf}
              ersterLauf={angewandt === null}
              rundenwerteAbweichend={rundenwerteAbweichend}
              onEntwurf={setEntwurf}
              onStarten={() => setLauf({ einstellungen: entwurf, schritt: 0 })}
              onAuswuerfeln={() => {
                // Der Würfel betrifft nur die Vorhaben. Die Rundenwerte darüber
                // bleiben stehen und bemessen die neuen Kostenpläne.
                const seed = neuerSeed();
                setEntwurf({ ...entwurf, seed, vorhaben: zufaelligeVorhaben(seed, entwurf) });
              }}
              onZuruecksetzen={() => {
                setEntwurf({ ...ausgangsrunde, vorhaben: entwurf.vorhaben });
                setAngewandt(null);
              }}
              laeuft={lauf !== null}
            />
          </div>
        )}

        {lauf && <Simulationslauf schritt={lauf.schritt} />}

        {!lauf && !daten && entwurf && entwurf.vorhaben.length > 0 && (
          <Paper withBorder p="xl" radius="sm" mt="xl" bg="white" className="auftritt">
            <Text c="var(--tinte-lese)">
              Noch nichts gerechnet. Starten Sie die Simulation, um Zuteilung,
              Vergleichsrechnung und Nachweismappe zu erhalten.
            </Text>
          </Paper>
        )}

        {!lauf && daten && werte && verfahren && hebel && (
          <div className="auftritt">
            <section className="abschnitt" aria-labelledby="ueberschrift-ergebnis">
              <div className="abschnitt__kopf">
                <Title order={2} id="ueberschrift-ergebnis">
                  Ergebnis der Runde
                </Title>
              </div>

              {entwurfNichtAngewandt && (
                <Alert color="ocker" variant="light" mb="md" role="status">
                  Die Einstellungen wurden geändert, aber noch nicht angewandt. Die Tabelle zeigt
                  weiterhin die zuletzt gerechnete Runde.
                </Alert>
              )}

              <Paper withBorder p="lg" radius="sm" mb="lg" bg="white">
                <Stack gap="md">
                  <Text className="bescheid" maw="76ch">
                    {daten.runde.zweck}
                  </Text>

                  <Group gap="xl" wrap="wrap">
                    <div>
                      <Hinweis text={ERKLAERUNG.foerderzeitraum}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                          Förderzeitraum
                        </Text>
                      </Hinweis>
                      <Text className="mono">
                        {datum(daten.runde.zeitraum.von)} – {datum(daten.runde.zeitraum.bis)}
                      </Text>
                    </div>
                    <div>
                      <Hinweis text={ERKLAERUNG.foerdertopf}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                          Fördertopf
                        </Text>
                      </Hinweis>
                      <Text className="mono" fz="1.5rem" fw={600} c="amt.9" lh={1.2}>
                        {euro(daten.runde.poolCent)}
                      </Text>
                    </div>
                    <div>
                      <Hinweis text={ERKLAERUNG.hoechstbetrag}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                          Höchstbetrag je Vorhaben
                        </Text>
                      </Hinweis>
                      <Text className="mono">
                        {daten.runde.hoechstbetragJeVorhabenCent === null
                          ? 'nicht festgelegt'
                          : euro(daten.runde.hoechstbetragJeVorhabenCent)}
                      </Text>
                    </div>
                    <div>
                      <Hinweis text={ERKLAERUNG.beitragendeGesamt}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.06em">
                          Beitragende
                        </Text>
                      </Hinweis>
                      <Text className="mono">{verfahren.qf.kennzahlen.beitragendeGesamt}</Text>
                    </div>
                  </Group>

                  {pruefsumme && (
                    <Text size="sm" c="dimmed">
                      Prüfsumme der Eingangsdaten (SHA-256):{' '}
                      <Text span className="mono" fz="xs" c="var(--tinte)" inherit={false}>
                        {pruefsumme}
                      </Text>
                      <br />
                      Seed {angewandt?.seed} und dieselben Einstellungen erzeugen diese Runde
                      erneut — und damit dieselbe Prüfsumme.
                    </Text>
                  )}

                  {abweichungen.length > 0 && (
                    <Alert color="ocker" variant="light" title="Probeberechnung" role="status">
                      Die Eingangsgrößen weichen von der Ausgangsrunde ab. Eine jetzt erzeugte
                      Nachweismappe weist eine Probeberechnung aus, keine Festlegung.
                      <ul style={{ margin: '6px 0 0', paddingLeft: '1.15em' }}>
                        {abweichungen.map((text) => (
                          <li key={text}>{text}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                </Stack>
              </Paper>

              <Group gap="xl" mb="sm" wrap="wrap">
                <Checkbox
                  label={
                    <Hinweis text={ERKLAERUNG.schalterVergleich}>
                      Vergleichsverfahren als Spalten
                    </Hinweis>
                  }
                  checked={zeigeVergleich}
                  onChange={(e) => setZeigeVergleich(e.currentTarget.checked)}
                />
                <Checkbox
                  label={
                    <Hinweis text={ERKLAERUNG.schalterKopplung}>
                      Kopplungsabschlag als Spalte
                    </Hinweis>
                  }
                  checked={zeigeKopplung}
                  onChange={(e) => setZeigeKopplung(e.currentTarget.checked)}
                />
              </Group>

              <Ergebnistabelle
                daten={daten}
                werte={werte}
                verfahren={verfahren}
                hebel={hebel}
                kopplung={kopplung}
                zeigeVergleich={zeigeVergleich}
                zeigeKopplung={zeigeKopplung}
              />

              {verfahren.qf.nichtAusgeschoepftCent > 0 && (
                <p className="notiz notiz--ocker">
                  <strong>Nicht ausgeschöpft: {euro(verfahren.qf.nichtAusgeschoepftCent)}.</strong>{' '}
                  Der Betrag konnte nicht verteilt werden, weil alle verbleibenden Vorhaben ihre
                  Obergrenze erreicht haben. Das ist kein Rundungsfehler, sondern eine
                  haushaltsrechtlich erhebliche Größe.
                </p>
              )}

              {werte.some((w) => w.beitragendeAnzahl <= 1) && (
                <p className="notiz">
                  <strong>Vorhaben mit höchstens einer beitragenden Person erhalten null.</strong>{' '}
                  Die Regel bemisst die Mitträgerschaft durch mehrere Personen; bei einer
                  einzelnen Person sind Gesamtfinanzierungswert und Beitragssumme rechnerisch
                  gleich groß. Das ist der von der Regel vorgesehene Fall und kein Rechenfehler.
                </p>
              )}

              {zeigeKopplung && kopplung && <Kopplungsgruppen
                  kopplung={kopplung.kopplung}
                  merkmalsnamen={PROGRAMMTYPEN[angewandt!.programmtyp].merkmalsnamen}
                />}
            </section>

            <Kennzahlenblock daten={daten} verfahren={verfahren} />

            <section className="abschnitt" aria-labelledby="ueberschrift-nachweis">
              <div className="abschnitt__kopf">
                <Title order={2} id="ueberschrift-nachweis">
                  Nachweismappe
                </Title>
              </div>
              <p className="leitsatz">
                Druckfähige Zusammenstellung: Rechenregel, Zuteilungstabelle, Begründungstext je
                Zuteilung, Vergleichsrechnung, Rechenprotokoll und die pseudonymisierten
                Eingangsdaten. Zusätzlich als JSON herunterladbar.
              </p>
              <Group>
                <Button onClick={mappeOeffnen} disabled={pruefsumme === ''}>
                  Nachweismappe erzeugen
                </Button>
                {pruefsumme === '' && (
                  <Text size="sm" c="dimmed">
                    Prüfsumme wird berechnet …
                  </Text>
                )}
              </Group>
            </section>
          </div>
        )}

        <footer style={{ marginTop: '72px', borderTop: '1px solid var(--linie)', paddingTop: 18 }}>
          <Text size="sm" c="dimmed" maw="82ch">
            Die veröffentlichte Rechenregel steht in{' '}
            <a href="https://github.com/citizen-tech/QF-SPRIND-prototype/blob/main/FORMEL.md">
              FORMEL.md
            </a>
            , der Quelltext unter{' '}
            <a href="https://github.com/citizen-tech/QF-SPRIND-prototype">
              github.com/citizen-tech/QF-SPRIND-prototype
            </a>
            . Lizenz EUPL-1.2. Sämtliche Daten dieser Seite sind synthetisch erzeugt; es besteht
            keine Verbindung zu tatsächlichen Vereinen, Vorhaben oder Personen.
          </Text>
        </footer>
      </main>
    </>
  );
}
