# Offene Laufzeitnachweise

Diese Datei ist die einzige lebende Liste noch ausstehender Tests in MSFS.
Jeder Punkt ist ein Einzeiler und wird nach der Prüfung entfernt; das belastbare
Ergebnis geht als Fakt nach
[`msfs-sdk-reference.md`](msfs-sdk-reference.md) oder in die zuständige
Produktentscheidung.

## Checklisten

- [ ] Taog's Hangar OH-6A und H500C: `ATC MODEL`, `ATC TYPE` und `TITLE`
  erfassen und die vorläufigen `TITLE`-Matchregeln für beide Varianten
  bestätigen oder korrigieren.
- [ ] `SET PLASMA OFF` als Checklist-Bestätigung im Taog's-Hangar OH-6A/H500C
  nachweisen.

## Darstellung und EFB-Lifecycle

- [ ] Seit Release 0.5.1 einmalig beobachtet: Im nachts in LOWI gestarteten
  H500C-VR-Flug erschien die nach Flugstart geöffnete VR Checklist ohne das
  geplante VR-Dichteprofil und dadurch zu klein; in der nächsten Dev-Session
  reproduzieren und je EFB-Instanz `created`/`resumed`, `Display mode detected`
  beziehungsweise Lesefehler für `E:IS IN VR` sowie das Vorhandensein der
  Klasse `vr-checklist-app--vr` protokollieren.

## Phase 3 — Begleit-App

- [ ] Maximale CommBus-Nutzlast und tatsächliches Chunk-Verhalten bestimmen.
- [ ] Lebensdauer der CommBus-Registrierung bei `AppBootMode.COLD` und
  `AppSuspendMode.SLEEP` einschließlich der FPS-Wirkung einer Änderung messen.
- [ ] CommBus-Registrierung und -Zustellung über Nicht-VR → VR → Nicht-VR
  nachweisen.
- [ ] Anzahl und Lifecycle der EFB-App-Instanzen bei einem Darstellungswechsel
  anhand der vorhandenen Diagnosezeilen bestimmen.
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufendem MSFS nachweisen.

## Bedingte Rückfallebene

- [ ] Nur falls ein eigenes WASM-Modul benötigt wird: Laden eines mit der
  rekonstruierten SDK-Clang-Toolchain gebauten Moduls in MSFS nachweisen.
