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
Laufzeittest muss sowohl den VR-Rundweg als auch einen vollständigen
MSFS-Neustart abdecken.

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

Die EFB-API dokumentiert `onResume()` für jede Wiederaufnahme der Ansicht. Die
offiziellen Ereignisse `AircraftLoaded` und `FlightLoaded` existieren dagegen
in der nativen SimConnect-Schicht und stehen der reinen EFB-JavaScript-App nicht
als dokumentierter Hook zur Verfügung. Eine zusätzliche WASM- oder externe
SimConnect-Komponente wäre für diese Aufgabe unverhältnismäßig. Deshalb bleibt
die Implementierung event-first und verwendet den Zehn-Sekunden-Timer nur als
Fallback für den beobachteten residenten Free-Flight-Wechsel.

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
