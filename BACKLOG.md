# Offene Arbeit

Einstieg für die Frage „Was ist noch offen?“. Aufgaben ohne eigene Fachliste
stehen hier in Umsetzungsreihenfolge. Bei Fachlisten steht hier nur der Link;
Status, Befund und nächster Schritt werden ausschließlich am Ziel gepflegt.

## Umsetzung und Veröffentlichung

1. **Update-Prüfung im Companion.** Gemäß
   [ADR 0012](docs/adr/0012-veroeffentlichung-als-zip-und-companion-setup.md)
   installierte Versionen beim Start einmal gegen GitHub Releases prüfen,
   erst nach Bestätigung laden und anwenden und auf das EFB-ZIP hinweisen.
   Die Online-Prüfung ist opt-in: Beim ersten Start fragen, ob gesucht werden
   darf; in Settings abschaltbar. README-Aussage „Keine Cloudverbindung im
   Flug“ entsprechend präzisieren. Künftige Repository-URL:
   `https://github.com/PatUlm/msfs2024-vr-checklist`.
2. **Paket-ID auf `patulm-vr-checklist` umbenennen.** Paketdefinition,
   Projektdatei, Release-Skripte, Tests und Doku umstellen; `Creator`, npm-`author`
   und `--packAuthors` auf `PatUlm`. Lokale Community-Junction, Staging und
   Project-Editor-Ausgabe des alten Namens entfernen und im EFB prüfen, dass
   gespeicherte Einstellungen nicht an der Paket-ID hängen.
3. **Dokumentation veröffentlichungsfähig machen.** Texte reviewen und ins
   Englische übersetzen.
4. **Öffentlichen Dateibestand und Historie prüfen.** Geheimnisse, private
   Daten und Weitergaberechte berücksichtigen; den finalen Artefaktumfang
   abgleichen. Die lokale JetBrains-Diagnose vor öffentlicher Übernahme auf
   Reproduktion, technischen Befund und Ticketlink kürzen.
   Vor dem ersten Push die gesamte Historie anonymisieren: Autor, Committer
   und Tagger aller Commits und Tags per `git filter-repo` auf `PatUlm` und
   die GitHub-noreply-Adresse umschreiben, danach lokal `user.name` und
   `user.email` des Repositorys entsprechend setzen. Alle Hashes ändern sich:
   Verweise auf eigene Commits im aktuellen Stand anhand der
   filter-repo-Commit-Map nachführen (derzeit Prüfstand `61fb91d` in
   `docs/license-audit.md` und im Inventar) und Tags prüfen. Danach Bitbucket
   per Force-Push abgleichen, damit die alte Historie nicht erreichbar bleibt.
5. **GitHub-Release vorbereiten.** Nach Abschluss der Aufgaben und Fachprüfungen
   die Release-Artefakte gemäß [Release-Ablauf](docs/release.md) erstellen und
   Release-Beschreibung vorbereiten. Repository und GitHub-Release auf
   ausdrücklichen Auftrag veröffentlichen.

## Fachlisten

- [Lizenz- und Weitergabefragen](docs/license-audit.md)
- [MSFS-Laufzeitnachweise](docs/open-tests.md)
- [Visuelle Nachweise](docs/design-qa.md)
- [JetBrains Remote Development](docs/jetbrains-remote-development.md)
