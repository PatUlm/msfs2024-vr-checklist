# Windows-Begleit-App

Dieser Verzeichnisbaum enthält die Windows-Seite von Phase 3. Die EFB-App und
das MSFS-Paket bleiben getrennt unter `../msfs/`; Checklistendaten und
Audioassets liegen weiterhin auf Repository-Ebene.

## Struktur

```text
companion/
  release-notes.json             app-lesbare Offline-Release-Notes
  src/
    VRChecklist.Companion/        Avalonia-Status-App
    VRChecklist.Transport/        gemeinsamer SimConnect-/CommBus-Transport
    VRChecklist.TransportProbe/   bidirektionales Diagnosewerkzeug
```

Die Status-App und das Diagnosewerkzeug teilen sich ausschließlich den
Transport und den versionierten Snapshot-Vertrag. Der Probe bleibt eine kleine
Konsolenanwendung; Produktzustände werden in der Avalonia-App dargestellt.

`release-notes.json` ist die kuratierte, in die Companion-App eingebettete
Quelle für die Offline-Ansicht. Schema 1 führt die Version, das ISO-Kalenderdatum,
ein hervorgehobenes Hauptmerkmal sowie geordnete Feature- und Fehlerlisten je
Release. `task validate:release-notes` prüft Format, Sortierung und vollständige
Abdeckung aller in `CHANGELOG.md` veröffentlichten Versionen seit Einführung
der Companion-App; ältere Produktmeilensteine dürfen zusätzlich enthalten sein.
Die neueste Version muss außerdem mit `VERSION` übereinstimmen.

Die Checklistenansicht der Status-App bettet die JSON-Dateien aus
`../checklists/data/` zur Build-Zeit als Ressourcen ein. Die JSON-Dateien
bleiben die einzige Quelle; die App rendert sie nur.

Die in `../assets/audio/completion/manifest.json` beschriebene Brian-Ansage wird ebenfalls
eingebettet, beim Start mit Concentus dekodiert und über `NAudio.Wasapi` im
Shared Mode auf dem gewählten Ausgabegerät abgespielt, sobald der Snapshot eine
neu erledigte Gruppe meldet. Unter `Settings` bietet `Audio output` das
Windows-Standardgerät oder ein konkretes Windows-Ausgabegerät. `Settings` öffnet
einen modalen Dialog; `Test sound` in diesem Dialog spielt
`Checklist completed` auf der Auswahl ab, auch ohne MSFS und ohne Änderung des
Checklistenfortschritts. Simulator-Reconnects und Checklistenevents unterbrechen
den Testton nicht; tatsächliche Abbrüche erscheinen ausdrücklich als Abbruch.
`Windows default` steht immer zuerst, danach folgen
zuletzt gewählte Geräte vor den übrigen, alphabetisch sortierten Ausgängen.
`Radio effect` ist standardmäßig eingeschaltet und lässt sich auch während
einer Ansage umschalten. Ausgeschaltet wird dieselbe Clean-Datei unverändert
abgespielt; es gibt keine zweite TTS-Generierung und keinen Onlinezugriff.
Herkunft und Renderablauf stehen unter [Audioassets](../assets/audio/README.md).
`Read checklist items` aktiviert die eingebetteten Brian-Itemansagen und ist
standardmäßig eingeschaltet; eine gespeicherte Off-Auswahl bleibt erhalten. Einschalten liest den aktuellen Eintrag; anschließend
wird bei einem tatsächlichen Itemwechsel angesagt. Schnelles Weiterklicken
bricht veraltete Itemansagen ab. Gruppenabschluss und Test sound haben Vorrang;
danach folgt nur das zuletzt aktuelle Item. Reconnects wiederholen denselben
Eintrag nicht. Die acht A400M-FSM-Init-Schritte haben vorerst keine Ansage.
Bei abweichenden Checklistenrevisionen erscheint ein Audiofehler.
Geräte-ID, letzter Anzeigename, Auswahlhistorie sowie Radio- und Itemansage-Einstellung liegen
unter `%LOCALAPPDATA%\VRChecklist\audio-output.json`. Ein fehlendes Gerät bleibt
ausgewählt, bis es wieder verfügbar ist oder eine andere Auswahl getroffen wird.
Ohne MSFS
prüft `VRChecklist.TransportProbe.dll --play-completion-sound` denselben
Audiopfad einmal auf dem Windows-Standardgerät.

Build und Windows-Deployment werden aus dem Repository-Root mit
`task companion:deploy` gestartet. Das verwaltete Ziel ist standardmäßig
`/mnt/c/dev/msfs2024-vr-checklist-companion-staging`; Laufzeitanleitung und
Voraussetzungen stehen im Root-[README](../README.md).

Ein Release enthält die frameworkabhängige `VRChecklist.Companion.exe` mit
ihren Laufzeitdateien, aber ohne `SimConnect.dll`. `task companion:install`
installiert sie unter dem konfigurierten Windows-Benutzerprofil und hinterlegt
den lokalen SimConnect-Pfad in `simconnect-path.txt` für den direkten
EXE-Start. `task companion:deploy` schreibt dieselbe Datei ins Staging; das
Release-Paket nimmt sie nicht auf.
