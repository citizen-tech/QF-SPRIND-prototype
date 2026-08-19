import { euro, prozent, zahl } from '../format';
import type { Vorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import type { Verfahrensergebnis } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  werte: readonly Vorhabenwerte[];
  qf: Verfahrensergebnis;
};

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

export default function Rechenprotokoll({ daten, werte, qf }: Eigenschaften) {
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const schritteNachId = new Map(qf.schritte.map((s) => [s.id, s]));
  const gesamtbemessungswert = werte.reduce((a, w) => a + w.rohEuro, 0);

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-protokoll">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-protokoll">Rechenprotokoll</h2>
        <p className="abschnitt__einleitung">
          Jede Zwischengröße ausgeschrieben. Dieser Abschnitt ist der Beweis der
          Nachrechenbarkeit: Mit den hier ausgewiesenen Zahlen lässt sich jede Zuteilung von
          Hand prüfen.
        </p>
      </div>

      <p className="notiz">
        Gesamtbemessungswert aller zugelassenen Vorhaben:{' '}
        <strong>{zahl(gesamtbemessungswert, 2)}</strong>. Fördertopf{' '}
        {euro(daten.runde.poolCent)}, verteilt in {qf.iterationen}{' '}
        {qf.iterationen === 1 ? 'Durchlauf' : 'Durchläufen'}.
      </p>

      {daten.vorhaben.map((vorhaben) => {
        const w = werteNachId.get(vorhaben.id)!;
        const schritt = schritteNachId.get(vorhaben.id)!;
        const anteil = gesamtbemessungswert > 0 ? w.rohEuro / gesamtbemessungswert : 0;

        return (
          <details key={vorhaben.id}>
            <summary>
              <span>
                {vorhaben.titel}
                <span className="traeger">{vorhaben.traeger}</span>
              </span>
              <span className="zahl zahl--akzent">{euro(schritt.endbetragCent)}</span>
            </summary>

            <div className="protokoll__inhalt">
              <dl className="rechenschritte">
                <dt>Beitragende Personen</dt>
                <dd>{w.beitragendeAnzahl}</dd>

                <dt>Einzelbeiträge</dt>
                <dd>{w.beitraegeAnzahl}</dd>

                <dt>Beitragssumme E</dt>
                <dd>{euro(w.eigenCent)}</dd>

                <dt>Summe der Wurzeln W</dt>
                <dd>{zahl(w.wurzelsumme, 6)}</dd>

                <dt>Gesamtfinanzierungswert Q = W²</dt>
                <dd>{zahl(w.quadrat, 6)}</dd>

                <dt>Bemessungswert R = max(0, Q − E)</dt>
                <dd>{zahl(w.rohEuro, 6)}</dd>

                <dt>Anteil am Gesamtbemessungswert</dt>
                <dd>{prozent(anteil, 3)}</dd>

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

              <h3>Beiträge ({w.beitragendeAnzahl} Personen)</h3>
              <p className="zahl--still" style={{ fontSize: '0.87rem', margin: '4px 0 8px' }}>
                Kennungen sind Pseudonyme. Mehrfachbeiträge derselben Person sind vor der
                Wurzelziehung addiert.
              </p>
              <div className="beitragsliste">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Kennung</th>
                      <th scope="col" className="zahl">
                        Beitrag
                      </th>
                      <th scope="col" className="zahl">
                        Wurzel
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.posten.map((posten) => (
                      <tr key={posten.beitragendeId}>
                        <th scope="row" style={{ fontWeight: 400 }}>
                          {posten.beitragendeId}
                        </th>
                        <td className="zahl">{euro(posten.betragCent)}</td>
                        <td className="zahl zahl--still">{zahl(posten.wurzel, 6)}</td>
                      </tr>
                    ))}
                    {w.posten.length === 0 && (
                      <tr>
                        <td colSpan={3} className="zahl--still">
                          Für dieses Vorhaben liegt kein Beitrag vor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Summe</th>
                      <td className="zahl">{euro(w.eigenCent)}</td>
                      <td className="zahl">{zahl(w.wurzelsumme, 6)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </details>
        );
      })}
    </section>
  );
}
