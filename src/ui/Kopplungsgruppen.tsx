import { prozent, zahl } from '../format';
import type { Kopplungsergebnis } from '../kern/paarweise';

export default function Kopplungsgruppen({ kopplung }: { kopplung: Kopplungsergebnis }) {
  return (
    <details style={{ marginTop: '14px' }}>
      <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 560 }}>
        Kopplungsabschlag nach Merkmalskombination ({kopplung.merkmalsgruppen.length} Gruppen)
      </summary>

      <div style={{ padding: '0 14px 14px' }}>
        <p className="notiz notiz--hinweis">
          <strong>Vereinfachtes Zusatzverfahren, nicht Bestandteil der Bemessungsregel.</strong>{' '}
          Paarweise Beschränkung mit Kopplungsparameter M = {kopplung.parameterM},{' '}
          <em>nicht</em> das vollständige Connection-Oriented Cluster Match. Quelle: Vitalik
          Buterin, „Pairwise coordination subsidies“, ethresear.ch 2019 — <em>nicht</em> aus
          Buterin/Hitzig/Weyl, wo das Verfahren nicht vorkommt. M ist gewählt, nicht aus den
          Daten abgeleitet.
        </p>

        <div className="tabellenrahmen">
          <table>
            <caption>
              Ausgewertet werden nur Beitragspaare, deren beide Personen dieselbe Region und
              Altersgruppe angegeben haben. Ausgewiesen wird ausschließlich die
              Gruppenzugehörigkeit, nie eine einzelne Person.
            </caption>
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
                  mit Abschlag
                </th>
                <th scope="col" className="zahl">
                  Abschlag
                </th>
              </tr>
            </thead>
            <tbody>
              {kopplung.merkmalsgruppen.map((gruppe) => (
                <tr key={`${gruppe.region}|${gruppe.altersgruppe}`}>
                  <th scope="row">{gruppe.region}</th>
                  <td>{gruppe.altersgruppe}</td>
                  <td className="zahl">{gruppe.beitragendeAnzahl}</td>
                  <td className="zahl zahl--still">{zahl(gruppe.paarwertUngedaempft, 1)}</td>
                  <td className="zahl zahl--still">{zahl(gruppe.paarwertGedaempft, 1)}</td>
                  <td className="zahl zahl--akzent">{prozent(gruppe.abschlag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="notiz">
          Ein hoher Abschlag ist <strong>kein Nachweis einer Absprache</strong>. Er zeigt an,
          dass Beitragende dieser Merkmalskombination auffällig häufig dieselben Vorhaben
          gemeinsam getragen haben. Das kann eine Absprache sein — oder eine Nachbarschaft, ein
          Verein, ein Betrieb. Das Verfahren wertet zudem große Einzelbeiträge stärker ab als
          kleine, weil die Kopplungsgröße mit der Beitragshöhe wächst. Als Anhaltspunkt für eine
          Prüfung geeignet, als Grundlage einer Entscheidung nicht.
        </p>
      </div>
    </details>
  );
}
