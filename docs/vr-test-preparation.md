# Abschluss des ersten VR-Teststands

## Ziel

Der erste echte VR-Test sollte einen möglichst unbeeinflussten Ersteindruck
liefern. Der Benutzer flog deshalb ohne vorgegebene Test-Checkliste und meldete
die im normalen Betrieb beobachteten Abweichungen zurück.

Status: **Erfolgreich abgeschlossen am 2026-08-23.** Das kompakte VR-Layout ist
gut lesbar und bedienbar; Phase 1 ist damit abgenommen. Die akzeptierte
Laufzeitreferenz liegt unter
[`assets/vr-g36-accepted-layout.png`](assets/vr-g36-accepted-layout.png).

Der erste freie VR-Flug mit der G36 wurde erfolgreich absolviert. Die
Checkliste war insgesamt gut bedienbar. MSFS vergrößerte jedoch die gesamte
EFB-Darstellung in VR, wodurch die 20-Pixel-Schrift zu groß wirkte, und der
reservierte Scrollbarbereich erzeugte rechts einen sichtbar größeren
Außenabstand. Die 17-Pixel-Basisschrift und das korrigierte Padding wurden im
zweiten VR-Stand als deutliche Verbesserung bestätigt. Navigation, Item-Zeilen,
Checkboxen und deren Innenmaße wurden anschließend ebenfalls moderat
verkleinert; dieses Dichteprofil ist für den nächsten Flug akzeptiert. Die
EFB-Aktion `VALIDATE` erreicht die Custom-App über keinen der mit SDK 1.7.3
verfügbaren getesteten Pfade und bleibt weiterhin deaktiviert.

Beim ersten Wechsel aus VR zurück in den normalen Modus gingen abgeschlossene
Items scheinbar verloren. Der daraufhin ergänzte kurzlebige
SDK-`DataStore`-Snapshot wurde beim Wechsel von Nicht-VR zu VR und zurück
erfolgreich geprüft: Fortschritt und aktive Gruppe bleiben bestehen. Ein echter
Flug-Ladezustand oder Flugzeugwechsel löscht den Snapshot weiterhin. Nachdem
ein Snapshot aus Release 0.1.2 auch einen zeitnahen vollständigen
Simulatorneustart überlebt hatte, wurde er zusätzlich an den über
`E:SIMULATION TIME` abgeleiteten Simulatorprozess gebunden. Der nächste
Laufzeittest zeigte anschließend, dass Release 0.1.4 bei einem neuen Free Flight
mit demselben H125 innerhalb desselben Simulatorprozesses trotzdem den alten
Fortschritt wiederherstellte. Seitdem entsteht der Snapshot ausschließlich als
15 Sekunden gültige Einmal-Übergabe bei einem erkannten Wechsel von `IS IN VR`.
Release 0.1.5 behielt den Fortschritt in einem weiteren neuen H125-Free-Flight
dennoch auch nach einer Wartezeit von mehr als 15 Sekunden. Damit ist bestätigt,
dass nicht der abgelaufene `DataStore`-Snapshot, sondern der unbegrenzt lebende
In-Memory-Zustand der residenten EFB-App erhalten bleibt, wenn weder
`GameState.loading` noch eine neue Flugzeugidentität beobachtet wird.

Die erste Lifecycle-Telemetrie zeigte beim Verlassen des Free Flight und beim
Start des nächsten Fluges den Wechsel `GameModeManager.isInMenu` von `false`
auf `true` und zurück. Der Gegenversuch ESC → Settings → Save → Resume erzeugte
jedoch exakt dieselbe Sequenz. Dieser Menüstatus ist damit als Reset-Signal
ausgeschlossen.

SDK 1.7.3, das mitgelieferte `FlowAircraft`-Sample und die offizielle
JavaScript-Flow-API dokumentieren stattdessen den globalen CommBus-Kanal
`__FLOW_API__`. Die App lauscht über `JS_LISTENER_COMM_BUS` auf
die Flow-Events und setzt bei `FltLoad` zurück. Nach der runtime-verifizierten
Behebung protokolliert die Coherent-Ausgabe jedes Flow-Event nur noch als eine
kompakte Zeile mit Eventname, Event-ID und optionalem FLT-Pfad. Der frühere
Diagnosestand ergänzte zusätzlich Game-State und Flugzeugidentität; diese
Angaben stehen weiterhin in den Meldungen zu Display-Mode, Flugzeugauswahl und
Reset.

