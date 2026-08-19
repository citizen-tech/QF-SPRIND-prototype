// Darstellung von Zahlen in deutscher Schreibweise.
//
// Bewusst ohne Intl: die Ausgabe soll in jeder Umgebung identisch sein, auch
// dort, wo die Sprachdatenbank fehlt oder abweicht.

function mitTausenderpunkt(ganzzahl: string): string {
  return ganzzahl.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 41217 → "412,17 €" */
export function euro(cent: number): string {
  return `${euroOhneZeichen(cent)} €`;
}

/** 41217 → "412,17" */
export function euroOhneZeichen(cent: number): string {
  const gerundet = Math.round(cent);
  const vorzeichen = gerundet < 0 ? '−' : '';
  const absolut = Math.abs(gerundet);
  const ganz = mitTausenderpunkt(String(Math.floor(absolut / 100)));
  const rest = String(absolut % 100).padStart(2, '0');
  return `${vorzeichen}${ganz},${rest}`;
}

/** Dezimalzahl mit fester Stellenzahl, Komma als Trennzeichen. */
export function zahl(wert: number, stellen = 2): string {
  if (!Number.isFinite(wert)) return '—';
  const text = Math.abs(wert).toFixed(stellen);
  const [ganz, rest] = text.split('.');
  const vorzeichen = wert < 0 ? '−' : '';
  return vorzeichen + mitTausenderpunkt(ganz) + (rest ? `,${rest}` : '');
}

/** Anteil 0..1 als Prozentangabe. */
export function prozent(anteil: number, stellen = 1): string {
  if (!Number.isFinite(anteil)) return '—';
  return `${zahl(anteil * 100, stellen)} %`;
}

/** ISO-Datum oder -Zeitpunkt → "31.12.2026" */
export function datum(iso: string): string {
  const teile = iso.slice(0, 10).split('-');
  if (teile.length !== 3) return iso;
  return `${teile[2]}.${teile[1]}.${teile[0]}`;
}

/** Prüfsumme gekürzt für die Fließtextdarstellung. */
export function kurzePruefsumme(hex: string): string {
  return hex ? `${hex.slice(0, 8)}…` : '—';
}
