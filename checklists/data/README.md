# Strukturierte Checklistendaten

`checklist.schema.json` definiert das versionierbare Austauschformat der EFB-App. `challenge` und `response` enthalten die kanonischen, direkt darstell- und vorlesbaren Texte. Varianten und Bedingungen werden getrennt in `alternatives` beziehungsweise `condition` erfasst und nicht in `response` wiederholt. Ergänzende Anzeigeinformationen, die weder Antwort noch Bedingung sind, stehen in `notes`. Die strukturierten Daten sind bewusst von Aufbau und Format der ursprünglichen Quelldokumente entkoppelt.

Verbindliche Schreibweisen und die inhaltliche Abgrenzung von Challenge und
Response stehen im [`style-guide.md`](style-guide.md). Er ist bei jeder
inhaltlichen Änderung zusammen mit diesem Dokument zu beachten.

Textfelder bleiben einzeilig; die spätere Oberfläche übernimmt das visuelle Wrapping. Dadurch enthalten die Daten keine aus Tabellenlayouts übernommenen Zeilenumbrüche.

Die JSON-Dateien in diesem Verzeichnis sind die einzige Quelle für Checklist-Inhalte. Anwendungscode darf keine separate oder duplizierte Checklist-Liste enthalten.

`aircraft.msfsMatches` enthält explizite Regeln für die String-SimVars
`ATC MODEL`, `ATC TYPE` und `TITLE`. Mehrere Regeln werden als Alternativen
behandelt; alle Felder innerhalb einer Regel müssen gemeinsam passen. Jedes Feld
verwendet bewusst entweder `equals` oder `contains`. Vor dem Vergleich
normalisiert die App Groß-/Kleinschreibung, Leerzeichen und Satzzeichen.
`contains` muss mindestens vier normalisierte Zeichen enthalten. Neue Regeln
werden erst nach Beobachtung im MSFS ergänzt. Mehrdeutige Treffer laden aus
Sicherheitsgründen keine Checkliste. Bei einer fehlenden Zuordnung zeigt der
Leerzustand alle drei Werte in einer `Model:`-Zeile an.

Beispiel für eine kombinierte Regel:

```json
{
  "atcType": { "contains": "MH-60" },
  "title": { "contains": "MH60" }
}
```

Die erste TTS-Sprache ist Englisch. Für einfache Einträge bildet die App den gesprochenen Text aus `<challenge>: <response>`. Das optionale Feld `speech` überschreibt diesen Fallback mit einem vollständig formulierten Satz, wenn Bedingungen, Alternativen, Abkürzungen oder Aussprache sonst nicht zuverlässig wiedergegeben würden.

Unklare Inhalte werden mit `needsReview: true` markiert. `reviewNote` beschreibt
konkret, was noch geprüft werden muss; die App stellt diesen Hinweis sichtbar
in der Checklistenansicht dar.

## IDs und Reihenfolge

Jede Gruppe enthält ein Pflichtfeld `phase` mit genau einem der englischen
Werte `Engine Start`, `Taxi`, `Departure`, `Cruise`, `Descent`, `Approach`,
`Landing`, `After Landing` oder `Shutdown`. Die zulässigen Werte stehen im
Schema; `task validate` prüft sie. Sie sind direkt darstellbare Bezeichnungen,
keine aus dem Gruppennamen abgeleiteten Werte.

`Engine Start` umfasst auch Vorbereitung, APU und Nacharbeiten zum
Triebwerksstart. `Taxi` umfasst die Vorbereitung zum Rollen. `Departure`
umfasst Startvorbereitung, Start und Steigflug. Die kombinierte G36-Gruppe
`Approach` bleibt trotz enthaltener Landekonfiguration der Phase `Approach`
zugeordnet. `Cruise`, `Descent` und `After Landing` sind für spätere Gruppen
vorgesehen; leere Gruppen werden dafür nicht angelegt.

Die Phase klassifiziert die Gruppe. Sie ändert weder Reihenfolge noch
Fortschrittslogik oder Sprachausgabe.

Checklist-, Abschnitts- und Eintrags-IDs sind stabile semantische Slugs in `lower-kebab-case`. Eine Eintrags-ID muss innerhalb ihres Abschnitts eindeutig sein. Vollständige Referenzen werden hierarchisch zusammengesetzt, zum Beispiel `sikorsky-mh-60/engine-start/engine-1-start`.

IDs werden nach ihrer erstmaligen Vergabe nicht automatisch aus dem Anzeigetext neu erzeugt. Textänderungen und neu eingefügte Einträge verändern daher keine bestehenden Referenzen.