Der Laufzeittest mit `0.1.5-dev.20260825194948` bestätigte trotz durchgehendem
Game-State `ingame` und unveränderter H125-Identität diese Ereignisfolge:
`FlightEnd`, `FltLoad`/`FltLoaded` für `apron.flt`,
`FltLoad`/`FltLoaded` für `CustomFlight.FLT`, `TeleportStart`/`TeleportDone`
und anschließend `FlightStart`. Der Reset wurde bei `FltLoad` ausgeführt, und
der neue H125-Free-Flight begann ohne die erledigten Punkte des vorherigen
Fluges. Mehrere `FltLoad`-Ereignisse innerhalb derselben Ladesequenz sind
beobachtet und wegen des idempotenten Resets unkritisch.

Der entscheidende Gegenversuch ist damit ebenfalls bestanden: ESC → Settings →
Save → Resume behielt auf Build `0.1.5-dev.20260825200349` alle gesetzten Haken
und löste keinen Reset aus. Das Config-Menü sendet also kein `FltLoad`, während
der Flugwechsel es sendet. Genau diese Unterscheidung fehlte `isInMenu`.

Der Rundweg Nicht-VR → VR → Nicht-VR wurde für die Flow-API-Umstellung nicht
erneut geprüft. Er war in der Phase-1-Abnahme erfolgreich, und ein
Display-Mode-Wechsel erzeugt kein `FltLoad`, sodass die Einmal-Übergabe im
`DataStore` unberührt bleibt. Eine Abweichung wird als neuer Bugreport
behandelt.

## Automatische Checklistenauswahl

- Alle versionierten JSON-Checklisten werden über eine zentrale Registry in die
  App eingebunden.
- Das aktuell geladene Modell wird über die String-SimVar `ATC MODEL` gelesen.
- Das Datenschema enthält explizite Regeln für `ATC MODEL`, `ATC TYPE` und
  `TITLE`. Pro Feld ist `equals` oder ein bewusstes `contains` erlaubt; alle
  Felder einer Regel müssen gemeinsam passen.
- Beim Flugwechsel werden Modell und Checkliste neu ermittelt, Zustände
  zurückgesetzt und die erste Gruppe aktiviert.
- `onResume()` und der bestehende Game-State-Listener lösen sofortige Prüfungen
  aus. Nur als Absicherung werden die drei String-Werte bei sichtbarer App alle
  zehn Sekunden gelesen; bei pausierter App läuft kein Timer.
- Unbekannte Modellwerte werden in der DevMode-Konsole protokolliert, damit ein
  Alias gezielt ergänzt werden kann.

Die offiziellen SDK-Unterlagen beschreiben `ATC MODEL` als Modellnamen für ATC
mit bis zu 128 Zeichen. Die DA42-Zuordnung ist im Simulator bestätigt; die
Laufzeitwerte der G36 und MH-60 wurden erfasst und in Match-Regeln übernommen.
Die erste H125-Regel verwendet den eindeutigen `H125`-Teil des sichtbaren
Titels, weil das gestreamte Asobo-Paket seine `aircraft.cfg`-Werte nur in
geschützten `fsarchive`-Dateien bereitstellt. Die automatische Auswahl der
H125-Checkliste über diese Regel wurde am 2026-08-25 im MSFS-Laufzeitsystem
bestätigt.

