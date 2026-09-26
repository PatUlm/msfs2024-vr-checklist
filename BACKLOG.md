# Offene Arbeit

Einstieg für die Frage „Was ist noch offen?“. Die Aufgaben stehen hier in
Umsetzungsreihenfolge. Bei Fachlisten steht hier nur der Link; Status, Befund
und nächster Schritt werden ausschließlich am Ziel gepflegt.

**⚠ Git-Historie:** Die Historie wird genau einmal umgeschrieben, in Punkt 4
beim ersten GitHub-Push. Mit ⚠ markierte Punkte können Dateien ergeben, die
dabei zusätzlich aus der Historie entfernt werden müssen.

## Umsetzung und Veröffentlichung

1. **Paket-ID auf `patulm-vr-checklist` umbenennen.** Paketdefinition,
   Projektdatei, Release-Skripte, Tests und Doku umstellen; `Creator`, npm-`author`
   und `--packAuthors` auf `PatUlm`. Lokale Community-Junction, Staging und
   Project-Editor-Ausgabe des alten Namens entfernen und im EFB prüfen, dass
   gespeicherte Einstellungen nicht an der Paket-ID hängen.
2. **Dokumentation veröffentlichungsfähig machen.** Texte reviewen und ins
   Englische übersetzen.
3. **⚠ Öffentlichen Dateibestand prüfen.** Geheimnisse, private Daten und
   Weitergaberechte im aktuellen Baum und in der Historie berücksichtigen,
   etwa die aus dem Baum entfernten QA-Screenshots; den finalen
   Artefaktumfang abgleichen. Dateien festhalten, die in Punkt 4 aus der
   Historie entfernt werden.
4. **⚠ Historie umschreiben und erster GitHub-Push.** Alle Commit-Hashes und
   Tags ändern sich.
   1. Aktuellen Stand samt Tags nach Bitbucket pushen. Bitbucket bleibt danach
      eingefrorenes privates Backup der alten Historie und wird nicht mehr
      bespielt; lokal als Remote `bitbucket` führen.
   2. Per `git filter-repo` Autor, Committer und Tagger aller Commits und Tags
      auf `PatUlm` und die GitHub-noreply-Adresse umschreiben und diese Pfade
      aus allen Commits entfernen:
      - die in Punkt 3 festgehaltenen Dateien;
      - `assets/audio/checklist-completed.wav` und `.opus`: Platzhalter mit
        Windows-Systemstimme, Weitergaberecht nicht belegt; Companion-Stände
        vom 12.–18.09.2026 sind danach nicht mehr baubar;
      - `msfs/PackageSources/efb_api/` und `msfs/PackageSources/vendor/`:
        SDK-Sample-Inhalte (EULA 1(b)); ältere Stände bauen danach nur mit
        einer von Hand aus dem SDK kopierten Fassung.

      Danach lokal `user.name` und `user.email` des Repositorys entsprechend
      setzen.
   3. Verweise auf eigene Commits im aktuellen Stand anhand der
      filter-repo-Commit-Map nachführen (derzeit Prüfstand `61fb91d` in
      `docs/license-audit.md` und im Inventar) und Tags prüfen.
   4. `https://github.com/PatUlm/msfs2024-vr-checklist` als `origin` anlegen
      und auf ausdrücklichen Auftrag pushen. GitHub ist danach primärer Remote.
5. **GitHub-Release vorbereiten.** Nach Abschluss der Aufgaben und Fachprüfungen
   die Release-Artefakte gemäß [Release-Ablauf](docs/release.md) erstellen und
   Release-Beschreibung vorbereiten. Repository und GitHub-Release auf
   ausdrücklichen Auftrag veröffentlichen.
6. **Update-Prüfung im Companion.** Gemäß
   [ADR 0012](docs/adr/0012-veroeffentlichung-als-zip-und-companion-setup.md)
   installierte Versionen beim Start einmal gegen GitHub Releases prüfen,
   erst nach Bestätigung laden und anwenden und auf das EFB-ZIP hinweisen.
   Die Online-Prüfung ist opt-in: Beim ersten Start fragen, ob gesucht werden
   darf; in Settings abschaltbar. README-Aussage „Keine Cloudverbindung im
   Flug“ entsprechend präzisieren. Setzt ein veröffentlichtes GitHub-Release
   voraus; Nutzer des ersten Releases aktualisieren einmal manuell.

## Fachlisten

- [Lizenz- und Weitergabefragen](docs/license-audit.md)
- [MSFS-Laufzeitnachweise](docs/open-tests.md)
- [Visuelle Nachweise](docs/design-qa.md)
