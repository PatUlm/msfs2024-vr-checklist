# Agent instructions

Diese Regeln gelten für das gesamte Repository. Sie halten dauerhaftes
Projektwissen fest; temporäre Beobachtungen und offene visuelle Abweichungen
gehören nach `docs/design-qa.md`.

## Zusammenarbeit und Sprache

- Kommuniziere mit dem Benutzer auf Deutsch, solange er nicht die Sprache
  wechselt.
- Prüfe vor Änderungen `git status --short` und erhalte alle bestehenden,
  insbesondere nicht zugehörigen Änderungen.
- Ein vom Benutzer gemeldeter Bug ist standardmäßig ein Arbeitsauftrag. Er wird
  entweder selbstständig untersucht, behoben und angemessen verifiziert oder,
  wenn eine sofortige Bearbeitung bewusst nicht möglich ist, mit Reproduktion,
  Auswirkung, aktuellem Kenntnisstand und nächstem Schritt dauerhaft in der
  passenden Projektdokumentation für später festgehalten. Ein Bug bleibt nicht
  ausschließlich als Gesprächsergebnis undokumentiert offen.
- Vor UI-Arbeiten sind `docs/design-decisions.md` und
  `docs/design-qa.md` zu lesen. Ändere dokumentierte Designentscheidungen nicht
  stillschweigend.
- Vor Arbeiten am nächsten VR-Teststand sind zusätzlich die offenen visuellen
  Nachweise in `docs/design-qa.md` und die Laufzeitnachweise in
  `docs/open-tests.md` zu lesen.
- Vor Arbeiten an Phase 2 oder Phase 3 sind `docs/adr/README.md` und die dort
  verlinkten Entscheidungen zu lesen. Eine dokumentierte Entscheidung wird nicht
  stillschweigend umgeworfen; eine Kehrtwende bekommt ein neues ADR, das das
  alte ersetzt.
- Vor Änderungen an Checklistendaten sind `checklists/data/README.md` und
  `checklists/data/style-guide.md` zu lesen.
- Quellen von Checklisten werden lokal in maschinenlesbarer Form vorgehalten.
  Vor einer Prüfung oder einem Abgleich mit der ursprünglichen Checkliste ist
  zuerst das Repository einschließlich der lokal ignorierten Quellen unter
  `checklists/source/` zu prüfen. Eine externe Quelle wird nur herangezogen,
  wenn die benötigte lokale Quelle fehlt oder die konkrete Frage nicht
  beantwortet.
- Neue oder aktualisierte direkte Abhängigkeiten und ausgelieferte
  Drittkomponenten müssen im selben Arbeitsgang in
  `docs/third-party-licenses.md` mit Version, Lizenz und Primärquelle
  nachgeführt werden.
- Jede abgeschlossene **nutzerwirksame** Änderung muss im selben Arbeitsgang das
  englische `CHANGELOG.md` aktualisieren. Noch nicht veröffentlichte Änderungen
  stehen unter `## [Unreleased]`. Bei einem Release werden sie nach
  `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` verschoben; datumsbasierte Überschriften
  ohne Version werden nicht verwendet.
- Das `CHANGELOG.md` hält ausschließlich Änderungen fest, die Benutzer in der
  ausgelieferten App, den Checklisten oder der Distribution wahrnehmen. Reine
  Änderungen an Dokumentation, Tests, QA-Nachweisen, Forschung, ADRs,
  Agentenregeln sowie internen Build- und Release-Abläufen erzeugen keinen
  Eintrag. Begleitende Dokumentation zu einer Produktänderung bekommt keinen
  eigenen Eintrag; beschrieben wird nur die nutzerwirksame Produktänderung.
- Fehler, die während Entwicklung oder Review einer noch unveröffentlichten
  Änderung gefunden und vor ihrer Veröffentlichung behoben werden, erhalten
  keinen eigenen `Fixed`-Eintrag. Der zugehörige Feature-Eintrag beschreibt nur
  das fertige, auslieferbare Ergebnis. Ein eigener `Fixed`-Eintrag entsteht erst,
  wenn bereits veröffentlichtes Verhalten oder ein unabhängiger bestehender
  Fehler korrigiert wird.
