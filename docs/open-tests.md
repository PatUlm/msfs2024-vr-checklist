# Offene Laufzeitnachweise

Diese Datei ist die einzige lebende Liste noch ausstehender Tests in MSFS.
Jeder Punkt ist ein Einzeiler und wird nach der Prüfung entfernt; das belastbare
Ergebnis geht als Fakt nach
[`msfs-sdk-reference.md`](msfs-sdk-reference.md) oder in die zuständige
Produktentscheidung.

## Phase 3 — Begleit-App

- [ ] CommBus-Zustellung nach einem Wechsel zu einer anderen EFB-App und
  Rückkehr nachweisen (`AppSuspendMode.SLEEP`): Item abhaken, App wechseln,
  zurückkehren, erneut abhaken; prüfen, ob der Companion beide Änderungen
  erhält oder der Listener in `onResume` neu registriert werden muss.
- [ ] CommBus-Registrierung und -Zustellung über Nicht-VR → VR → Nicht-VR
  nachweisen; dabei im Coherent Debugger beobachten, ob der beim VR-Eintritt
  ersetzte Kontext unter „Inspectable web views“ weiterlebt und weiter sendet.
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufendem MSFS nachweisen.