Die Reihenfolge wird ausschließlich durch die JSON-Arrays festgelegt: `sections[]` bestimmt die Abschnittsreihenfolge, `items[]` die Eintragsreihenfolge. Ein separates `order`-Feld ist nicht vorgesehen.

Die strukturellen Invarianten werden über den projektweiten Task geprüft:

```bash
task validate
```

Quelldokumente unter `checklists/source/` dienen ausschließlich als lokale Referenz und werden nicht von Git versioniert. Die JSON-Dateien in diesem Verzeichnis sind die prüfbaren, versionierbaren Daten für die Anwendung.

Nachvollziehbare, eng begrenzte Auszüge aus öffentlich zugänglichen Quellen
liegen versioniert unter `checklists/references/`. Sie dokumentieren Herkunft und
Ableitung der Checklistendaten, sind aber weder eine zweite Datenquelle der App
noch ein Ersatz für das jeweils gültige Flughandbuch.

## Inhaltliche Herkunft

- Die minimale Cessna-152-Checkliste ist mit dem originalen Cessna-POH
  abgeglichen. Herkunft, Seitenangaben und die gewählten Werte innerhalb der
  POH-Bereiche stehen unter [`../references/cessna-152/`](../references/cessna-152/).
- Die lokalen ODS-Referenzen für DA42 und MH-60 liegen ausschließlich unter
  `checklists/source/` und bleiben unversioniert. Die JSON-Dateien sind die
  daraus abgeleitete, kanonische Fassung.
- Verhaltensänderungen der Miltech-MH-60 stehen im Changelog des
  [Miltech Bug Trackers](https://bugs.miltechsimulations.com/) (Produkt
  `MH60`), maschinenlesbar unter
  `https://bugs.miltechsimulations.com/api/products` (Feld `changelog`, inkl.
  `EXPERIMENTAL`-Builds). Das ältere Forum-Topic
  [MH60 Release Notes](https://miltechsimulations.talkyard.net/-337/miltech-simulations-mh60-release-notes)
  endet bei V1.1.0. Keybinds und Systembeschreibung:
  [Miltech Documentation Hub](https://docs.miltechsimulations.com/miltech-simulations-mh60).
- Die H125-Reihenfolge für den kompakten Motorstart stützt sich auf die
  veröffentlichte
  [AS350/H125-Operatorcheckliste](https://aviapages.com/media/2022/03/14/Checklist_H125.pdf):
  Pitot Heat folgt auf Generator und Avionik und liegt vor dem Übergang des
  Twist Grip auf `FLIGHT`.
- Die für Prestart, Motorstart, Run-up und Shutdown relevanten H125-Verfahren
  sind mit Seitenangaben und Herkunftsnachweis unter
  [`../references/h125/`](../references/h125/) festgehalten.
- Die kompakte OH-6A-/H500C-Checkliste ist aus der Expert-Checkliste im
  veröffentlichten Taog's-Hangar-Flughandbuch abgeleitet. Herkunft,
  Variantenabgrenzung und bewusste Auslassungen stehen unter
  [`../references/oh6a-h500c/`](../references/oh6a-h500c/).
- Der kompakte H125-Shutdown stützt sich auf den veröffentlichten
  [AS350-B3e-Flight-Manual-Auszug](https://data.ntsb.gov/Docket/Document/docBLOB?FileExtension=.PDF&FileName=Excerpts+from+AS350+Flight+Manual%2C+Revisions+2+%26+3+-+Normal+Procedures-Master.PDF&ID=40431411):
  Twist Grip auf `IDLE`, 30 Sekunden Cool-down, anschließend die verwendeten
  Systeme abschalten und die Rotorbremse erst bei höchstens 140 Rotor-RPM
  betätigen.
- Die A400M-Checkliste ist ein vom Benutzer bereitgestellter Entwurf; die
  lokale Vorlage liegt unter `checklists/source/Airbus A400M 2026-09-19.md`.
  Die Einträge des Abschnitts `EFIS and FMS Setup` (`fsm-init`) sind mit
  `needsReview` markiert, bis sie
  im Simulator bestätigt sind; `Flight Plan` hatte im Entwurf keine Response.
  Die `msfsMatches`-Regel ist noch nicht im MSFS beobachtet.
- Die G36-Checkliste ist bewusst eine minimale, unvollständige Referenz aus den
  vom Benutzer bereitgestellten Werten; es wurden keine zusätzlichen
  Verfahrensschritte erfunden. Der Benutzer bestätigte, dass `Flag`/`Flags` in
  der Vorlage `Flap`/`Flaps` bedeutete.
