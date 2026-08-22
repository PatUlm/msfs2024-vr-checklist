# Vorbereitung des ersten VR-Teststands

## Ziel

Der erste echte VR-Test soll einen möglichst unbeeinflussten Ersteindruck
liefern. Der Agent erstellt deshalb keine Test-Checkliste und gibt keinen
vorgegebenen Prüfablauf vor. Der Benutzer fliegt normal und berichtet danach,
was nicht gut funktioniert hat.

Vor diesem Test soll der nächste Build die drei offenen UI-Punkte aus
`design-qa.md` sowie die folgenden Produktfunktionen enthalten.

## Automatische Checklistenauswahl

- Alle versionierten JSON-Checklisten werden über eine zentrale Registry in die
  App eingebunden.
- Das aktuell geladene Modell wird über die String-SimVar `ATC MODEL` gelesen.
- Das Datenschema erhält pro Checkliste eine explizite Liste akzeptierter
  MSFS-Modell-Aliase. Verglichen wird normalisiert, aber exakt; keine
  Teilstring-Heuristik verwenden.
- Beim Flugwechsel werden Modell und Checkliste neu ermittelt, Zustände
  zurückgesetzt und die erste Gruppe aktiviert.
- Unbekannte Modellwerte werden in der DevMode-Konsole protokolliert, damit ein
  Alias gezielt ergänzt werden kann.

Die offiziellen SDK-Unterlagen beschreiben `ATC MODEL` als Modellnamen für ATC
mit bis zu 128 Zeichen. Die konkreten Laufzeitwerte für DA42, G36 und MH-60
müssen im Simulator einmal verifiziert werden.

## Fehlende Checkliste

Ist keine Checkliste zugeordnet, rendert die normale App-Fläche ohne Header,
Fortschritt oder Navigation ausschließlich den mittig zentrierten Text:

`Keine Checkliste vorhanden`

## Vorläufiger Inhalt der Bonanza G36

Datei: `checklists/data/beechcraft-bonanza-g36.json`

Die Reihenfolge ist `Departure`, danach `Approach`. Die Bezeichnungen folgen
wo möglich der DA42:

| Gruppe    | Challenge           | Response       | Typ    |
| --------- | ------------------- | -------------- | ------ |
| Departure | Flaps               | 0              | action |
| Departure | Rotation Speed (Vr) | 73 kt          | action |
| Departure | Climb Rate          | Positive       | verify |
| Departure | Gear                | Up             | action |
| Approach  | Gear                | Down           | action |
| Approach  | Approach Speed      | 95 kt          | action |
| Approach  | Flaps               | 1 (Approach)   | action |
| Approach  | Approach Speed      | 90 kt          | action |
| Approach  | Flaps               | 2 (Full)       | action |

Die Checkliste ist absichtlich minimal und unvollständig. Es werden keine
zusätzlichen Verfahrensschritte erfunden. Der Benutzer hat bestätigt, dass mit
`Flag`/`Flags` jeweils `Flap`/`Flaps` gemeint war. Die Werte 95 kt und 90 kt
werden ohne TAS- oder IAS-Zusatz einheitlich als `Approach Speed` dargestellt.

## Enter-Bedienung

Der Benutzer löst die Eingabe über die Stream-Deck-Aktion `Hotkey: Return` aus.
Sie soll sich für Coherent wie eine normale Enter-Taste verhalten.

Erster Versuch:

- Listener für `keydown` in `onResume()` registrieren und in `onPause()` wieder
  entfernen.
- `event.key === "Enter"` akzeptieren; sowohl `code === "Enter"` als auch
  `code === "NumpadEnter"` unterstützen und Wiederholungen über `event.repeat`
  ignorieren.
- Das erste noch offene Item in Checklist-Reihenfolge bestätigen und bei Bedarf
  dessen Gruppe anzeigen.
- `preventDefault()` und `stopPropagation()` nur ausführen, wenn die sichtbare
  Checklist-Ansicht das Ereignis tatsächlich verarbeitet.

Falls das EFB kein DOM-Tastaturereignis erhält, wird nicht blind ein L- oder
B-Event eingeführt. Stattdessen wird im Simulator ermittelt, welchen Key-Event
die vorhandene `ENT`-Belegung auslöst. Erst danach kann der
`KeyEventManager` aus dem MSFS SDK diesen konkreten Event abfangen. Der Intercept
muss bei sichtbarer App konsumieren und bei pausierter App wieder durchreichen,
damit Karriere-Funksprüche außerhalb der Checkliste weiterhin funktionieren.

## Abnahmekriterium vor dem freien VR-Test

Der lokale Stand muss `task check` bestehen und nach `task deploy`, **Build All
In Project** sowie **Ignore Cache + Reload** in 2D kurz auf technische Fehler
geprüft werden. Danach folgt der freie VR-Test ohne weiteren vorgegebenen
Prüfablauf.
