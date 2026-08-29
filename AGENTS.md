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
- Commits sind, soweit sinnvoll möglich, nach fachlichem Kontext zu trennen.
  Checklistendaten, Anwendungscode und allgemeine Dokumentation gehören
  beispielsweise in getrennte Commits. Unmittelbar zugehörige Tests und
  Dokumentation dürfen bei der jeweiligen fachlichen Änderung bleiben.
- Jeder eindeutige Release-Commit `chore(release): publish version X.Y.Z` erhält
  einen annotierten Git-Tag `vX.Y.Z`, der exakt auf diesen Commit zeigt.
- Commit und Push erfolgen nur auf ausdrücklichen Wunsch des Benutzers.

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
  in `docs/open-tests.md` und werden nach ihrer Klärung entfernt. ADRs enthalten
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
- Nach Code- oder Datenänderungen muss mindestens `task check` erfolgreich
  laufen.
- Nach jeder app-wirksamen Code-, UI- oder Checklistendaten-Änderung muss nach
  der erfolgreichen Prüfung automatisch `task deploy` ausgeführt werden. Reine
  Dokumentationsänderungen lösen keinen unnötigen Deployment-Build aus.
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
