# Checklist Style Guide

Dieser Style Guide hält die sprachlichen Konventionen für alle JSON-Checklisten
fest. Gleiche oder ähnliche Handlungen sollen flugzeugübergreifend gleich
aufgebaut und benannt sein.

## Challenge und Response

- Die Challenge benennt eindeutig das zu bedienende oder zu prüfende System.
  Dazu gehören auch Seiten- und Komponentennummern.
- Die Response enthält nur den geforderten Zustand oder die auszuführende
  Aktion.
- Nummern, die selbst eine Sollstellung oder einen Sollwert darstellen, bleiben
  in der Response.

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
- Abkürzungen dürfen im sichtbaren Text stehen. Wenn die automatische
  Aussprache unklar wäre, erhält der Eintrag einen vollständig formulierten
  `speech`-Text.
