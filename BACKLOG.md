# Priorisierter Umsetzungs-Backlog

Dieses Dokument enthält ausschließlich die noch offenen Code-, Build- und
Qualitätsarbeiten. Die unnummerierten Abschnitte stehen in ihrer
Umsetzungsreihenfolge; die nächste Arbeitssession beginnt beim ersten Abschnitt
und schließt möglichst jeweils ein kleines, lauffähiges Inkrement
einschließlich der nach `AGENTS.md` notwendigen Prüfungen, Deployments,
Dokumentation und Commits ab.

Vollständig erledigte Abschnitte werden entfernt und nicht dauerhaft abgehakt.
Checkboxen halten nur den Zwischenstand mehrteiliger offener Arbeiten fest;
sobald die gesamte Abnahme erfüllt ist, wird der zugehörige Abschnitt gelöscht.
Erledigte Arbeit bleibt über Git-Historie, Changelog und die jeweils zuständige
Projektdokumentation nachvollziehbar.

Offene visuelle Abweichungen bleiben ausschließlich in [docs/design-qa.md](docs/design-qa.md), noch
ausstehende MSFS-Laufzeitnachweise ausschließlich in [docs/open-tests.md](docs/open-tests.md). Dieser
Backlog dupliziert diese Listen nicht.

## EFB-Markup auf den Simulator ausrichten

- [ ] Alle `aria-*`-Attribute aus dem eigenen EFB-Anwendungscode vollständig
  entfernen. Nutzerentscheidung: ARIA wird für die Simulatoroberfläche nicht
  benötigt.
- [ ] Weitere Elemente und Attribute auf tatsächlichen Nutzen im Simulator
  prüfen, etwa ARIA-Rollen, SEO-Metadaten und reine Suchmaschinenoptimierungen.
  Vorhandene Bestandteile ohne Nutzen entfernen; für Darstellung, Bedienung
  oder SDK-Verhalten benötigtes Markup erhalten. Die Prüfung setzt nicht voraus,
  dass solche Optimierungen bereits vorhanden sind.
- [ ] Zugehörige Designentscheidungen und technische Hinweise an die
  Bereinigung anpassen. Versionierte SDK-Vorlagen und installierte SDK-Dateien
  bleiben unverändert.
