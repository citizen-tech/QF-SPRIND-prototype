// Datenmodell der Förderrunde.
// Alle Geldbeträge sind ganzzahlige Cent. Nirgends Gleitkomma-Euro speichern.

export type Runde = {
  id: string;
  formelVersion: string; // aus version.ts, z.B. "qf-gedeckelt-1.0.0"
  zweck: string; // Programmzweck im Klartext
  zeitraum: { von: string; bis: string }; // ISO-Datum
  poolCent: number; // gedeckelter Matching-Topf
  hoechstbetragJeVorhabenCent: number | null;
  zulassungskriterien: string[];
};

export type Vorhaben = {
  id: string;
  titel: string;
  traeger: string; // Verein oder Trägerverein
  beantragtCent: number; // Kostenplan — begrenzt die Zuteilung
  eingangZeitpunkt: string; // ISO — nur für das Windhundverfahren
  jurypunkte: number; // 0..100 — nur für die Jury-Vergleichsrechnung
};

export type Beitrag = {
  vorhabenId: string;
  beitragendeId: string; // pseudonym, z.B. "b-0147"
  betragCent: number;
  zeitpunkt: string; // ISO
  merkmal: {
    // "bestätigtes Merkmal"
    region: string; // z.B. "Berlin-Nord"
    altersgruppe: string; // z.B. "30-44"
  };
};

export type Rundendaten = {
  runde: Runde;
  vorhaben: Vorhaben[];
  beitraege: Beitrag[];
};
