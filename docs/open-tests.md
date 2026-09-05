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

- [ ] Beim nächsten VR-Teststand prüfen, ob Coherent GT CSS Custom Properties mit
  `var()` und `calc()` für Längen auswertet; ohne Nachweis bleibt `em` über die
  Root-Schriftgröße der einzige zentrale Skalierungsweg.

## Phase 3 — Begleit-App

- [ ] Maximale CommBus-Nutzlast und tatsächliches Chunk-Verhalten bestimmen.
- [ ] Lebensdauer der CommBus-Registrierung bei `AppBootMode.COLD` und
  `AppSuspendMode.SLEEP` einschließlich der FPS-Wirkung einer Änderung messen.
- [ ] CommBus-Registrierung und -Zustellung über Nicht-VR → VR → Nicht-VR
  nachweisen.
- [ ] Nach einem Wechsel VR → Nicht-VR prüfen, ob der beim VR-Eintritt
  ersetzte Coherent-Kontext unter „Inspectable web views“ weiterlebt oder
  verworfen wird; der VR-Eintritt selbst erzeugt nachweislich einen neuen
  Kontext (siehe `msfs-sdk-reference.md`).
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufendem MSFS nachweisen.

## Bedingte Rückfallebene

- [ ] Nur falls ein eigenes WASM-Modul benötigt wird: Laden eines mit der
  rekonstruierten SDK-Clang-Toolchain gebauten Moduls in MSFS nachweisen.
