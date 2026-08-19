// Version der Bemessungsregel.
//
// Ändert sich das Rechenergebnis bei gleicher Eingabe, MUSS diese Nummer steigen
// und FORMEL.md eine Änderungshistorie erhalten. Das ist die Rechtsanforderung,
// die dieser Prototyp demonstrieren soll: eine über Runden wechselnde Formel
// zerstört die Gleichbehandlung.

export const FORMEL_VERSION = 'qf-gedeckelt-1.0.0';

/** Stand der veröffentlichten Fassung (ISO-Datum). */
export const FORMEL_STAND = '2026-08-19';

/** Höchstzahl der Durchläufe im Deckelverfahren. Reiner Sicherungswert. */
export const HOECHSTZAHL_DURCHLAEUFE = 100;
