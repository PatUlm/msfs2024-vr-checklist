# MSFS 2024 VR Checklist

Native, offlinefähige Checklist-App für das Electronic Flight Bag (EFB) von
Microsoft Flight Simulator 2024. Die App lädt passend zum aktuellen Flugzeug
eine versionierte Checkliste und zeigt ihre Einträge als große, anklickbare
Checklist-Zeilen.

## Features

Die EFB-App:

- arbeitet offline und bleibt ohne Begleit-App vollständig bedienbar;
- wählt automatisch die zum Flugzeug passende, versionierte JSON-Checkliste;
- bietet große, vollständig anklickbare Items und Bestätigung per Taste oder HOTAS;
- zeigt eine Gruppe mit Vor-/Zurück-Navigation, automatischem Gruppenwechsel
  und grünen Haken für vollständig erledigte Gruppen;
- unterscheidet Action-, Verify-, ATC- und Optional-Items und zeigt den
  Fortschritt der Pflichtitems;
- erhält den Fortschritt beim Wechsel zwischen VR und Nicht-VR und setzt ihn
  beim Laden eines neuen Fluges zurück;
- zeigt Diagnosewerte für Flugzeuge ohne passende Checkliste.

Die Windows-Begleit-App:

- zeigt Simulatorverbindung, EFB-Status, Flugzeug, aktive Gruppe, nächstes Item
  und Fortschritt;
- liest das nächste offene Item auf Englisch mit Brian vor und meldet den
  Gruppenabschluss mit `Checklist completed`;
- bietet gespeicherte Einstellungen für `Read checklist items` und den live
  angewendeten `Radio effect`, beide standardmäßig eingeschaltet;
- lässt das Audio-Ausgabegerät unabhängig vom Windows-Standard wählen und
  mit `Test sound` prüfen;
- zeigt alle mitgelieferten Checklisten und erlaubt Textkopie sowie PDF-Export;
- zeigt Release Notes vollständig offline und kann unbekannte
  Flugzeugkennungen zur Ergänzung der Zuordnung kopieren.

Mitgeliefert werden Checklisten für Airbus A400M, Airbus H125, Beechcraft
Bonanza G36, Cessna 152, Diamond DA42, Hughes OH-6A/500C und Sikorsky MH-60.
Die acht noch ungeprüften A400M-Einträge unter `FSM Init` sind sichtbar
markiert und vorerst von den Sprachansagen ausgenommen.

## Bestätigungstaste belegen

Die App hakt das nächste offene Item ab, wenn ein bestimmtes Sim-Key-Event
feuert. Belegt wird es in MSFS unter **Steuerungen**; die Suche dort erwartet den
Anzeigenamen der Action, nicht den Eventnamen:

| Eventname    | Anzeigename in den Steuerungen |
| ------------ | ------------------------------ |
| `PLASMA_OFF` | `SET PLASMA OFF`               |

Der Anzeigename ist der Eventname ohne Unterstriche. Bei einer anderen
Sim-Sprache kann er abweichen; eine hier ergänzte Zeile erspart dann die Suche.

Zwei Einschränkungen:

- Der Druck wirkt nur, solange die Checklisten-App im EFB offen ist. Das ist
  beabsichtigt.
- Die Action wird mit Pass-through abgefangen. In G36, DA42, H125 und MH-60
  bedient sie kein bekanntes System; für andere Flugzeuge ist das nicht
  zugesagt. Der Stand dazu steht in
  [docs/adr/0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).

## Entwicklungsmodell

Das Linux-native WSL2-Repository ist die einzige editierbare Source of Truth.
Build und Entwicklung laufen aus WSL2. Deterministische One-Way-Deployments
übertragen die EFB-Eingaben für den MSFS Project Editor und die gebauten
Companion-Dateien in getrennte Windows-lokale Staging-Verzeichnisse.

Das installierte SDK und dessen Samples bleiben strikt read-only. Die benötigten
Dateien des offiziellen EFB Template Samples aus SDK 1.7.3 wurden unter `msfs/`
in dieses Repository kopiert und nur dort angepasst.

Verifizierte Werkzeuge:

