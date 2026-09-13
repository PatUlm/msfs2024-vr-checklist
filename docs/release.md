# Release und Community-Installation

Dieses Dokument beschreibt den reproduzierbaren Weg vom WSL2-Repository zu
einem dauerhaft installierten MSFS-2024-Community-Paket. Repository und
Windows-Staging bleiben dabei getrennt; ein Release wird nie aus dem
Community-Ordner zurück in das Repository synchronisiert.

## Lokale Konfiguration

Die Windows-spezifischen Pfade liegen in der ignorierten Root-Datei `.env`.
Nach einem frischen Clone wird sie aus der versionierten Vorlage erzeugt:

```bash
cp .env.example .env
```

Zu konfigurieren sind:

```dotenv
VR_CHECKLIST_MSFS_SDK_ROOT="/mnt/c/MSFS 2024 SDK"
VR_CHECKLIST_COMPANION_INSTALL_DIR="/mnt/c/Users/USER/AppData/Local/Programs/VRChecklist Companion"
VR_CHECKLIST_COMMUNITY_DIR="/mnt/c/Users/USER/AppData/Roaming/Microsoft Flight Simulator 2024/Packages/Community2024"
VR_CHECKLIST_RELEASE_DIR="/mnt/c/dev/msfs2024-vr-checklist-releases"
```

Das Release-Verzeichnis muss den schützenden Namen
`msfs2024-vr-checklist-releases` tragen. Als Installationsziel ist ausschließlich
der MSFS-2024-Ordner `Community2024` zulässig. Damit kann der Task weder einen
beliebigen Ordner spiegeln noch versehentlich den gesamten Packages-Baum
ersetzen. Das Companion-Ziel ist zusätzlich auf
`AppData/Local/Programs/VRChecklist Companion` innerhalb eines Windows-
Benutzerprofils beschränkt.

## Versionsmodell

Die Root-Datei `VERSION` ist die kanonische Versionsquelle und enthält genau
eine dreiteilige SemVer-Version `MAJOR.MINOR.PATCH`. Die aktuelle Version wird
identisch verwendet für:

- die sichtbare Versionszeile eines Release-Builds,
- `package_version` im MSFS-Manifest und damit die Anzeige in My Library,
- die `VERSION` der Companion-EXE,
- den Namen und die Metadaten des unveränderlichen Release-Artefakts.

Die Versionswerte in der MSFS-Paketdefinition und den npm-Metadaten werden als
notwendige Spiegelungen gegen `VERSION` geprüft. Ein abweichender Wert lässt
`task check`, `task deploy` und `task release` fehlschlagen.

Entwicklungsbuilds bleiben eindeutig, indem sie die Projektversion um
`-dev.YYYYMMDDHHMMSS` in UTC ergänzen. Beispiel:
`0.1.2-dev.20260824153042`. Diese Kennung erscheint in der EFB-App und in der
Begleit-App; Staging-Manifest und `VERSION`-Dateien behalten die
veröffentlichungsfähige dreiteilige Version.

Vor einer inhaltlich veränderten Veröffentlichung wird `VERSION` nach SemVer
erhöht und in Paketdefinition, `package.json` sowie den beiden Root-Einträgen
von `package-lock.json` gespiegelt. Die Prüfung verhindert, dass ein vergessenes
Duplikat unbemerkt veröffentlicht wird.

## Release bauen

