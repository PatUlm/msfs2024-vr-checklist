# MSFS 2024 VR Checklist

Offline-Checklisten für das Electronic Flight Bag (EFB) in Microsoft Flight
Simulator 2024, mit großen Bedienflächen für VR und einer optionalen
Windows-Begleit-App für Sprachausgabe.

Das Projekt soll kostenlos als Open Source auf GitHub erscheinen. Die
öffentliche Version 1.0 wird vorbereitet; Projektlizenz und einzelne
Weitergaberechte sind noch offen. Den Stand zeigt die [Roadmap](ROADMAP.md).

## Funktionen

- Automatische Flugzeugauswahl, große anklickbare Zeilen und Bestätigung per
  Taste oder HOTAS.
- Gruppenweise Navigation, Phasenüberspringen und Fortschrittsanzeige.
- Fortschritt bleibt beim Wechsel zwischen VR und Nicht-VR erhalten; ein neuer
  Flug setzt ihn zurück.
- Optionaler Companion mit englischen Brian-Ansagen, zuschaltbarem Radioeffekt
  und wählbarem Audioausgang. Keine Cloudverbindung im Flug.
- Checklisten im Companion ansehen, als Text kopieren oder als PDF speichern;
  Release Notes offline lesen.

Enthalten sind Airbus A400M, Airbus H125, Beechcraft Bonanza G36, Cessna 152,
Diamond DA42, Hughes OH-6A/500C und Sikorsky MH-60. Umfang und Abdeckung
unterscheiden sich je Flugzeug. Die acht A400M-Einträge unter `EFIS and FMS
Setup` sind als ungeprüft markiert und bleiben stumm; auch die automatische
A400M-Zuordnung ist noch nicht im Simulator bestätigt.

Die Checklisten sind mit KI-Unterstützung bearbeitete Merkhilfen für das
**Spiel**, keine Flugunterlagen für reale Luftfahrt. Ihre
[Quellen und Einschränkungen](checklists/data/README.md#inhaltliche-herkunft)
sind dokumentiert.

## Installation und Start

Derzeit ist der unterstützte Weg ein lokaler Build aus WSL2 mit installiertem
MSFS-2024-SDK. Die [Entwicklungsanleitung](docs/development.md) beschreibt die
Einrichtung; [Release und Installation](docs/release.md) erklären das
Community-Paket und die Companion-EXE. Ein fertiger GitHub-Download samt
Endnutzerinstallation gehört noch zur Vorbereitung von 1.0.

Nach der Installation im EFB **VR Checklist** öffnen. Die App funktioniert
vollständig ohne Companion. Für Sprachausgabe zusätzlich
`VRChecklist.Companion.exe` starten; diese benötigt die .NET-10-Laufzeit und
einen lokalen Pfad zur nativen `SimConnect.dll` (siehe
[Companion](companion/README.md)).

## Bedienung

Ein Klick auf eine Zeile hakt sie ab oder öffnet sie wieder. Sind alle Items
einer Gruppe erledigt, folgt automatisch die nächste. Optionale Items zählen
nicht zum Fortschrittsbalken, halten aber den automatischen Gruppenwechsel
auf, bis sie erledigt sind oder man manuell weiterblättert.

`Skip phase` erledigt den zusammenhängenden aktuellen Phasenblock einschließlich
optionaler Items und öffnet die nächste Phase. In der letzten Phase erledigt
es deren verbleibende Items.

Für Taste oder HOTAS in den MSFS-**Steuerungen** die Action **SET PLASMA OFF**
belegen (Event `PLASMA_OFF`; der Anzeigename kann je Sim-Sprache abweichen).
Sie bestätigt das nächste offene Item der angezeigten Gruppe, solange die App
im EFB offen ist. Das Event wird an den Simulator weitergereicht; für fremde
Flugzeuge ist eine Nebenwirkung nicht ausgeschlossen. Der aktuelle Stand der
Eventwahl steht in [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).

Im Companion unter **Settings**:

- `Read checklist items`: nächsten offenen Eintrag vorlesen; standardmäßig an.
- `Radio effect`: Klangfilter live ein-/ausschalten; standardmäßig an.
- `Audio output` und `Test sound`: Ausgabegerät wählen und prüfen. Ein nicht
  verfügbares Gerät bleibt ausgewählt, bis es zurückkehrt oder ersetzt wird.

Gruppenabschluss und Testton funktionieren auch bei ausgeschalteten
Itemansagen. Minimieren lässt Verbindung und Audio weiterlaufen; Schließen
beendet den Companion.

## Probleme und Mitwirken

Bei fehlender Checkliste die Diagnosewerte `ATC MODEL`, `ATC TYPE` und `TITLE`
melden; der Companion kann sie mit `Copy` kopieren. Bei anderen Fehlern helfen
Version, Flugzeug, Reproduktionsschritte und gegebenenfalls ein Screenshot.

- [Entwicklung](docs/development.md): Setup, Tests und Simulator-Iteration.
- [Checklistendaten](checklists/data/README.md): Inhalte ergänzen oder korrigieren.
- [Backlog](BACKLOG.md): nächste Arbeiten.
- [Changelog](CHANGELOG.md): Änderungen je Version.
- [Drittlizenzen](docs/third-party-licenses.md) und
  [offene Lizenzpunkte](docs/license-audit.md): aktueller Veröffentlichungsstand.

Eine Projektlizenz ist noch nicht erteilt. Fremde SDK-Teile und
[Audioassets](assets/audio/README.md#rights-notice) haben gesonderte Bedingungen.
