# Bemessungsregel für die Verteilung des Fördertopfes

**Fassung:** `qf-gedeckelt-1.0.0`
**Stand:** 19. August 2026

Diese Regel entspricht dem, was in einer Förderrichtlinie unter dem Gliederungspunkt
„Bewilligungsverfahren“ stünde. Sie ist so gefasst, dass eine sachbearbeitende Person
jede Zuteilung mit Taschenrechner und Tabellenkalkulation nachrechnen kann.

Die Regel **bemisst**. Sie entscheidet nicht und bescheidet nicht. Die Bewilligung
bleibt Sache der Behörde.

---

## 1. Anwendungsbereich und Begriffe

| Begriff | Bedeutung |
|---|---|
| **Fördertopf** | Der für die Runde bereitgestellte Betrag. Er ist der Höchstbetrag der Gesamtzuteilung. |
| **Höchstbetrag je Vorhaben** | Obergrenze der Zuteilung an ein einzelnes Vorhaben. Kann entfallen. |
| **Beitrag** | Eine Zahlung einer beitragsberechtigten Person an ein zugelassenes Vorhaben. |
| **Beitragssumme** | Summe aller Beiträge an ein Vorhaben. |
| **Bemessungswert** | Das Gewicht, mit dem ein Vorhaben am Fördertopf beteiligt wird (Abschnitt 2). |
| **Zuteilung** | Der auf ein Vorhaben entfallende Anteil am Fördertopf. |

Alle Beträge werden in **ganzen Cent** geführt. Zwischenrechnungen erfolgen in Euro
(Abschnitt 6).

---

## 2. Der Bemessungswert

### 2.1 In Worten

Für jedes zugelassene Vorhaben:

1. Die Beiträge werden **je beitragender Person zusammengefasst**. Hat eine Person
   mehrfach an dasselbe Vorhaben gezahlt, gilt die Summe ihrer Zahlungen als *ein*
   Beitrag dieser Person.
2. Aus jedem so zusammengefassten Personenbeitrag wird die **Quadratwurzel** gezogen
   (Beträge in Euro).
3. Diese Wurzeln werden **addiert**.
4. Die Summe wird **quadriert**. Das ergibt den *Gesamtfinanzierungswert*.
5. Vom Gesamtfinanzierungswert wird die **Beitragssumme abgezogen**. Das Ergebnis ist
   der **Bemessungswert**. Er beziffert den Betrag, der über die bereits geleisteten
   Bürgerbeiträge hinaus erforderlich wäre.
6. Ist das Ergebnis kleiner als null, gilt null.

Der Bemessungswert wächst mit der **Zahl der mittragenden Personen**, nicht mit der
Höhe der eingesammelten Beträge. Das ist der Zweck der Regel.

### 2.2 In mathematischer Schreibweise

Für ein Vorhaben *p* mit den Personenbeiträgen *c₁, …, c_n* (in Euro):

```
Beitragssumme     E  =  c₁ + c₂ + … + c_n

Wurzelsumme       W  =  √c₁ + √c₂ + … + √c_n

Gesamtfinanzierungswert  Q  =  W²

Bemessungswert    R  =  max(0, Q − E)
```

### 2.3 Rechenbeispiel zum Nachvollziehen

Zwei Vorhaben, Fördertopf 1.000,00 €, kein Höchstbetrag je Vorhaben, Kostenpläne
ausreichend hoch.

| | Vorhaben A | Vorhaben B |
|---|---|---|
| Beiträge | 1 €, 1 €, 1 €, 1 € | 4 €, 4 € |
| Beitragssumme *E* | 4,00 | 8,00 |
| Wurzeln | 1 + 1 + 1 + 1 | 2 + 2 |
| Wurzelsumme *W* | 4,00 | 4,00 |
| *Q = W²* | 16,00 | 16,00 |
| Bemessungswert *R = Q − E* | **12,00** | **8,00** |

Summe der Bemessungswerte: 12 + 8 = 20.

* Vorhaben A: 1.000,00 € × 12 ÷ 20 = **600,00 €**
* Vorhaben B: 1.000,00 € × 8 ÷ 20 = **400,00 €**

Vorhaben A hat **halb so viel Geld** eingesammelt wie B und erhält **anderthalbmal
so viel** Zuteilung, weil es von doppelt so vielen Personen mitgetragen wird.

---

## 3. Der Höchstbetrag je Vorhaben

