import { euro, prozent, zahl } from '../format';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { MODELLIERUNGSHINWEIS, VERFAHREN, VERFAHREN_IDS } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  verfahren: Record<VerfahrenId, Verfahrensergebnis>;
};

export default function Vergleichsansicht({ daten, verfahren }: Eigenschaften) {
  const kennzahlzeilen: {
    name: string;
    erklaerung: string;
    wert: (e: Verfahrensergebnis) => string;
    hervorheben?: boolean;
  }[] = [
    {
      name: 'Erreichte Beitragende',
      erklaerung:
        'Personen, von denen mindestens ein unterstütztes Vorhaben eine Zuteilung erhält.',
      wert: (e) =>
        `${e.kennzahlen.beitragendeMitTreffer} von ${e.kennzahlen.beitragendeGesamt}`,
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
      erklaerung:
        'Anteil der eingesammelten Beitragseuro, der auf Vorhaben mit Zuteilung entfällt.',
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
    <section className="abschnitt" aria-labelledby="ueberschrift-vergleich">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-vergleich">Vergleichsrechnung</h2>
        <p className="abschnitt__einleitung">
          Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe
          Topf, dieselben Höchstbeträge — fünf Verteilregeln.
        </p>
      </div>

      <div className="tabellenrahmen">
        <table>
          <caption>Zuteilung je Vorhaben und Verfahren, in Euro.</caption>
          <thead>
            <tr>
              <th scope="col">Vorhaben</th>
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
            {daten.vorhaben.map((vorhaben) => (
              <tr key={vorhaben.id}>
                <th scope="row">
                  {vorhaben.titel}
                  <span className="traeger">{vorhaben.traeger}</span>
                </th>
                {VERFAHREN_IDS.map((id) => {
                  const betrag = verfahren[id].zuteilungCent.get(vorhaben.id) ?? 0;
                  return (
                    <td
                      key={id}
                      className={
                        id === 'qf'
                          ? 'zahl zahl--akzent'
                          : betrag === 0
                            ? 'zahl zahl--null'
                            : 'zahl zahl--still'
                      }
                    >
                      {euro(betrag)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Summe</th>
              {VERFAHREN_IDS.map((id) => (
                <td key={id} className="zahl">
                  {euro(
                    [...verfahren[id].zuteilungCent.values()].reduce((a, b) => a + b, 0),
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="notiz notiz--hinweis">{MODELLIERUNGSHINWEIS}</p>

      <h3 style={{ marginTop: '30px' }}>Kennzahlen je Verfahren</h3>
      <div className="tabellenrahmen" style={{ marginTop: '10px' }}>
        <table>
          <thead>
            <tr>
              <th scope="col">Kennzahl</th>
              {VERFAHREN_IDS.map((id) => (
                <th key={id} scope="col" className="zahl">
                  {VERFAHREN[id].bezeichnung}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kennzahlzeilen.map((zeile) => (
              <tr key={zeile.name}>
                <th scope="row">
                  {zeile.name}
                  <span className="traeger">{zeile.erklaerung}</span>
                </th>
                {VERFAHREN_IDS.map((id) => (
                  <td
                    key={id}
                    className={
                      zeile.hervorheben && id === 'qf' ? 'zahl zahl--akzent' : 'zahl'
                    }
                  >
                    {zeile.wert(verfahren[id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: '30px' }}>Die Regeln im Wortlaut</h3>
      <dl className="paare" style={{ marginTop: '12px' }}>
        {VERFAHREN_IDS.map((id) => (
          <div key={id}>
            <dt className="paar__begriff">{VERFAHREN[id].bezeichnung}</dt>
            <dd className="paar__wert" style={{ fontSize: '0.92rem' }}>
              {VERFAHREN[id].regel}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
