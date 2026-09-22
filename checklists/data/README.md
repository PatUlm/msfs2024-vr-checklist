# Strukturierte Checklistendaten

Diese JSON-Dateien sind die einzige Quelle für Checklisteninhalte. Das
[Schema](checklist.schema.json) definiert Felder und zulässige Werte;
[style-guide.md](style-guide.md) die verbindlichen Schreibweisen.
Hier bleiben nur Regeln zur Bearbeitung und Quellenbelege, keine zweite
Feldreferenz oder Änderungschronik.

## Bearbeiten und zuordnen

- `challenge` benennt das System, `response` Zustand/Aktion. Bedingungen,
  Alternativen und Notizen getrennt pflegen. Texte einzeilig; die UI bricht um.
- Englische Ansagen verwenden `speech`, sonst `<challenge>: <response>`.
  `needsReview` und ein konkretes `reviewNote` kennzeichnen ungeklärte Inhalte.
- Checklist-, Gruppen- und Item-IDs sind stabile semantische Slugs in
  `lower-kebab-case`, auch bei Textänderungen. Item-IDs sind je Gruppe eindeutig;
  Referenzen zum Beispiel `sikorsky-mh-60/engine-start/engine-1-start`.
- Allein die Array-Reihenfolge bestimmt den Ablauf; kein separates `order`.
  Die Gruppe erhält eine Phase aus dem Schema. `Engine Start` umfasst auch
  Vorbereitung/APU/Nacharbeiten, `Taxi` die Rollvorbereitung, `Departure`
  Startvorbereitung/Start/Steigflug. Keine leeren Gruppen für ungenutzte Phasen.
  Die G36-Gruppe `Approach` bleibt trotz Landekonfiguration dieser Phase zugeordnet.
- Phasen dienen Anzeige und `Skip phase`: Aufeinanderfolgende Gruppen mit
  gleicher Phase bilden den übersprungenen Block. Phasenänderungen deshalb
  auch auf diese Wirkung prüfen.
- `aircraft.msfsMatches`: Regeln sind Alternativen; Felder einer Regel müssen
  gemeinsam passen. `equals`/`contains` werden normalisiert verglichen;
  `contains` braucht mindestens vier normalisierte Zeichen. Neue Regeln aus
  beobachteten MSFS-Werten ableiten. Fehlende/mehrdeutige Treffer laden keine
  Default-Checkliste; die angezeigten Diagnosewerte helfen beim Ergänzen.

```json
{
  "atcType": { "contains": "MH-60" },
  "title": { "contains": "MH60" }
}
```

Nach Datenänderungen `task validate`; vor Abschluss `task check` und Deployment
gemäß [AGENTS.md](../../AGENTS.md). Geänderte gesprochene Texte erfordern
passende [Audioassets](../../assets/audio/README.md).

Quellenreferenzen unter `checklists/references/` begründen Werte und bewusste
Auslassungen. Keine Originalhandbücher oder vollständigen Verfahrensabschriften
versionieren und keine zweite App-Checkliste in der Dokumentation pflegen.

## Inhaltliche Herkunft

Die Checklisten sind für die App angepasste Zusammenstellungen aus
Ingame-Abläufen und den nachfolgend dokumentierten Handbuchquellen. Bei der
Bearbeitung wurden KI-Werkzeuge als Hilfsmittel verwendet; fachliche Belege
sind die genannten Originalveröffentlichungen. Die
[Herkunftsprüfung](../../docs/checklist-license-review.md) hält die
Anbieterzuordnung und Bewertung des geprüften Bestands fest.

- Die minimale Cessna-152-Checkliste ist mit dem originalen Cessna-POH
  abgeglichen. Herkunft, Seitenangaben und die gewählten Werte innerhalb der
  POH-Bereiche stehen unter [`../references/cessna-152/`](../references/cessna-152/).
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
- Die A400M-Checkliste bildet einen für die App angepassten Ingame-Ablauf ab.
  Die Einträge des Abschnitts `EFIS and FMS Setup` (`fsm-init`) sind mit
  `needsReview` markiert, bis sie
  im Simulator bestätigt sind.
  Der offene Zuordnungsnachweis steht in [open-tests.md](../../docs/open-tests.md).
- Die G36-Checkliste ist bewusst eine minimale, unvollständige Merkliste
  ausgewählter Geschwindigkeiten, Klappen- und Fahrwerksstellungen.
