# Roadmap – MSFS 2024 VR Checklist

Diese Roadmap zeigt ausschließlich Meilensteine und ihren aktuellen Stand.
Produktanforderungen, technische Fakten, Entscheidungen und offene Nachweise
stehen in den jeweils verlinkten Dokumenten.

- [x] **Phase 0 – Entwicklungsumgebung:** WSL2-Repository, SDK 1.7.3 und
  reproduzierbare Build-, Packaging- und Testabläufe stehen.
- [x] **Phase 0.5 – Beispielchecklisten:** Versionierbares JSON-Format sowie
  erste strukturierte Flugzeugchecklisten stehen.
- [x] **Phase 1 – Nativer EFB-Prototyp:** Offlinefähige App, automatische
  Flugzeugauswahl und VR-first Bedienung sind seit 2026-08-23 abgenommen.
- [x] **Phase 2 – Bestätigung per Taste oder HOTAS:** `SET PLASMA OFF` erreicht
  G36, DA42, H125 und MH-60; die Bestätigungseingabe ist seit 2026-08-29
  abgenommen ([ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md)).
- [ ] **Phase 3 – Begleit-App und Sprachausgabe:** Transportdurchstich und
  Status-App sind in MSFS bestätigt, Offline-Release-Notes sind umgesetzt.
  Der Audio-Nachweis mit einer Dummy-Datei ist seit 2026-09-13 in MSFS bestätigt.
  WASAPI Shared Mode über das Windows-Standardgerät ist in Nicht-VR und VR
  bestätigt. Die explizite Audio-Gerätewahl ist umgesetzt; ihr MSFS-Nachweis
  steht noch aus. Danach werden Stimme, TTS-Anbieter und Klangprofile
  entschieden und die produktiven Sprachassets vorab gerendert
  ([Produktanforderungen](docs/phase-3-requirements.md),
  [Architekturentscheidungen](docs/adr/README.md)).
