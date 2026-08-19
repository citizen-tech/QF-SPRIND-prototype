import { datum, euro, kurzePruefsumme } from '../format';
import type { Rundendaten } from '../kern/typen';

type Eigenschaften = {
  daten: Rundendaten;
  pruefsumme: string;
  istProbeberechnung: boolean;
  abweichungen: string[];
};

export default function Rundenkopf({
  daten,
  pruefsumme,
  istProbeberechnung,
  abweichungen,
}: Eigenschaften) {
  const { runde } = daten;

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-runde">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-runde">Förderrunde</h2>
      </div>

      <div className="tafel">
        <p style={{ maxWidth: '78ch' }}>{runde.zweck}</p>

        <dl className="paare">
          <div>
            <dt className="paar__begriff">Förderzeitraum</dt>
            <dd className="paar__wert">
              {datum(runde.zeitraum.von)} – {datum(runde.zeitraum.bis)}
            </dd>
          </div>
          <div>
            <dt className="paar__begriff">Fördertopf</dt>
            <dd className="paar__wert paar__wert--gross paar__wert--akzent">
              {euro(runde.poolCent)}
            </dd>
          </div>
          <div>
            <dt className="paar__begriff">Höchstbetrag je Vorhaben</dt>
            <dd className="paar__wert">
              {runde.hoechstbetragJeVorhabenCent === null
                ? 'nicht festgelegt'
                : euro(runde.hoechstbetragJeVorhabenCent)}
            </dd>
          </div>
          <div>
            <dt className="paar__begriff">Zugelassene Vorhaben</dt>
            <dd className="paar__wert">{daten.vorhaben.length}</dd>
          </div>
          <div>
            <dt className="paar__begriff">Fassung der Bemessungsregel</dt>
            <dd className="paar__wert">{runde.formelVersion}</dd>
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
          <p className="notiz">
            <span className="paar__begriff" style={{ display: 'block' }}>
              Prüfsumme vollständig (SHA-256)
            </span>
            <span className="pruefsumme">{pruefsumme}</span>
          </p>
        )}

        {istProbeberechnung && (
          <div className="notiz notiz--hinweis" role="status">
            <strong>Probeberechnung.</strong> Die Eingangsgrößen weichen von der
            veröffentlichten Runde ab. Eine jetzt erzeugte Nachweismappe weist eine
            Probeberechnung aus, keine Festlegung.
            <ul>
              {abweichungen.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        )}

        <h3 style={{ marginTop: '22px' }}>Zulassungskriterien</h3>
        <ul style={{ maxWidth: '78ch', margin: '8px 0 0', paddingLeft: '1.2em' }}>
          {runde.zulassungskriterien.map((kriterium) => (
            <li key={kriterium}>{kriterium}</li>
          ))}
        </ul>

        <p style={{ marginTop: '18px', marginBottom: 0 }}>
          <a href="https://github.com/citizen-tech/QF-SPRIND-prototype/blob/main/FORMEL.md">
            Veröffentlichte Bemessungsregel ansehen (FORMEL.md)
          </a>
        </p>
      </div>
    </section>
  );
}
