import { useId } from 'react';
import { euro } from '../format';
import type { Simulationseinstellungen, Vorhabenrolle } from '../kern/simulation';
import {
  PROGRAMME,
  ROLLENNAMEN,
  TRAEGER,
  VORHABENTITEL,
  vorhabenvorgabe,
} from '../kern/simulation';

type Eigenschaften = {
  entwurf: Simulationseinstellungen;
  offen: boolean;
  geaendert: boolean;
  onEntwurf: (naechster: Simulationseinstellungen) => void;
  onUmschalten: () => void;
  onStarten: () => void;
  onZuruecksetzen: () => void;
};

const ROLLEN: Vorhabenrolle[] = ['normal', 'wenige-grosse', 'allein', 'absprache'];

/** Eurofeld: rechnet zwischen Cent im Zustand und Euro in der Anzeige um. */
function EuroFeld({
  name,
  cent,
  min,
  max,
  schritt = 50,
  onWert,
}: {
  name: string;
  cent: number;
  min: number;
  max: number;
  schritt?: number;
  onWert: (cent: number) => void;
}) {
  const id = useId();
  return (
    <span className="feld">
      <label className="feld__name" htmlFor={id}>
        {name}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={schritt}
        value={cent / 100}
        onChange={(e) => onWert(Math.round(Number(e.target.value) * 100))}
      />
    </span>
  );
}

