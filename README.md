# MSFS 2024 VR Checklist

Native, offlinefähige Checklist-App für das Electronic Flight Bag (EFB) von
Microsoft Flight Simulator 2024. Die App lädt passend zum aktuellen Flugzeug
eine versionierte Checkliste und zeigt ihre Einträge als große, anklickbare
Checklist-Zeilen.

## Features

Aktuell verfügbar:

- native, offlinefähige MSFS-2024-EFB-App
- versionierte und validierte Checklistendaten im JSON-Format
- VR-first Oberfläche mit großen, vollständig anklickbaren Items
- genau eine sichtbare Gruppe mit Vor-/Zurück-Navigation
- automatischer Wechsel nach Abschluss einer Gruppe
- Fortschrittsanzeige und Reset beim Laden eines neuen Fluges
- semantische Darstellung von Action-, Verify- und Communication-Items
- automatische Auswahl der Checkliste anhand des geladenen Flugzeugmodells
- zentrierter Leerzustand mit Diagnosewerten, wenn keine passende Checkliste
  vorhanden ist
- minimale Zwei-Gruppen-Checkliste für die Beechcraft Bonanza G36
- kleine SemVer-basierte Entwicklungskennung am unteren rechten Rand

## Bestätigungstaste belegen

Die App hakt das nächste offene Item ab, wenn ein bestimmtes Sim-Key-Event
feuert. Belegt wird es in MSFS unter **Steuerungen**; die Suche dort erwartet den
Anzeigenamen der Action, nicht den Eventnamen:

| Eventname      | Anzeigename in den Steuerungen |
| -------------- | ------------------------------ |
| `LEAD_POLE_ON` | `LEAD POLE ON`                 |

Der Anzeigename ist der Eventname ohne Unterstriche. Bei einer anderen
Sim-Sprache kann er abweichen; eine hier ergänzte Zeile erspart dann die Suche.

Zwei Einschränkungen:

- Der Druck wirkt nur, solange die Checklisten-App im EFB offen ist. Das ist
  beabsichtigt.
- Das Steuerungsmenü zeigt nur Actions der geladenen Flugzeugkategorie. In der
  MH-60 und der H125 erscheint `LEAD POLE ON` deshalb nicht und ist dort nicht
  belegbar; der Stand dazu steht in
  [docs/adr/0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).

## Bekannte Einschränkungen

- Die MSFS-EFB-Aktion `VALIDATE` wird in SDK 1.7.3 nicht an diese Custom-App
  weitergereicht. Enter, Numpad Enter und ein physisches Gamepad wurden über
  DOM-, Input-Stack- und `AppView`-Interaction-Pfade ohne eingehenden Callback
  getestet. Deshalb ist aktuell kein wirkungsloser Eingabe-Listener aktiv. Die
  Ursache ist inzwischen belegt: Alle `KEY_EFB_*`-Aktionen tragen in der
  SDK-Input-Datenbank das Tag `norebind_kbmpad` und sind für Tastatur, Maus und
  Pad überhaupt nicht belegbar. Die schnelle Bestätigung entsteht stattdessen in
  Phase 2 über ein frei belegbares Sim-Key-Event, das die EFB-App direkt
  abfängt; siehe
  [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).

## Entwicklungsmodell

Das Linux-native WSL2-Repository ist die einzige editierbare Source of Truth.
Build und TypeScript-Entwicklung laufen ausschließlich unter WSL2. Ein
deterministisches One-Way-Deployment überträgt nur die für den MSFS Project
Editor benötigten Dateien in ein Windows-lokales Staging.

Das installierte SDK und dessen Samples bleiben strikt read-only. Die benötigten
Dateien des offiziellen EFB Template Samples aus SDK 1.7.3 wurden unter `msfs/`
in dieses Repository kopiert und nur dort angepasst.

Verifizierte Werkzeuge:

- Microsoft Flight Simulator 2024 SDK `1.7.3`
- Node.js `v24.19.0`
- npm `11.17.0`
- Task `v3.37.2`

## Einstieg

Nach einem frischen Clone:

```bash
task init
task install
task check
```

`task init` legt ausschließlich den lokalen, ignorierten Ordner `tmp/` an und
führt keine Downloads aus. `task install` installiert den gelockten
Abhängigkeitsstand der EFB-App mit `npm ci`.

## Projekt-Tasks

Alle projektweiten Abläufe beginnen im Repository-Root:

