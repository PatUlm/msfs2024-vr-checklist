# Windows-Begleit-App

Dieses Dokument enthält nur Companion-spezifische Entwicklungs- und
Diagnosehinweise. Bedienung steht im [Root-README](../README.md), Setup und
Deployment in [development.md](../docs/development.md).

## Aufbau

- `src/VRChecklist.Companion/`: Avalonia-App, Audio und Checklistenexport.
- `src/VRChecklist.Transport/`: gemeinsamer SimConnect-/CommBus-Transport.
- `src/VRChecklist.TransportProbe/`: Konsolendiagnose und Selbsttests.
- `release-notes.json`: eingebettete Offline-Release-Notes. Version und Datum
  müssen zum Changelog passen; `task validate:release-notes` prüft sie.

Checklisten aus `checklists/data/` und Ansagen aus `assets/audio/` werden beim
Build eingebettet. Die Architektur steht in den [ADRs](../docs/adr/README.md),
das gewählte Verhalten in [design-decisions.md](../docs/design-decisions.md).

## Start und Diagnose

`task companion:deploy` baut App und Probe ins Windows-Staging. Die
frameworkabhängige EXE benötigt .NET 10 und die native MSFS-2024-`SimConnect.dll`.
Diese DLL wird nicht mitgeliefert. Der Suchpfad lässt sich setzen über:

1. `VR_CHECKLIST_SIMCONNECT_DIR` als Windows-Umgebungsvariable, oder
2. `simconnect-path.txt` neben der EXE mit dem Windows-Verzeichnispfad, etwa
   `C:\MSFS 2024 SDK\SimConnect SDK\lib`.

Deployment und lokale Release-Installation schreiben diese Datei automatisch
aus dem konfigurierten SDK-Pfad. Sie bleibt lokal.

Im Staging liegt unter `tools\transport-probe` das Diagnosewerkzeug.
Es fordert den EFB-Zustand an; `--play-completion-sound` prüft ohne MSFS
jeweils einmal den Audiopfad auf dem Windows-Standardgerät.

Audioeinstellungen liegen unter
`%LOCALAPPDATA%\VRChecklist\audio-output.json`. Ein nicht verfügbares Gerät
bleibt ausgewählt; unter Settings ein verfügbares Gerät wählen und mit
`Test sound` prüfen. Bei abweichender Checklistenrevision EFB und Companion
auf denselben Release-Stand bringen.