Für den kompakten H125-Motorstart steht `Pitot Heat: On` nach Generator und
Avionik sowie vor dem Übergang des Twist Grip auf `FLIGHT`. Diese Reihenfolge
folgt der veröffentlichten
[AS350/H125-Operatorcheckliste](https://aviapages.com/media/2022/03/14/Checklist_H125.pdf),
die Pitot Heat nach Generator und Avionics/Instruments und vor Hydrauliktest und
Flight-Stellung aufführt.

Der kompakte H125-Shutdown spiegelt die zuvor verwendeten Bedienelemente und
folgt dem veröffentlichten
[AS350-B3e-Flight-Manual-Auszug](https://data.ntsb.gov/Docket/Document/docBLOB?FileExtension=.PDF&FileName=Excerpts+from+AS350+Flight+Manual%2C+Revisions+2+%26+3+-+Normal+Procedures-Master.PDF&ID=40431411):
Twist Grip auf `IDLE`, 30 Sekunden Cool-down, Pitot/Horn/Licht/Avionik,
Starter und Generator aus, Rotorbremse bei höchstens 140 Rotor-RPM sowie Beacon
und Battery/Master nach Rotorstillstand aus.

Die EFB-API dokumentiert `onResume()` für jede Wiederaufnahme der Ansicht. Für
den eigentlichen Flug-Lifecycle stellt MSFS 2024 darüber hinaus die globale
[JavaScript Flow API](https://docs.flightsimulator.com/msfs2024/html/6_Programming_APIs/JavaScript/Flow_API/Flow_API.htm)
bereit. Sie liefert unter anderem `FltLoad`, `FltLoaded`, `BackToMainMenu`,
`FlightStart` und `FlightEnd` direkt über den Communication API Listener. Eine
eigene WASM-Brücke ist für diese Events deshalb nicht erforderlich. Der
Zehn-Sekunden-Timer bleibt ausschließlich als Fallback für die automatische
Flugzeugauswahl bestehen, nicht als Erkennung eines neuen Fluges.

## Fehlende Checkliste

Ist keine Checkliste zugeordnet, rendert die normale App-Fläche ohne Header,
Fortschritt oder Navigation den mittig zentrierten Text:

`Keine Checkliste vorhanden`

Am unteren Rand zeigt eine einzelne, zentrierte und blasse `Model:`-Zeile die
aktuellen String-Werte von `ATC MODEL`, `ATC TYPE` und `TITLE`, getrennt durch
senkrechte Striche.

## Minimaler Inhalt der Bonanza G36

Datei: `checklists/data/beechcraft-bonanza-g36.json`

Die Reihenfolge ist `Departure`, danach `Approach`. Die Bezeichnungen folgen
wo möglich der DA42:

| Gruppe    | Challenge           | Response       | Typ    |
| --------- | ------------------- | -------------- | ------ |
| Departure | Flaps               | 0              | action |
| Departure | Rotation Speed (Vr) | 73 kt          | action |
| Departure | Climb Rate          | Positive       | verify |
| Departure | Gear                | Up             | action |
| Departure | Climb Speed (Vy)    | 100 kt         | action |
| Approach  | Gear                | Down           | action |
| Approach  | Approach Speed      | 95 kt          | action |
| Approach  | Flaps               | 1 (Approach)   | action |
| Approach  | Landing Speed       | 80 kt          | action |
| Approach  | Flaps               | 2 (Full)       | action |

Die Checkliste ist absichtlich minimal und unvollständig. Es werden keine
zusätzlichen Verfahrensschritte erfunden. Der Benutzer hat bestätigt, dass mit
`Flag`/`Flags` jeweils `Flap`/`Flaps` gemeint war. Die Werte 95 kt und 80 kt
werden ohne TAS- oder IAS-Zusatz als `Approach Speed` beziehungsweise
`Landing Speed` dargestellt.

## VALIDATE-Bedienung (zurückgestellt)

Das Produktziel ist weiterhin, über eine externe Aktion das erste noch offene
Item zu bestätigen. Für den ersten VR-Teststand ist die Funktion jedoch bewusst
nicht aktiv. Folgende Wege wurden im MSFS/Coherent-Laufzeitsystem geprüft:

- DOM `keydown` für Enter, Return und Numpad Enter: kein Event in der App.
- EFB-`InputStackListener` für `KEY_EFB_VALID` auf `released`: kein Callback.
- Nach gemeldeter Stack-Bereitschaft `KEY_EFB_VALID` und
  `KEY_MENU_WM_VALIDATE` auf `pressed`: Registrierung erfolgreich, aber kein
  Callback.
- `AppView.routeGamepadInteractionEvent(GamepadEvents.BUTTON_A)`: weder mit ENT
  noch mit einem physischen Gamepad ein Callback.

Die beobachtete Warnung zu bereits aktivierten Gamepad-Inputs stammte aus
`atlasapp.js` und nicht aus der VR Checklist. Alle wirkungslosen Listener sind
aus dem aktiven Code entfernt. Der Quellcode hält die Versuche als Kommentar
fest; eine erneute Umsetzung wartet auf einen dokumentierten und in einer
Custom-App bestätigten Eventpfad oder ein bewusst definiertes eigenes externes
Event.

## Abnahmeergebnis

Der lokale Stand bestand `task check` und wurde über `task deploy`, **Build All
In Project** sowie **Ignore Cache + Reload** in MSFS geladen. Der anschließende
freie VR-Flug bestätigte Lesbarkeit, Bedienbarkeit, Flugzeugauswahl und das
kompakte VR-Dichteprofil. Der Wechsel Nicht-VR → VR → Nicht-VR behielt den
Checklistenzustand bei.
