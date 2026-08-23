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
  Breite. Sie zeigen ausschließlich Pfeil und Namen der vorherigen
  beziehungsweise nächsten Gruppe; zusätzliche Texte wie `PREVIOUS` und `NEXT`
  sind visuell redundant.
- Die Gruppennamen in den Navigationsbuttons verwenden dieselbe Schriftgröße
  wie die Texte der Checklist-Items und bleiben dadurch in VR gleich gut lesbar.
- Vor einem vorhandenen Gruppenziel steht dessen zweistellige Nummer in Blau.
  An den deaktivierten Listenenden bleiben stattdessen die unnummerierten
  Platzhalter `Start` und `Complete` sichtbar.
- Sind alle Items einer Gruppe erledigt, wechselt die App nach einer kurzen
  Bestätigungspause automatisch zur nächsten Gruppe.
- App-Header, Gruppenname und Navigation bleiben stehen; ausschließlich die
  Item-Liste scrollt. Das wird durch die Flex-Struktur und nicht durch
  `position: sticky` erreicht.
- Der Hintergrund hinter Gruppenname und Navigation ist transparent, damit der
  Bereich nicht wie eine zusätzliche schwere Leiste wirkt.
- Der Platz für die vertikale Scrollbar wird auch bei kurzen Gruppen dauerhaft
  reserviert. Navigation und Item-Liste behalten dadurch unabhängig vom
  Overflow dieselbe rechte Flucht.

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
- Die Zuordnung erfolgt über explizite, versionierte Match-Regeln für
  `ATC MODEL`, `ATC TYPE` und `TITLE`. Eine Regel darf pro Feld bewusst `equals`
  oder `contains` verwenden; mehrere Felder derselben Regel müssen gemeinsam
  passen. Es gibt keine implizite Teilstring-Heuristik und keine heimliche
  Default-Checkliste. Mehrdeutige Treffer führen ebenfalls in den Leerzustand.
- Die Auswahl wird primär ereignisgesteuert beim Öffnen der Ansicht und bei
  beobachteten Ladezustandswechseln aktualisiert. Solange die App sichtbar ist,
  prüft ein zusätzlicher Fallback die Identität nur alle zehn Sekunden. Damit
  wird ein Flugzeugwechsel auch erkannt, wenn die residente EFB-App kein
  zuverlässiges View- oder Ladezustandsereignis erhält.
- Ist keine Match-Regel zugeordnet, bleibt die App verfügbar und zeigt
  zentriert die Meldung `Keine Checkliste vorhanden`. Am unteren Rand steht eine
  einzelne, zentrierte und blasse Diagnosezeile `Model:`, gefolgt von
  `ATC MODEL`, `ATC TYPE` und `TITLE`. So kann eine neue Match-Regel anhand eines
  Screenshots oder Berichts ergänzt werden.
- Ein unbekanntes Modell darf niemals versehentlich die DA42-Checkliste laden.

## Laufzeitperformance

- Die App arbeitet event-first und führt keine eigene Logik pro Render-Frame
  aus.
- Periodische Arbeit ist nur als langsamer Sicherheitsmechanismus zulässig und
  wird beendet, sobald die App nicht sichtbar ist.
- Ein bequemeres Verhalten darf nicht unbemerkt zulasten der MSFS-Framerate
  gehen. Performance und FPS-Verträglichkeit sind explizite Qualitätskriterien.

## Checklistensprache

- Komponenten- oder Triebwerksnummern sind Teil der Challenge; die Response
  enthält nur den geforderten Zustand oder die Aktion.
- Gemeinsam gemeinte Komponentenpaare werden einheitlich und kompakt als
  `[1+2]` geschrieben. Die eckigen Klammern markieren den Komponenten-Scope;
  runde Klammern bleiben erklärenden Zusätzen vorbehalten. Numerische
  Sollstellungen bleiben in der Response.
- Die vollständigen Schreibregeln stehen in
  [`../checklists/data/style-guide.md`](../checklists/data/style-guide.md).

## Sequenzielle Eingabe (zurückgestellt)

- Das Produktziel bleibt, mit einer abstrakten externen Eingabe das erste noch
  offene Item in Checklist-Reihenfolge zu bestätigen.
- SDK 1.7.3 reicht die konfigurierte MSFS-EFB-Aktion `VALIDATE` im getesteten
  Custom-App-Kontext weder über DOM-Tastaturereignisse, den EFB-Input-Stack noch
  `AppView.routeGamepadInteractionEvent()` weiter. Auch ein physisches Gamepad
  erzeugte keinen App-Callback.
- Deshalb enthält die App aktuell keinen wirkungslosen Listener. Die Funktion
  wird erst mit einem dokumentierten und in einer Custom-App bestätigten
  Eingabepfad oder über ein später bewusst definiertes eigenes externes Event
  umgesetzt.
- L- und B-Events werden nicht ohne nachgewiesene Zuordnung als Ersatz geraten.

## Versionsanzeige

- Die App-Version steht sehr klein und blass am unteren rechten Rand, ohne die
  Checkliste visuell zu stören.
- Entwicklungsbuilds verwenden die CalVer-Ausprägung
  `YYYY.0M-dev.SSSSSSS`. `SSSSSSS` entspricht den siebenstellig aufgefüllten
  Sekunden seit Beginn des aktuellen UTC-Monats. Dadurch sind Builds innerhalb
  eines Monats automatisch eindeutig und lexikografisch sortierbar; `dev`
  kennzeichnet sie unmissverständlich als Entwicklungsstand.
- Die Build-Kennung wird beim App-Build erzeugt. Für einen Release kann eine
  explizite Version vorgegeben und beispielsweise nur `YYYY.0M` angezeigt
  werden.

## Sprachausgabe

- Die erste TTS-Sprache der App ist Englisch.
- Beim Übergang vom unvollständigen in den vollständig erledigten Zustand einer
  Checkliste wird einmalig `Checklist completed` gesprochen.
- Ein Reset oder das bloße Laden einer bereits leeren Checkliste darf diese
  Ansage nicht auslösen. Wird ein abgeschlossenes Item wieder geöffnet und die
  Checkliste danach erneut vervollständigt, ist eine neue Ansage zulässig.

## Referenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png) ist
  die historische Layoutreferenz für die kompakte Hauptzeile. Ihr blauer linker
  Action-Marker wurde durch eine spätere Entscheidung verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png) zeigt den
  aktuellen MSFS-Laufzeitstand und die noch offene rechte Fehlflucht der
  Abschnittsnavigation.