- Microsoft Flight Simulator 2024 SDK `1.7.3`
- Node.js `v24.19.0`
- npm `11.17.0`
- Task `v3.37.2`
- Docker `29.7.2`
- .NET SDK `10.0.302` im fest versionierten Build-Container

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
| `task companion:build`                    | Baut Windows-App und Transporttest               |
| `task companion:test`                     | Prüft Transport, Audio und Companion-Verhalten   |
| `task companion:deploy`                   | Deployed App und Test ins Windows-Staging        |
| `task deploy`                             | Baut und deployed ins Windows-Staging           |
| `task release`                            | Erzeugt das in `VERSION` deklarierte Release     |
| `task community:install`                  | Verlinkt das aktuelle Release in `Community2024` |
| `task community:install VERSION=x.y.z`    | Verlinkt gezielt ein vorhandenes Release         |
| `task companion:install`                  | Installiert die Companion-EXE eines Releases     |
| `task release:install`                    | Installiert MSFS-Paket und Companion-EXE          |
| `task check`                              | Führt die vollständige lokale Prüfung aus       |

Die `package.json` unter `msfs/PackageSources/VRChecklist/` bleibt für rein
Frontend-spezifische npm-Skripte zuständig. Nichttriviale projektweite Logik
liegt unter `scripts/`.

## Windows-Begleit-App

Die frameworkabhängige .NET-10-/Avalonia-App verbindet sich über SimConnect mit
dem CommBus. Simulatorverbindung und empfangener EFB-Zustand bleiben getrennte
Statusangaben; nach dem ersten Kontakt und jedem Reconnect fordert die App einen
vollständigen, versionierten Snapshot an. Änderungen an Flugzeug, Checkliste,
aktiver Gruppe, nächstem offenen Item und Pflichtfortschritt werden danach
ereignisgesteuert übertragen.

Die Begleit-App verwendet vorab erzeugte, mitgelieferte Audiodateien. Sie
arbeitet im Flug offline, enthält weder TTS-Modell noch API-Schlüssel und
kontaktiert keinen TTS-Anbieter. Mikrofonaufnahme und Spracherkennung sind
nicht Teil des Produkts. Fehler in Verbindung oder Audio blockieren die
EFB-Bedienung nicht.

`Read checklist items` steuert die Itemansagen; Gruppenabschluss und
`Test sound` bleiben bei ausgeschaltetem Schalter verfügbar. Neue Items
ersetzen veraltete Itemansagen. Eine laufende Abschlussansage endet vor der
Ansage des inzwischen aktuellen Items. Wiederholte Zustandsmeldungen,
Reconnects und VR-Kontextwechsel wiederholen dasselbe Item nicht.
`Radio effect` verändert die Wiedergabe direkt; ausgeschaltet erklingt die
unveränderte Clean-Aufnahme.

Audioherkunft und Renderablauf stehen in [assets/audio/README.md](assets/audio/README.md).
Das Projekt bleibt vorerst privat. Vor einer öffentlichen Veröffentlichung
ist die konkrete Audio-Lizenz gemäß
[ADR 0008](docs/adr/0008-stimme-und-tts-anbieter.md) festzulegen.

Build und Deployment aus dem Repository-Root:

```bash
task companion:deploy
```

Der Build verwendet ein per Digest fixiertes offizielles .NET-SDK-Image und
kopiert `SimConnect.dll` nicht. Das Deployment legt stattdessen neben der EXE
und der Transport-Probe eine `simconnect-path.txt` mit dem SimConnect-Ordner
des konfigurierten SDK ab, so wie es `task companion:install` für ein Release
tut. Für den Laufzeittest werden zuerst die EFB-App deployed, im Project Editor
**Build All In Project** ausgeführt und im Coherent Debugger **Ignore Cache +
Reload** gewählt. Anschließend wird
`C:\dev\msfs2024-vr-checklist-companion-staging\VRChecklist.Companion.exe`
direkt gestartet. Die Umgebungsvariable `VR_CHECKLIST_SIMCONNECT_DIR` hat
weiterhin Vorrang, falls ein anderer SimConnect-Ordner getestet werden soll.

Der frühere Konsolen-Durchstich bleibt als Diagnosewerkzeug unter
`tools\transport-probe` im Staging erhalten. Das Companion-Staging wird wie das
EFB-Staging ausschließlich aus dem WSL-Repository befüllt und nie als Quelle
zurücksynchronisiert. Die SDK-DLL dient nur dem lokalen Entwicklungstest und
wird nicht in ein Projekt- oder Releasepaket aufgenommen.

## Verzeichnisstruktur

