# Release und lokale Installation

Diese Anleitung beschreibt den aktuellen Maintainer-Ablauf. Dokumentiert
werden nötige Befehle und Fallstricke; interne Prüfschritte stehen im Code.

## Einmalige Einrichtung

Voraussetzungen und Clone-Setup stehen in [development.md](development.md).
Die Windows-Pfade in der ignorierten `.env` anhand von
[.env.example](../.env.example) anpassen:

- `VR_CHECKLIST_MSFS_SDK_ROOT`: installierter SDK-Ordner.
- `VR_CHECKLIST_COMMUNITY_DIR`: tatsächlicher `Community2024`-Ordner.
- `VR_CHECKLIST_COMPANION_INSTALL_DIR`:
  `%LOCALAPPDATA%\VRChecklist.Companion`, als WSL-Pfad; dorthin installiert
  das Setup.
- `VR_CHECKLIST_RELEASE_DIR`: standardmäßig
  `/mnt/c/dev/msfs2024-vr-checklist-releases`.

Die Skripte verlangen die Zielnamen `Community2024`,
`msfs2024-vr-checklist-releases` und `AppData/Local/VRChecklist.Companion`, um
versehentliche Änderungen fremder Ordner zu verhindern.

## Version und Release

`VERSION` ist die kanonische SemVer-Version für EFB, MSFS-Paket und Companion.
Entwicklungsbuilds zeigen zusätzlich `-dev.YYYYMMDDHHMMSS` in UTC; Releases
zeigen exakt `MAJOR.MINOR.PATCH`.

1. Fachliche Änderungen einschließlich nötiger Simulatornachweise abschließen
   und nach den [Reviewregeln](../AGENTS.md) freigeben lassen.
2. `VERSION` erhöhen und in `msfs/PackageDefinitions/patulm-vr-checklist.xml`,
   `msfs/PackageSources/VRChecklist/package.json` sowie den beiden
   Root-Versionseinträgen der dortigen `package-lock.json` spiegeln.
3. Nutzerwirksame Änderungen aus `CHANGELOG.md` unter die neue Version mit
   Datum verschieben. `companion/release-notes.json` mit gleichem Datum und
   Version aktualisieren, wichtigste Neuerung zuerst.
4. `task check` erfolgreich ausführen. MSFS und Companion beenden.
5. `task release` ausführen. Es baut beide Apps, erzeugt EFB-ZIP und
   Companion-Setup und legt ein unveränderliches Release unter dem
   konfigurierten Release-Ordner an. Die `SimConnect.dll` kommt aus dem
   konfigurierten SDK.
6. Release-Metadaten als `chore(release): publish version X.Y.Z` committen und
   einen annotierten Tag `vX.Y.Z` exakt auf diesen Commit setzen.
7. `task release:install` ausführen und die tatsächlich installierten Versionen
   prüfen. Erst dann ist der lokale Release-Schritt abgeschlossen.

Der Release-Ordner enthält `release.json`, das MSFS-Paket
`patulm-vr-checklist/` für die lokale Junction, das Download-ZIP
`patulm-vr-checklist-X.Y.Z.zip` und unter `VRChecklist.Companion/` die
Velopack-Ausgabe: `VRChecklist.Companion-win-Setup.exe`, das volle `.nupkg`
und den Update-Feed `releases.win.json`. Für spätere Updates müssen Setup,
`.nupkg` und `releases.win.json` gemeinsam am GitHub-Release hängen. Bereits
vorhandene Versionen werden nicht überschrieben.

Die Vorbereitung öffentlicher Releases steht im [Backlog](../BACKLOG.md).
Der lokale Release-Task veröffentlicht nichts auf GitHub;
Pushes und Veröffentlichung erfolgen nur auf ausdrücklichen Auftrag.

## Installation und Rollback

```bash
task release:install
```

Installiert die zuvor gebaute Version aus `VERSION`. Einzelne Komponenten
lassen sich mit `task community:install` oder `task companion:install`
installieren. Für ein vorhandenes anderes Release; der Companion lässt sich
so erst ab Releases mit Setup installieren:

```bash
task release:install VERSION=0.13.2
```

Das Community-Paket wird als native Windows-Junction auf das Release
installiert. **Den verlinkten Release-Ordner nicht löschen**, solange er
installiert ist. Linux-Symlinks auf `/mnt/c` sind kein Ersatz: Windows erkennt
sie nicht als Junction. Der Installer erstellt und prüft den Link über Windows.

Der Companion wird wie bei Spielern über das Setup installiert, hier mit
`--silent`. Es beendet einen laufenden Companion aus diesem Ordner und ersetzt
die vorhandene Installation. Danach **VR Checklist Companion** starten.

Beim normalen Simulatorstart steht das Community-Paket ohne DevMode bereit.
Ein im Project Editor gebauter Stand desselben Pakets hat Vorrang; für
Entwicklung muss die Community-Installation daher nicht entfernt werden.
