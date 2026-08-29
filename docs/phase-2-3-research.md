# Historischer Überblick zur Recherche für Phase 2 und Phase 3

Dieses Dokument fasst die abgeschlossene Recherche vom 26. August 2026 nur
noch als Wegweiser zu ihren dauerhaften Ergebnissen zusammen. Es ist kein
fortlaufender Ablageort für technische Erkenntnisse, Quellenprotokolle oder
offene Tests.

Die frühere ausführliche Fassung untersuchte Transportwege, Eingabeoptionen,
Companion-App-Stacks, TTS-Modelle, Stimmen, Lizenzen, Audioausgabe und eine
WASM-Rückfallebene. Kandidatenlisten, Rohbelege, Testskripte und zwischenzeitlich
offene Annahmen wurden nach Abschluss der Entscheidungen entfernt. Bei Bedarf
bleiben sie über die Git-Historie nachvollziehbar.

## Dauerhafte Ergebnisse

| Thema | Ergebnis | Maßgeblicher Ort |
| --- | --- | --- |
| Bestätigungseingabe | Ein Sim-Key-Event kann direkt in der EFB-App empfangen werden; der derzeitige Auslöser trägt Hubschrauber nicht. | [ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md), [SDK-Lessons](msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app) |
| Phasenzuschnitt | Phase 2 bleibt auf die EFB-App begrenzt; Begleit-App und Sprache bilden Phase 3. | [ADR 0005](adr/0005-phase-2-auf-die-efb-app-verkuerzen.md) |
| Transport | CommBus über SimConnect ist der vorgesehene bidirektionale Kanal, aber im Custom-EFB-Kontext noch laufzeitlich nachzuweisen. | [ADR 0003](adr/0003-transportkanal-commbus-ueber-simconnect.md), [offene Tests](open-tests.md) |
| Begleit-App | .NET 10 mit Avalonia, eigenem SimConnect-P/Invoke und NAudio ist der gewählte Stack. | [ADR 0004](adr/0004-stack-der-begleit-app.md) |
| Lizenzstrategie | Das Projekt bleibt vorerst privat, wahrt aber die Möglichkeit einer späteren Veröffentlichung. | [ADR 0001](adr/0001-lizenz-und-veroeffentlichungsstrategie.md) |
| Sprachausgabe | Ansagen werden vorab gerendert und als versionierte Assets ausgeliefert. | [ADR 0006](adr/0006-tts-vorab-synthese.md), [ADR 0007](adr/0007-ablage-der-gerenderten-audiodateien.md) |
| Stimme und Anbieter | Die Wahl bleibt bis zum Hörvergleich und zur Prüfung der Weitergaberechte offen. | [ADR 0008](adr/0008-stimme-und-tts-anbieter.md) |
| Produktumfang Phase 3 | Anzeige, Transport, Audio, Offline-Verhalten und Abnahmekriterien sind verbindlich festgelegt. | [Phase-3-Anforderungen](phase-3-requirements.md) |

## Weitere Pflege

- Bestätigte, überraschende MSFS-SDK- und Laufzeitfallstricke stehen
  ausschließlich in [`msfs-sdk-reference.md`](msfs-sdk-reference.md).
- Ausstehende Laufzeitnachweise stehen ausschließlich in
  [`open-tests.md`](open-tests.md) und werden nach ihrer Klärung entfernt.
- Entscheidungen werden ausschließlich in den [ADRs](adr/README.md) geändert
  oder durch ein Nachfolge-ADR ersetzt.
- Dieses Dokument wird nicht um neue Rechercheverläufe erweitert.
