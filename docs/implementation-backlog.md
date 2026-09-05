# Priorisierter Umsetzungs-Backlog

Dieses Dokument enthält ausschließlich die noch offenen Code-, Build- und
Qualitätsarbeiten. Die unnummerierten Abschnitte stehen in ihrer
Umsetzungsreihenfolge; die nächste Arbeitssession beginnt beim ersten Abschnitt
und schließt möglichst jeweils ein kleines, lauffähiges Inkrement
einschließlich der nach `AGENTS.md` notwendigen Prüfungen, Deployments,
Dokumentation und Commits ab.

Vollständig erledigte Abschnitte werden entfernt und nicht dauerhaft abgehakt.
Checkboxen halten nur den Zwischenstand mehrteiliger offener Arbeiten fest;
sobald die gesamte Abnahme erfüllt ist, wird der zugehörige Abschnitt gelöscht.
Erledigte Arbeit bleibt über Git-Historie, Changelog und die jeweils zuständige
Projektdokumentation nachvollziehbar.

Offene visuelle Abweichungen bleiben ausschließlich in `design-qa.md`, noch
ausstehende MSFS-Laufzeitnachweise ausschließlich in `open-tests.md`. Dieser
Backlog dupliziert diese Listen nicht.

## `VRChecklistView` fachlich zerlegen

- [ ] Vor dem nächsten Feature die derzeit rund 1.700 Zeilen große View in
  klar benannte Verantwortungsbereiche zerlegen. Kandidaten sind Domänenmodell
  und Flugzeug-Matching, Laufzeitzustand und Persistenz, CommBus-Transport,
  Bestätigungseingabe sowie Rendering.
- [ ] Die dabei isolierte zustandsbehaftete Logik mit gezielten Unit-Tests
  absichern, insbesondere Persistenzabgleich, Lifecycle-Übergänge und
  Flugzeugauswahl.
- **Einordnung:** Die View bündelt zu viele unabhängige Aufgaben und erschwert
  Review, Änderung und isolierte Tests. Das Refactoring ist der nächste
  Code-Arbeitsschritt, aber nicht Teil der aktuellen ADR-Korrektur.
- **Abnahme:** Das ausgelieferte Verhalten und das Coherent-Single-Bundle
  bleiben unverändert. Erforderlich sind `task check`, `task deploy` sowie ein
  MSFS-Nachweis für VR-Wechsel, Fortschrittserhalt, Flugwechsel-Reset,
  Bestätigungseingabe und CommBus-Status.

## Skalierung an einen zentralen Faktor binden

- [ ] Alle Größen des Stylesheets (derzeit rund 130 feste Pixelwerte in zwei
  Dichteprofilen) auf einen zentralen Skalierungsfaktor umstellen. Mechanismus
  nach Laufzeitnachweis aus `open-tests.md`: CSS Custom Property mit `calc()`
  oder Root-Schriftgröße mit `em`. Kein `transform: scale` (siehe `DON'T` in
  `msfs-sdk-reference.md`).
- [ ] Skalierungsfaktor = kurze Viewportseite / Profilkonstante, Profilwahl
  nach der Tabelle unten. Die Viewport-Werte stehen in
  `msfs-sdk-reference.md`. `E:IS IN VR` bleibt zusätzlich Auslöser für den
  Fortschrittsabgleich beim Kontextwechsel.
- **Entscheidung (2026-09-05):** Der Faktor ist kontinuierlich, nicht in
  Stufen gerastert. Die Basisschrift wird per JS aus dem Viewport berechnet,
  auf 0,1 px gerundet und als Root-Schriftgröße auf das App-Element gesetzt;
  alle Stylesheet-Größen folgen in `em`. Neu berechnet wird nur bei `resume`,
  `resize` und VR-Wechsel, nicht pro Frame. Eine Stufentabelle wäre mehr
  Pflege ohne Performancegewinn, weil der Viewport nur zwischen den
  gemessenen Werten springt. Zeigt der MSFS-Nachweis unscharfen Text, wird die
  Rasterung an derselben Stelle ergänzt.
- [ ] Querformat: Die Orientation-Einstellung vertauscht Breite und Höhe. Mit
  der kurzen Seite als Basis bleibt die Textgröße gleich und es sind weniger
  Zeilen sichtbar; ein eigenes Querformat-Layout ist ein späterer, getrennter
  Schritt.
- [ ] Danach: Einstellung `Auto` oder fester Prozentwert, persistent im
  `DataStore`, damit sie ohne laufende Begleit-App gilt. Offen ist, ob die
  Bedienung in der EFB-App, in der Begleit-App über CommBus oder an beiden
  Orten liegt.
- **Abnahme:** Die Designentscheidung zum VR-Dichteprofil in
  `design-decisions.md` wird durch den Abschnitt „Dichteprofile“ ersetzt.
  Erforderlich sind `task check`, `task deploy` sowie ein MSFS-Nachweis für
  montiertes EFB, schwebendes VR-Panel und gelöstes Nicht-VR-Panel in Small
  und Large mit dem abgenommenen VR-Layout als Referenz.

### Dichteprofile (entschieden 2026-09-05)

Die Skalierung ist viewport-proportional, wie bei den Microsoft-EFB-Apps:
Innerhalb eines Profils zeigt die App immer denselben Ausschnitt, unabhängig
davon, ob das EFB montiert oder gelöst ist und welche EFB-Größe gewählt wurde.
Small/Medium/Large und die Distanz zum Panel ändern nur die physische Größe,
nie den Inhalt. Die App wertet `efbSize` deshalb nicht aus; „mehr sehen“ deckt
ausschließlich der manuelle Prozentfaktor ab. Dass das gelöste Panel bei
gleichem Ausschnitt physisch größer wirkt als das montierte, regelt der
Benutzer über EFB-Größe und Distanz, nicht die App.

Ein Profil ist durch eine Konstante definiert: Basisschrift = kurze
Viewportseite / Konstante. Die Referenz je Profil ist ein heute akzeptierter
Zustand.

| Profil | Ausschnitt | Referenz | Konstante |
|---|---|---|---|
| VR | die heutige VR-Ansicht mit großen Elementen | montiertes Tablet in VR, 17 px auf 468 | 27,5 |
| Nicht-VR | etwas mehr Inhalt als VR | gelöstes Small-Panel in Nicht-VR, 20 px auf 782 | 39 |

Profilwahl:

| Situation | Erkennung | Profil |
|---|---|---|
| VR, montiert oder gelöst | `E:IS IN VR` | VR |
| Nicht-VR, montiert | Viewportbreite unter der Schwelle zwischen 468 und 782 | VR |
| Nicht-VR, gelöst | sonst | Nicht-VR |

Das in Nicht-VR montierte Tablet erhält bewusst das VR-Profil (17 px statt
heute 20 px auf 468): „Montiert immer die VR-Ansicht“ gilt in beiden Modi,
„in Nicht-VR etwas mehr sehen“ nur für das gelöste Panel. Die Konstanten sind
Startwerte und werden beim MSFS-Nachweis des Inkrements am Bild bestätigt
oder angepasst.
