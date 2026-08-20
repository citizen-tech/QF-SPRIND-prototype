// Logarithmische Umrechnung für den Fördertopf-Schieber.
//
// Ein linearer Schieber von 100 € bis 1.000.000 € wäre unbrauchbar: Die
// interessanten Größen für eine Pilotrunde liegen unter 5.000 €, also im
// ersten halben Prozent des Wegs. Logarithmisch liegt jede Zehnerpotenz auf
// gleich viel Weg.

export const TOPF_MIN_CENT = 10_000; // 100 €
export const TOPF_MAX_CENT = 100_000_000; // 1.000.000 €

const LOG_MIN = Math.log(TOPF_MIN_CENT);
const LOG_MAX = Math.log(TOPF_MAX_CENT);

/** Rundet auf einen Betrag, den man vorlesen mag: 2.500 € statt 2.487,31 €. */
function aufGlattenBetrag(cent: number): number {
  const euro = cent / 100;
  const stufe = euro < 1_000 ? 10 : euro < 10_000 ? 100 : euro < 100_000 ? 1_000 : 10_000;
  return Math.round(euro / stufe) * stufe * 100;
}

/** Schieberstellung 0..100 → Betrag in Cent. */
export function schieberZuCent(stellung: number): number {
  const anteil = Math.min(100, Math.max(0, stellung)) / 100;
  const cent = Math.exp(LOG_MIN + anteil * (LOG_MAX - LOG_MIN));
  return Math.min(TOPF_MAX_CENT, Math.max(TOPF_MIN_CENT, aufGlattenBetrag(cent)));
}

/** Betrag in Cent → Schieberstellung 0..100. */
export function centZuSchieber(cent: number): number {
  const begrenzt = Math.min(TOPF_MAX_CENT, Math.max(TOPF_MIN_CENT, cent));
  return ((Math.log(begrenzt) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

/** Beschriftete Marken auf dem Schieber, jeweils eine Zehnerpotenz. */
export const TOPF_MARKEN = [
  { cent: 10_000, text: '100 €' },
  { cent: 100_000, text: '1.000 €' },
  { cent: 1_000_000, text: '10.000 €' },
  { cent: 10_000_000, text: '100.000 €' },
  { cent: 100_000_000, text: '1 Mio. €' },
].map((m) => ({ value: centZuSchieber(m.cent), label: m.text }));
