# Windows-Begleit-App

Dieser Verzeichnisbaum enthält die Windows-Seite von Phase 3. Die EFB-App und
das MSFS-Paket bleiben getrennt unter `../msfs/`; Checklistendaten und später
gemeinsam genutzte Audioassets liegen weiterhin auf Repository-Ebene.

## Struktur

```text
companion/
  src/
    VRChecklist.Companion/        Avalonia-Status-App
    VRChecklist.Transport/        gemeinsamer SimConnect-/CommBus-Transport
    VRChecklist.TransportProbe/   bidirektionales Diagnosewerkzeug
```

Die Status-App und das Diagnosewerkzeug teilen sich ausschließlich den
Transport und den versionierten Snapshot-Vertrag. Der Probe bleibt eine kleine
Konsolenanwendung; Produktzustände werden in der Avalonia-App dargestellt.

Build und Windows-Deployment werden aus dem Repository-Root mit
`task companion:deploy` gestartet. Das verwaltete Ziel ist standardmäßig
`/mnt/c/dev/msfs2024-vr-checklist-companion-staging`; Laufzeitanleitung und
Voraussetzungen stehen im Root-[README](../README.md).

Ein Release enthält die frameworkabhängige `VRChecklist.Companion.exe` mit
ihren Laufzeitdateien, aber ohne `SimConnect.dll`. `task companion:install`
installiert sie unter dem konfigurierten Windows-Benutzerprofil und hinterlegt
den lokalen SimConnect-Pfad für den direkten EXE-Start.
