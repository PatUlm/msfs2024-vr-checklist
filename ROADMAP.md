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
- [x] **Phase 3 – Begleit-App und Sprachausgabe:** Statusanzeige,
  Offline-Release-Notes, Gerätewahl, Brian-Item- und Abschlussansagen sowie
  Live-Radiofilter sind umgesetzt. Der VR-Kontextwechsel ist seit 2026-09-19
  bestätigt; Release 0.11.1 enthält die Korrektur gegen wiederholte Ansagen.

## Verbleibende Arbeiten

- Zurückgestellt: acht A400M-`FSM Init`-Einträge inhaltlich prüfen und danach
  vertonen; markiert in den [Checklistendaten](checklists/data/airbus-a400m.json).
- Vor öffentlicher Veröffentlichung: Code- und Audio-Lizenz abschließend
  festlegen, siehe [ADR 0001](docs/adr/0001-lizenz-und-veroeffentlichungsstrategie.md)
  und [ADR 0008](docs/adr/0008-stimme-und-tts-anbieter.md).

Ein weiterer Funktionsmeilenstein ist derzeit nicht festgelegt. Offene
Laufzeitnachweise stehen in [docs/open-tests.md](docs/open-tests.md),
visuelle Abweichungen in [docs/design-qa.md](docs/design-qa.md).
