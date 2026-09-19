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

## Phase 4 – Öffentliches Open-Source-Release 1.0

Ziel ist die Veröffentlichung des Projekts als Open Source auf GitHub mit
Release **1.0.0**. Die folgenden Schritte bilden den Plan für diese Phase:

- [ ] **Lizenzen prüfen und festlegen:** Lizenz des eigenen Codes wählen;
  Abhängigkeiten, SDK-Anteile, Checklistenquellen und Audioassets auf zulässige
  Veröffentlichung und Weitergabe prüfen. Erforderliche Lizenztexte,
  Herkunftshinweise und etwaige Ausnahmen vollständig dokumentieren.
  Unvereinbare Bestandteile vor der Veröffentlichung ersetzen oder entfernen.
  Grundlage sind [ADR 0001](docs/adr/0001-lizenz-und-veroeffentlichungsstrategie.md),
  [ADR 0008](docs/adr/0008-stimme-und-tts-anbieter.md) und die
  [Drittlizenzen](docs/third-party-licenses.md); die bisherige Entscheidung
  „vorerst privat“ wird durch eine neue Veröffentlichungsentscheidung abgelöst.
- [ ] **Dokumentation prüfen und bereinigen:** Alle Projektdokumente mit dem
  aktuellen Stand abgleichen. Veraltete und für den heutigen Stand unwichtige
  Informationen entfernen; weiterhin gültige Entscheidungen, notwendige
  Nutzungshinweise und offene Einschränkungen erhalten. Verweise korrigieren
  und doppelte Inhalte zusammenführen.
- [ ] **Dokumentation ins Englische übersetzen:** Sämtliche verbleibenden
  Projektdokumente einschließlich README, Roadmap, Backlog, Agentenregeln,
  Architekturentscheidungen und Entwicklungsanleitungen übersetzen.
  Terminologie und Verweise abschließend auf Konsistenz prüfen.
- [ ] **GitHub-Veröffentlichung vorbereiten:** Repository, zu veröffentlichende
  Historie und Release-Artefakte auf Geheimnisse, private Daten und nicht zur
  Weitergabe freigegebene Dateien prüfen. Einstieg, Build, Installation und
  Lizenzumfang für externe Nutzer nachvollziehbar dokumentieren.
- [ ] **Version 1.0.0 veröffentlichen:** Nach Abschluss der Lizenz- und
  Dokumentationsarbeiten Versionsangaben, Changelog und Release Notes
  aktualisieren, vorgeschriebene Prüfungen durchführen, Release bauen, taggen
  und lokal installieren. Repository öffentlich bereitstellen und das
  GitHub-Release mit den vorgesehenen Artefakten veröffentlichen.

Die Phase ist abgeschlossen, wenn das öffentliche GitHub-Repository und das
Release 1.0.0 verfügbar sind, alle veröffentlichten Bestandteile lizenzrechtlich
geprüft und passend ausgewiesen sind und die gesamte Projektdokumentation
aktuell, bereinigt und englischsprachig vorliegt.

## Zurückgestellte Arbeiten

- Zurückgestellt: acht A400M-`FSM Init`-Einträge inhaltlich prüfen und danach
  vertonen; markiert in den [Checklistendaten](checklists/data/airbus-a400m.json).

Offene Laufzeitnachweise stehen in [docs/open-tests.md](docs/open-tests.md),
visuelle Abweichungen in [docs/design-qa.md](docs/design-qa.md).