Für jedes Vorhaben wird ein Höchstbetrag der Zuteilung bestimmt. Es gilt der
**kleinere** der beiden folgenden Werte:

1. der für die Runde festgelegte **Höchstbetrag je Vorhaben**, sofern festgelegt;
2. der **Kostenplan abzüglich der Beitragssumme**.

Der zweite Wert ist zwingend: Die Zuwendung darf zusammen mit den bereits
geleisteten Bürgerbeiträgen die zuwendungsfähigen Ausgaben nicht überschreiten. Die
Bürgerbeiträge sind Drittmittel im Sinne der Finanzierung.

Ergibt sich ein negativer Wert, gilt null.

---

## 4. Das Verteilverfahren

Der Fördertopf wird im Verhältnis der Bemessungswerte verteilt. Überschreitet eine
Zuteilung den Höchstbetrag des Vorhabens, wird sie auf diesen gekürzt und der
freiwerdende Betrag auf die übrigen Vorhaben weiterverteilt. Das wiederholt sich, bis
keine Kürzung mehr anfällt.

**Verfahrensschritte:**

1. Der verfügbare Restbetrag wird auf den vollen Fördertopf gesetzt. Als *offen*
   gelten alle zugelassenen Vorhaben mit einem Bemessungswert größer als null.
2. Ist kein Vorhaben mehr offen oder ist der Restbetrag aufgebraucht, endet das
   Verfahren.
3. Die Bemessungswerte der offenen Vorhaben werden addiert. Ist die Summe null, endet
   das Verfahren.
4. Für jedes offene Vorhaben wird ein **vorläufiger Betrag** ermittelt:
   Restbetrag × Bemessungswert des Vorhabens ÷ Summe der Bemessungswerte der offenen
   Vorhaben.
5. Es wird geprüft, bei welchen offenen Vorhaben der vorläufige Betrag den
   Höchstbetrag nach Abschnitt 3 **überschreitet**.
6. Überschreitet kein Vorhaben seinen Höchstbetrag, gelten die vorläufigen Beträge als
   Zuteilung. Das Verfahren endet.
7. Andernfalls wird jedes überschreitende Vorhaben auf seinen Höchstbetrag **festgesetzt**.
   Der festgesetzte Betrag wird vom Restbetrag abgezogen, das Vorhaben gilt nicht mehr
   als offen. Das Verfahren wird bei Schritt 2 fortgesetzt.

Vorhaben, für die nach Verfahrensende kein Betrag festgesetzt wurde, erhalten eine
Zuteilung von null.

Die **Zahl der Durchläufe** wird protokolliert und ausgewiesen. Sie ist durch die Zahl
der Vorhaben begrenzt; das Verfahren bricht spätestens nach 100 Durchläufen ab.

### 4.1 Rechenbeispiel mit Höchstbetrag

Daten wie in Abschnitt 2.3, zusätzlich Höchstbetrag je Vorhaben **550,00 €**.

* **Durchlauf 1:** A = 600,00 € — überschreitet 550,00 €. A wird auf 550,00 €
  festgesetzt. Restbetrag: 1.000,00 − 550,00 = 450,00 €. Offen ist nur noch B.
* **Durchlauf 2:** B = 450,00 € × 8 ÷ 8 = 450,00 €. Das liegt unter 550,00 €; keine
  Überschreitung. Das Verfahren endet.

Ergebnis: **A = 550,00 €, B = 450,00 €**, zwei Durchläufe, nicht ausgeschöpft: 0,00 €.

### 4.2 Nicht ausgeschöpfter Betrag

Die Differenz zwischen Fördertopf und Summe aller Zuteilungen wird gesondert
ausgewiesen. Sie entsteht, wenn alle Vorhaben ihren Höchstbetrag erreicht haben oder
wenn die Summe der Bemessungswerte null ist. Sie ist **kein Rundungsfehler**, sondern
eine haushaltsrechtlich erhebliche Größe.

---

## 5. Rundung auf Cent

Die vorläufigen Beträge sind in aller Regel keine glatten Centbeträge. Gerundet wird
nach dem **Verfahren des größten Restes**:

1. Jeder Betrag wird auf den nächstkleineren vollen Cent **abgerundet**.
2. Die abgerundeten Beträge werden addiert und von der zu verteilenden Summe
   abgezogen. Die Differenz ist die Zahl der noch zu vergebenden **Restcent**.
