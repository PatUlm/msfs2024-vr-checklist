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

## Querformat-Layout

- [ ] Die Orientation-Einstellung des EFB vertauscht Breite und Höhe der
  Layoutbox. Mit der kurzen Seite als Skalierungsbasis bleibt die Textgröße im
  Querformat gleich und es sind weniger Zeilen sichtbar. Ob ein eigenes
  Querformat-Layout nötig ist, wird erst nach einem MSFS-Nachweis im
  Querformat entschieden.
