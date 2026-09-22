# Entwicklung

Diese Anleitung enthält den aktuellen Weg vom Clone zum Simulator-Test.
Task-Implementierungen und vergangene Testläufe werden hier nicht nacherzählt.

## Voraussetzungen und Einrichtung

- Windows mit MSFS 2024 und installiertem SDK 1.7.3 für Simulator-Tests und
  Paketierung; das installierte SDK und seine Samples bleiben read-only.
- Repository im Linux-Dateisystem von WSL2, Node.js 24, npm und Task 3.
- Docker für den im `Taskfile.yml` fixierten .NET-SDK-Container; keine lokale
  Visual-Studio-Installation nötig.
- Für den Companion-Start unter Windows: .NET-10-Laufzeit und die native
  `SimConnect.dll` aus der lokalen SDK-Installation.

Vom Repository-Root aus:

```bash
cp .env.example .env
task init
task install
task check
```

Die Pfade in `.env` anpassen; Zugangsdaten bleiben dort lokal. Für normale
Builds werden weder ElevenLabs-Zugang noch FFmpeg benötigt. Audio ist bereits
versioniert. `task --list` zeigt alle Tasks, `Taskfile.yml` ihre Definitionen.

## Arbeitsablauf

| Aufgabe | Task |
| --- | --- |
| Checklistendaten prüfen | `task validate` |
| EFB bauen / Änderungen beobachten | `task build` / `task watch` |
| Alle lokalen Prüfungen | `task check` |
| EFB für den Simulator bereitstellen | `task deploy` |
| Companion für Windows bereitstellen | `task companion:deploy` |

Nach abgestimmten App- oder Datenänderungen zuerst `task check`, dann
`task deploy`; bei Companion-Änderungen zusätzlich `task companion:deploy`.
Reine Dokumentationsänderungen benötigen kein Deployment.

Die Deployment-Ziele sind standardmäßig:

- EFB: `C:\dev\msfs2024-vr-checklist-staging`
- Companion: `C:\dev\msfs2024-vr-checklist-companion-staging`

Beide sind ausschließlich One-Way-Ziele aus dem WSL-Repository. EFB-Quellen
und SDK-Kopien werden dort nicht bearbeitet oder zurücksynchronisiert.
Die Skripte verwalten nur ihre eigenen Eingaben; vom Project Editor erzeugte
Pakete bleiben im Staging erhalten. Ein anderes EFB-Laufwerk lässt sich mit
`task deploy STAGING_DIR=/mnt/d/dev/msfs2024-vr-checklist-staging` wählen.

## In MSFS prüfen

1. Nach `task deploy` MSFS mit Developer Mode starten.
2. Im Project Editor
   `C:\dev\msfs2024-vr-checklist-staging\VRChecklistProject.xml` öffnen und
   **Build All In Project** ausführen.
3. Einen Flug mit passendem Flugzeug starten und im EFB **VR Checklist** öffnen.
4. Nach Folgebuilds im Coherent Debugger **Ignore Cache + Reload** verwenden.
5. Den geänderten Standardablauf prüfen; VR-relevantes Styling im EFB in VR.

Für reine UI-Änderungen ist normalerweise kein neuer Flug nötig. Für
Lifecycle- oder Reset-Änderungen ist er erforderlich. Ausstehende Nachweise
stehen in [open-tests.md](open-tests.md) und [design-qa.md](design-qa.md).
Nach einem Deployment die tatsächlich geschriebene Versionskennung prüfen,
nicht die Kennung eines früheren Builds verwenden.

Nach `task companion:deploy` die
`VRChecklist.Companion.exe` im Companion-Staging starten. Das Deployment
schreibt `simconnect-path.txt` mit dem lokalen SDK-Pfad; die DLL selbst wird
nicht kopiert. Diagnosewerkzeug und Quellaufbau stehen im
[Companion-README](../companion/README.md).

## Orientierung für Beiträge

- [AGENTS.md](../AGENTS.md): Arbeits-, Review- und Commitregeln.
- [Checklistendaten](../checklists/data/README.md) und
  [Style Guide](../checklists/data/style-guide.md): neue oder korrigierte Inhalte.
- [Designentscheidungen](design-decisions.md): bewusst gewähltes Verhalten.
- [SDK-Referenz](msfs-sdk-reference.md): MSFS- und Coherent-Fallen.
- [ADRs](adr/README.md): Architektur und ihre Gründe.
- [Audio](../assets/audio/README.md) und [Branding](../assets/branding/README.md):
  Assets bearbeiten.
- [Release](release.md): Versionierung, Paketbau und lokale Installation.
- [Drittlizenzen](third-party-licenses.md): Abhängigkeiten und Herkunft.

Änderungen als kleine, lauffähige Inkremente auf `master` umsetzen. Bei
Fehlerberichten helfen App-Version, Flugzeug/Add-on, Reproduktionsschritte und
erwartetes beziehungsweise tatsächliches Verhalten; bei Darstellungsfehlern
zusätzlich ein Screenshot und die Angabe VR/Nicht-VR.
