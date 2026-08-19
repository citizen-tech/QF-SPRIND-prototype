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
        <span className="abschnitt__nummer">3</span>
        <h2 id="ueberschrift-kennzahlen">Kennzahlen je Verfahren</h2>
      </div>

      <p className="abschnitt__einleitung">
        Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe Topf,
        dieselben Höchstbeträge, fünf Verteilregeln. Die erste Zeile ist die aussagekräftigste:
        Sie zählt, wie viele Menschen am Ergebnis beteiligt sind.
      </p>

      <div className="tabellenrahmen">
        <table>
          <thead>
            <tr>
              <th scope="col">Kennzahl</th>
              {VERFAHREN_IDS.map((id) => (
                <th key={id} scope="col" className="zahl">
                  {VERFAHREN[id].bezeichnung}
                  {VERFAHREN[id].modelliert && (
                    <>
                      <br />
                      <span className="marke marke--modelliert">modelliert</span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((zeile) => (
              <tr key={zeile.name}>
                <th scope="row">
                  {zeile.name}
                  <span className="traeger">{zeile.erklaerung}</span>
                </th>
                {VERFAHREN_IDS.map((id) => (
                  <td
                    key={id}
                    className={zeile.hervorheben && id === 'qf' ? 'zahl zahl--akzent' : 'zahl'}
                  >
                    {zeile.wert(verfahren[id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="notiz notiz--hinweis">{MODELLIERUNGSHINWEIS}</p>

      <details>
        <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 560 }}>
          Die fünf Verteilregeln im Wortlaut
        </summary>
        <dl className="paare" style={{ padding: '14px' }}>
          {VERFAHREN_IDS.map((id) => (
            <div key={id}>
              <dt className="paar__begriff">{VERFAHREN[id].bezeichnung}</dt>
              <dd className="paar__wert" style={{ fontSize: '0.9rem' }}>
                {VERFAHREN[id].regel}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
