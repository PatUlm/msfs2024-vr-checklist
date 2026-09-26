# MSFS 2024 VR Checklist

Offline-Checklisten für das Electronic Flight Bag (EFB) in Microsoft Flight
Simulator 2024, mit großen Bedienflächen für VR und einer optionalen
Windows-Begleit-App für Sprachausgabe.

Das Veröffentlichungsziel steht in der [Roadmap](ROADMAP.md), offene Arbeit
im [Backlog](BACKLOG.md).

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
unterscheiden sich je Flugzeug.

Die Checklisten sind mit KI-Unterstützung bearbeitete Merkhilfen für das
**Spiel**, keine Flugunterlagen für reale Luftfahrt. Ihre
[Quellen und Einschränkungen](checklists/data/README.md#inhaltliche-herkunft)
sind dokumentiert.

## Installation und Start

Ein Release besteht aus zwei Dateien derselben Version. EFB-App und Companion
immer gemeinsam aktualisieren, sonst bleiben die Ansagen stumm.

1. **EFB-App:** `patulm-vr-checklist-X.Y.Z.zip` in den Community-Ordner von
   MSFS 2024 entpacken, sodass dort der Ordner `patulm-vr-checklist` liegt.
   Vor einem Update den alten Ordner löschen.
2. **Companion (optional):** `VRChecklist.Companion-win-Setup.exe` ausführen.
   Es installiert ohne Adminrechte unter `%LOCALAPPDATA%\VRChecklist.Companion`
   und legt Verknüpfungen auf dem Desktop und im Startmenü an. .NET, das
   MSFS-SDK oder eine eigene `SimConnect.dll` sind nicht nötig. Das Setup ist
   nicht signiert; bei der SmartScreen-Warnung **Weitere Informationen** und
   dann **Trotzdem ausführen** wählen. Deinstallation über die Windows-Apps-Liste;
   Einstellungen bleiben dabei erhalten.

Nach der Installation im EFB **VR Checklist** öffnen. Die App funktioniert
ohne laufenden Companion. Für Sprachausgabe und zum Konfigurieren der
Bestätigungsaktionen zusätzlich **VR Checklist Companion** starten. Hinweise
bei Problemen stehen unter
[Companion: Start und Diagnose](companion/README.md#start-und-diagnose).
Eigene Builds beschreiben [Entwicklung](docs/development.md) und
[Release](docs/release.md).

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
Flugzeuge ist eine Nebenwirkung nicht ausgeschlossen. Die Begründung der
Eventwahl steht in [ADR 0011](docs/adr/0011-bestaetigungsaktionen-im-companion.md).

Im Companion unter **Settings**:

- **EFB Keybindings**: mit dem Schalter die Bestätigung aktivieren und rechts
  daneben im Dropdown die MSFS-Aktion auswählen; aktuell `SET PLASMA OFF`, standardmäßig an.
  Bei Aus bleibt die Auswahl erhalten. Auch ohne Simulator
  bearbeitbar. Der Companion speichert die Auswahl lokal und überträgt sie,
  sobald VR Checklist im EFB erreichbar ist. Hinweise auf ausstehende Übertragung verschwinden nach der
  Übernahme. Die EFB behält den letzten übernommenen Wert auch ohne Companion,
  nach Flugwechsel und Simulatorneustart. Aus unterbindet nur die
  Checklistenbestätigung; das Event erreicht weiterhin das Flugzeug.
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
- [Drittlizenzen](docs/third-party-licenses.md): Komponenten und Primärquellen.

Eigener Code und eigene Inhalte stehen unter der [MIT-Lizenz](LICENSE).
Ausgenommen sind die aus dem EFB-Template des MSFS-SDK übernommenen
Konfigurationsdateien ([Herkunft](msfs/PackageSources/README.md)),
die [Drittkomponenten](docs/third-party-licenses.md) und die Sprachaufnahmen
unter eigenen [Audiobedingungen](assets/audio/LICENSE): Weitergabe und
Bearbeitung sind erlaubt, KI-Training und die übrigen Grenzen der
ElevenLabs-Nutzungsrichtlinie gelten weiter.
