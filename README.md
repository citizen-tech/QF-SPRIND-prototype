# Bemessungsrechnung Quadratic Funding — Prototyp

Eine einseitige, statische Webanwendung. Man richtet eine Förderrunde ein, lässt sie
simulieren, und die Seite rechnet sie nach **budgetbeschränktem Quadratic Funding**
durch, stellt das Ergebnis vier herkömmlichen Vergabeverfahren gegenüber und erzeugt
daraus eine prüffähige Nachweismappe.

Die Simulation ist **seed-gesteuert**: Gleicher Seed und gleiche Einstellungen erzeugen
dieselbe Runde und damit dieselbe Prüfsumme. Zufällig ist nur, wie die Runde zustande
kommt, nie, was daraus gerechnet wird.

Jede gerechnete Runde lässt sich als **Link teilen**. Er trägt Seed und
Einstellungen; wer ihn öffnet, sieht dieselbe Runde und dieselbe Prüfsumme.
Wurden die Vorhaben nicht von Hand geändert, genügt der Seed — sie werden aus
ihm neu abgeleitet, und der Link bleibt rund hundert Zeichen kurz.

Zwei **Programmtypen** stehen zur Wahl, vier Größenordnungen auseinander: eine
Bürgerbeteiligung mit 180 Personen und einem Topf von 2.500 €, und ein gemeinsam von
Bund und Ländern finanziertes Programm mit 110 beitragenden Stellen und 8 Mio. €.
Beide rechnen mit **derselben Bemessungsregel in derselben Fassung** — das ist der
Beleg für die Skalierbarkeit, nicht ein zweites Werkzeug.

Ein zweiter Bereich, **Wie das Verfahren rechnet**, erklärt die Formel als Bild:
Jeder Beitrag wird zu einem Quadrat der Seitenlänge √c, auf der Diagonale
aufgereiht spannen sie ein großes Quadrat auf. Dessen Fläche ist der
Gesamtfinanzierungswert, die Fläche über den Beitragsblöcken der Bemessungswert.
Die Darstellung folgt Miller, Weyl und Erichsen, *Beyond Collusion Resistance*
(2022), Abbildungen 1 bis 3.

Der Satz, den die Seite belegen soll:

> Bei gleicher Eingabe kommt immer dasselbe heraus, jede Fassung trägt eine
> Versionsnummer, und jede einzelne Zuteilung ist von Hand nachrechenbar.

## Was das ist

* Ein **Prototyp** zur Demonstration der Nachrechenbarkeit und der Vergleichsrechnung.
* Ein **Rechenkern** in `src/kern/`, der ohne Oberfläche testbar ist und eine
  Versionsnummer trägt. **Ändert sich das Rechenergebnis, ändert sich die Version.**
* Eine **veröffentlichte Rechenregel** in [FORMEL.md](FORMEL.md), geschrieben so, dass
  eine sachbearbeitende Person sie mit Taschenrechner und Tabellenkalkulation
  nachvollziehen kann.

## Was das nicht ist

* **Kein Produktivsystem.** Statische Seite, kein Backend, keine Datenbank, keine Anmeldung.
* **Keine echten Daten.** Sämtliche Vorhaben, Träger und beitragenden Personen sind
  synthetisch erzeugt (`tools/seed.ts`, fester Seed). Es besteht keine Verbindung zu
  tatsächlichen Vereinen, Vorhaben oder Personen.
* **Kein Zahlungsverkehr.** Es wird nichts überwiesen, eingezogen oder verwahrt.
* **Keine EUDI-Wallet- oder eID-Anbindung.** Die Merkmale in den Demodaten sind
  Platzhalter für später bestätigte Merkmale.
* **Kein Verwaltungsakt.** Die erzeugte Nachweismappe ist kein Zuwendungsbescheid und
  begründet keinen Anspruch. Das Werkzeug bemisst und dokumentiert; bescheiden tut die
  Behörde.
