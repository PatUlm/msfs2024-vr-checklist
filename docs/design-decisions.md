# Designentscheidungen

Dieses Dokument beschreibt die dauerhaft akzeptierte Produktsprache der VR
Checklist. Beobachtungen, noch nicht gelöste Abweichungen und die nächste
Iteration stehen separat in `design-qa.md`.

## VR-first Typografie und Dichte

- Die Basisschrift der Checkliste beträgt 20 CSS-Pixel. Sie ist bewusst größer
  als in der ursprünglichen Layoutreferenz, damit sie in VR lesbar bleibt.
- Ein einfaches Action-Item hat mindestens 60 Pixel Höhe. Condition,
  Alternative, Note oder Review-Inhalt dürfen das Item vertikal vergrößern.
- Zwischen Items liegen 8 Pixel Abstand; gefordert waren mindestens 2 Pixel.
- Lesbarkeit und robuste Interaktion sind wichtiger als die maximale Anzahl
  gleichzeitig sichtbarer Items.

## Seiten- und Abschnittsaufbau

- Auf dem Bildschirm ist genau eine Checklistengruppe sichtbar.
- Der aktuelle Gruppenname ist visuell dominant und zeigt Nummer und Titel auf
  gemeinsamer Grundlinie.
- Darunter liegen zwei gleichwertige Navigationsbuttons mit jeweils 50 Prozent
  Breite. Sie zeigen Pfeil, Richtung sowie den Namen der vorherigen
  beziehungsweise nächsten Gruppe.
- Sind alle Items einer Gruppe erledigt, wechselt die App nach einer kurzen
  Bestätigungspause automatisch zur nächsten Gruppe.
- App-Header, Gruppenname und Navigation bleiben stehen; ausschließlich die
  Item-Liste scrollt. Das wird durch die Flex-Struktur und nicht durch
  `position: sticky` erreicht.
- Der Hintergrund hinter Gruppenname und Navigation ist transparent, damit der
  Bereich nicht wie eine zusätzliche schwere Leiste wirkt.

## Aufbau eines Checklist-Items

- Die Hauptzeile besteht aus Challenge, gut sichtbarer gepunkteter Führung,
  Response und einer rechts ausgerichteten Checkbox auf gleicher Höhe.
- Die gesamte Item-Fläche ist das Interaktionsziel, einschließlich des Randes
  um die Checkbox.
- Der Default-Typ `action` erhält weder ein sichtbares Typ-Label noch einen
  farbigen linken Marker.
- `verify` und `communication` bleiben sichtbar gekennzeichnet und erhalten
  einen semantischen linken Farbmarker.
- `Review required` ist ein neutraler Zusatzstatus und bekommt keine eigene
  Signalfarbe.
- Labels wie `Condition:` und `Note:` enden mit Doppelpunkt und haben dieselbe
  Schriftgröße wie der nachfolgende Text.

## Zustände und Rückmeldung

- Erledigte Items verwenden einen grünen Hintergrund und ein X in der
  Checkbox. Das X wird mit CSS-Linien gezeichnet, nicht als Font-Glyphe.
- Hover hebt ein Item durch einen helleren Hintergrund hervor, nicht durch eine
  weiße Umrandung. Textkontrast und Erledigt-Status müssen erhalten bleiben.
- Die Abschnittsnavigation soll dieselbe zurückhaltende, hintergrundbasierte
  Hover-Sprache verwenden.
- Beim Start beziehungsweise Laden eines neuen Fluges werden alle Items, der
  Fortschritt und die aktive Gruppe zurückgesetzt.

## Flugzeugauswahl und Leerzustand

- Die App wählt automatisch die zum aktuell geladenen Flugzeug oder
  Hubschrauber passende JSON-Checkliste.
- Die Zuordnung erfolgt über explizite MSFS-Modell-Aliase in den versionierten
  Daten. Es gibt keine unscharfe Auswahl nach Teilstrings und keine heimliche
  Default-Checkliste.
- Ist kein Alias zugeordnet, bleibt die App verfügbar und zeigt zentriert die
  kurze Meldung `Keine Checkliste vorhanden`.
- Ein unbekanntes Modell darf niemals versehentlich die DA42-Checkliste laden.

## Sequenzielle Eingabe

- Der Stream-Deck-Hotkey `Return` sowie `Enter` und `Numpad Enter` bestätigen
  das erste noch offene Item in Checklist-Reihenfolge.
- Die Eingabe ist nur aktiv, solange die VR-Checklist-Ansicht sichtbar ist. Sie
  darf außerhalb der App insbesondere keine Karriere-Funkaktion blockieren.
- Ein Gedrückthalten der Taste darf ein Item nur einmal bestätigen.
- Der erste Implementierungsweg ist ein normales Coherent/DOM-Tastaturereignis.
  L- und B-Events sind kein Ersatz für eine Tastatureingabe. Falls Coherent das
  Ereignis nicht liefert, wird erst nach Ermittlung des tatsächlich ausgelösten
  MSFS-Key-Events ein gezielter Intercept ergänzt.

## Referenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png) ist
  die historische Layoutreferenz für die kompakte Hauptzeile. Ihr blauer linker
  Action-Marker wurde durch eine spätere Entscheidung verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png) zeigt den
  aktuellen MSFS-Laufzeitstand und die noch offene rechte Fehlflucht der
  Abschnittsnavigation.
