import { euro } from '../format';

/**
 * Das QF-Quadrat.
 *
 * Nach Miller, Weyl und Erichsen, „Beyond Collusion Resistance“ (2022),
 * Abbildungen 1 bis 3. Die Darstellung bildet genau die drei Größen ab, mit
 * denen auch FORMEL.md Abschnitt 2.2 rechnet:
 *
 *   Seitenlänge des Quadrats  = W, die Summe der Wurzeln
 *   ganze Fläche              = Q = W², der Gesamtfinanzierungswert
 *   Blöcke auf der Diagonale  = E, die Beitragssumme
 *   Restfläche                = R = Q − E, der Bemessungswert
 *
 * Gezeichnet wird nicht das volle Raster aus n² Feldern, sondern die Fläche und
 * die n Blöcke darauf — das ist dasselbe Bild bei einem Bruchteil der Elemente
 * und trägt auch Vorhaben mit vielen Beitragenden.
 */
export default function QfQuadrat({
  betraegeEuro,
  referenzSeite,
  kantenlaenge = 240,
  beschriftung,
}: {
  betraegeEuro: readonly number[];
  /** Größte Seitenlänge der Vergleichsgruppe — dadurch sind Quadrate maßstabsgleich. */
  referenzSeite: number;
  kantenlaenge?: number;
  beschriftung: string;
}) {
  const wurzeln = betraegeEuro.map((c) => Math.sqrt(Math.max(0, c)));
  const seite = wurzeln.reduce((a, b) => a + b, 0);
  const eigen = betraegeEuro.reduce((a, b) => a + b, 0);
  const quadrat = seite * seite;

  const skala = referenzSeite > 0 ? kantenlaenge / referenzSeite : 0;
  const px = seite * skala;

  let lauf = 0;
  const bloecke = wurzeln.map((w) => {
    const versatz = lauf;
    lauf += w;
    return { versatz: versatz * skala, groesse: w * skala };
  });

  return (
    <svg
      viewBox={`0 0 ${kantenlaenge} ${kantenlaenge}`}
      className="qfquadrat"
      role="img"
      aria-label={
        `${beschriftung}: ${betraegeEuro.length} Beitragende, Beitragssumme ` +
        `${euro(Math.round(eigen * 100))}, Bemessungswert ` +
        `${euro(Math.round((quadrat - eigen) * 100))}.`
      }
    >
      {/* Ganze Fläche: der Gesamtfinanzierungswert */}
      <rect
        x="0"
        y={kantenlaenge - px}
        width={px}
        height={px}
        className="qfquadrat__gesamt"
      />
      {/* Blöcke auf der Diagonale: die Beiträge selbst */}
      {bloecke.map((b, i) => (
        <rect
          key={i}
          x={b.versatz}
          y={kantenlaenge - b.versatz - b.groesse}
          width={b.groesse}
          height={b.groesse}
          className="qfquadrat__beitrag"
        />
      ))}
    </svg>
  );
}

/** Seitenlänge eines Quadrats — die Summe der Wurzeln, in Wurzel-Euro. */
export function seitenlaenge(betraegeEuro: readonly number[]): number {
  return betraegeEuro.reduce((a, c) => a + Math.sqrt(Math.max(0, c)), 0);
}
