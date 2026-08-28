# Offene Tests

Was in MSFS noch nachzuweisen ist. Ein Punkt verschwindet hier, sobald er
geprüft ist; das Ergebnis geht als Fakt nach
[`msfs-sdk-reference.md`](msfs-sdk-reference.md).

## Phase 2 — Bestätigungseingabe

- [ ] `LEAD POLE ON` nach einem **VR-Wechsel** (erzeugt den App-Kontext neu)
- [ ] Findet sich ein Auslöser, der **auch in Hubschraubern belegbar** und dort
      folgenlos ist, oder braucht die Flotte zwei Auslöser? Siehe den Nachtrag
      in [ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
- [ ] Hakt ein Druck in einer **vollständigen Gruppe** wirklich nichts ab? Die
      App protokolliert diesen Fall jetzt ausdrücklich.

## Phase 3 — Begleit-App

- [ ] Kommt ein selbst benanntes **CommBus**-Event von einem externen
      SimConnect-Client in der EFB-App an?
- [ ] Wie sendet die EFB-App über denselben Kanal zurück?
- [ ] Maximale CommBus-Nutzlast und Chunk-Verhalten
- [ ] Lebensdauer der Listener-Registrierung bei `AppBootMode.COLD` und
      `AppSuspendMode.SLEEP`, samt FPS-Wirkung einer Änderung
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufender MSFS-Session

## Erledigt am 2026-08-28

- Hubschrauber: **nicht prüfbar** und damit gefallen. `LEAD POLE ON` ist in den
  Steuerungen der MH-60 und der H125 nicht belegbar.
- Fokussiertes Textfeld: **entfällt**. Die EFB-App hat kein Eingabefeld, und das
  Event wirkt ohnehin nur bei offener App.
- Zustellungen je Druck nach frischem Simulatorstart: beantwortet. Ein Druck
  stellt auch bei genau **einer** Registrierung mehrfach zu; die Entprellung
  greift. Fakt in [`msfs-sdk-reference.md`](msfs-sdk-reference.md), Abschnitt
  „Eingaben".