- Sobald die Release-Notes-Funktion der Companion-App umgesetzt ist, wird bei
  jedem Release zusätzlich ihre app-lesbare Release-Notes-Quelle aktualisiert.
  Das Changelog bleibt die vollständige chronologische Änderungshistorie; die
  Release Notes sind die nach Wichtigkeit geordnete, nutzerorientierte
  Darstellung mit Version, Datum, hervorgehobenem Hauptmerkmal und knappen
  Einzeilern für Features und Fehlerkorrekturen.
- Commits sind, soweit sinnvoll möglich, nach fachlichem Kontext zu trennen.
  Checklistendaten, Anwendungscode und allgemeine Dokumentation gehören
  beispielsweise in getrennte Commits. Unmittelbar zugehörige Tests und
  Dokumentation dürfen bei der jeweiligen fachlichen Änderung bleiben.
- Jeder eindeutige Release-Commit `chore(release): publish version X.Y.Z` erhält
  einen annotierten Git-Tag `vX.Y.Z`, der exakt auf diesen Commit zeigt.
- Ein Release ist erst mit der lokalen Installation abgeschlossen: Nach dem
  erfolgreichen Release-Build und dem Release-Commit wird `task release:install`
  ausgeführt, damit Community2024 und die installierte Companion-EXE auf der
  neuen Version stehen. Ein gebautes, aber nicht installiertes Release ist kein
  fertiger Release-Schritt.
- Das Repository folgt **Trunk-Based Development** auf `master`. Änderungen
  werden als kleine, fachlich geschlossene und jederzeit lauffähige Inkremente
  umgesetzt; langlebige Feature-Branches und große Sammel-Commits werden
  vermieden.
- Ein Inkrement gilt erst als abgeschlossen, wenn die vorgeschriebenen lokalen
  Prüfungen erfolgreich sind, notwendige Deployments ausgeführt wurden und ein
  für die Korrektheit erforderlicher MSFS-Laufzeitnachweis vorliegt. Reine
  Dokumentationsänderungen benötigen weiterhin kein Deployment.
- Jedes abgeschlossene Inkrement wird zeitnah committed und bleibt nicht ohne
  sachlichen Grund als fertiger Working-Tree-Diff liegen. Diese Regel ist die
  dauerhafte Erlaubnis für solche Abschluss-Commits; eine erneute Nachfrage ist
  nicht nötig. Unfertige oder nicht lauffähige Zwischenstände werden nicht als
  vermeintlich fertige Inkremente committed.
- Der Benutzer reviewt und stagt fachliche Änderungen; Staging gilt als
  Freigabe. Der Agent reviewt den staged Diff nicht erneut und committet nach
  vollständiger Freigabe ohne Rückfrage. Selbst stagen darf er nur auf
  ausdrücklichen Wunsch oder gemäß den folgenden Ausnahmen.
- Review und Commit sind getrennte Schritte: Solange im Auftrag noch
  reviewpflichtige Änderungen offen sind oder entstehen, keine Commits.
  Im Commit-Schritt keine neuen reviewpflichtigen Änderungen beginnen.
- Rein dokumentarische Abschlussarbeiten an freigegebenen Änderungen darf der
  Agent selbst nachstagen und mitcommitten, etwa das Entfernen bestätigter
  Testpunkte. Neue fachliche oder unbeteiligte Änderungen sind davon ausgenommen.
- Ausnahme: Bei einem ausdrücklich beauftragten reinen Release-Schritt müssen
  die mechanischen Release-Metadaten nach bereits freigegebenen fachlichen
  Änderungen nicht erneut vom Benutzer reviewt oder gestaged werden. Der Agent
  darf Versionsspiegelungen, Changelog und app-lesbare Release Notes nach den
  erfolgreichen Release-Prüfungen selbst stagen, als eindeutigen Release-Commit
  committen und taggen. Neue fachliche Änderungen sind von dieser Ausnahme
  nicht erfasst.
- Pushes erfolgen weiterhin nur auf ausdrücklichen Wunsch des Benutzers.

## MSFS-spezifische Lessons learned

- MSFS 2024, das EFB-SDK und Coherent GT sind eigene Laufzeiten. Ihr Verhalten
  wird nicht aus allgemeinen Browser-, React- oder Betriebssystemkonventionen
  abgeleitet. Das installierte SDK und seine Samples bleiben read-only.
