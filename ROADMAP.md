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
- [ ] **Phase 3 – Begleit-App und Sprachausgabe:** Transportdurchstich,
  Status-App, Audio-Nachweis mit Dummy-Datei und danach die produktive,
  vorab gerenderte Sprachausgabe sind in dieser Reihenfolge geplant; die
  TTS-Anbieterwahl blockiert den Phasenstart nicht
  ([Produktanforderungen](docs/phase-3-requirements.md),
  [Architekturentscheidungen](docs/adr/README.md)).
