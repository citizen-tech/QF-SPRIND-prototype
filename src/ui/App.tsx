import { useEffect, useMemo, useState } from 'react';
import demodaten from '../daten/runde-demo.json';
import { euro } from '../format';
import { berechneHebel } from '../kern/hebel';
import { berechneQfMitKopplung, KOPPLUNGSPARAMETER_M } from '../kern/paarweise';
import { pruefsumme as berechnePruefsumme } from '../kern/pruefsumme';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Beitrag, Rundendaten } from '../kern/typen';
import { alleVerfahren } from '../kern/vergleich';
import { baueNachweismappe } from '../nachweis/mappe';
import NachweismappeAnsicht from '../nachweis/Nachweismappe';
import Kopplungsansicht from './Kopplungsansicht';
import Rechenprotokoll from './Rechenprotokoll';
import Rundenkopf from './Rundenkopf';
import Schieber from './Schieber';
import Vergleichsansicht from './Vergleichsansicht';
import Vorhabenliste from './Vorhabenliste';

const AUSGANGSDATEN = demodaten as Rundendaten;

/** Fester Ausgangszeitpunkt für ergänzte Beiträge — kein Date.now, damit die
 *  Prüfsumme allein von der Eingabe abhängt. */
const ZUSATZBEITRAG_BASIS = Date.UTC(2026, 8, 30, 12, 0, 0);

