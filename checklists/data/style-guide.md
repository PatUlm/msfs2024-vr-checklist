# Checklist Style Guide

Dieser Style Guide hält die sprachlichen Konventionen für alle JSON-Checklisten
fest. Gleiche oder ähnliche Handlungen sollen flugzeugübergreifend gleich
aufgebaut und benannt sein.

## Titel

- `title` nennt ausschließlich das Luftfahrzeug, also Hersteller und Muster,
  zum Beispiel `Diamond DA42` oder `Sikorsky MH-60`.
- Zusätze wie `Checklist`, `+ ATC` oder `Minimal` gehören nicht in den Titel.
  Dass es sich um eine Checkliste handelt, ergänzen die Anzeigen und der
  PDF-Dateiname selbst; Umfang und Herkunft stehen in der Dokumentation.

## Challenge und Response

- Die Challenge benennt eindeutig das zu bedienende oder zu prüfende System.
  Dazu gehören auch Seiten- und Komponentennummern.
- Die Response enthält nur den geforderten Zustand oder die auszuführende
  Aktion.
- Nummern, die selbst eine Sollstellung oder einen Sollwert darstellen, bleiben
  in der Response.
- Bei `communication`-Items lautet die Challenge `COM: <Funkstelle>`, zum
  Beispiel `COM: ATIS`, `COM: Clearance`, `COM: Ground` oder `COM: Tower`. Das
  `COM:` benennt das zu bedienende Funkgerät — COM 1 oder COM 2 ist auf diese
  Station zu stellen —, nicht die Wortart „Communication“. Es steht damit in
  derselben Logik wie jede andere Challenge, die ein System benennt, und
  wiederholt das Typ-Label `ATC` nicht, das die Art der Handlung markiert.
- Ein überspringbares Item bekommt den Kind `optional`. Seine Optionalität wird
  nicht zusätzlich in die Response geschrieben; `As required` bleibt Items
  vorbehalten, die zwar abzuarbeiten sind, deren Sollzustand aber von der
  Situation abhängt.

Beispiele:

| Challenge               | Response       | Begründung                              |
| ----------------------- | -------------- | --------------------------------------- |
| Fuel Boost Pumps [1+2]  | On             | `[1+2]` identifiziert die Pumpen.       |
| Engine 1                | Start + IDLE   | `1` identifiziert das Triebwerk.        |
| Flaps                    | 2 (Full)       | `2` ist die geforderte Klappenstellung. |
| Landing Speed           | 80 kt          | `80 kt` ist der geforderte Wert.        |

## Nummerierte Komponenten

- Ein gemeinsam gemeintes Komponentenpaar wird in der Challenge kompakt als
  `[1+2]` geschrieben. Zwischen Ziffern und Pluszeichen stehen keine
  Leerzeichen.
- Eckige Klammern kennzeichnen die Paarangabe als Komponenten-Scope und trennen
  sie klar vom eigentlichen Challenge-Namen. Runde Klammern bleiben erklärenden
  Zusätzen vorbehalten, zum Beispiel der Sollstellung `1 (Approach)`.
- `1/2` wird nicht verwendet, weil der Schrägstrich auch eine Alternative oder
  einen Bruch ausdrücken kann.
- Eine einzelne Komponente wird mit Leerzeichen geschrieben, zum Beispiel
  `Engine 1`.
- Eigenständig zu bestätigende Bedienelemente erhalten getrennte Items. Sie
  werden nicht allein wegen eines kompakten Quelldokuments mit Pluszeichen in
  einer Challenge zusammengefasst; so bleiben beispielsweise `SAS [1+2]` und
  `TRIM` getrennt wahrnehmbar.
- Verbindet ein Pluszeichen mehrere Zustände oder Aktionen innerhalb einer
  Response, wird es zur Lesbarkeit von Leerzeichen umgeben, zum Beispiel
  `Start + IDLE`.
- Ein optionaler `speech`-Text formuliert Nummern natürlich aus, zum Beispiel
  `one and two`; die kompakte Bildschirmschreibweise wird nicht vorgelesen.

## Einheiten und Begriffe

- Einheiten folgen mit einem Leerzeichen auf den Wert, zum Beispiel `80 kt`
  oder `100 %`.
- Bereits etablierte Challenge-Namen werden für gleiche Vorgänge wiederverwendet.
  Neue Flugzeug-Checklisten orientieren sich zuerst an vorhandenen Einträgen,
  bevor neue Synonyme eingeführt werden.
- Bei Geschwindigkeiten wird ein fachlich passendes Kürzel ergänzt, etwa
  `Rotation Speed (Vr)`, `Climb Speed (Vy)` oder `Approach Speed (Vapp)`.
  Grenzwerte in Bedingungen nennen ebenfalls ihr Kürzel, etwa `Vfe` für die
  maximale Geschwindigkeit mit ausgefahrenen Klappen. Ein normaler Steigflug
  wird nur dann als `Vy` bezeichnet, wenn tatsächlich die Geschwindigkeit für
  die beste Steigrate gemeint ist; ein gewählter Anflugwert wird nicht ohne
  Quellenbeleg zu `Vref` erklärt.
- `kt` bezeichnet die Einheit Knoten, `KIAS` zusätzlich den Bezug auf die
  angezeigte Fluggeschwindigkeit. Bei kompakter Anzeige in `kt` bleibt der
  belegte Bezug auf IAS, TAS oder Ground Speed in Hinweisen beziehungsweise
  Bedingungen und im Herkunftsnachweis erhalten.
- Abkürzungen dürfen im sichtbaren Text stehen. Wenn die automatische
  Aussprache unklar wäre, erhält der Eintrag einen vollständig formulierten
  `speech`-Text.

## Gesprochene Prüfaufforderungen

- Jeder Eintrag mit `kind: "verify"` erhält einen `speech`-Text, der mit
  `Verify ` beginnt, zum Beispiel `Verify A P U indicator: On.`.
  Die sichtbare Challenge bleibt der Systemname; das vorhandene Verify-Badge
  kennzeichnet die Prüfhandlung in der Oberfläche.