3. Die Vorhaben werden nach der Größe ihres abgeschnittenen Nachkommaanteils geordnet,
   absteigend. Bei gleichem Nachkommaanteil entscheidet die **kleinere Kennung** des
   Vorhabens.
4. In dieser Reihenfolge erhält je ein Vorhaben einen zusätzlichen Cent, bis die
   Restcent vergeben sind.

Damit ist die Summe der gerundeten Zuteilungen **exakt** gleich der zu verteilenden
Summe.

Bereits nach Abschnitt 4 festgesetzte Vorhaben stehen auf einem glatten Centbetrag.
Ihr Nachkommaanteil ist null; sie erhalten daher nie einen Restcent.

### 5.1 Rechenbeispiel zur Rundung

Fördertopf 10,00 €, drei Vorhaben mit gleichem Bemessungswert, keine Höchstbeträge.

Vorläufig je 3,3333… € = 333,33… Cent. Abgerundet 333 + 333 + 333 = 999 Cent. Es
verbleibt **1 Cent**. Alle drei Nachkommaanteile sind gleich, also entscheidet die
kleinste Kennung.

Ergebnis: **334 / 333 / 333 Cent**, Summe exakt 1.000 Cent.

---

## 6. Rechengenauigkeit und Reproduzierbarkeit

Damit dieselbe Eingabe stets dasselbe Ergebnis liefert, gelten folgende Festlegungen:

1. **Sortierung vor jeder Summenbildung.** Beiträge werden vor jeder Zusammenfassung
   geordnet nach Vorhaben, dann nach Kennung der beitragenden Person, dann nach
   Zeitpunkt, dann nach Betrag — jeweils aufsteigend. Die Reihenfolge der Summanden
   beeinflusst bei maschineller Gleitkommarechnung die letzten Stellen; ohne feste
   Sortierung wäre das Ergebnis nicht reproduzierbar.
2. **Wurzelrechnung in Euro**, nicht in Cent. Erst das Endergebnis wird nach
   Abschnitt 5 auf Cent gerundet.
3. **Keine zufälligen und keine zeitabhängigen Größen.** Die Berechnung enthält weder
   Zufallszahlen noch einen Bezug auf das Systemdatum.
4. **Eine einzige Rundungsstelle.** Alle Verfahren nutzen dieselbe Rundungsregel aus
   Abschnitt 5.
5. **Toleranz beim Abrunden.** Beim Umrechnen von Euro in Cent wird eine Toleranz von
   einem Milliardstel Cent zugunsten des nächsthöheren Cents angesetzt. Ohne sie
   würde ein bereits glatter Betrag wie 412,17 € durch die binäre Zahlendarstellung
   gelegentlich auf 412,16 € abgeschnitten. Die Toleranz ist ein fester Wert und
   verändert kein Ergebnis, das nicht ohnehin dem glatten Cent entspricht.

Zu jeder Berechnung werden **Fassungsnummer** und **Prüfsumme der Eingangsdaten**
ausgewiesen. Die Prüfsumme ist ein SHA-256-Wert über eine festgelegte, sortierte
Darstellung der Eingangsdaten. Stimmen Fassungsnummer und Prüfsumme überein, ist das
Ergebnis identisch.

---

## 7. Sonderfälle

| Fall | Behandlung |
|---|---|
| **Kein Beitrag** | Bemessungswert null, Zuteilung null. |
| **Genau eine beitragende Person** | Bemessungswert null, Zuteilung null. Gesamtfinanzierungswert und Beitragssumme sind hier rechnerisch gleich groß. Das ist beabsichtigt: Die Regel bemisst Mitträgerschaft, und eine einzelne Person trägt nichts mit. |
| **Mehrere Zahlungen derselben Person an dasselbe Vorhaben** | Werden vor der Wurzelziehung addiert (Abschnitt 2.1 Nr. 1). Andernfalls ließe sich durch bloßes Aufteilen einer Zahlung zusätzliche Zuteilung erzeugen: 500 € in zwei Zahlungen zu 250 € ergäben einen Bemessungswert von 500, obwohl niemand hinzugekommen ist. |
| **Kostenplan bereits durch Beiträge gedeckt** | Höchstbetrag nach Abschnitt 3 ist null, Zuteilung null. |
| **Fördertopf nicht ausgeschöpft** | Wird nach Abschnitt 4.2 gesondert ausgewiesen. |
| **Kein Höchstbetrag je Vorhaben festgelegt** | Es gilt allein die Grenze aus dem Kostenplan. |