export default function App() {
  const [poolCent, setPoolCent] = useState(AUSGANGSDATEN.runde.poolCent);
  const [hoechstbetragCent, setHoechstbetragCent] = useState(
    AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent,
  );
  const [zusatzbeitraege, setZusatzbeitraege] = useState<Beitrag[]>([]);
  const [mappeOffen, setMappeOffen] = useState(false);
  const [kopplungOffen, setKopplungOffen] = useState(false);
  const [pruefsumme, setPruefsumme] = useState('');

  const daten = useMemo<Rundendaten>(
    () => ({
      runde: {
        ...AUSGANGSDATEN.runde,
        poolCent,
        hoechstbetragJeVorhabenCent: hoechstbetragCent,
      },
      vorhaben: AUSGANGSDATEN.vorhaben,
      beitraege: [...AUSGANGSDATEN.beitraege, ...zusatzbeitraege],
    }),
    [poolCent, hoechstbetragCent, zusatzbeitraege],
  );

  const abweichungen = useMemo(() => {
    const liste: string[] = [];
    if (poolCent !== AUSGANGSDATEN.runde.poolCent) {
      liste.push(
        `Fördertopf abweichend gesetzt: ${euro(poolCent)} statt ` +
          `${euro(AUSGANGSDATEN.runde.poolCent)}.`,
      );
    }
    if (hoechstbetragCent !== AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent) {
      const jetzt = hoechstbetragCent === null ? 'ohne Höchstbetrag' : euro(hoechstbetragCent);
      const vorher =
        AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent === null
          ? 'ohne Höchstbetrag'
          : euro(AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent);
      liste.push(`Höchstbetrag je Vorhaben abweichend gesetzt: ${jetzt} statt ${vorher}.`);
    }
    if (zusatzbeitraege.length > 0) {
      const summe = zusatzbeitraege.reduce((a, b) => a + b.betragCent, 0);
      liste.push(
        `${zusatzbeitraege.length} Beitrag/Beiträge über insgesamt ${euro(summe)} wurden ` +
          `nachträglich ergänzt.`,
      );
    }
    return liste;
  }, [poolCent, hoechstbetragCent, zusatzbeitraege]);

  const istProbeberechnung = abweichungen.length > 0;

  const werte = useMemo(() => berechneVorhabenwerte(daten), [daten]);
  const verfahren = useMemo(() => alleVerfahren(daten, werte), [daten, werte]);
  const hebel = useMemo(() => berechneHebel(daten), [daten]);
  const kopplung = useMemo(
    () => (kopplungOffen ? berechneQfMitKopplung(daten, werte, KOPPLUNGSPARAMETER_M) : null),
    [kopplungOffen, daten, werte],
  );

  useEffect(() => {
    let verworfen = false;
    setPruefsumme('');
    berechnePruefsumme(daten).then((wert) => {
      if (!verworfen) setPruefsumme(wert);
    });
    return () => {
      verworfen = true;
    };
  }, [daten]);

  function zuruecksetzen() {
    setPoolCent(AUSGANGSDATEN.runde.poolCent);
    setHoechstbetragCent(AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent);
    setZusatzbeitraege([]);
  }

  function beitragErgaenzen(vorhabenId: string, betragCent: number) {
    setZusatzbeitraege((bisher) => [
      ...bisher,
      {
        vorhabenId,
        beitragendeId: `b-ergaenzt-${String(bisher.length + 1).padStart(3, '0')}`,
        betragCent,
        zeitpunkt: new Date(ZUSATZBEITRAG_BASIS + bisher.length * 60_000).toISOString(),
        merkmal: { region: 'nicht angegeben', altersgruppe: 'nicht angegeben' },
      },
    ]);
  }

  if (mappeOffen) {
    const mappe = baueNachweismappe({
      daten,
      werte,
      verfahren,
      pruefsumme,
      erzeugtAm: new Date().toISOString(),
      abweichungen,
    });
    return <NachweismappeAnsicht mappe={mappe} onSchliessen={() => setMappeOffen(false)} />;
  }

  return (
    <>
      <div className="band">
        <div className="band__inhalt">
          Prototyp mit <strong>synthetischen Demodaten</strong>. Kein Zahlungsverkehr, keine
          echten Vorhaben, keine echten Personen. Der Rechenkern ist derselbe, der später
          produktiv laufen soll.
        </div>
      </div>

      <main className="huelle">
        <header className="kopf">
          <h1>Bemessungsrechnung für einen Fördertopf</h1>
          <p className="kopf__unterzeile">
            Budgetbeschränktes Quadratic Funding, gegenübergestellt mit vier herkömmlichen
            Verteilregeln. Das Werkzeug bemisst und dokumentiert. Es entscheidet nicht und
            bescheidet nicht — das bleibt Sache der Behörde.
          </p>
        </header>

        <Rundenkopf
          daten={daten}
          pruefsumme={pruefsumme}
          istProbeberechnung={istProbeberechnung}
          abweichungen={abweichungen}
        />

        <Vorhabenliste daten={daten} werte={werte} qf={verfahren.qf} hebel={hebel} />

        <Vergleichsansicht daten={daten} verfahren={verfahren} />

        <Schieber
          poolCent={poolCent}
          hoechstbetragCent={hoechstbetragCent}
          ausgangsPoolCent={AUSGANGSDATEN.runde.poolCent}
          ausgangsHoechstbetragCent={AUSGANGSDATEN.runde.hoechstbetragJeVorhabenCent}
          vorhaben={daten.vorhaben}
          zusatzbeitraege={zusatzbeitraege}
          istProbeberechnung={istProbeberechnung}
          onPool={setPoolCent}
          onHoechstbetrag={setHoechstbetragCent}
          onBeitragErgaenzen={beitragErgaenzen}
          onZuruecksetzen={zuruecksetzen}
        />

        <Rechenprotokoll daten={daten} werte={werte} qf={verfahren.qf} />

        <Kopplungsansicht
          daten={daten}
          qf={verfahren.qf}
          kopplung={kopplung}
          offen={kopplungOffen}
          onUmschalten={() => setKopplungOffen((x) => !x)}
        />

        <section className="abschnitt">
          <div className="abschnitt__kopf">
            <h2>Nachweismappe</h2>
          </div>
          <p className="abschnitt__einleitung">
            Erzeugt eine druckfähige Zusammenstellung: Rechenregel, Zuteilungstabelle,
            Begründungstext je Zuteilung, Vergleichsrechnung, Rechenprotokoll und die
            pseudonymisierten Eingangsdaten. Zusätzlich als JSON herunterladbar.
          </p>
          <div className="knopfreihe">
            <button
              type="button"
              className="knopf knopf--haupt"
              onClick={() => setMappeOffen(true)}
              disabled={pruefsumme === ''}
            >
              Nachweismappe erzeugen
            </button>
            {pruefsumme === '' && (
              <span className="zahl--still">Prüfsumme wird berechnet …</span>
            )}
          </div>
        </section>

        <footer className="fuss">
          <p>
            Bemessungsregel in der Fassung <strong>{daten.runde.formelVersion}</strong>.
            Quelltext und Rechenregel:{' '}
            <a href="https://github.com/citizen-tech/QF-SPRIND-prototype">
              github.com/citizen-tech/QF-SPRIND-prototype
            </a>
            . Lizenz EUPL-1.2.
          </p>
          <p>
            Sämtliche Daten dieser Seite sind synthetisch erzeugt. Es besteht keine
            Verbindung zu tatsächlichen Vereinen, Vorhaben oder Personen.
          </p>
        </footer>
      </main>
    </>
  );
}
