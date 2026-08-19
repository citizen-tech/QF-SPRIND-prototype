import { useState } from 'react';
import { euro, prozent, zahl } from '../format';
import type { Hebelanzeige } from '../kern/hebel';
import { PROBEBEITRAG_CENT } from '../kern/hebel';
import type { Kopplungsverfahren } from '../kern/paarweise';
import type { Vorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import type { VerfahrenId, Verfahrensergebnis } from '../kern/vergleich';
import { VERFAHREN } from '../kern/vergleich';

type Eigenschaften = {
  daten: Rundendaten;
  werte: readonly Vorhabenwerte[];
  verfahren: Record<VerfahrenId, Verfahrensergebnis>;
  hebel: Hebelanzeige;
  kopplung: Kopplungsverfahren | null;
  zeigeVergleich: boolean;
  zeigeKopplung: boolean;
};

const VERGLEICHSSPALTEN: VerfahrenId[] = ['giesskanne', 'windhund', 'jury', 'anteilig'];

function deckelText(w: Vorhabenwerte): string {
  switch (w.deckelGrund) {
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

export default function Ergebnistabelle({
  daten,
  werte,
  verfahren,
  hebel,
  kopplung,
  zeigeVergleich,
  zeigeKopplung,
}: Eigenschaften) {
  const [offen, setOffen] = useState<ReadonlySet<string>>(new Set());

  const qf = verfahren.qf;
  const werteNachId = new Map(werte.map((w) => [w.vorhabenId, w]));
  const schritteNachId = new Map(qf.schritte.map((s) => [s.id, s]));
  const groessteZuteilung = Math.max(1, ...qf.schritte.map((s) => s.endbetragCent));
  const gesamtbemessungswert = werte.reduce((a, w) => a + w.rohEuro, 0);
  const bezug = hebel.bezugVorhabenId
    ? daten.vorhaben.find((v) => v.id === hebel.bezugVorhabenId)
    : undefined;

  const spaltenzahl =
    5 + (zeigeVergleich ? VERGLEICHSSPALTEN.length : 0) + (zeigeKopplung && kopplung ? 1 : 0);

  function umschalten(id: string) {
    setOffen((bisher) => {
      const naechster = new Set(bisher);
      if (naechster.has(id)) naechster.delete(id);
      else naechster.add(id);
      return naechster;
    });
  }

  const alleOffen = offen.size === daten.vorhaben.length;

  return (
    <>
      <div className="knopfreihe" style={{ marginBottom: '10px' }}>
        <button
          type="button"
          className="knopf knopf--klein"
          onClick={() =>
            setOffen(alleOffen ? new Set() : new Set(daten.vorhaben.map((v) => v.id)))
          }
        >
          {alleOffen ? 'Alle Zeilen einklappen' : 'Alle Zeilen aufklappen'}
        </button>
        <span className="feld__hinweis">
          Aufgeklappt zeigt jede Zeile ihr vollständiges Rechenprotokoll und die
          pseudonymisierte Beitragsliste.
        </span>
      </div>

      <div className="tabellenrahmen">
        <table>
          <caption>
            Zuteilung nach der Bemessungsregel {daten.runde.formelVersion}. Fördertopf{' '}
            {euro(daten.runde.poolCent)}, verteilt in {qf.iterationen}{' '}
            {qf.iterationen === 1 ? 'Durchlauf' : 'Durchläufen'}. Gesamtbemessungswert{' '}
            {zahl(gesamtbemessungswert, 2)}.
          </caption>
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
                Quadratic Funding
              </th>
              <th scope="col">
                <span className="nur-vorlesen">Anteil als Balken</span>
              </th>
              {zeigeVergleich &&
                VERGLEICHSSPALTEN.map((id) => (
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
              {zeigeKopplung && kopplung && (
                <th scope="col" className="zahl">
                  Mit Kopplungsabschlag
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {daten.vorhaben.map((vorhaben) => {
              const w = werteNachId.get(vorhaben.id)!;
              const schritt = schritteNachId.get(vorhaben.id)!;
              const istOffen = offen.has(vorhaben.id);
              const anteil = (schritt.endbetragCent / groessteZuteilung) * 100;
              const hebelwert = hebel.werte.get(vorhaben.id)!;
              const anteilBemessung =
                gesamtbemessungswert > 0 ? w.rohEuro / gesamtbemessungswert : 0;

              return [
                <tr key={vorhaben.id} className={istOffen ? 'zeile--offen' : undefined}>
                  <th scope="row">
                    <button
                      type="button"
                      className="aufklapp"
                      aria-expanded={istOffen}
                      aria-controls={`detail-${vorhaben.id}`}
                      onClick={() => umschalten(vorhaben.id)}
                    >
                      <span className="aufklapp__pfeil" aria-hidden="true">
                        ▶
                      </span>
                      <span>
                        {vorhaben.titel}
                        <span className="traeger">{vorhaben.traeger}</span>
                        {schritt.gedeckelt && (
                          <span className="marke marke--deckel">{deckelText(w)}</span>
                        )}
                      </span>
                    </button>
                  </th>
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
                  {zeigeVergleich &&
                    VERGLEICHSSPALTEN.map((id) => {
                      const betrag = verfahren[id].zuteilungCent.get(vorhaben.id) ?? 0;
                      return (
                        <td key={id} className={betrag === 0 ? 'zahl zahl--null' : 'zahl zahl--still'}>
                          {euro(betrag)}
                        </td>
                      );
                    })}
                  {zeigeKopplung && kopplung && (
                    <td className="zahl zahl--still">
                      {euro(kopplung.zuteilungCent.get(vorhaben.id) ?? 0)}
                    </td>
                  )}
                </tr>,

                istOffen && (
                  <tr key={`${vorhaben.id}-detail`} className="detailzeile">
                    <td colSpan={spaltenzahl} id={`detail-${vorhaben.id}`}>
                      <div className="detail">
                        <div>
                          <h4>Rechenprotokoll</h4>
                          <dl className="rechenschritte" style={{ marginTop: '8px' }}>
                            <dt>Beitragende Personen</dt>
                            <dd>{w.beitragendeAnzahl}</dd>

                            <dt>Einzelbeiträge</dt>
                            <dd>{w.beitraegeAnzahl}</dd>

                            <dt>Beitragssumme E</dt>
                            <dd>{euro(w.eigenCent)}</dd>

                            <dt>Summe der Wurzeln W</dt>
                            <dd>{zahl(w.wurzelsumme, 6)}</dd>

                            <dt>Q = W²</dt>
                            <dd>{zahl(w.quadrat, 6)}</dd>

                            <dt>Bemessungswert R = max(0, Q − E)</dt>
                            <dd>{zahl(w.rohEuro, 6)}</dd>

                            <dt>Anteil am Gesamtbemessungswert</dt>
                            <dd>{prozent(anteilBemessung, 3)}</dd>

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

                          <h4 style={{ marginTop: '18px' }}>
                            Wirkung eines weiteren Beitrags von {euro(PROBEBEITRAG_CENT)}
                          </h4>
                          <p style={{ fontSize: '0.88rem', margin: '6px 0 0' }}>
                            {schritt.gedeckelt || hebelwert.zuwachsCent <= 0 ? (
                              <span className="zahl--still">
                                Obergrenze erreicht — ein weiterer Beitrag erhöht die Zuteilung
                                in dieser Runde nicht.
                              </span>
                            ) : hebelwert.verhaeltnis === null || !bezug ? (
                              <span className="zahl--still">nicht bestimmbar</span>
                            ) : (
                              <>
                                zählt hier{' '}
                                <strong>{zahl(hebelwert.verhaeltnis, 1)}-mal so stark</strong>{' '}
                                wie bei „{bezug.titel}“. Bewusst ohne Euro-Angabe: Bei
                                gedeckeltem Topf hinge eine Eurozahl von allen übrigen
                                Beiträgen der Runde ab und wäre am Rundenende falsch.
                              </>
                            )}
                          </p>
                        </div>

                        <div>
                          <h4>
                            Beiträge ({w.beitragendeAnzahl}{' '}
                            {w.beitragendeAnzahl === 1 ? 'Person' : 'Personen'})
                          </h4>
                          <p
                            className="feld__hinweis"
                            style={{ margin: '4px 0 8px', maxWidth: '52ch' }}
                          >
                            Kennungen sind Pseudonyme. Mehrfachbeiträge derselben Person sind
                            vor der Wurzelziehung addiert.
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
                                    <td>{posten.beitragendeId}</td>
                                    <td className="zahl">{euro(posten.betragCent)}</td>
                                    <td className="zahl zahl--still">
                                      {zahl(posten.wurzel, 6)}
                                    </td>
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
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Summe</th>
              <td className="zahl">{qf.kennzahlen.beitragendeGesamt}</td>
              <td className="zahl">{euro(werte.reduce((a, w) => a + w.eigenCent, 0))}</td>
              <td className="zahl">
                {euro([...qf.zuteilungCent.values()].reduce((a, b) => a + b, 0))}
              </td>
              <td />
              {zeigeVergleich &&
                VERGLEICHSSPALTEN.map((id) => (
                  <td key={id} className="zahl">
                    {euro([...verfahren[id].zuteilungCent.values()].reduce((a, b) => a + b, 0))}
                  </td>
                ))}
              {zeigeKopplung && kopplung && (
                <td className="zahl">
                  {euro([...kopplung.zuteilungCent.values()].reduce((a, b) => a + b, 0))}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