* **Nicht das geförderte Endprodukt**, sondern ein Zwischenstand zur Erprobung.

## Lokal starten

Voraussetzung: Node 20 oder neuer.

```bash
npm ci
npm run dev        # Entwicklungsserver
npm test           # Tests im Beobachtungsmodus
npm run test -- --run   # Tests einmalig
npm run build      # Typprüfung und Produktionsbau nach dist/
```

Weitere Skripte:

```bash
npm run seed       # erzeugt src/daten/runde-demo.json neu (fester Seed, gleiches Ergebnis)
npm run golden     # friert das Rechenergebnis in test/golden/runde-demo.json ein
```

`npm run golden` ist **nicht** die Antwort auf einen fehlgeschlagenen Golden-Test. Schlägt
er fehl, hat sich das Rechenergebnis bei gleicher Eingabe geändert; dann ist zuerst die
Fassungsnummer in `src/kern/version.ts` zu erhöhen und `FORMEL.md` zu ergänzen.

## Aufbau

```
src/kern/        reine Rechenbibliothek — keine React-, DOM- oder UI-Importe
                 (Formel, Verteilung, Vergleichsverfahren, Kennzahlen,
                  Prüfsumme, Hebel, Kopplungsabschlag, Rundenerzeuger,
                  Runde als Link)
src/ui/          Oberfläche: Einstellungen, eine Ergebnistabelle, Kennzahlen,
                 Erklärung der Formel als Flächenbild
src/nachweis/    Nachweismappe: Objektaufbau, Begründungstexte, Druckansicht
src/daten/       erzeugte Demodaten (eingecheckt)
tools/           schreibt Demodaten und Golden-Datei
test/            Ankertests, Kerntests, Vergleichs-, Simulations-, Link-,
                 Golden-Test
docs/            Primärquelle zur Formel
```

Der Rundenerzeuger liegt in `src/kern/simulation.ts`, nicht in `tools/`: Browser und
Befehlszeile müssen dieselbe Runde erzeugen, sonst wäre die eingecheckte Demorunde nicht
mehr das, was die Seite zeigt.

Die Trennung ist verbindlich: `src/kern/**` importiert nichts aus React, dem DOM oder
`src/ui`. Der Rechenkern muss unverändert in anderem Zusammenhang laufen und für sich
testbar sein.

## Herkunft der Formel

Grundformel und Verteilung bei begrenztem Topf folgen Buterin, Hitzig und Weyl:
*A Flexible Design for Funding Public Goods* (arXiv:1809.06421v2), Definition 5 und
Definition 7. Die Fundstellen und die bewusste Abweichung — Höchstbetrag je Vorhaben
und iteratives Nachverteilen — sind in [FORMEL.md](FORMEL.md), Abschnitt 8, im Einzelnen
belegt, einschließlich dessen, was diese Abweichung am Optimalitätsargument der Quelle
kostet.

Der optionale Kopplungsabschlag stammt aus einer **anderen** Quelle (Vitalik Buterin,
*Pairwise coordination subsidies*, ethresear.ch, 2019) und ist nicht Bestandteil der
Bemessungsregel.

## Auslieferung

Bau und Auslieferung erfolgen über GitHub Actions
(`.github/workflows/deploy.yml`) bei jedem Push auf `main`. **Die Tests laufen vor dem
Bau** — ein Rechenkern, der die Ankertests reißt, wird nicht ausgeliefert.

Einmalig einzurichten: In den Repository-Einstellungen unter *Settings → Pages* muss als
Quelle **GitHub Actions** gewählt sein. Ohne diesen Schritt schlägt der Schritt
`deploy-pages` fehl.

Der Pfad `base` in `vite.config.ts` muss dem Repository-Namen entsprechen
(hier `/QF-SPRIND-prototype/`).

## Lizenz

[EUPL-1.2](LICENSE). Die Lizenz ist in allen Amtssprachen der Europäischen Union
gleichermaßen verbindlich; beigefügt ist die englische Fassung.