| Task                                      | Wirkung                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `task init`                               | Legt lokale, ignorierte Arbeitsverzeichnisse an |
| `task install`                            | Installiert die EFB-Abhängigkeiten              |
| `task validate`                           | Prüft alle versionierten Checklistendaten       |
| `task build`                              | Validiert die Daten und baut die EFB-App        |
| `task watch`                              | Startet den Watch-Build für die EFB-App         |
| `task deploy`                             | Baut und deployed ins Windows-Staging           |
| `task release`                            | Erzeugt das in `VERSION` deklarierte Release     |
| `task community:install`                  | Installiert das aktuelle Release in `Community2024` |
| `task community:install VERSION=x.y.z`    | Installiert gezielt ein vorhandenes Release      |
| `task check`                              | Führt die vollständige lokale Prüfung aus       |

Die `package.json` unter `msfs/PackageSources/VRChecklist/` bleibt für rein
Frontend-spezifische npm-Skripte zuständig. Nichttriviale projektweite Logik
liegt unter `scripts/`.

## Verzeichnisstruktur

```text
assets/branding/                         editierbare Branding-Quellen
VERSION                                  kanonische SemVer-Projektversion
checklists/data/                         kanonische Checklistendaten
msfs/VRChecklistProject.xml              MSFS-DevMode-Projekt
msfs/PackageDefinitions/                 Paketdefinition und ContentInfo
msfs/PackageSources/VRChecklist/          TypeScript/SCSS-App und Build
msfs/PackageSources/efb_api/              kopierte EFB-API aus SDK 1.7.3
msfs/PackageSources/vendor/               kopiertes MSFS-SDK-Paket
scripts/                                  Validierung und One-Way-Deployment
```

`node_modules/`, `dist/` und Ausgaben des MSFS Project Editors werden nicht
versioniert.

## Checklistendaten

Die JSON-Dateien unter `checklists/data/` sind die einzige Quelle für
Checklist-Inhalte:

- `diamond-da42.json`: 7 Abschnitte mit 52 Einträgen
- `beechcraft-bonanza-g36.json`: 2 Abschnitte mit 10 Einträgen
- `sikorsky-mh-60.json`: 5 Abschnitte mit 32 Einträgen
- `checklist.schema.json`: gemeinsamer Datenvertrag

Die App importiert alle drei JSON-Dateien über eine zentrale Registry; es
existiert keine zweite Liste mit Checklist-Inhalten im App-Code. Explizite
`aircraft.msfsMatches`-Regeln ordnen die SimVars `ATC MODEL`,
`ATC TYPE` und `TITLE` einer Checkliste zu. Die Regeln unterstützen kontrollierte
exakte und Teilstring-Vergleiche sowie gemeinsam erforderliche Felder.
Unbekannte Flugzeuge zeigen alle drei Werte direkt im Leerzustand, damit neue
Regeln gezielt ergänzt werden können. Das Schema unterstützt weiterhin die
sichtbaren Felder
`needsReview` und `reviewNote`; die aktuell versionierten Checklisten enthalten
keine offenen Review-Markierungen.

Validierung ohne App-Build:

```bash
task validate
```

## App-Build

Ein einmaliger Build wird mit folgendem Befehl erzeugt:

```bash
task build
```

Die gebündelten JavaScript-, CSS- und Asset-Dateien entstehen unter
`msfs/PackageSources/VRChecklist/dist/`. Die aus dem offiziellen Template
übernommenen Entwicklungswerte sind `TYPECHECKING=true`, `SOURCE_MAPS=true` und
`MINIFY=false`.

Die Root-Datei `VERSION` enthält die kanonische SemVer-Projektversion. Ein
Entwicklungsbuild ergänzt sie automatisch um einen UTC-Zeitstempel im Format
`x.y.z-dev.YYYYMMDDHHMMSS`. Ein Release zeigt dagegen exakt `x.y.z`; derselbe
Wert wird auch in das MSFS-Manifest und das Release-Artefakt übernommen.

Während der Entwicklung:

```bash
task watch
```

## Windows-Staging

Der Standard-Deploy erzeugt beziehungsweise aktualisiert:

```text
/mnt/c/dev/msfs2024-vr-checklist-staging
C:\dev\msfs2024-vr-checklist-staging
```

Ausführung:

```bash
task deploy
```

Ein abweichendes Laufwerk kann explizit angegeben werden; der schützende
Verzeichnisname bleibt verbindlich:

```bash
task deploy STAGING_DIR=/mnt/d/dev/msfs2024-vr-checklist-staging
```

Das Deploymentskript überträgt ausschließlich:

- `VRChecklistProject.xml`
- `PackageDefinitions/`
- `PackageSources/VRChecklist/dist/`
- das gerenderte ContentInfo-Thumbnail aus `assets/branding/`

