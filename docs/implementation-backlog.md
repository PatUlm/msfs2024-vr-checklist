# Priorisierter Umsetzungs-Backlog

Dieses Dokument enthält die aktuell vereinbarten Code-, Build- und
Qualitätsarbeiten in ihrer Umsetzungsreihenfolge. Die nächste Arbeitssession
beginnt beim ersten noch offenen Punkt und schließt möglichst jeweils ein
kleines, lauffähiges Inkrement einschließlich der nach `AGENTS.md` notwendigen
Prüfungen, Deployments, Dokumentation und Commits ab.

Offene visuelle Abweichungen bleiben ausschließlich in `design-qa.md`, noch
ausstehende MSFS-Laufzeitnachweise ausschließlich in `open-tests.md`. Dieser
Backlog dupliziert diese Listen nicht.

## 1. Fortschritt bei jedem Flugzeugwechsel zurücksetzen

- [x] In `VRChecklistView.refreshSelectedChecklist` nicht nur einen Wechsel der
  Checklist-ID, sondern jede geänderte normalisierte Flugzeugidentität als
  Reset-Bedingung behandeln.
- **Problem:** Mehrere Identitäten können dieselbe Checkliste auswählen, etwa
  die drei DA42-Match-Regeln. Der aktuelle Pfad setzt dann den Runtime-Zustand
  nicht zurück, sondern speichert ihn unter der neuen Identität erneut.
- **Auswirkung:** Ein Flugzeug- oder Variantenwechsel kann erledigte Items
  vorübergehend übernehmen und widerspricht der Produktentscheidung, dass ein
  Flugzeugwechsel den Fortschritt immer zurücksetzt.
- **Abnahme:** Wechsel zwischen zwei Identitäten mit gleicher Checklist-ID
  setzt Items, Fortschritt und aktive Gruppe zurück; ein reiner VR-Wechsel und
  eine unveränderte Identität behalten den Zustand. `task check` und
  `task deploy` ausführen, die tatsächlich deployte Version nennen und den
  Reset in MSFS gezielt nachweisen. Die nutzerwirksame Korrektur unter
  `CHANGELOG.md`/`[Unreleased]` eintragen.

## 2. Companion-Selbsttests in den Release-Task aufnehmen

- [x] `task release` so verdrahten, dass `companion:test` vor der Paketierung
  zwingend erfolgreich läuft.
- **Problem:** Der Release-Task führt derzeit den Companion-Build und die
  Release-Tests aus, überspringt aber die Transport-Selbsttests. Ein
  kompilierender Protokollfehler könnte dadurch mit dem Release-Befehl
  paketiert werden.
- **Abnahme:** Ein isolierter `task release` erreicht die vorhandenen
  Transport-Selbsttests vor der Erzeugung des unveränderlichen Artefakts. Die
  Task-Abhängigkeiten vermeiden unnötige doppelte Builds. Als interne
  Build-/Release-Korrektur benötigt dieser Punkt keinen Changelog-Eintrag und
  kein Deployment.

## 3. Avalonia Compiled Bindings aktivieren

- [x] `AvaloniaUseCompiledBindingsByDefault` aktivieren und den notwendigen
  `x:DataType`-Vertrag für `MainWindow` ergänzen.
- **Problem:** Die Bindings in `MainWindow.axaml` sind trotz globalem
  `TreatWarningsAsErrors` ausschließlich reflektionsbasiert. Tippfehler werden
  daher erst als leere Laufzeitanzeige sichtbar.
- **Abnahme:** Der Release-Build bleibt mit null Warnungen erfolgreich; ein
  absichtlich falscher Binding-Pfad wird vor Abschluss des Inkrements einmal
  lokal als Buildfehler bestätigt und wieder entfernt. Anschließend
  `task check` und wegen der Companion-Änderung `task companion:deploy`
  ausführen sowie die tatsächlich deployte Version nennen. Kein eigener
  Changelog-Eintrag, solange sich das sichtbare Verhalten nicht ändert.

## 4. npm-Buildabhängigkeiten kontrolliert aktualisieren

- [ ] Die gelockten Entwicklungsabhängigkeiten aktualisieren und notwendige
  direkte Versionsänderungen in `docs/third-party-licenses.md` nachführen.
- **Ausgangsstand vom 2026-08-29:** `npm audit --package-lock-only` meldet neun
  Findings, davon sieben mit hoher und zwei mit mittlerer Einstufung, in
  `brace-expansion`, `esbuild`, `immutable`, `minimatch`, `nanoid`, `picomatch`
  und `postcss`. `npm audit --package-lock-only --omit=dev` meldet keine
  Laufzeit-Findings; der aktuelle NuGet-Audit meldet ebenfalls keine bekannte
  Schwachstelle.
- **Einordnung:** Es handelt sich um Build-/Entwicklungsrisiken, nicht um eine
  bekannte Schwachstelle des ausgelieferten EFB-Bundles. Das esbuild-Update
  überschreitet laut Audit den aktuellen unterstützten Versionsbereich und ist
  deshalb nicht als ungeprüftes `npm audit fix --force` auszuführen.
- **Abnahme:** `npm audit --package-lock-only` ist sauber oder jede bewusst
  verbleibende Meldung ist mit Reichweite und Folgeaktion hier dokumentiert.
  `task check` bestätigt den Build. Ohne nutzerwirksame Änderung entstehen kein
  Changelog-Eintrag und kein Deployment.

## 5. Snapshot-Versand ratenbegrenzen und zusammenfassen

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

## 6. Offline-Release-Notes in die Companion-App integrieren

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

## 7. Protokollvalidierung und vorhandene Selbsttests erweitern

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

## 8. Dispatch-Fehlervertrag des CommBus-Clients härten

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

## 9. Thread-Affinität und Shutdown absichern

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

## 10. Ausgelieferte Drittkomponenten explizit inventarisieren

- [ ] Das tatsächliche Companion-Release gegen
  `docs/third-party-licenses.md` abgleichen und ausgelieferte transitive
  Komponenten wie `Avalonia.Remote.Protocol.dll` entweder einzeln oder durch
  eine eindeutig formulierte Komponentenfamilie samt Version und Primärquelle
  abdecken.
- **Abnahme:** Jede ausgelieferte Drittkomponente ist nachvollziehbar einer
  dokumentierten Lizenz zugeordnet. Als reine Dokumentations-/Compliance-
  Änderung entstehen kein Changelog-Eintrag und kein Deployment.

## 11. `VRChecklistView` nur bei fachlichem Anlass zerlegen

- [ ] Bei der nächsten größeren Änderung an Transport, Persistenz oder
  Rendering prüfen, ob genau der betroffene Verantwortungsbereich ohne
  Lifecycle-Risiko extrahiert werden kann.
- **Einordnung:** Die große Klasse erschwert isolierte Tests, ist im aktuellen
  Coherent-Single-Bundle aber kein eigenständiger Fehler. Es findet kein
  vorsorglicher Komplettumbau statt.
- **Abnahme:** Eine Extraktion erfolgt nur als kleines, fachlich begründetes
  Inkrement mit unverändertem EFB-Verhalten, `task check`, `task deploy` und dem
  für den berührten Bereich notwendigen MSFS-Nachweis.
