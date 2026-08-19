import { datum, euro, prozent, zahl } from '../format';
import type { Nachweismappe } from './mappe';

type Eigenschaften = {
  mappe: Nachweismappe;
  onSchliessen: () => void;
};

function zeitpunkt(iso: string): string {
  const d = new Date(iso);
  const zweistellig = (n: number) => String(n).padStart(2, '0');
  return (
    `${zweistellig(d.getDate())}.${zweistellig(d.getMonth() + 1)}.${d.getFullYear()}, ` +
    `${zweistellig(d.getHours())}:${zweistellig(d.getMinutes())} Uhr`
  );
}

export default function NachweismappeAnsicht({ mappe, onSchliessen }: Eigenschaften) {
  function herunterladen() {
    const blob = new Blob([JSON.stringify(mappe, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const verweis = document.createElement('a');
    verweis.href = url;
    verweis.download = `nachweismappe-${mappe.runde.id}-${mappe.formelVersion}.json`;
    document.body.appendChild(verweis);
    verweis.click();
    verweis.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="werkzeugleiste nicht-drucken">
        <div className="werkzeugleiste__inhalt">
          <button type="button" className="knopf" onClick={onSchliessen}>
            ← Zurück zur Berechnung
          </button>
          <span className="knopfreihe">
            <button type="button" className="knopf" onClick={herunterladen}>
              Als JSON herunterladen
            </button>
            <button type="button" className="knopf knopf--haupt" onClick={() => window.print()}>
              Drucken oder als PDF sichern
            </button>
          </span>
        </div>
      </div>

      <article className="mappe">
        <header className="mappe__kopf">
          <p className="mappe__warnung">Prototyp — synthetische Daten — kein Verwaltungsakt</p>
          <h1>Nachweis der Bemessung</h1>
          <p style={{ marginTop: '8px', maxWidth: '78ch' }}>{mappe.runde.zweck}</p>

          <dl className="paare" style={{ marginTop: '18px' }}>
            <div>
              <dt className="paar__begriff">Runde</dt>
              <dd className="paar__wert">{mappe.runde.id}</dd>
            </div>
            <div>
              <dt className="paar__begriff">Förderzeitraum</dt>
              <dd className="paar__wert">
                {datum(mappe.runde.zeitraum.von)} – {datum(mappe.runde.zeitraum.bis)}
              </dd>
            </div>
            <div>
              <dt className="paar__begriff">Erstellt am</dt>
              <dd className="paar__wert">{zeitpunkt(mappe.erzeugtAm)}</dd>
            </div>
            <div>
              <dt className="paar__begriff">Fassung der Bemessungsregel</dt>
              <dd className="paar__wert">{mappe.formelVersion}</dd>
            </div>
            <div>
              <dt className="paar__begriff">Fördertopf</dt>
              <dd className="paar__wert">{euro(mappe.summen.poolCent)}</dd>
            </div>
            <div>
              <dt className="paar__begriff">Höchstbetrag je Vorhaben</dt>
              <dd className="paar__wert">
                {mappe.runde.hoechstbetragJeVorhabenCent === null
                  ? 'nicht festgelegt'
                  : euro(mappe.runde.hoechstbetragJeVorhabenCent)}
              </dd>
            </div>
          </dl>

          <p style={{ margin: '16px 0 0' }}>
            <span className="paar__begriff" style={{ display: 'block' }}>
              Prüfsumme der Eingangsdaten (SHA-256)
            </span>
            <span className="pruefsumme">{mappe.pruefsummeEingangsdaten}</span>
          </p>

          <p className="notiz" style={{ marginBottom: 0 }}>
            {mappe.hinweis}
          </p>

          {mappe.istProbeberechnung && (
            <div className="notiz notiz--hinweis" style={{ marginBottom: 0 }}>
              <strong>Probeberechnung, keine Festlegung.</strong> Die Eingangsgrößen weichen
              von der veröffentlichten Runde ab:
              <ul>
                {mappe.abweichungen.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <section className="mappe__abschnitt">
          <h2>1. Bemessungsregel in Kurzfassung</h2>
          <ol style={{ maxWidth: '80ch' }}>
            {mappe.bemessungsregel.kurzfassung.map((satz) => (
              <li key={satz}>{satz}</li>
            ))}
          </ol>
          <p>
            Maßgeblich ist der vollständige Wortlaut in der Datei{' '}
            <strong>{mappe.bemessungsregel.verweis}</strong> in der Fassung{' '}
            {mappe.formelVersion}.
          </p>
        </section>

        <section className="mappe__abschnitt">
          <h2>2. Zuteilungstabelle</h2>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  <th scope="col" className="zahl">
                    Beitragende
                  </th>
                  <th scope="col" className="zahl">
                    Beitragssumme
                  </th>
                  <th scope="col" className="zahl">
                    Bemessungswert
                  </th>
                  <th scope="col" className="zahl">
                    Anteil
                  </th>
                  <th scope="col" className="zahl">
                    Zuteilung
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <tr key={zeile.vorhabenId}>
                    <th scope="row">
                      {zeile.titel}
                      <span className="traeger">{zeile.traeger}</span>
                    </th>
                    <td className="zahl">{zeile.beitragendeAnzahl}</td>
                    <td className="zahl">{euro(zeile.beitragssummeCent)}</td>
                    <td className="zahl">{zahl(zeile.bemessungswert, 2)}</td>
                    <td className="zahl">{prozent(zeile.anteilAmBemessungswert)}</td>
                    <td className="zahl zahl--akzent">{euro(zeile.zuteilungCent)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Summe</th>
                  <td className="zahl" />
                  <td className="zahl">
                    {euro(
                      mappe.zuteilungen.reduce((a, z) => a + z.beitragssummeCent, 0),
                    )}
                  </td>
                  <td className="zahl">{zahl(mappe.summen.gesamtbemessungswert, 2)}</td>
                  <td className="zahl" />
                  <td className="zahl">{euro(mappe.summen.zugeteiltCent)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p style={{ marginTop: '12px' }}>
            Fördertopf {euro(mappe.summen.poolCent)}, zugeteilt{' '}
            {euro(mappe.summen.zugeteiltCent)}, nicht ausgeschöpft{' '}
            <strong>{euro(mappe.summen.nichtAusgeschoepftCent)}</strong>. Die Verteilung
            erforderte {mappe.summen.iterationen}{' '}
            {mappe.summen.iterationen === 1 ? 'Durchlauf' : 'Durchläufe'}.
          </p>
        </section>

        <section className="mappe__abschnitt">
          <h2>3. Begründung je Zuteilung</h2>
          {mappe.zuteilungen.map((zeile) => (
            <div className="begruendung" key={zeile.vorhabenId}>
              <p className="begruendung__titel">
                {zeile.titel} — {euro(zeile.zuteilungCent)}
              </p>
              <p style={{ margin: 0 }}>{zeile.begruendung}</p>
            </div>
          ))}
        </section>

        <section className="mappe__abschnitt">
          <h2>4. Vergleichsrechnung</h2>
          <p style={{ maxWidth: '80ch' }}>
            Wirtschaftlichkeit ist ein Vergleichsbegriff. Dieselben Eingangsdaten, derselbe
            Topf, dieselben Höchstbeträge, fünf Verteilregeln.
          </p>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  {mappe.vergleichsrechnung.map((v) => (
                    <th key={v.verfahren} scope="col" className="zahl">
                      {v.bezeichnung}
                      {v.modelliert && <span className="traeger">modelliert</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <tr key={zeile.vorhabenId}>
                    <th scope="row">{zeile.titel}</th>
                    {mappe.vergleichsrechnung.map((v) => (
                      <td key={v.verfahren} className="zahl">
                        {euro(v.zuteilungCent[zeile.vorhabenId] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: '22px' }}>Kennzahlen</h3>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Verfahren</th>
                  <th scope="col" className="zahl">
                    Erreichte Beitragende
                  </th>
                  <th scope="col" className="zahl">
                    Geförderte Vorhaben
                  </th>
                  <th scope="col" className="zahl">
                    Median
                  </th>
                  <th scope="col" className="zahl">
                    Gini
                  </th>
                  <th scope="col" className="zahl">
                    Nicht ausgeschöpft
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappe.vergleichsrechnung.map((v) => (
                  <tr key={v.verfahren}>
                    <th scope="row">{v.bezeichnung}</th>
                    <td className="zahl">
                      {v.kennzahlen.beitragendeMitTreffer} von{' '}
                      {v.kennzahlen.beitragendeGesamt}
                    </td>
                    <td className="zahl">{v.kennzahlen.gefoerderteVorhaben}</td>
                    <td className="zahl">{euro(v.kennzahlen.medianZuteilungCent)}</td>
                    <td className="zahl">{zahl(v.kennzahlen.gini, 3)}</td>
                    <td className="zahl">{euro(v.kennzahlen.nichtAusgeschoepftCent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="notiz">{mappe.modellierungshinweis}</p>
        </section>

        <section className="mappe__abschnitt">
          <h2>5. Rechenprotokoll</h2>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  <th scope="col" className="zahl">
                    Beitragssumme E
                  </th>
                  <th scope="col" className="zahl">
                    Wurzelsumme W
                  </th>
                  <th scope="col" className="zahl">
                    Q = W²
                  </th>
                  <th scope="col" className="zahl">
                    R = Q − E
                  </th>
                  <th scope="col" className="zahl">
                    Obergrenze
                  </th>
                  <th scope="col" className="zahl">
                    Vor Kürzung
                  </th>
                  <th scope="col" className="zahl">
                    Zuteilung
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappe.zuteilungen.map((zeile) => (
                  <tr key={zeile.vorhabenId}>
                    <th scope="row">{zeile.titel}</th>
                    <td className="zahl">{euro(zeile.beitragssummeCent)}</td>
                    <td className="zahl">{zahl(zeile.wurzelsumme, 6)}</td>
                    <td className="zahl">{zahl(zeile.quadrat, 4)}</td>
                    <td className="zahl">{zahl(zeile.bemessungswert, 4)}</td>
                    <td className="zahl">{euro(zeile.deckelCent)}</td>
                    <td className="zahl">{euro(Math.round(zeile.vorlaeufigCent))}</td>
                    <td className="zahl zahl--akzent">{euro(zeile.zuteilungCent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mappe__abschnitt">
          <h2>6. Eingangsdaten (pseudonymisiert)</h2>
          <h3>Vorhaben</h3>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Kennung</th>
                  <th scope="col">Titel</th>
                  <th scope="col">Träger</th>
                  <th scope="col" className="zahl">
                    Kostenplan
                  </th>
                  <th scope="col">Antragseingang</th>
                  <th scope="col" className="zahl">
                    Jurypunkte
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappe.eingangsdatenPseudonymisiert.vorhaben.map((v) => (
                  <tr key={v.id}>
                    <th scope="row" style={{ fontWeight: 400 }}>
                      {v.id}
                    </th>
                    <td>{v.titel}</td>
                    <td>{v.traeger}</td>
                    <td className="zahl">{euro(v.beantragtCent)}</td>
                    <td>{datum(v.eingangZeitpunkt)}</td>
                    <td className="zahl">{v.jurypunkte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: '22px' }}>
            Beiträge ({mappe.eingangsdatenPseudonymisiert.beitraege.length})
          </h3>
          <div className="tabellenrahmen">
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  <th scope="col">Kennung</th>
                  <th scope="col" className="zahl">
                    Betrag
                  </th>
                  <th scope="col">Zeitpunkt</th>
                  <th scope="col">Region</th>
                  <th scope="col">Altersgruppe</th>
                </tr>
              </thead>
              <tbody>
                {mappe.eingangsdatenPseudonymisiert.beitraege.map((b, index) => (
                  <tr key={`${b.vorhabenId}-${b.beitragendeId}-${index}`}>
                    <td>{b.vorhabenId}</td>
                    <td>{b.beitragendeId}</td>
                    <td className="zahl">{euro(b.betragCent)}</td>
                    <td>{datum(b.zeitpunkt)}</td>
                    <td>{b.merkmal.region}</td>
                    <td>{b.merkmal.altersgruppe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mappe__abschnitt">
          <h2>7. Reproduzierbarkeit</h2>
          <dl className="paare">
            <div>
              <dt className="paar__begriff">Fassung der Bemessungsregel</dt>
              <dd className="paar__wert">{mappe.reproduzierbarkeit.formelVersion}</dd>
            </div>
            <div>
              <dt className="paar__begriff">Prüfsumme der Eingangsdaten</dt>
              <dd className="paar__wert pruefsumme" style={{ fontSize: '0.85rem' }}>
                {mappe.reproduzierbarkeit.pruefsummeEingangsdaten}
              </dd>
            </div>
          </dl>
          <h3 style={{ marginTop: '18px' }}>So wird nachgerechnet</h3>
          <ol style={{ maxWidth: '80ch' }}>
            {mappe.reproduzierbarkeit.anleitung.map((satz) => (
              <li key={satz}>{satz}</li>
            ))}
          </ol>
          <p className="notiz">{mappe.hinweis}</p>
        </section>
      </article>
    </>
  );
}
