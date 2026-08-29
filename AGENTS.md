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
- Vor Arbeiten, die vom MSFS-SDK, der EFB-API, dem Flug-Lifecycle, SimVars,
  Coherent GT oder der Paketierung abhängen, ist `docs/msfs-sdk-reference.md` zu
  lesen. Dort stehen die bestätigten Fakten, Do's und Don'ts einschließlich der
  nachgewiesen wirkungslosen Pfade.
- Vor Arbeiten an Phase 2 oder Phase 3 sind `docs/adr/README.md` und die dort
  verlinkten Entscheidungen zu lesen. Eine dokumentierte Entscheidung wird nicht
  stillschweigend umgeworfen; eine Kehrtwende bekommt ein neues ADR, das das
  alte ersetzt.
- Vor Änderungen an Checklistendaten sind `checklists/data/README.md` und
  `checklists/data/style-guide.md` zu lesen.
- Jede abgeschlossene Änderung muss im selben Arbeitsgang das englische
  `CHANGELOG.md` aktualisieren. Noch nicht veröffentlichte Änderungen stehen
  unter `## [Unreleased]`. Bei einem Release werden sie nach
  `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` verschoben; datumsbasierte Überschriften
  ohne Version werden nicht verwendet.
- Das `CHANGELOG.md` hält **nutzerwirksame Änderungen** fest. Dokumentationsarbeit
  ist ein Eintrag, nicht einer je berührter Datei; Zwischenstände einer
  laufenden Untersuchung gehören gar nicht hinein.
- Commits sind, soweit sinnvoll möglich, nach fachlichem Kontext zu trennen.
  Checklistendaten, Anwendungscode und allgemeine Dokumentation gehören
  beispielsweise in getrennte Commits. Unmittelbar zugehörige Tests und
  Dokumentation dürfen bei der jeweiligen fachlichen Änderung bleiben.
- Jeder eindeutige Release-Commit `chore(release): publish version X.Y.Z` erhält
  einen annotierten Git-Tag `vX.Y.Z`, der exakt auf diesen Commit zeigt.
- Commit und Push erfolgen nur auf ausdrücklichen Wunsch des Benutzers.

## MSFS-SDK-Recherche und Laufzeitnachweise

- MSFS 2024, das EFB-SDK und Coherent GT werden nicht wie Standard-Web- oder
  Desktop-Laufzeiten behandelt. Ihr Verhalten darf nicht aus allgemeinen
  Browser-, React- oder Betriebssystem-Konventionen abgeleitet werden.
- Vor einer Implementierung, die von MSFS-spezifischen APIs, Events, SimVars,
  Lifecycle- oder Paketierungsdetails abhängt, sind das installierte SDK, die
  offiziellen SDK-Unterlagen und die passenden SDK-Samples zu prüfen. Das
  installierte SDK und seine Samples bleiben dabei strikt read-only.
- Reichen Dokumentation und Samples nicht für eine eindeutige Aussage aus,
  sind zusätzlich das offizielle MSFS-DevSupport-Forum und andere belastbare
  Primärquellen nach dem konkreten Laufzeitverhalten zu durchsuchen. Annahmen
  und Community-Vermutungen werden nicht als bestätigte API-Verträge behandelt.
- Bleibt der tatsächliche Eventpfad unklar, wird vor der Produktivlogik ein
  eng begrenztes diagnostisches Logging eingebaut. Der relevante Übergang wird
  im Simulator reproduziert; empfangene Events, Reihenfolge und Payloads werden
  dokumentiert. Erst danach wird das Reset-, Persistenz- oder Lifecycle-Verhalten
  an einen im Custom-EFB-Kontext bestätigten Pfad gebunden.
- Recherchequellen und Herleitungen stehen in `docs/phase-2-3-research.md`,
  bestätigte Laufzeitfakten in `docs/msfs-sdk-reference.md`, noch zu führende
  Laufzeitnachweise in `docs/open-tests.md` und offene visuelle Abweichungen in
  `docs/design-qa.md`.
- Dauerhaft gültige SDK-Erkenntnisse gehören zusätzlich nach
  `docs/msfs-sdk-reference.md`, damit sie nicht erneut über mehrere Dokumente
  verstreuen. Jede Aussage dort trägt ihre Nachweisstufe.
- Die Dokumentation ist nach Zweck getrennt, damit nichts doppelt gepflegt wird:
  `docs/msfs-sdk-reference.md` sagt **was gilt**, `docs/phase-2-3-research.md`
  sagt **warum wir es wissen** einschließlich der verworfenen Kandidaten, und
  die ADRs unter `docs/adr/` sagen **wie wir uns entschieden haben**. Ein ADR mit
  Status `Vorgeschlagen` oder `Offen` hängt noch an einem Nachweis. Noch nicht
  geführte Laufzeitnachweise stehen als Einzeiler in `docs/open-tests.md`;
  verbindliche Produktanforderungen für Phase 3 in
  `docs/phase-3-requirements.md`.
- **Ein Fakt hat genau einen Ort.** Andere Dokumente verweisen darauf, statt ihn
  zu wiederholen. Wer eine Erkenntnis an mehreren Stellen ablegt, macht jede
  spätere Korrektur zu einer Suche und lässt zwangsläufig eine Stelle veralten.
- **Dokumentiert wird das Ergebnis, nicht der Weg.** Ein Fehlversuch gehört nur
  hinein, wenn er jemanden davon abhält, ihn zu wiederholen — dann als `[NEG]`
  oder `DON'T`, nicht als Protokoll. Geschrieben wird am Ende einer
  Erkenntniskette, nicht nach jedem Zwischenschritt.

## Source of Truth und generierte Dateien

- Das Repository unter WSL2 ist die einzige editierbare Source of Truth.
- Das installierte MSFS-SDK und seine Samples bleiben read-only. Bearbeitet
  werden ausschließlich die in dieses Repository kopierten Quellen.
- Das Windows-Staging unter
  `/mnt/c/dev/msfs2024-vr-checklist-staging` ist ein One-Way-Deployment-Ziel und
  darf nicht als Quelle zurück in das Repository synchronisiert werden.
- `node_modules/`, `dist/` sowie `Packages/`, `PackagesMetadata/` und
  `_PackageInt/` sind generiert und werden nicht manuell bearbeitet oder
  versioniert. Ausnahme: Die vorab gerenderten Sprachausgabedateien unter
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

## MSFS-SDK- und Coherent-GT-Verhalten

Die bestätigten Fakten, Do's und Don'ts zu Coherent GT, EFB-API, App-Lifecycle,
SimVars, Flug-Lifecycle, Persistenz, Eingaben und Paketierung stehen vollständig
in [`docs/msfs-sdk-reference.md`](docs/msfs-sdk-reference.md). Hier werden sie
nicht dupliziert.

- Die dort dokumentierten Don'ts und die als **[NEG]** markierten Pfade sind
  verbindlich. Sie werden nicht ohne neuen, im Custom-EFB-Kontext geführten
  Laufzeitnachweis erneut umgesetzt.
- Als **[OPEN]** markierte Punkte sind vor einer darauf aufbauenden
  Implementierung nachzuweisen.

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
