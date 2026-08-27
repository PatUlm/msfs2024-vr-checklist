# Offene Tests

Was in MSFS noch nachzuweisen ist. Ein Punkt verschwindet hier, sobald er
geprüft ist; das Ergebnis geht als Fakt nach
[`msfs-sdk-reference.md`](msfs-sdk-reference.md).

## Phase 2 — Bestätigungseingabe

- [ ] `LEAD_POLE_ON` in der **H125** — kritisch, siehe unten
- [ ] `LEAD_POLE_ON` in der **MH-60** — kritisch, siehe unten
- [ ] `LEAD_POLE_ON` nach einem **VR-Wechsel** (erzeugt den App-Kontext neu)
- [ ] `LEAD_POLE_ON` bei **fokussiertem Textfeld** in der EFB
- [ ] Erzeugt ein Druck nach **frischem Simulatorstart** genau eine Zustellung?
- [ ] Hakt ein Druck in einer **vollständigen Gruppe** wirklich nichts ab?

Warum die Hubschrauber kritisch sind: Asobo hat 2022 bestätigt, dass
`INTERCEPT_KEY_EVENT` in Hubschraubern nicht feuerte, ohne spätere
Fix-Bestätigung. Fällt der Test, fällt
[ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md) für die
Hubschrauber und Phase 2 braucht für sie doch eine Begleit-App.

## Phase 3 — Begleit-App

- [ ] Kommt ein selbst benanntes **CommBus**-Event von einem externen
      SimConnect-Client in der EFB-App an?
- [ ] Wie sendet die EFB-App über denselben Kanal zurück?
- [ ] Maximale CommBus-Nutzlast und Chunk-Verhalten
- [ ] Lebensdauer der Listener-Registrierung bei `AppBootMode.COLD` und
      `AppSuspendMode.SLEEP`, samt FPS-Wirkung einer Änderung
- [ ] WASAPI Shared Mode gegen das VR-Audiogerät bei laufender MSFS-Session
