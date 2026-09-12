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
- [ ] Gruppenabschluss-Ansage nachweisen: Bei laufendem MSFS und Companion die
  letzte offene Position einer Gruppe abhaken; der Companion spielt die Ansage
  genau einmal auf dem Windows-Standardgerät, auch wenn die App direkt danach
  automatisch zur nächsten Gruppe wechselt. Gegenproben: Item wieder öffnen und
  erneut abhaken (neue Ansage), Companion bei erledigten Gruppen neu starten
  (keine Ansage), Checkliste zurücksetzen (keine Ansage).
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufendem MSFS nachweisen.