```text
assets/audio/                            vorab gerenderte Offline-Sprachassets
assets/branding/                         editierbare Branding-Quellen
VERSION                                  kanonische SemVer-Projektversion
checklists/data/                         kanonische Checklistendaten
companion/src/                           Windows-Projekte der Begleit-App
msfs/VRChecklistProject.xml              MSFS-DevMode-Projekt
msfs/PackageDefinitions/                 Paketdefinition und ContentInfo
msfs/PackageSources/VRChecklist/          TypeScript/SCSS-App und Build
msfs/PackageSources/efb_api/              kopierte EFB-API aus SDK 1.7.3
msfs/PackageSources/vendor/               kopiertes MSFS-SDK-Paket
scripts/                                  Validierung und One-Way-Deployment
```

`node_modules/`, das generierte `msfs/PackageSources/VRChecklist/dist/` und
Ausgaben des MSFS Project Editors werden nicht versioniert. Das kopierte
`msfs/PackageSources/efb_api/dist/` ist dagegen ein bewusst versionierter Teil
der SDK-Vorlage und wird nicht lokal neu erzeugt.

## Checklistendaten

Die JSON-Dateien unter `checklists/data/` sind die einzige Quelle für
Checklist-Inhalte:

- `airbus-a400m.json`: Airbus A400M
- `airbus-h125.json`: Airbus H125
- `beechcraft-bonanza-g36.json`: Beechcraft Bonanza G36
- `cessna-152.json`: Cessna 152
- `diamond-da42.json`: Diamond DA42
- `hughes-oh6a-500c.json`: Hughes OH-6A/500C
- `sikorsky-mh-60.json`: Sikorsky MH-60
- `checklist.schema.json`: gemeinsamer Datenvertrag

Die App importiert alle sieben Checklistendateien über eine zentrale Registry; es
existiert keine zweite Liste mit Checklist-Inhalten im App-Code. Explizite
`aircraft.msfsMatches`-Regeln ordnen die SimVars `ATC MODEL`,
`ATC TYPE` und `TITLE` einer Checkliste zu. Die Regeln unterstützen kontrollierte
exakte und Teilstring-Vergleiche sowie gemeinsam erforderliche Felder.
Unbekannte Flugzeuge zeigen alle drei Werte direkt im Leerzustand, damit neue
Regeln gezielt ergänzt werden können. Das Schema unterstützt weiterhin die
sichtbaren Felder
`needsReview` und `reviewNote`; die acht A400M-Einträge unter `FSM Init`
sind noch zur inhaltlichen Prüfung markiert.

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

Windows-spezifische SDK-, Release-, Companion-Installations- und
`Community2024`-Pfade werden lokal in einer ignorierten Root-`.env`
konfiguriert. Ein gemeinsames, produktives und versioniertes Release wird
gebaut mit:

```bash
task release
```

Die aktuelle, zuvor erzeugte Version wird bei beendetem MSFS vollständig
installiert mit:

```bash
task release:install
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
- `docs/msfs-sdk-reference.md`: zentrale, knappe Sammlung dauerhaft relevanter
  MSFS-SDK- und Laufzeit-Lessons
- `docs/design-decisions.md`: akzeptierte UI- und Interaktionsentscheidungen
- `docs/design-qa.md`: offene visuelle Nachweise und Referenzen für den nächsten
  UI- oder VR-Teststand
- `docs/open-tests.md`: einzige lebende Liste offener Laufzeitnachweise
- `BACKLOG.md`: priorisierte Code-, Build- und
  Qualitätsarbeiten für die nächsten Umsetzungssessions
- `docs/release.md`: reproduzierbarer Release- und Community2024-Installationsflow
- `docs/third-party-licenses.md`: direkte Abhängigkeiten, Lizenzstand und
  Primärquellen
- `docs/adr/`: getroffene Architekturentscheidungen mit Konsequenzen und Status
- `docs/assets/`: versionierte, dauerhaft referenzierte Design-Screenshots

## Offizielle Referenzen

- [EFB Template Sample](https://docs.flightsimulator.com/msfs2024/retail/samples-tutorials/samples/efb/efb-template-sample/)
- [Electronic Flight Bag API](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/efb/electronic-flight-bag-api/)
- [Simulation Variables](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/simvars/simulation-variables/)
- [Key Events](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/key-events/key-events-index/)
- [Project Editor](https://docs.flightsimulator.com/msfs2024/flighting/devmode/editors/project-editor/the-project-editor/)
- [SDK release notes for 360 × 240 My Library images](https://docs.flightsimulator.com/msfs2024/retail/introduction/sdk-release-notes/)