MSFS 2024 vor dem Kommandozeilen-Build beenden. Ein an den interaktiven
Simulator angehängter Package Tool-Prozess kann sonst auf dessen Ende warten,
ohne einen Neubau auszuführen; siehe die
[SDK-Referenz](msfs-sdk-reference.md#paketierung-und-testiteration).

Der Release-Task verwendet immer die in `VERSION` deklarierte Version:

```bash
task release
```

Der Task führt nacheinander aus:

1. SemVer- und Quellenkonsistenzprüfung.
2. Checklistendaten- und TypeScript-Prüfung.
3. Minifizierten App-Build mit der Projektversion und ohne Source Maps.
4. One-Way-Deployment nach
   `C:\dev\msfs2024-vr-checklist-staging`.
5. Vollständigen Package-Neubau mit dem installierten
   `FsPackageTool.exe`, einschließlich Mirroring gegen veraltete Dateien.
6. Prüfung von `manifest.json`, `layout.json`, Dateigrößen, Pflichtdateien,
   eingebetteter Release-Version und fehlenden Source Maps.
7. Kopie in ein versioniertes, unveränderliches Artefakt.

Zusätzlich baut und prüft der Task die frameworkabhängige Windows-EXE, deployed
sie ins getrennte Companion-Staging und nimmt sie ohne die nicht
weiterverteilte `SimConnect.dll` in dasselbe Release auf.

Für `VERSION=0.1.2` entsteht standardmäßig:

```text
C:\dev\msfs2024-vr-checklist-releases\0.1.2\
├── release.json
├── patulm-vr-checklist\
│   ├── manifest.json
│   ├── layout.json
│   ├── ContentInfo\
│   └── html_ui\
└── VRChecklist.Companion\
    ├── VRChecklist.Companion.exe
    ├── VRChecklist.Companion.dll
    ├── THIRD-PARTY-NOTICES.md
    └── VERSION
```

Existiert dieselbe Release-Version bereits, bricht der Task ab. Ein
veröffentlichtes Artefakt wird nicht stillschweigend überschrieben; eine
inhaltliche Änderung benötigt eine neue SemVer-Version.

## Release in Community2024 installieren

MSFS 2024 sollte während des Austauschs beendet sein. Ohne Parameter wird die
in `VERSION` deklarierte, zuvor gebaute Version installiert:

```bash
task community:install
```

Eine gezielte vorhandene Version kann für einen Rollback weiterhin explizit
ausgewählt werden, zum Beispiel:

```bash
task community:install VERSION=2026.08
```

Das bereits erzeugte historische CalVer-Artefakt `2026.08` bleibt ebenfalls
gezielt installierbar; neue Release-Builds akzeptieren ausschließlich SemVer.

Vor dem Austausch werden Metadaten, Paketinhalt und eingebettete App-Version
erneut geprüft. Anschließend wird neben dem Ziel zunächst ein temporärer
nativer Windows-Verzeichnislink auf das unveränderliche Release-Paket erzeugt
und sein aufgelöstes Ziel erneut geprüft. Erst danach wird ausschließlich
`Community2024/patulm-vr-checklist` atomar durch den Link ersetzt; bei einem
Fehler vor dem Abschluss wird die vorherige Installation wiederhergestellt.
Unter WSL2 entsteht dabei eine Windows-Junction, die ohne Administratorrechte
von MSFS wie ein normales Verzeichnis gelesen wird. Für Version `0.4.2` zeigt
sie beispielsweise auf:

```text
C:\dev\msfs2024-vr-checklist-releases\0.4.2\patulm-vr-checklist
```

Der Installer lässt die Junction ausdrücklich von Windows erzeugen. Ein direkt
unter WSL auf `/mnt/c` angelegter Node-/Linux-Symlink verwendet dagegen den
WSL-spezifischen Reparse-Tag `IO_REPARSE_TAG_LX_SYMLINK`; Windows erkennt ihn
nicht als Junction und erhält daraus weder `LinkType` noch `Target`.

Ein verlinktes Release bleibt damit zugleich die installierte Quelle und darf
erst gelöscht werden, nachdem `community:install` auf eine andere Version
umgestellt oder das Community-Paket entfernt wurde. Ein Rollback mit
`VERSION=...` tauscht nur den Link aus und dupliziert keine Paketdateien.

Beim nächsten normalen Simulatorstart ist die Community-Version ohne DevMode
verfügbar. Wird das gleichnamige Projekt später im DevMode gebaut und gemountet,
hat die DevMode-Version im VFS Vorrang. Das installierte Community-Paket muss
daher für normale Entwicklungsiterationen nicht deaktiviert werden.

## Companion-EXE installieren

Die Companion-App wird aus demselben Release sicher in das konfigurierte
Benutzerverzeichnis installiert. Der Task legt dort keine Kopie von
`SimConnect.dll` ab, sondern nur eine lokale Pfadkonfiguration zur DLL des
installierten SDKs an:

```bash
task companion:install
```

Beide Release-Bestandteile werden nacheinander installiert mit:

```bash
task release:install
```

Danach lässt sich
`%LOCALAPPDATA%\Programs\VRChecklist Companion\VRChecklist.Companion.exe`
direkt starten. Die App bleibt frameworkabhängig und benötigt die installierte
.NET-10-Laufzeit. Ein bereits laufender Companion-Prozess muss vor
einem Update beendet werden.

## Branding-Dateien

- EFB-App-Icon:
  `assets/branding/app-icon.svg`
- Windows-Companion-Icon (Quelle und eingebettete ICO-Datei):
  `assets/branding/app-icon-windows.svg`,
  `assets/branding/app-icon-windows.ico`
- editierbare Thumbnail-Quelle:
  `assets/branding/content-info-thumbnail.svg`
- vom MSFS-Paket verwendetes Thumbnail:
  `assets/branding/content-info-thumbnail.jpg`

Das Thumbnail ist exakt 360 × 240 Pixel groß und zeigt Bildmarke sowie
Produktname, aber keinen eingebetteten Versionswert. Dieses Format folgt der
mit SDK 1.5.3 eingeführten
[MSFS-2024-Vorgabe für Community-My-Library-Bilder](https://docs.flightsimulator.com/msfs2024/retail/introduction/sdk-release-notes/);
Titel, Hersteller und Version werden von MSFS daneben aus den Paketmetadaten
dargestellt.

Nach einer visuellen Branding-Änderung müssen Icon und Thumbnail in
Originalauflösung geprüft werden. Das App-Icon benötigt zusätzlich einen Test
in der EFB-App-Liste einschließlich normalem, Hover- und ausgewähltem Zustand.