---

## 8. Herkunft der Regel und ihre Grenzen

Die Regel ist keine Eigenentwicklung. Abschnitt 2 und Abschnitt 4 geben ein
veröffentlichtes Verfahren wieder.

**Grundformel (Abschnitt 2).** Vitalik Buterin, Zoë Hitzig, E. Glen Weyl:
*A Flexible Design for Funding Public Goods* (arXiv:1809.06421v2, 16. August 2020).
Definition 5 auf Seite 9 legt den Gesamtfinanzierungswert als Quadrat der Summe der
Wurzeln der Beiträge fest. Der Index läuft dabei ausdrücklich über **Personen**, nicht
über einzelne Zahlungen (Seite 6: „subscripts index citizens“) — daraus folgt die
Zusammenfassung je Person nach Abschnitt 2.1 Nr. 1. Der Abzug der Beitragssumme in
Abschnitt 2.1 Nr. 5 ist das in Gleichung (7) auf Seite 9 als *deficit* bezeichnete
Finanzierungserfordernis.

**Verteilung bei begrenztem Topf (Abschnitt 4).** Dasselbe Papier, Definition 7 auf
Seite 17, beschreibt das *Capital-constrained Quadratic Finance*: Der
Finanzierungsbetrag ist eine Mischung aus der Grundformel mit Gewicht α und den
ungeförderten Beiträgen mit Gewicht 1 − α, wobei „for any budget B, α may be adjusted
to ensure the budget is not exceeded“. Rechnerisch entspricht das genau der
verhältnismäßigen Verteilung nach Bemessungswerten: Wählt man α so, dass der Topf
gerade ausgeschöpft wird, erhält jedes Vorhaben den Anteil am Topf, der seinem Anteil
an der Summe der Bemessungswerte entspricht.

**Was nicht aus der Quelle stammt — und was das kostet.** Der Höchstbetrag je Vorhaben
und das iterative Nachverteilen aus Abschnitt 4 sind eine Ergänzung. Sie folgen aus dem
Haushaltsrecht, nicht aus der Theorie. Sie haben eine Nebenwirkung, die offengelegt
gehört: Die Quelle begründet die Sachgerechtigkeit der Verteilung damit, dass α für
**alle** Vorhaben gleich hoch ist (Seite 18, mit Verweis auf die Steuertheorie von
Atkinson und Stiglitz: gleichmäßige Verzerrung über alle Güter). Sobald einzelne
Vorhaben auf einen Höchstbetrag gekürzt werden, gilt für sie faktisch ein niedrigeres
α als für die übrigen. Das Optimalitätsargument der Quelle trägt dann nur noch für die
nicht gekürzten Vorhaben. Die Kürzung ist eine bewusste rechtliche Vorgabe, die der
ökonomischen Optimalität vorgeht.

**Bekannte Angriffsfläche.** Die Quelle benennt in Abschnitt 5.2 (Seite 19) als
zentrale Schwachstellen *Kollusion* (mehrere Personen stimmen ihr Beitragsverhalten
ab) und *Betrug* (eine Person tritt als mehrere auf). Sie beziffert die Schwelle, ab
der sich vorgetäuschte Identitäten rechnen, mit 1 ÷ α. Als Gegenmittel nennt sie
Identitätsprüfung sowie die Prüfung kleiner Gruppen mit auffällig hoher Zuteilung —
nicht ein rechnerisches Verfahren. Ein rechnerischer Kopplungsabschlag ist im
Prototyp gesondert und ausdrücklich als nachrangiges Zusatzverfahren ausgewiesen; er
stammt aus einer anderen Quelle (Vitalik Buterin, *Pairwise coordination subsidies: a
new quadratic funding design*, ethresear.ch, 2019) und ist **nicht** Bestandteil
dieser Bemessungsregel.

---

## 9. Änderungshistorie

| Fassung | Datum | Änderung |
|---|---|---|
| `qf-gedeckelt-1.0.0` | 19.08.2026 | Erstfassung. |

**Ändert sich das Rechenergebnis bei gleicher Eingabe, muss die Fassungsnummer
erhöht und die Änderung hier eingetragen werden.** Eine über Runden hinweg
stillschweigend wechselnde Bemessungsregel verletzt den Gleichbehandlungsgrundsatz.
