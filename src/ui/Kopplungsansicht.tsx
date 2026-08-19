import { euro, prozent, zahl } from '../format';
import type { Kopplungsverfahren } from '../kern/paarweise';
import type { Rundendaten } from '../kern/typen';
import type { Verfahrensergebnis } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  qf: Verfahrensergebnis;
  kopplung: Kopplungsverfahren | null;
  offen: boolean;
  onUmschalten: () => void;
};

export default function Kopplungsansicht({
  daten,
  qf,
  kopplung,
  offen,
  onUmschalten,
}: Eigenschaften) {
  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-kopplung">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-kopplung">Kopplungsabschlag (Zusatzverfahren)</h2>
        <p className="abschnitt__einleitung">
          Ein nachrangiges Zusatzverfahren, das Beitragspaare abwertet, die über mehrere
          Vorhaben hinweg gemeinsam auftreten. Es ist <strong>nicht</strong> Bestandteil der
          Bemessungsregel {daten.runde.formelVersion} und wirkt sich nicht auf die
          Nachweismappe aus.
        </p>
      </div>

      <div className="knopfreihe">
        <button
          type="button"
          className="knopf"
          onClick={onUmschalten}
          aria-expanded={offen}
          aria-controls="kopplung-inhalt"
        >
          {offen ? 'Standard anzeigen' : 'Mit Kopplungsabschlag rechnen'}
        </button>
      </div>

      <div id="kopplung-inhalt" hidden={!offen}>
        {kopplung && (
          <>
            <p className="notiz notiz--hinweis" style={{ marginTop: '18px' }}>
              <strong>Vereinfachtes Verfahren.</strong> Paarweise Beschränkung mit
              Kopplungsparameter M = {kopplung.kopplung.parameterM}, <em>nicht</em> das
              vollständige Connection-Oriented Cluster Match. Quelle: Vitalik Buterin,
              „Pairwise coordination subsidies: a new quadratic funding design“,
              ethresear.ch, 2019 — <em>nicht</em> aus Buterin/Hitzig/Weyl, wo das Verfahren
              nicht vorkommt. Der Parameter M ist gewählt, nicht aus den Daten abgeleitet.
            </p>

            <div className="tabellenrahmen">
              <table>
                <caption>
                  Zuteilung nach Standardregel und mit Kopplungsabschlag, in Euro.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Vorhaben</th>
                    <th scope="col" className="zahl">
                      Standard
                    </th>
                    <th scope="col" className="zahl">
                      Mit Abschlag
                    </th>
                    <th scope="col" className="zahl">
                      Unterschied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daten.vorhaben.map((vorhaben) => {
                    const standard = qf.zuteilungCent.get(vorhaben.id) ?? 0;
                    const mit = kopplung.zuteilungCent.get(vorhaben.id) ?? 0;
                    const unterschied = mit - standard;
                    return (
                      <tr key={vorhaben.id}>
                        <th scope="row">
                          {vorhaben.titel}
                          <span className="traeger">{vorhaben.traeger}</span>
                        </th>
                        <td className="zahl zahl--akzent">{euro(standard)}</td>
                        <td className="zahl">{euro(mit)}</td>
                        <td className="zahl zahl--still">
                          {unterschied === 0
                            ? '±0,00 €'
                            : `${unterschied > 0 ? '+' : ''}${euro(unterschied)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: '28px' }}>Abschlag nach Merkmalskombination</h3>
            <p className="abschnitt__einleitung" style={{ marginTop: '6px' }}>
              Ausgewertet werden nur Beitragspaare, deren beide Personen dieselbe Region und
              dieselbe Altersgruppe angegeben haben. Ausgewiesen wird ausschließlich die
              Gruppenzugehörigkeit, nie eine einzelne Person.
            </p>

            <div className="tabellenrahmen">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Region</th>
                    <th scope="col">Altersgruppe</th>
                    <th scope="col" className="zahl">
                      Personen
                    </th>
                    <th scope="col" className="zahl">
                      Paarwert ohne Abschlag
                    </th>
                    <th scope="col" className="zahl">
                      Paarwert mit Abschlag
                    </th>
                    <th scope="col" className="zahl">
                      Abschlag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kopplung.kopplung.merkmalsgruppen.map((gruppe) => (
                    <tr key={`${gruppe.region}|${gruppe.altersgruppe}`}>
                      <th scope="row">{gruppe.region}</th>
                      <td>{gruppe.altersgruppe}</td>
                      <td className="zahl">{gruppe.beitragendeAnzahl}</td>
                      <td className="zahl zahl--still">
                        {zahl(gruppe.paarwertUngedaempft, 1)}
                      </td>
                      <td className="zahl zahl--still">{zahl(gruppe.paarwertGedaempft, 1)}</td>
                      <td className="zahl zahl--akzent">{prozent(gruppe.abschlag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="notiz">
              Ein hoher Abschlag ist <strong>kein Nachweis einer Absprache</strong>. Er zeigt
              an, dass Beitragende dieser Merkmalskombination auffällig häufig dieselben
              Vorhaben gemeinsam getragen haben. Das kann eine Absprache sein — oder eine
              Nachbarschaft, ein Verein, ein Betrieb. Das Verfahren wertet zudem große
              Einzelbeiträge stärker ab als kleine, weil die Kopplungsgröße mit der
              Beitragshöhe wächst. Als Anhaltspunkt für eine Prüfung geeignet, als Grundlage
              einer Entscheidung nicht.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
