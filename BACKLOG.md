# Nächste Arbeiten

Nur offene, konkrete Arbeiten in Umsetzungsreihenfolge. Erledigte Punkte
entfernen; keine zweite Roadmap oder Testliste pflegen.

1. **Lizenzhinweise und SDK-Nachweise vervollständigen.** Offene Punkte und
   Abschlusskriterien stehen in [R1/R2](docs/license-audit.md); danach
   Projektlizenz und Audio-Bedingungen entscheiden (R3/R5).
2. **Bestätigungstaste für 1.0 abstimmen.** ADR 0002 verlangt vor öffentlicher
   Weitergabe eine konfigurierbare Eventwahl; sie ist noch nicht umgesetzt.
   Der bisherige Plan „keine neuen Features vor 1.0“ löst das nicht auf.
   Entweder die zugesagte Konfiguration umsetzen oder die Entscheidung
   ausdrücklich durch ein neues ADR ersetzen.
3. **Öffentliche Installation festlegen.** Downloadpakete, .NET-Voraussetzung
   und Bezug/Pfad der nicht mitgelieferten `SimConnect.dll` für externe Nutzer
   klären und die README daran ausrichten. Der jetzige Weg setzt ein lokales
   SDK voraus. Anschließend die bereinigte Dokumentation ins Englische übersetzen.

Externe Entwicklungsstörung: [JetBrains Remote Development](docs/jetbrains-remote-development.md)
ist als laufende Diagnose separat dokumentiert. Vor öffentlicher Übernahme
auf Reproduktion, Befund und Ticketlink kürzen und private Details entfernen.

Offene Laufzeitnachweise: [open-tests.md](docs/open-tests.md).
Offene Sichtprüfungen: [design-qa.md](docs/design-qa.md).
