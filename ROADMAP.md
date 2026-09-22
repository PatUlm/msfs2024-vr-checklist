# Roadmap

Nur kommende Meilensteine und wesentliche offene Grenzen hier pflegen.
Erledigte Produktänderungen stehen im [Changelog](CHANGELOG.md), konkrete
Aufgaben im [Backlog](BACKLOG.md).

EFB-App, Taste/HOTAS, Companion und Offline-Sprachausgabe sind umgesetzt.
Nächstes Ziel ist die kostenlose Open-Source-Veröffentlichung auf GitHub als
**1.0.0**.

- [ ] **Veröffentlichungsumfang klären:** Projekt-/Audiolizenz, SDK-Nachweise
  und Distributionshinweise gemäß [Lizenzpunkten](docs/license-audit.md)
  abschließen. Die bisher beschlossene konfigurierbare Eventwahl mit dem
  vorgesehenen 1.0-Umfang abstimmen, siehe [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
- [ ] **Dokumentation veröffentlichungsfähig machen:** Die bereinigten Texte
  reviewen und anschließend ins Englische übersetzen; Installation passend
  zum tatsächlich angebotenen Download ergänzen.
- [ ] **GitHub-Distribution vorbereiten:** Öffentlichen Dateibestand und
  Historie auf Geheimnisse, private Daten und Weitergaberechte prüfen;
  Download-Artefakte und Installation für externe Nutzer fertigstellen.
- [ ] **1.0.0 veröffentlichen:** Prüfungen, Release-Build, Commit, Tag und lokale
  Installation abschließen, dann Repository und GitHub-Release veröffentlichen.

Zurückgestellt bleiben die acht ungeprüften A400M-Einträge unter `EFIS and FMS
Setup` (`fsm-init`) samt Vertonung. Offene Simulatornachweise stehen ausschließlich
in [docs/open-tests.md](docs/open-tests.md), Visuelles in
[docs/design-qa.md](docs/design-qa.md).
