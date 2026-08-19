import { useId, useState } from 'react';
import { euro } from '../format';
import type { Beitrag, Vorhaben } from '../kern/typen';

type Eigenschaften = {
  poolCent: number;
  hoechstbetragCent: number | null;
  ausgangsPoolCent: number;
  ausgangsHoechstbetragCent: number | null;
  vorhaben: readonly Vorhaben[];
  zusatzbeitraege: readonly Beitrag[];
  istProbeberechnung: boolean;
  onPool: (cent: number) => void;
  onHoechstbetrag: (cent: number | null) => void;
  onBeitragErgaenzen: (vorhabenId: string, betragCent: number) => void;
  onZuruecksetzen: () => void;
};

const POOL_MIN = 50_000; // 500 €
const POOL_MAX = 1_000_000; // 10.000 €
const POOL_SCHRITT = 10_000; // 100 €

const HOECHST_MIN = 10_000; // 100 €
const HOECHST_MAX = 250_000; // 2.500 €
const HOECHST_SCHRITT = 5_000; // 50 €

const BETRAGSSTUFEN = [500, 1_000, 2_000, 5_000];

export default function Schieber({
  poolCent,
  hoechstbetragCent,
  ausgangsPoolCent,
  ausgangsHoechstbetragCent,
  vorhaben,
  zusatzbeitraege,
  istProbeberechnung,
  onPool,
  onHoechstbetrag,
  onBeitragErgaenzen,
  onZuruecksetzen,
}: Eigenschaften) {
  const poolId = useId();
  const hoechstId = useId();
  const ohneId = useId();
  const vorhabenId = useId();
  const betragId = useId();

  const [gewaehltesVorhaben, setGewaehltesVorhaben] = useState(vorhaben[0]?.id ?? '');
  const [gewaehlterBetrag, setGewaehlterBetrag] = useState(BETRAGSSTUFEN[1]);

  const ohneHoechstbetrag = hoechstbetragCent === null;

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-wasWaereWenn">
      <div className="abschnitt__kopf">
        <h2 id="ueberschrift-wasWaereWenn">Was wäre wenn</h2>
        <p className="abschnitt__einleitung">
          Änderungen wirken sofort auf alle fünf Verfahren, die Kennzahlen und das
          Rechenprotokoll. Die Ausgangswerte lassen sich jederzeit wiederherstellen.
        </p>
      </div>

      <div className="tafel">
        <div className="raster-zwei">
          <div>
            <label className="regler" htmlFor={poolId}>
              <span className="regler__kopf">
                <span className="regler__name">Fördertopf</span>
                <span className="regler__wert">{euro(poolCent)}</span>
              </span>
              <input
                id={poolId}
                type="range"
                min={POOL_MIN}
                max={POOL_MAX}
                step={POOL_SCHRITT}
                value={poolCent}
                onChange={(e) => onPool(Number(e.target.value))}
              />
              <span className="regler__spanne" aria-hidden="true">
                <span>{euro(POOL_MIN)}</span>
                <span>{euro(POOL_MAX)}</span>
              </span>
            </label>
          </div>

          <div>
            <label className="regler" htmlFor={hoechstId}>
              <span className="regler__kopf">
                <span className="regler__name">Höchstbetrag je Vorhaben</span>
                <span className="regler__wert">
                  {ohneHoechstbetrag ? 'ohne' : euro(hoechstbetragCent)}
                </span>
              </span>
              <input
                id={hoechstId}
                type="range"
                min={HOECHST_MIN}
                max={HOECHST_MAX}
                step={HOECHST_SCHRITT}
                value={hoechstbetragCent ?? HOECHST_MAX}
                disabled={ohneHoechstbetrag}
                onChange={(e) => onHoechstbetrag(Number(e.target.value))}
              />
              <span className="regler__spanne" aria-hidden="true">
                <span>{euro(HOECHST_MIN)}</span>
                <span>{euro(HOECHST_MAX)}</span>
              </span>
            </label>

            <div className="schalter">
              <input
                id={ohneId}
                type="checkbox"
                checked={ohneHoechstbetrag}
                onChange={(e) =>
                  onHoechstbetrag(
                    e.target.checked ? null : (ausgangsHoechstbetragCent ?? HOECHST_MAX),
                  )
                }
              />
              <label htmlFor={ohneId}>
                Ohne Höchstbetrag je Vorhaben rechnen
              </label>
            </div>
            {ohneHoechstbetrag && (
              <p className="notiz notiz--hinweis" style={{ marginBottom: 0 }}>
                Ohne Höchstbetrag begrenzt allein der Kostenplan die Zuteilung. Das deutsche
                Haushaltsrecht verlangt einen Höchstbetrag; diese Stellung dient nur dem
                Vergleich.
              </p>
            )}
          </div>
        </div>

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid var(--linie)',
            margin: '24px 0 20px',
          }}
        />

        <h3>Beitrag ergänzen</h3>
        <p className="abschnitt__einleitung" style={{ marginTop: '6px' }}>
          Fügt einen Beitrag einer weiteren, bisher unbeteiligten Person hinzu. Damit wird
          begreifbar, wie stark ein einzelner zusätzlicher Kopf wirkt.
        </p>

        <div
          className="knopfreihe"
          style={{ alignItems: 'flex-end', gap: '14px', marginTop: '14px' }}
        >
          <span className="feld" style={{ flex: '1 1 320px' }}>
            <label className="feld__name" htmlFor={vorhabenId}>
              Vorhaben
            </label>
            <select
              id={vorhabenId}
              value={gewaehltesVorhaben}
              onChange={(e) => setGewaehltesVorhaben(e.target.value)}
            >
              {vorhaben.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.titel}
                </option>
              ))}
            </select>
          </span>

          <span className="feld">
            <label className="feld__name" htmlFor={betragId}>
              Betrag
            </label>
            <select
              id={betragId}
              value={gewaehlterBetrag}
              onChange={(e) => setGewaehlterBetrag(Number(e.target.value))}
            >
              {BETRAGSSTUFEN.map((cent) => (
                <option key={cent} value={cent}>
                  {euro(cent)}
                </option>
              ))}
            </select>
          </span>

          <button
            type="button"
            className="knopf"
            onClick={() => onBeitragErgaenzen(gewaehltesVorhaben, gewaehlterBetrag)}
          >
            Beitrag hinzufügen
          </button>
        </div>

        {zusatzbeitraege.length > 0 && (
          <p className="notiz" style={{ marginBottom: 0 }}>
            Ergänzt: {zusatzbeitraege.length}{' '}
            {zusatzbeitraege.length === 1 ? 'Beitrag' : 'Beiträge'} über insgesamt{' '}
            {euro(zusatzbeitraege.reduce((a, b) => a + b.betragCent, 0))}.
          </p>
        )}

        <div className="knopfreihe" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="knopf"
            onClick={onZuruecksetzen}
            disabled={!istProbeberechnung}
          >
            Auf Ausgangswerte zurücksetzen
          </button>
          <span className="zahl--still" style={{ fontSize: '0.87rem' }}>
            Ausgangswerte: Fördertopf {euro(ausgangsPoolCent)}, Höchstbetrag{' '}
            {ausgangsHoechstbetragCent === null
              ? 'ohne'
              : euro(ausgangsHoechstbetragCent)}
            , keine ergänzten Beiträge.
          </span>
        </div>
      </div>
    </section>
  );
}
