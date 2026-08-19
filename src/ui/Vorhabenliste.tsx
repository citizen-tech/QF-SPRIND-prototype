import { euro, zahl } from '../format';
import type { Hebelanzeige } from '../kern/hebel';
import { PROBEBEITRAG_CENT } from '../kern/hebel';
import type { Vorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import type { Verfahrensergebnis } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  werte: readonly Vorhabenwerte[];
  qf: Verfahrensergebnis;
  hebel: Hebelanzeige;
};

function deckelText(werte: Vorhabenwerte): string {
  switch (werte.deckelGrund) {
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

export default function Vorhabenliste({ daten, werte, qf, hebel }: Eigenschaften) {
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const schritteNachId = new Map(qf.schritte.map((s) => [s.id, s]));
  const groessteZuteilung = Math.max(1, ...qf.schritte.map((s) => s.endbetragCent));
  const bezug = hebel.bezugVorhabenId
    ? daten.vorhaben.find((v) => v.id === hebel.bezugVorhabenId)
    : undefined;

  const summeBeitraege = werte.reduce((a, w) => a + w.eigenCent, 0);
  const summeZuteilung = qf.schritte.reduce((a, s) => a + s.endbetragCent, 0);

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-vorhaben">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-vorhaben">Vorhaben und Zuteilung</h2>
        <p className="abschnitt__einleitung">
          Die Bemessung folgt der Zahl der mittragenden Personen, nicht der Höhe der
          eingesammelten Beträge. Beide Spalten stehen nebeneinander, damit der Unterschied
          sichtbar bleibt.
        </p>
      </div>

      <div className="tabellenrahmen">
        <table>
          <caption>
            Zuteilung nach der Bemessungsregel {daten.runde.formelVersion}. Fördertopf{' '}
            {euro(daten.runde.poolCent)}, verteilt in {qf.iterationen}{' '}
            {qf.iterationen === 1 ? 'Durchlauf' : 'Durchläufen'}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Vorhaben</th>
              <th scope="col" className="zahl">
                Beantragt
              </th>
              <th scope="col" className="zahl">
                Beitragende
              </th>
              <th scope="col" className="zahl">
                Beitragssumme
              </th>
              <th scope="col" className="zahl">
                Zuteilung
              </th>
              <th scope="col">
                <span className="nur-vorlesen">Anteil als Balken</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {daten.vorhaben.map((vorhaben) => {
              const w = werteNachId.get(vorhaben.id)!;
              const schritt = schritteNachId.get(vorhaben.id)!;
              const anteil = (schritt.endbetragCent / groessteZuteilung) * 100;
              return (
                <tr key={vorhaben.id}>
                  <th scope="row">
                    {vorhaben.titel}
                    <span className="traeger">{vorhaben.traeger}</span>
                    {schritt.gedeckelt && (
                      <span className="marke marke--deckel" style={{ marginTop: '4px' }}>
                        {deckelText(w)}
                      </span>
                    )}
                  </th>
                  <td className="zahl zahl--still">{euro(vorhaben.beantragtCent)}</td>
                  <td className="zahl">{w.beitragendeAnzahl}</td>
                  <td className="zahl zahl--still">{euro(w.eigenCent)}</td>
                  <td className="zahl zahl--akzent">{euro(schritt.endbetragCent)}</td>
                  <td>
                    <span
                      className="balken"
                      role="img"
                      aria-label={`Zuteilung ${euro(schritt.endbetragCent)}`}
                    >
                      <span className="balken__fuellung" style={{ width: `${anteil}%` }} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Summe</th>
              <td className="zahl" />
              <td className="zahl">{qf.kennzahlen.beitragendeGesamt} Personen</td>
              <td className="zahl">{euro(summeBeitraege)}</td>
              <td className="zahl">{euro(summeZuteilung)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {qf.nichtAusgeschoepftCent > 0 && (
        <p className="notiz notiz--hinweis">
          <strong>Nicht ausgeschöpft: {euro(qf.nichtAusgeschoepftCent)}.</strong> Der Betrag
          konnte nicht verteilt werden, weil alle verbleibenden Vorhaben ihren Höchstbetrag
          erreicht haben. Das ist kein Rundungsfehler, sondern eine haushaltsrechtlich
          erhebliche Größe.
        </p>
      )}

      <h3 style={{ marginTop: '32px' }}>Wirkung eines weiteren Beitrags</h3>
      {bezug ? (
        <>
          <p className="abschnitt__einleitung" style={{ marginTop: '6px' }}>
            Wie stark wirkt ein zusätzlicher Beitrag von {euro(PROBEBEITRAG_CENT)} — gemessen
            im Verhältnis zum Vorhaben „{bezug.titel}“, dem meistgetragenen Vorhaben, dessen
            Zuteilung nicht an einer Obergrenze steht.
          </p>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  <th scope="col" className="zahl">
                    Beitragende
                  </th>
                  <th scope="col">Wirkung</th>
                </tr>
              </thead>
              <tbody>
                {daten.vorhaben.map((vorhaben) => {
                  const w = werteNachId.get(vorhaben.id)!;
                  const eintrag = hebel.werte.get(vorhaben.id)!;
                  const gedeckelt = schritteNachId.get(vorhaben.id)!.gedeckelt;
                  return (
                    <tr key={vorhaben.id}>
                      <th scope="row">{vorhaben.titel}</th>
                      <td className="zahl">{w.beitragendeAnzahl}</td>
                      <td>
                        {gedeckelt || eintrag.zuwachsCent <= 0 ? (
                          <span className="zahl--still">
                            Obergrenze erreicht — ein weiterer Beitrag erhöht die Zuteilung in
                            dieser Runde nicht.
                          </span>
                        ) : eintrag.verhaeltnis === null ? (
                          <span className="zahl--still">nicht bestimmbar</span>
                        ) : (
                          <>
                            zählt hier{' '}
                            <strong>{zahl(eintrag.verhaeltnis, 1)}-mal so stark</strong> wie
                            bei „{bezug.titel}“
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="notiz">
            Bewusst ohne Euro-Angabe: Bei gedeckeltem Topf hängt die Wirkung eines Beitrags
            von allen übrigen Beiträgen der Runde ab. Eine ausgewiesene Eurozahl wäre im
            Regelfall zu hoch und am Rundenende falsch. Das Verhältnis bleibt auch bei
            späteren Verschiebungen aussagekräftig.
          </p>
        </>
      ) : (
        <p className="notiz">
          Kein Bezugsvorhaben bestimmbar: Alle Vorhaben mit Zuteilung stehen an einer
          Obergrenze. Ein zusätzlicher Beitrag verändert die Zuteilung in dieser Runde nicht.
        </p>
      )}

      {werte.some((w) => w.beitragendeAnzahl <= 1) && (
        <p className="notiz">
          <strong>Vorhaben mit höchstens einer beitragenden Person erhalten null.</strong> Die
          Regel bemisst die Mitträgerschaft durch mehrere Personen; bei einer einzelnen Person
          sind Gesamtfinanzierungswert und Beitragssumme rechnerisch gleich groß. Das ist der
          von der Regel vorgesehene Fall und kein Rechenfehler.
        </p>
      )}
    </section>
  );
}