export default function Simulationseinstellungen({
  entwurf,
  offen,
  geaendert,
  onEntwurf,
  onUmschalten,
  onStarten,
  onZuruecksetzen,
}: Eigenschaften) {
  const seedId = useId();
  const programmId = useId();
  const vonId = useId();
  const bisId = useId();
  const personenId = useId();
  const abspracheId = useId();
  const ohneHoechstId = useId();

  const setze = (teil: Partial<Simulationseinstellungen>) => onEntwurf({ ...entwurf, ...teil });

  const setzeVorhaben = (index: number, teil: Partial<Simulationseinstellungen['vorhaben'][number]>) => {
    const vorhaben = entwurf.vorhaben.map((v, i) => (i === index ? { ...v, ...teil } : v));
    setze({ vorhaben });
  };

  const vorhabenHinzufuegen = () => {
    const index = entwurf.vorhaben.length;
    const neu = vorhabenvorgabe(index);
    setze({ vorhaben: [...entwurf.vorhaben, { ...neu, id: `v-${index + 1}` }] });
  };

  const vorhabenEntfernen = (index: number) => {
    const vorhaben = entwurf.vorhaben
      .filter((_, i) => i !== index)
      .map((v, i) => ({ ...v, id: `v-${i + 1}` }));
    setze({ vorhaben });
  };

  const ohneHoechstbetrag = entwurf.hoechstbetragJeVorhabenCent === null;

  return (
    <section className="abschnitt" aria-labelledby="ueberschrift-einstellungen">
      <div className="abschnitt__kopf">
        <span className="abschnitt__nummer">1</span>
        <h2 id="ueberschrift-einstellungen">Simulation einrichten</h2>
        <button
          type="button"
          className="knopf knopf--klein"
          onClick={onUmschalten}
          aria-expanded={offen}
          aria-controls="einstellungen-inhalt"
          style={{ marginLeft: 'auto' }}
        >
          {offen ? 'Einstellungen einklappen' : 'Einstellungen aufklappen'}
        </button>
      </div>

      <div id="einstellungen-inhalt" hidden={!offen}>
        <p className="abschnitt__einleitung">
          Alle Eingangsgrößen sind einstellbar. Der Seed steuert den Zufall vollständig:
          gleicher Seed und gleiche Einstellungen erzeugen dieselbe Runde und damit dieselbe
          Prüfsumme. Zufällig ist nur, wie die Runde zustande kommt — nie, was daraus
          gerechnet wird.
        </p>

        <div className="tafel">
          <h3>Runde</h3>
          <div className="felder" style={{ marginTop: '12px' }}>
            <span className="feld" style={{ gridColumn: 'span 2' }}>
              <label className="feld__name" htmlFor={programmId}>
                Programm
              </label>
              <select
                id={programmId}
                value={entwurf.zweck}
                onChange={(e) => setze({ zweck: e.target.value })}
              >
                {PROGRAMME.map((p) => (
                  <option key={p.name} value={p.zweck}>
                    {p.name}
                  </option>
                ))}
              </select>
            </span>

            <span className="feld">
              <label className="feld__name" htmlFor={vonId}>
                Zeitraum von
              </label>
              <input
                id={vonId}
                type="date"
                value={entwurf.zeitraumVon}
                onChange={(e) => setze({ zeitraumVon: e.target.value })}
              />
            </span>

            <span className="feld">
              <label className="feld__name" htmlFor={bisId}>
                Zeitraum bis
              </label>
              <input
                id={bisId}
                type="date"
                value={entwurf.zeitraumBis}
                onChange={(e) => setze({ zeitraumBis: e.target.value })}
              />
            </span>
          </div>

          <div className="felder" style={{ marginTop: '16px' }}>
            <EuroFeld
              name="Fördertopf (€)"
              cent={entwurf.poolCent}
              min={100}
              max={100_000}
              schritt={100}
              onWert={(poolCent) => setze({ poolCent })}
            />

            <span className="feld">
              <span className="feld__name">Höchstbetrag je Vorhaben (€)</span>
              <input
                type="number"
                min={50}
                max={50_000}
                step={50}
                disabled={ohneHoechstbetrag}
                value={ohneHoechstbetrag ? '' : entwurf.hoechstbetragJeVorhabenCent! / 100}
                onChange={(e) =>
                  setze({ hoechstbetragJeVorhabenCent: Math.round(Number(e.target.value) * 100) })
                }
              />
              <label className="schalter" htmlFor={ohneHoechstId}>
                <input
                  id={ohneHoechstId}
                  type="checkbox"
                  checked={ohneHoechstbetrag}
                  onChange={(e) =>
                    setze({ hoechstbetragJeVorhabenCent: e.target.checked ? null : 60_000 })
                  }
                />
                <span className="feld__hinweis">ohne Höchstbetrag rechnen</span>
              </label>
            </span>

            <span className="feld">
              <label className="feld__name" htmlFor={personenId}>
                Beitragende insgesamt
              </label>
              <input
                id={personenId}
                type="number"
                min={5}
                max={2000}
                step={5}
                value={entwurf.beitragendeGesamt}
                onChange={(e) => setze({ beitragendeGesamt: Number(e.target.value) })}
              />
            </span>

            <EuroFeld
              name="Beitrag von (€)"
              cent={entwurf.betragMinCent}
              min={1}
              max={500}
              schritt={1}
              onWert={(betragMinCent) => setze({ betragMinCent })}
            />

            <EuroFeld
              name="Beitrag bis (€)"
              cent={entwurf.betragMaxCent}
              min={1}
              max={500}
              schritt={1}
              onWert={(betragMaxCent) => setze({ betragMaxCent })}
            />

            <span className="feld">
              <label className="feld__name" htmlFor={abspracheId}>
                Absprachegruppe (Personen)
              </label>
              <input
                id={abspracheId}
                type="number"
                min={0}
                max={100}
                value={entwurf.abspracheGroesse}
                onChange={(e) => setze({ abspracheGroesse: Number(e.target.value) })}
              />
              <span className="feld__hinweis">0 schaltet die Gruppe ab</span>
            </span>

            <span className="feld">
              <label className="feld__name" htmlFor={seedId}>
                Seed
              </label>
              <input
                id={seedId}
                type="number"
                min={1}
                step={1}
                value={entwurf.seed}
                onChange={(e) => setze({ seed: Math.max(1, Math.floor(Number(e.target.value))) })}
              />
              <span className="feld__hinweis">steuert den Zufall vollständig</span>
            </span>
          </div>

          <hr className="trenner" />

          <div className="knopfreihe" style={{ justifyContent: 'space-between' }}>
            <h3>Vorhaben ({entwurf.vorhaben.length})</h3>
            <button type="button" className="knopf knopf--klein" onClick={vorhabenHinzufuegen}>
              + Vorhaben hinzufügen
            </button>
          </div>

          <div className="tabellenrahmen" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Vorhaben</th>
                  <th scope="col">Träger</th>
                  <th scope="col" className="zahl">
                    Kostenplan (€)
                  </th>
                  <th scope="col" className="zahl">
                    Zuspruch
                  </th>
                  <th scope="col" className="zahl">
                    Jurypunkte
                  </th>
                  <th scope="col">Muster</th>
                  <th scope="col">
                    <span className="nur-vorlesen">Entfernen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {entwurf.vorhaben.map((v, index) => (
                  <tr key={v.id}>
                    <td style={{ minWidth: '260px' }}>
                      <select
                        aria-label={`Titel des Vorhabens ${index + 1}`}
                        value={v.titel}
                        onChange={(e) => setzeVorhaben(index, { titel: e.target.value })}
                      >
                        {VORHABENTITEL.map((titel) => (
                          <option key={titel} value={titel}>
                            {titel}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <select
                        aria-label={`Träger des Vorhabens ${index + 1}`}
                        value={v.traeger}
                        onChange={(e) => setzeVorhaben(index, { traeger: e.target.value })}
                      >
                        {TRAEGER.map((traeger) => (
                          <option key={traeger} value={traeger}>
                            {traeger}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ width: '110px' }}>
                      <input
                        aria-label={`Kostenplan des Vorhabens ${index + 1}`}
                        type="number"
                        min={10}
                        max={50_000}
                        step={10}
                        value={v.beantragtCent / 100}
                        onChange={(e) =>
                          setzeVorhaben(index, {
                            beantragtCent: Math.round(Number(e.target.value) * 100),
                          })
                        }
                      />
                    </td>
                    <td style={{ width: '90px' }}>
                      <input
                        aria-label={`Zuspruch für Vorhaben ${index + 1}`}
                        type="number"
                        min={1}
                        max={10}
                        value={v.zuspruch}
                        onChange={(e) => setzeVorhaben(index, { zuspruch: Number(e.target.value) })}
                      />
                    </td>
                    <td style={{ width: '95px' }}>
                      <input
                        aria-label={`Jurypunkte für Vorhaben ${index + 1}`}
                        type="number"
                        min={0}
                        max={100}
                        value={v.jurypunkte}
                        onChange={(e) =>
                          setzeVorhaben(index, { jurypunkte: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td style={{ minWidth: '210px' }}>
                      <select
                        aria-label={`Muster für Vorhaben ${index + 1}`}
                        value={v.rolle}
                        onChange={(e) =>
                          setzeVorhaben(index, { rolle: e.target.value as Vorhabenrolle })
                        }
                      >
                        {ROLLEN.map((rolle) => (
                          <option key={rolle} value={rolle}>
                            {ROLLENNAMEN[rolle]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="knopf knopf--klein"
                        onClick={() => vorhabenEntfernen(index)}
                        disabled={entwurf.vorhaben.length <= 2}
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="notiz">
            <strong>Zuspruch</strong> steuert, wie viele Personen beitragen, nicht wie viel Geld
            zusammenkommt. <strong>Muster</strong> setzt gezielt die Fälle, an denen sich die
            Verfahren unterscheiden: „Wenige große Beiträge“ sammelt viel Geld von wenigen
            Köpfen, „Nur eine beitragende Person“ führt zu einer Zuteilung von null, und die
            Absprachegruppe trägt alle so gekennzeichneten Vorhaben geschlossen mit — dafür
            braucht es mindestens zwei davon.
          </p>

          <div className="knopfreihe" style={{ marginTop: '18px' }}>
            <button type="button" className="knopf knopf--haupt" onClick={onStarten}>
              Simulation starten
            </button>
            <button
              type="button"
              className="knopf"
              onClick={onZuruecksetzen}
              disabled={!geaendert}
            >
              Auf Ausgangswerte zurücksetzen
            </button>
            <span className="feld__hinweis">
              Fördertopf {euro(entwurf.poolCent)} auf {entwurf.vorhaben.length} Vorhaben,
              rund {entwurf.beitragendeGesamt} Beitragende.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
