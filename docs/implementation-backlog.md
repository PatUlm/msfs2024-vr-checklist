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
- [ ] Auto-Skalierung aus `window.innerWidth`/`innerHeight` ableiten statt aus
  `E:IS IN VR`; das heutige VR-Dichteprofil wird ein abgeleiteter Faktor. Die
  Viewport-Größe liefert zugleich Hoch- oder Querformat. `E:IS IN VR` bleibt
  nur Auslöser für den Fortschrittsabgleich beim Kontextwechsel.
- [ ] Danach: Einstellung `Auto` oder fester Prozentwert, persistent im
  `DataStore`, damit sie ohne laufende Begleit-App gilt. Offen ist, ob die
  Bedienung in der EFB-App, in der Begleit-App über CommBus oder an beiden
  Orten liegt.
- **Einordnung:** Voraussetzung ist der Nachweis in `open-tests.md`, dass sich
  montiertes und schwebendes EFB in der Viewport-Größe unterscheiden. Liefern
  beide dieselben Werte, kann Auto-Skalierung den Unterschied nicht erkennen;
  dann trägt nur der manuelle Faktor.
- **Abnahme:** Die Designentscheidung zum VR-Dichteprofil in
  `design-decisions.md` wird ersetzt. Erforderlich sind `task check`,
  `task deploy` sowie ein MSFS-Nachweis für montiertes EFB, schwebendes
  VR-Panel und Nicht-VR mit dem abgenommenen VR-Layout als Referenz.