- Vor MSFS-abhängigen Änderungen sind zuerst
  `docs/msfs-sdk-reference.md` und der bestehende Anwendungscode zu prüfen.
  SDK-Unterlagen und Samples werden erneut untersucht, wenn die Referenz die
  konkrete Frage nicht beantwortet, sich die SDK-Version geändert hat oder das
  beobachtete Verhalten der bisherigen Erkenntnis widerspricht.
- Eine Erkenntnis wird nur dauerhaft festgehalten, wenn sie eine zukünftige
  Implementierung beeinflusst oder einen wahrscheinlich wiederholten
  MSFS-spezifischen Fehler verhindert. Dazu gehören insbesondere überraschendes
  Lifecycle- und Eventverhalten, notwendige Ereignisreihenfolgen,
  Laufzeitbeschränkungen sowie nachweislich ungeeignete, naheliegende Wege.
  Erwartbares SDK-Verhalten, aus dem Code ersichtliche Implementierungsdetails
  und reine Bestätigungen werden nicht aufgenommen.
- Hängt die Korrektheit von ungeklärtem Laufzeitverhalten ab, darf ein eng
  begrenzter Diagnosepfad eingebaut und im Simulator geprüft werden. Rohlogs,
  Testskripte und der Untersuchungsweg sind temporär. Dauerhaft dokumentiert
  werden nur Ergebnis, Geltungsbereich und die daraus folgende DO-/DON'T-Regel.
- `docs/msfs-sdk-reference.md` ist der einzige Ort für bestätigte technische
  Lessons learned. Ein Nachweis wird nur so weit angegeben, wie er für die
  spätere Bewertung der Aussage nötig ist; nicht jede Aussage benötigt einen
  eigenen Marker. `[NEG]` bleibt besonders für naheliegende, nachweislich
  ungeeignete Wege reserviert.
- Noch ausstehende Laufzeitnachweise stehen ausschließlich als kurze Aufgaben
  in `docs/open-tests.md` und werden nach ihrer Klärung entfernt. Ein
  Laufzeitnachweis prüft den Default-Fall eines Features, also den einen
  Ablauf, den ein Pilot normalerweise auslöst. Grenz- und Gegenfälle werden
  durch Unit- oder Self-Tests abgedeckt und nicht als weitere manuelle
  Testschritte aufgeführt; Voraussetzung ist, dass programmiertes Verhalten
  in der Regel funktioniert. Ein zusätzlicher manueller Schritt braucht einen
  konkreten MSFS-Laufzeitgrund, den kein lokaler Test abdecken kann. ADRs enthalten
  Entscheidungen und Konsequenzen, aber keine zweite technische Referenz.
  `docs/phase-2-3-research.md` ist ein historisches Arbeitsdokument und wird
  nicht als fortlaufender Ablageort für neue Erkenntnisse verwendet.
- Reichen Referenz, SDK, offizielle Dokumentation und Samples nicht aus, dürfen
  das DevSupport-Forum und andere Primärquellen herangezogen werden.
  Community-Vermutungen gelten nicht als API-Vertrag.

## Source of Truth und generierte Dateien

- Das Repository unter WSL2 ist die einzige editierbare Source of Truth.
- Das installierte MSFS-SDK und seine Samples bleiben read-only. Bearbeitet
  werden ausschließlich die in dieses Repository kopierten Quellen.
- Das Windows-Staging unter
  `/mnt/c/dev/msfs2024-vr-checklist-staging` ist ein One-Way-Deployment-Ziel und
  darf nicht als Quelle zurück in das Repository synchronisiert werden.
- Das Companion-Staging unter
  `/mnt/c/dev/msfs2024-vr-checklist-companion-staging` folgt derselben
  One-Way-Regel. Es enthält ausschließlich gebaute Windows-Artefakte aus
  `companion/` und ist ebenfalls keine Source of Truth.
