# Bemessungsrechnung Quadratic Funding — Prototyp

Eine einseitige, statische Webanwendung. Sie rechnet eine fiktive Förderrunde nach
**budgetbeschränktem Quadratic Funding** durch, stellt das Ergebnis vier herkömmlichen
Vergabeverfahren gegenüber und erzeugt daraus eine prüffähige Nachweismappe.

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
src/ui/          Oberfläche
src/nachweis/    Nachweismappe: Objektaufbau, Begründungstexte, Druckansicht
src/daten/       erzeugte Demodaten (eingecheckt)
tools/           Erzeugung von Demodaten und Golden-Datei
test/            Ankertests, Kerntests, Vergleichstests, Golden-Test
docs/            Primärquelle zur Formel
```

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
