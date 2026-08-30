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

## Snapshot-Versand ratenbegrenzen und zusammenfassen

- [ ] Zustandsgetriebene CommBus-Snapshots mit einer kleinen, expliziten
  Ratenbegrenzung beziehungsweise einem Latest-State-Coalescing versehen.
  Direkte Antworten auf eine `stateRequest` bleiben unverzüglich und behalten
  deren `requestId`.
- **Problem:** Der EFB-Kanal sendet aktuell jeden Zustand unmittelbar. Das ist
  bei menschlichem Interaktionstempo praktisch begrenzt, erfüllt aber die
  dokumentierte SDK-DO-Regel und das Phase-3-Abnahmekriterium nicht explizit;
  an Abschnittsgrenzen entstehen zudem zwei zeitnahe Snapshots.
- **Abnahme:** Änderungen gehen ohne merkbare Verzögerung an den Companion,
  Bursts werden auf den neuesten Zustand zusammengefasst und eine explizite
  Anfrage erhält zuverlässig genau eine zuordenbare Antwort. `task check` und
  `task deploy` ausführen, die deployte Version nennen und den zugehörigen
  Punkt in `open-tests.md` in MSFS prüfen. Nutzerwirksame
  Zuverlässigkeitsänderungen im Changelog beschreiben.

## Offline-Release-Notes in die Companion-App integrieren

- [ ] In der Companion-App einen Button `Release Notes` und eine dazugehörige
  Ansicht oder ein Dialogfenster umsetzen.
- [ ] Eine eigene, versionierte und app-lesbare Release-Notes-Quelle unter
  `companion/` anlegen. Das konkrete Format wird im Inkrement festgelegt und
  erhält eine Validierung für SemVer, Kalenderdatum, eindeutige Versionen,
  Hauptmerkmal und geordnete Einzeiler.
- [ ] Die bisher veröffentlichten Companion-Stände aus `CHANGELOG.md` so weit
  zurückführen, dass mindestens jede ausgelieferte Companion-Version enthalten
  ist. Die neueste Version steht zuerst.
- **Darstellung:** Jede Version zeigt SemVer und Veröffentlichungsdatum. Das
  Hauptmerkmal steht als kurzer Text vor der Liste; danach folgen Features und
  Fehlerkorrekturen als knappe Bulletpoint-Einzeiler in abnehmender Wichtigkeit.
  Die Ansicht funktioniert vollständig offline.
- **Quellenvertrag:** `CHANGELOG.md` bleibt die vollständige englische Historie
  nutzerwirksamer Änderungen. Die separate Release-Notes-Quelle ist die
  kuratierte Darstellung für die Companion-App. Release-Prüfungen verhindern
  abweichende Versionen oder Datumswerte.
- **Abnahme:** Button, Navigation beziehungsweise Schließen, lange Listen,
  Textumbruch und Sortierung werden in der gebauten Windows-App geprüft.
  `task check` und `task companion:deploy` ausführen, die tatsächlich deployte
  Version nennen und die neue Funktion unter `CHANGELOG.md`/`[Unreleased]`
  eintragen. Dieses Inkrement wird vor dem Audio-Nachweis abgeschlossen.

## Protokollvalidierung und vorhandene Selbsttests erweitern

- [ ] `ChecklistStateProtocol.ParseSnapshot` auch für die Pflichtfelder
  verschachtelter Checklist-, Gruppen- und Item-Datensätze vollständig
  validieren.
- [ ] Den bestehenden `--self-test`-Pfad mindestens um malformed Snapshots,
  `CompletedRequiredItems > TotalRequiredItems`, Sequenzen kleiner eins,
  leere Pflichtfelder, Assembler-Reset, neue Sequenzen, `outOf == 0`,
  Session-/Sequenz-Deduplizierung und Fortschritt `0 / 0` ergänzen.
- **Festlegung:** Für die kleine Companion-App wird kein separates xUnit-,
  NUnit- oder anderes Testprojekt eingeführt. Der leichte, deterministische
  Konsolen-Selbsttest bleibt der vorgesehene Testweg. Diese Festlegung ist neu
  zu bewerten, falls Umfang oder Isolation der Tests deutlich wachsen.
- **Abnahme:** Jeder Fall liefert bei einem isolierten Fehler eine eindeutige
  Meldung und einen Exitcode ungleich null. `task check` und bei Änderungen am
  Companion `task companion:deploy` ausführen sowie die deployte Version
  nennen.

## Dispatch-Fehlervertrag des CommBus-Clients härten

- [ ] Festlegen und implementieren, ob ein fehlerhaftes CommBus-Paket den
  aktuellen Client bewusst beendet oder nach Assembler-Reset übersprungen wird.
  `dispatchError` darf in keinem Fall unbeabsichtigt über spätere Pump-Aufrufe
  kleben bleiben.
- **Problem:** Jede Exception im Dispatch wird derzeit als fataler Pump-Fehler
  gespeichert. Der aktuelle Service reconnectet daraufhin vollständig; ein
  anderer Aufrufer, der die Exception abfängt und weiterpumpt, erhält denselben
  Fehler dauerhaft.
- **Abnahme:** Der gewählte Vertrag ist im Code erkennbar, durch den bestehenden
  Selbsttestpfad abgedeckt und verliert keine nachfolgende gültige Nachricht.
  Ein absichtlich beschädigtes Paket kann die Companion-App nicht dauerhaft
  stilllegen. `task check` und `task companion:deploy` ausführen sowie die
  deployte Version nennen.

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