- `node_modules/`, `msfs/PackageSources/VRChecklist/dist/` sowie `Packages/`,
  `PackagesMetadata/` und `_PackageInt/` sind generiert und werden nicht
  manuell bearbeitet oder versioniert. Das kopierte
  `msfs/PackageSources/efb_api/dist/` ist dagegen Teil der bewusst versionierten
  SDK-Vorlage und wird nicht lokal neu erzeugt. Ausnahme: Die vorab gerenderten
  Sprachausgabedateien unter
  `assets/` werden bewusst versioniert, damit die Auslieferung ohne TTS-Modell
  und ohne Phonemizer auskommt; die Begründung steht in
  `docs/adr/0007-ablage-der-gerenderten-audiodateien.md`.
- Die Root-Datei `VERSION` ist die kanonische Quelle für die SemVer-Version der
  App, des MSFS-Pakets und neuer Release-Artefakte. Die Versionsangaben in der
  Paketdefinition und den npm-Metadaten müssen mit ihr übereinstimmen;
  `task check` prüft diese Konsistenz.
- Die JSON-Dateien unter `checklists/data/` sind die einzige Quelle für
  Checklist-Inhalte. Keine zweite Checkliste im Anwendungscode pflegen.
- `tmp/` ist ignoriert und flüchtig. Dauerhaft benötigte Screenshots liegen mit
  sprechenden Namen unter `docs/assets/` und werden aus der Dokumentation dort
  referenziert.

## Standardabläufe

- Projektweite Abläufe werden aus dem Repository-Root über `Taskfile.yml`
  gestartet; npm-Skripte sind nur für app-interne Frontend-Aufgaben bestimmt.
- Nach einem frischen Clone: `task init`, `task install`, `task check`.
- Änderungen, deren fachlicher Inhalt noch mit dem Benutzer abgestimmt werden
  muss oder zu denen Fragen offen sind, gelten als Zwischenstand. Vor der
  nötigen Benutzerentscheidung werden nur gezielte Prüfungen ausgeführt, die
  für die Abstimmung oder zur Vermeidung eines offensichtlich defekten
  Zwischenstands erforderlich sind; `task check` und Deployments folgen noch
  nicht.
- Nach inhaltlich abgestimmten Code- oder Datenänderungen muss vor Abschluss des
  Inkrements mindestens `task check` erfolgreich laufen.
- Nach jeder inhaltlich abgestimmten app-wirksamen Code-, UI- oder
  Checklistendaten-Änderung muss nach der erfolgreichen Prüfung automatisch
  `task deploy` ausgeführt werden. Reine Dokumentationsänderungen lösen keinen
  unnötigen Deployment-Build aus.
- Nach Änderungen am Windows-Companion muss zusätzlich automatisch
  `task companion:deploy` ausgeführt werden.
- Nach jedem Deployment ist die tatsächlich ins Windows-Staging geschriebene
  App-Version zu ermitteln und dem Benutzer ausdrücklich zu nennen. Nicht
  lediglich eine Version aus einem früheren lokalen Build angeben.
- Für eine MSFS-Testiteration folgt nach `task deploy` im Project Editor
  **Build All In Project** und im Coherent Debugger **Ignore Cache + Reload**.
- Für reine UI-Änderungen ist kein Neustart von MSFS 2024 und normalerweise
  auch kein neuer Flug erforderlich. Ein neuer Flug ist nur für Lifecycle- oder
  Reset-Verhalten nötig.
- Ein erfolgreicher Build beweist nicht, dass Coherent GT das Styling wie ein
  normaler Browser rendert. Visuelle Änderungen müssen im EFB geprüft werden.

## Produkt- und Qualitätsregeln

- Die dauerhaft akzeptierten UI- und Interaktionsentscheidungen stehen in
  `docs/design-decisions.md`; offene Abweichungen stehen in
  `docs/design-qa.md`.
- Die Oberfläche ist VR-first. Lesbarkeit und große Interaktionsziele haben
  Vorrang vor maximaler Informationsdichte.
- Laufzeitlogik ist event-first und darf keine unnötige Arbeit pro Frame
  verursachen. Polling ist nur als begründeter, langsamer und bei inaktiver App
  vollständig gestoppter Fallback zulässig; Performance und MSFS-FPS sind
  eigenständige Qualitätskriterien.
- Die Checkliste wird beim Übergang in den Ladezustand eines neuen Fluges
  zurückgesetzt. Änderungen an diesem Verhalten müssen gezielt in MSFS geprüft
  werden.
- Datenänderungen mit `task validate`, jede abgeschlossene Änderung mit
  `task check` verifizieren.
