# Offene Laufzeitnachweise

Diese Datei ist die einzige lebende Liste noch ausstehender Tests in MSFS.
Jeder Punkt ist ein Einzeiler und wird nach der Prüfung entfernt; das belastbare
Ergebnis geht als Fakt nach
[`msfs-sdk-reference.md`](msfs-sdk-reference.md) oder in die zuständige
Produktentscheidung.

## Phase 2 — Bestätigungseingabe

- [ ] Einen in Starrflüglern und Hubschraubern belegbaren, dort jeweils
  folgenlosen Auslöser oder zwei geeignete Auslöser je Kategorie nachweisen.
- [ ] Nachweisen, dass ein Druck in einer bereits vollständigen Gruppe keine
  weitere Zustandsänderung auslöst.

## Phase 3 — Begleit-App

- [ ] Zustellung eines selbst benannten CommBus-Events von einem externen
  SimConnect-Client an die EFB-App nachweisen.
- [ ] Rückweg von der EFB-App zum externen SimConnect-Client nachweisen.
- [ ] Maximale CommBus-Nutzlast und tatsächliches Chunk-Verhalten bestimmen.
- [ ] Lebensdauer der CommBus-Registrierung bei `AppBootMode.COLD` und
  `AppSuspendMode.SLEEP` einschließlich der FPS-Wirkung einer Änderung messen.
- [ ] CommBus-Registrierung und -Zustellung über Nicht-VR → VR → Nicht-VR
  nachweisen.
- [ ] Anzahl und Lifecycle der EFB-App-Instanzen bei einem Darstellungswechsel
  anhand der vorhandenen Diagnosezeilen bestimmen.
- [ ] Queue-Verhalten und Ratenbegrenzung des CommBus bei pausierter Simulation
  nachweisen.
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufendem MSFS nachweisen.

## Bedingte Rückfallebene

- [ ] Nur falls ein eigenes WASM-Modul benötigt wird: Laden eines mit der
  rekonstruierten SDK-Clang-Toolchain gebauten Moduls in MSFS nachweisen.
