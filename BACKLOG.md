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

## Lizenznachweise und Distribution für 1.0.0 vervollständigen

Die [Lizenzprüfung für 0.13.3](docs/license-audit.md) ist durchgeführt; die
Veröffentlichung ist noch nicht freigegeben. Die Befunde R1 bis R5 und ihre
Abschlusskriterien stehen ausschließlich im Prüfbericht.

Die Checklistenprüfung R4 ist abgeschlossen; Herstelleranfragen sind keine
pauschale Release-Voraussetzung. Nächstes Inkrement: vollständige
Lizenz-/Copyrighttexte in den Auslieferungsumfang aufnehmen und deren
Mitlieferung prüfen (R1), dabei die konkreten SDK-Nachweise ergänzen (R2).
Projektlizenz und Audio-Bedingungen sind anschließend festzulegen (R3/R5).
