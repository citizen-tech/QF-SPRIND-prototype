import { Group, Paper, Slider, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { euro, zahl } from '../format';
import { berechneVorhabenwerte } from '../kern/qf';
import type { Rundendaten } from '../kern/typen';
import QfQuadrat, { seitenlaenge } from './QfQuadrat';

type Eigenschaften = { daten: Rundendaten };

/** Didaktisches Beispiel: immer dieselbe Summe, auf verschieden viele Köpfe verteilt. */
const BEISPIELSUMME_EURO = 64;
const HOECHSTE_KOEPFE = 16;

function Legende() {
  return (
    <Group gap="lg" wrap="wrap" mt="sm">
      <span className="legende">
        <span className="legende__feld legende__feld--beitrag" />
        Beitragssumme <span className="mono">E</span> — was die Beitragenden selbst gegeben haben
      </span>
      <span className="legende">
        <span className="legende__feld legende__feld--gesamt" />
        Bemessungswert <span className="mono">R</span> — die Fläche darüber hinaus
      </span>
    </Group>
  );
}

export default function Erklaerung({ daten }: Eigenschaften) {
  const [koepfe, setKoepfe] = useState(8);
  const werte = useMemo(() => berechneVorhabenwerte(daten), [daten]);

  // Beispiel: dieselbe Summe, gleichmäßig auf koepfe Personen verteilt.
  const beispiel = useMemo(
    () => Array.from({ length: koepfe }, () => BEISPIELSUMME_EURO / koepfe),
    [koepfe],
  );
  const beispielReferenz = seitenlaenge(
    Array.from({ length: HOECHSTE_KOEPFE }, () => BEISPIELSUMME_EURO / HOECHSTE_KOEPFE),
  );
  const beispielSeite = seitenlaenge(beispiel);
  const beispielQ = beispielSeite * beispielSeite;

  // Vorhaben der Runde, maßstabsgleich nebeneinander.
  const vorhabenReferenz = Math.max(...werte.map((w) => w.wurzelsumme), 1);
  const nachWurzelsumme = [...werte].sort((a, b) => b.wurzelsumme - a.wurzelsumme);
  const titel = new Map(daten.vorhaben.map((v) => [v.id, v.titel]));

  return (
    <>
      <section className="abschnitt" aria-labelledby="ueberschrift-quadrat">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-quadrat">
            Die Formel als Bild
          </Title>
        </div>

        <p className="leitsatz">
          Quadratic Funding lässt sich zeichnen. Jeder Beitrag wird zu einem Quadrat mit der
          Seitenlänge <span className="mono">√c</span> — seine Fläche ist der Beitrag selbst.
          Legt man diese Quadrate auf die Diagonale, spannen sie ein großes Quadrat auf. Dessen
          Seitenlänge ist die Wurzelsumme <span className="mono">W</span>, seine Fläche der
          Gesamtfinanzierungswert <span className="mono">Q = W²</span>. Was über den Beiträgen
          hinaus in der Fläche liegt, ist der Bemessungswert{' '}
          <span className="mono">R = Q − E</span>.
        </p>

        <p className="leitsatz">
          Das sind genau die drei Größen aus Abschnitt 2.2 der veröffentlichten Rechenregel —
          nur als Bild statt als Formel. Die Darstellung stammt aus Miller, Weyl und Erichsen,
          „Beyond Collusion Resistance“ (2022), Abbildungen 1 bis 3.
        </p>

        <Paper withBorder p="lg" radius="sm" bg="white">
          <Title order={3}>Dieselbe Summe, verschieden viele Beitragende</Title>
          <Text size="sm" c="var(--tinte-lese)" mt={4} mb="lg">
            {euro(BEISPIELSUMME_EURO * 100)} kommen zusammen — immer. Nur die Zahl der
            Beitragenden ändert sich. Beide Quadrate stehen im selben Maßstab.
          </Text>

          <Group align="flex-end" gap="xl" wrap="wrap">
            <div>
              <QfQuadrat
                betraegeEuro={beispiel}
                referenzSeite={beispielReferenz}
                beschriftung={`${koepfe} Beitragende`}
              />
              <Text size="sm" ta="center" mt="xs" fw={500}>
                {koepfe} {koepfe === 1 ? 'Person' : 'Personen'} zu je{' '}
                <span className="mono">{euro(Math.round((BEISPIELSUMME_EURO / koepfe) * 100))}</span>
              </Text>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 280 }}>
              <Text size="sm" fw={500} mb={4}>
                Zahl der Beitragenden: <span className="mono">{koepfe}</span>
              </Text>
              <Slider
                color="amt.9"
                min={1}
                max={HOECHSTE_KOEPFE}
                step={1}
                value={koepfe}
                onChange={setKoepfe}
                marks={[1, 4, 8, 12, 16].map((v) => ({ value: v, label: String(v) }))}
                mb="xl"
                aria-label="Zahl der Beitragenden im Beispiel"
              />

              <dl className="rechenschritte" style={{ maxWidth: 420 }}>
                <dt>Beitragssumme E</dt>
                <dd>{euro(BEISPIELSUMME_EURO * 100)}</dd>
                <dt>Wurzelsumme W</dt>
                <dd>{zahl(beispielSeite, 2)}</dd>
                <dt>Gesamtfinanzierungswert Q = W²</dt>
                <dd>{zahl(beispielQ, 2)}</dd>
                <dt className="ergebnis">Bemessungswert R = Q − E</dt>
                <dd className="ergebnis">{zahl(beispielQ - BEISPIELSUMME_EURO, 2)}</dd>
              </dl>
            </div>
          </Group>

          <Legende />

          <p className="notiz">
            Bei einer einzigen Person ist das Quadrat genau so groß wie ihr Beitrag: Der
            Bemessungswert ist null, die Fläche ganz ausgefüllt. Mit jeder weiteren Person wächst
            die Fläche schneller als die Beitragssumme — und der Unterschied zwischen beiden ist
            das, was das Verfahren misst.
          </p>
        </Paper>
      </section>

      <section className="abschnitt" aria-labelledby="ueberschrift-runde">
        <div className="abschnitt__kopf">
          <Title order={2} id="ueberschrift-runde">
            Die Vorhaben dieser Runde
          </Title>
        </div>

        <p className="leitsatz">
          Dieselbe Darstellung, angewandt auf die gerechnete Runde. Alle Quadrate stehen im
          selben Maßstab: Die Fläche über den Beitragsblöcken ist der Bemessungswert, und in
          seinem Verhältnis wird der Fördertopf verteilt.
        </p>

        <div className="quadratreihe">
          {nachWurzelsumme.map((w) => (
            <figure key={w.vorhabenId} className="quadratreihe__eintrag">
              <QfQuadrat
                betraegeEuro={w.posten.map((p) => p.betragEuro)}
                referenzSeite={vorhabenReferenz}
                kantenlaenge={190}
                beschriftung={titel.get(w.vorhabenId) ?? w.vorhabenId}
              />
              <figcaption>
                <Text size="sm" fw={500} lineClamp={2}>
                  {titel.get(w.vorhabenId)}
                </Text>
                <Text size="xs" c="var(--tinte-lese)" mt={2}>
                  {w.beitragendeAnzahl} Beitragende · {euro(w.eigenCent)}
                </Text>
                <Text size="xs" className="mono" c="amt.9" mt={2}>
                  R = {zahl(w.rohEuro, 0)}
                </Text>
              </figcaption>
            </figure>
          ))}
        </div>

        <Legende />

        <p className="notiz notiz--ocker">
          <strong>Ein Unterschied zur Lehrbuchfassung.</strong> Dort wird die ganze Fläche des
          Quadrats ausgezahlt, der Fördertopf müsste also beliebig groß sein. Bei einem
          gedeckelten Topf geht das nicht: Die Fläche über den Beiträgen dient dann als{' '}
          <em>Gewicht</em>, in dessen Verhältnis der vorhandene Topf aufgeteilt wird. Die Bilder
          zeigen also die Bemessung, nicht den Auszahlungsbetrag.
        </p>
      </section>
    </>
  );
}