Es verweigert ein nicht leeres Staging, das nicht bereits durch seinen Marker
diesem Projekt zugeordnet ist. Bei Folgedeployments werden nur die verwalteten
Eingaben ersetzt. Die vom Project Editor erzeugten Verzeichnisse `Packages/`,
`PackagesMetadata/` und `_PackageInt/` bleiben erhalten. Es gibt keine
Synchronisation vom Windows-Staging zurück in das Repository.

## Releases und Community-Installation

Windows-spezifische SDK-, Release- und `Community2024`-Pfade werden lokal in
einer ignorierten Root-`.env` konfiguriert. Ein produktives, versioniertes Paket
wird gebaut mit:

```bash
task release
```

Die aktuelle, zuvor erzeugte Version wird bei beendetem MSFS installiert mit:

```bash
task community:install
```

Der vollständige Ablauf, Rollbacks, das gemeinsame Versionsmodell und die
Sicherheitsprüfungen sind ausschließlich in
[`docs/release.md`](docs/release.md) dokumentiert.

## Packaging und Test in MSFS 2024

1. Unter WSL2 `task deploy` erfolgreich ausführen.
2. MSFS 2024 mit aktiviertem Developer Mode starten.
3. Vor dem Start eines Fluges über `File` → `Open project…` folgende Datei
   öffnen:

   ```text
   C:\dev\msfs2024-vr-checklist-staging\VRChecklistProject.xml
   ```

4. Im Project Editor `Build All In Project` ausführen.
5. Einen Flug mit einem EFB-fähigen Flugzeug starten und `VR Checklist` öffnen.
6. Nach Folgebuilds im Coherent Debugger `Ignore Cache` aktivieren und die App
   mit `Reload` neu laden.
7. Checkboxen, Scrollverhalten und semantische Hinweise zunächst in 2D,
   anschließend in VR prüfen.
8. Einen zweiten Flugzeugtyp und einen Lauf ohne Netzwerkverbindung testen.
9. Die DevMode-Konsole auf JavaScript-, Paket- und Ressourcenfehler prüfen.

Nach Änderungen gilt:

```text
Source ändern → task deploy → Build All In Project → Ignore Cache + Reload → im EFB testen
```

Für reine UI-Änderungen ist dabei kein kompletter Neustart von MSFS 2024 nötig.
Ein neuer Flug wird nur benötigt, wenn Lifecycle- oder Reset-Verhalten geprüft
werden soll.

## Design- und Agentendokumentation

- `ROADMAP.md`: knappe Meilensteine und aktueller Projektstand
- `AGENTS.md`: dauerhafte Arbeitsregeln für neue Agent-Sessions
- `CLAUDE.md`: Weiterleitung auf `AGENTS.md` für Werkzeuge, die diese Datei
  nicht automatisch laden
- `docs/msfs-sdk-reference.md`: zentrale technische SDK-Referenz mit bestätigten
  Fakten, Do's, Don'ts und nachgewiesen wirkungslosen Pfaden
- `docs/design-decisions.md`: akzeptierte UI- und Interaktionsentscheidungen
- `docs/design-qa.md`: offene visuelle Nachweise und Referenzen für den nächsten
  UI- oder VR-Teststand
- `docs/open-tests.md`: einzige lebende Liste offener Laufzeitnachweise
- `docs/phase-3-requirements.md`: verbindlicher Produktumfang der geplanten
  Begleit-App
- `docs/release.md`: reproduzierbarer Release- und Community2024-Installationsflow
- `docs/phase-2-3-research.md`: technische Recherche zu Phase 2 und Phase 3 mit
  Kandidaten, Belegen und Lizenzlagen
- `docs/adr/`: getroffene Architekturentscheidungen mit ihren verworfenen
  Alternativen und ihrem Status
- `docs/assets/`: versionierte, dauerhaft referenzierte Design-Screenshots

## Offizielle Referenzen

- [EFB Template Sample](https://docs.flightsimulator.com/msfs2024/retail/samples-tutorials/samples/efb/efb-template-sample/)
- [Electronic Flight Bag API](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/efb/electronic-flight-bag-api/)
- [Simulation Variables](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/simvars/simulation-variables/)
- [Key Events](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/key-events/key-events-index/)
- [Project Editor](https://docs.flightsimulator.com/msfs2024/flighting/devmode/editors/project-editor/the-project-editor/)
- [SDK release notes for 360 × 240 My Library images](https://docs.flightsimulator.com/msfs2024/retail/introduction/sdk-release-notes/)
