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

- [ ] Seit Sim Update 6 (1.8.14.0, 2026-08-13) in H500C und MH-60
  reproduzierbar: Das im Cockpit montierte EFB zeigt in VR weiterhin die von
  MSFS vergrößerte Darstellung, das schwebende VR-Panel dagegen die normale
  Skalierung; mit aktivem VR-Dichteprofil ist die App dort zu klein. In der
  Diagnosezeile `Display mode detected` zusätzlich `window.innerWidth` und
  `window.innerHeight` protokollieren und für montiert, schwebend und Nicht-VR
  je EFB-Instanz festhalten. Ergebnis entscheidet, ob die Viewport-Größe als
  Skalierungsgrundlage taugt (siehe `implementation-backlog.md`).
- [ ] Im selben Teststand prüfen, ob Coherent GT CSS Custom Properties mit
  `var()` und `calc()` für Längen auswertet; ohne Nachweis bleibt `em` über die
  Root-Schriftgröße der einzige zentrale Skalierungsweg.

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
