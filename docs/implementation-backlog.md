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

## Thread-Affinität und Shutdown absichern

- [ ] Den Single-Worker-Vertrag von `CommBusClient` dokumentieren oder durch
  geeignete Guards absichern.
- [ ] `ChecklistConnectionService.Dispose` so gestalten, dass die
  `CancellationTokenSource` nicht freigegeben wird, solange der Worker nach dem
  Zwei-Sekunden-Wait noch darauf zugreifen kann.
- **Problem:** Der aktuelle Einsatz ist single-threaded, die öffentliche API
  drückt diesen Vertrag jedoch nicht aus. Blockiert ein nativer Dispatch länger
  als das Shutdown-Wait, besteht ein seltener Dispose-Race.
- **Abnahme:** Normaler Exit, Exit während des Verbindungsaufbaus und Exit
  während eines Pump-Aufrufs sind definiert und hängen nicht. Die Fälle werden
  soweit ohne native MSFS-Verbindung möglich im Selbsttestpfad abgedeckt;
  anschließend `task check` und `task companion:deploy` ausführen sowie die
  deployte Version nennen.

## Ausgelieferte Drittkomponenten explizit inventarisieren

- [ ] Das tatsächliche Companion-Release gegen
  `docs/third-party-licenses.md` abgleichen und ausgelieferte transitive
  Komponenten wie `Avalonia.Remote.Protocol.dll` entweder einzeln oder durch
  eine eindeutig formulierte Komponentenfamilie samt Version und Primärquelle
  abdecken.
- **Abnahme:** Jede ausgelieferte Drittkomponente ist nachvollziehbar einer
  dokumentierten Lizenz zugeordnet. Als reine Dokumentations-/Compliance-
  Änderung entstehen kein Changelog-Eintrag und kein Deployment.

## `VRChecklistView` nur bei fachlichem Anlass zerlegen

- [ ] Bei der nächsten größeren Änderung an Transport, Persistenz oder
  Rendering prüfen, ob genau der betroffene Verantwortungsbereich ohne
  Lifecycle-Risiko extrahiert werden kann.
- **Einordnung:** Die große Klasse erschwert isolierte Tests, ist im aktuellen
  Coherent-Single-Bundle aber kein eigenständiger Fehler. Es findet kein
  vorsorglicher Komplettumbau statt.
- **Abnahme:** Eine Extraktion erfolgt nur als kleines, fachlich begründetes
  Inkrement mit unverändertem EFB-Verhalten, `task check`, `task deploy` und dem
  für den berührten Bereich notwendigen MSFS-Nachweis.
