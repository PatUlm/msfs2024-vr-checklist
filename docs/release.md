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
  `%LOCALAPPDATA%\Programs\VRChecklist Companion`, als WSL-Pfad.
- `VR_CHECKLIST_RELEASE_DIR`: standardmäßig
  `/mnt/c/dev/msfs2024-vr-checklist-releases`.

Die Skripte verlangen die Zielnamen `Community2024`,
`msfs2024-vr-checklist-releases` und den Companion-Ordner unter
`AppData/Local/Programs`, um versehentliche Änderungen fremder Ordner zu verhindern.

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
5. `task release` ausführen. Es baut beide Apps, prüft das Paket und erzeugt
   ein unveränderliches Release unter dem konfigurierten Release-Ordner.
6. Release-Metadaten als `chore(release): publish version X.Y.Z` committen und
   einen annotierten Tag `vX.Y.Z` exakt auf diesen Commit setzen.
7. `task release:install` ausführen und die tatsächlich installierten Versionen
   prüfen. Erst dann ist der lokale Release-Schritt abgeschlossen.

Der Release-Ordner enthält `release.json`, das MSFS-Paket
`patulm-vr-checklist/` und `VRChecklist.Companion/`. Bereits vorhandene Versionen
werden nicht überschrieben. Windows-Voraussetzungen und DLL-Konfiguration
stehen im [Companion-README](../companion/README.md#start-und-diagnose).

Die Vorbereitung öffentlicher Releases steht im [Backlog](../BACKLOG.md).
Der lokale Release-Task veröffentlicht nichts auf GitHub;
Pushes und Veröffentlichung erfolgen nur auf ausdrücklichen Auftrag.

## Installation und Rollback

```bash
task release:install
```

Installiert die zuvor gebaute Version aus `VERSION`. Einzelne Komponenten
lassen sich mit `task community:install` oder `task companion:install`
installieren. Für ein vorhandenes anderes Release:

```bash
task release:install VERSION=0.13.2
```

Das Community-Paket wird als native Windows-Junction auf das Release
installiert. **Den verlinkten Release-Ordner nicht löschen**, solange er
installiert ist. Linux-Symlinks auf `/mnt/c` sind kein Ersatz: Windows erkennt
sie nicht als Junction. Der Installer erstellt und prüft den Link über Windows.

Die Companion-Dateien werden in das konfigurierte Benutzerverzeichnis kopiert.
Danach die EXE unter
`%LOCALAPPDATA%\Programs\VRChecklist Companion` starten.

Beim normalen Simulatorstart steht das Community-Paket ohne DevMode bereit.
Ein im Project Editor gebauter Stand desselben Pakets hat Vorrang; für
Entwicklung muss die Community-Installation daher nicht entfernt werden.
