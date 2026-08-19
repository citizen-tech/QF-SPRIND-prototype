import { useEffect, useMemo, useState } from 'react';
import { datum, euro, kurzePruefsumme } from '../format';
import { berechneHebel } from '../kern/hebel';
import { berechneQfMitKopplung, KOPPLUNGSPARAMETER_M } from '../kern/paarweise';
import { pruefsumme as berechnePruefsumme } from '../kern/pruefsumme';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Simulationseinstellungen } from '../kern/simulation';
import { erzeugeRunde, STANDARD_EINSTELLUNGEN } from '../kern/simulation';
import { alleVerfahren } from '../kern/vergleich';
import { baueNachweismappe } from '../nachweis/mappe';
import NachweismappeAnsicht from '../nachweis/Nachweismappe';
import Ergebnistabelle from './Ergebnistabelle';
import Kennzahlenblock from './Kennzahlenblock';
import Kopplungsgruppen from './Kopplungsgruppen';
import SimulationseinstellungenAnsicht from './Simulationseinstellungen';

function gleicheEinstellungen(a: Simulationseinstellungen, b: Simulationseinstellungen): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function App() {
  // Entwurf ist, was in den Feldern steht. Angewandt ist, was gerechnet wird.
  const [entwurf, setEntwurf] = useState<Simulationseinstellungen>(STANDARD_EINSTELLUNGEN);
  const [angewandt, setAngewandt] = useState<Simulationseinstellungen>(STANDARD_EINSTELLUNGEN);

  const [einstellungenOffen, setEinstellungenOffen] = useState(true);
  const [zeigeVergleich, setZeigeVergleich] = useState(true);
  const [zeigeKopplung, setZeigeKopplung] = useState(false);
  const [mappeOffen, setMappeOffen] = useState(false);
  const [pruefsumme, setPruefsumme] = useState('');

  const daten = useMemo(() => erzeugeRunde(angewandt), [angewandt]);
  const werte = useMemo(() => berechneVorhabenwerte(daten), [daten]);
  const verfahren = useMemo(() => alleVerfahren(daten, werte), [daten, werte]);
  const hebel = useMemo(() => berechneHebel(daten), [daten]);
  const kopplung = useMemo(
    () => (zeigeKopplung ? berechneQfMitKopplung(daten, werte, KOPPLUNGSPARAMETER_M) : null),
    [zeigeKopplung, daten, werte],
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

  const entwurfGeaendert = !gleicheEinstellungen(entwurf, angewandt);
  const vomStandardAbweichend = !gleicheEinstellungen(angewandt, STANDARD_EINSTELLUNGEN);

  const abweichungen = useMemo(() => {
    if (!vomStandardAbweichend) return [];
    const liste: string[] = [];
    const s = STANDARD_EINSTELLUNGEN;
    if (angewandt.seed !== s.seed) liste.push(`Seed ${angewandt.seed} statt ${s.seed}.`);
    if (angewandt.poolCent !== s.poolCent) {
      liste.push(`Fördertopf ${euro(angewandt.poolCent)} statt ${euro(s.poolCent)}.`);
    }
    if (angewandt.hoechstbetragJeVorhabenCent !== s.hoechstbetragJeVorhabenCent) {
      const jetzt =
        angewandt.hoechstbetragJeVorhabenCent === null
          ? 'ohne Höchstbetrag'
          : euro(angewandt.hoechstbetragJeVorhabenCent);
      liste.push(`Höchstbetrag je Vorhaben: ${jetzt}.`);
    }
    if (angewandt.vorhaben.length !== s.vorhaben.length) {
      liste.push(`${angewandt.vorhaben.length} Vorhaben statt ${s.vorhaben.length}.`);
    }
    if (angewandt.beitragendeGesamt !== s.beitragendeGesamt) {
      liste.push(`${angewandt.beitragendeGesamt} Beitragende statt ${s.beitragendeGesamt}.`);
    }
    if (liste.length === 0) liste.push('Die Einstellungen weichen von der Ausgangsrunde ab.');
    return liste;
  }, [angewandt, vomStandardAbweichend]);

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

        <SimulationseinstellungenAnsicht
          entwurf={entwurf}
          offen={einstellungenOffen}
          geaendert={entwurfGeaendert || vomStandardAbweichend}
          onEntwurf={setEntwurf}
          onUmschalten={() => setEinstellungenOffen((x) => !x)}
          onStarten={() => {
            setAngewandt(entwurf);
            setEinstellungenOffen(false);
          }}
          onZuruecksetzen={() => {
            setEntwurf(STANDARD_EINSTELLUNGEN);
            setAngewandt(STANDARD_EINSTELLUNGEN);
          }}
        />

        <section className="abschnitt" aria-labelledby="ueberschrift-ergebnis">
          <div className="abschnitt__kopf">
            <span className="abschnitt__nummer">2</span>
            <h2 id="ueberschrift-ergebnis">Ergebnis der Runde</h2>
          </div>

          {entwurfGeaendert && (
            <p className="notiz notiz--hinweis" role="status">
              Die Einstellungen wurden geändert, aber noch nicht angewandt. Die Tabelle zeigt
              weiterhin die zuletzt gerechnete Runde.
            </p>
          )}

          <div className="tafel" style={{ marginBottom: '18px' }}>
            <p style={{ maxWidth: '78ch' }}>{daten.runde.zweck}</p>
            <dl className="paare">
              <div>
                <dt className="paar__begriff">Förderzeitraum</dt>
                <dd className="paar__wert">
                  {datum(daten.runde.zeitraum.von)} – {datum(daten.runde.zeitraum.bis)}
                </dd>
              </div>
              <div>
                <dt className="paar__begriff">Fördertopf</dt>
                <dd className="paar__wert paar__wert--gross paar__wert--akzent">
                  {euro(daten.runde.poolCent)}
                </dd>
              </div>
              <div>
                <dt className="paar__begriff">Höchstbetrag je Vorhaben</dt>
                <dd className="paar__wert">
                  {daten.runde.hoechstbetragJeVorhabenCent === null
                    ? 'nicht festgelegt'
                    : euro(daten.runde.hoechstbetragJeVorhabenCent)}
                </dd>
              </div>
              <div>
                <dt className="paar__begriff">Beitragende</dt>
                <dd className="paar__wert">{verfahren.qf.kennzahlen.beitragendeGesamt}</dd>
              </div>
              <div>
                <dt className="paar__begriff">Seed</dt>
                <dd className="paar__wert">{angewandt.seed}</dd>
              </div>
              <div>
                <dt className="paar__begriff">Fassung der Bemessungsregel</dt>
                <dd className="paar__wert">{daten.runde.formelVersion}</dd>
              </div>
              <div>
                <dt className="paar__begriff">Prüfsumme der Eingangsdaten</dt>
                <dd className="paar__wert">
                  <span className="pruefsumme" title={pruefsumme || undefined}>
                    {pruefsumme ? kurzePruefsumme(pruefsumme) : 'wird berechnet …'}
                  </span>
                </dd>
              </div>
            </dl>

            {pruefsumme && (
              <p className="notiz" style={{ marginBottom: 0 }}>
                Vollständige Prüfsumme (SHA-256):{' '}
                <span className="pruefsumme">{pruefsumme}</span>
                <br />
                Seed {angewandt.seed} und diese Einstellungen erzeugen dieselbe Runde erneut —
                und damit dieselbe Prüfsumme.
              </p>
            )}

            {vomStandardAbweichend && (
              <div className="notiz notiz--hinweis" role="status" style={{ marginBottom: 0 }}>
                <strong>Probeberechnung.</strong> Die Eingangsgrößen weichen von der
                Ausgangsrunde ab. Eine jetzt erzeugte Nachweismappe weist eine Probeberechnung
                aus, keine Festlegung.
                <ul>
                  {abweichungen.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="schalterreihe">
            <span className="feld__name" style={{ marginRight: '4px' }}>
              Spalten
            </span>
            <label className="schalter">
              <input
                type="checkbox"
                checked={zeigeVergleich}
                onChange={(e) => setZeigeVergleich(e.target.checked)}
              />
              Vergleichsverfahren (Gießkanne, Windhund, Jury, anteilig nach Euro)
            </label>
            <label className="schalter">
              <input
                type="checkbox"
                checked={zeigeKopplung}
                onChange={(e) => setZeigeKopplung(e.target.checked)}
              />
              Kopplungsabschlag (Zusatzverfahren)
            </label>
          </div>

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
            <p className="notiz notiz--hinweis">
              <strong>
                Nicht ausgeschöpft: {euro(verfahren.qf.nichtAusgeschoepftCent)}.
              </strong>{' '}
              Der Betrag konnte nicht verteilt werden, weil alle verbleibenden Vorhaben ihre
              Obergrenze erreicht haben. Das ist kein Rundungsfehler, sondern eine
              haushaltsrechtlich erhebliche Größe.
            </p>
          )}

          {werte.some((w) => w.beitragendeAnzahl <= 1) && (
            <p className="notiz">
              <strong>Vorhaben mit höchstens einer beitragenden Person erhalten null.</strong>{' '}
              Die Regel bemisst die Mitträgerschaft durch mehrere Personen; bei einer einzelnen
              Person sind Gesamtfinanzierungswert und Beitragssumme rechnerisch gleich groß. Das
              ist der von der Regel vorgesehene Fall und kein Rechenfehler.
            </p>
          )}

          {zeigeKopplung && kopplung && <Kopplungsgruppen kopplung={kopplung.kopplung} />}
        </section>

        <Kennzahlenblock daten={daten} verfahren={verfahren} />

        <section className="abschnitt" aria-labelledby="ueberschrift-nachweis">
          <div className="abschnitt__kopf">
            <span className="abschnitt__nummer">4</span>
            <h2 id="ueberschrift-nachweis">Nachweismappe</h2>
          </div>
          <p className="abschnitt__einleitung">
            Druckfähige Zusammenstellung: Rechenregel, Zuteilungstabelle, Begründungstext je
            Zuteilung, Vergleichsrechnung, Rechenprotokoll und die pseudonymisierten
            Eingangsdaten. Zusätzlich als JSON herunterladbar.
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
            {pruefsumme === '' && <span className="feld__hinweis">Prüfsumme wird berechnet …</span>}
          </div>
        </section>

        <footer className="fuss">
          <p>
            Bemessungsregel in der Fassung <strong>{daten.runde.formelVersion}</strong>. Die
            veröffentlichte Rechenregel steht in{' '}
            <a href="https://github.com/citizen-tech/QF-SPRIND-prototype/blob/main/FORMEL.md">
              FORMEL.md
            </a>
            , der Quelltext unter{' '}
            <a href="https://github.com/citizen-tech/QF-SPRIND-prototype">
              github.com/citizen-tech/QF-SPRIND-prototype
            </a>
            . Lizenz EUPL-1.2.
          </p>
          <p>
            Sämtliche Daten dieser Seite sind synthetisch erzeugt. Es besteht keine Verbindung
            zu tatsächlichen Vereinen, Vorhaben oder Personen.
          </p>
        </footer>
      </main>
    </>
  );
}
