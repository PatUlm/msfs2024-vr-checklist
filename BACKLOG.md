# Offene Arbeit

Einstieg für die Frage „Was ist noch offen?“. Aufgaben ohne eigene Fachliste
stehen hier in Umsetzungsreihenfolge. Bei Fachlisten steht hier nur der Link;
Status, Befund und nächster Schritt werden ausschließlich am Ziel gepflegt.

## Umsetzung und Veröffentlichung

1. **Bestätigungstaste für 1.0 abstimmen.** Die in
   [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md)
   beschlossene Eventkonfiguration ist noch nicht umgesetzt. Konfiguration
   umsetzen oder die Entscheidung ausdrücklich durch ein neues ADR ersetzen.
2. **Öffentliche Installation festlegen.** Downloadpakete, .NET-Voraussetzung
   und Bezug/Pfad der nicht mitgelieferten `SimConnect.dll` für externe Nutzer
   klären und die README daran ausrichten. Der jetzige Weg setzt ein lokales
   SDK voraus.
3. **Dokumentation veröffentlichungsfähig machen.** Texte reviewen und ins
   Englische übersetzen; die Installation auf das angebotene Downloadpaket ausrichten.
4. **Öffentlichen Dateibestand und Historie prüfen.** Geheimnisse, private
   Daten und Weitergaberechte berücksichtigen; den finalen Artefaktumfang
   abgleichen. Die lokale JetBrains-Diagnose vor öffentlicher Übernahme auf
   Reproduktion, technischen Befund und Ticketlink kürzen.
5. **1.0.0 veröffentlichen.** Nach Abschluss der Aufgaben und Fachprüfungen
   den [Release-Ablauf](docs/release.md) ausführen und Repository sowie
   GitHub-Release auf ausdrücklichen Auftrag veröffentlichen.

## Fachlisten

- [Lizenz- und Weitergabefragen](docs/license-audit.md)
- [MSFS-Laufzeitnachweise](docs/open-tests.md)
- [Visuelle Nachweise](docs/design-qa.md)
- [JetBrains Remote Development](docs/jetbrains-remote-development.md)
