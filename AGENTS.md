# Agent instructions

Diese Regeln gelten für das gesamte Repository. Sie halten dauerhaftes
Projektwissen fest; temporäre Beobachtungen und offene visuelle Abweichungen
gehören nach `docs/design-qa.md`.

## Zusammenarbeit und Sprache

- Kommuniziere mit dem Benutzer auf Deutsch, solange er nicht die Sprache
  wechselt.
- Prüfe vor Änderungen `git status --short` und erhalte alle bestehenden,
  insbesondere nicht zugehörigen Änderungen.
- Vor UI-Arbeiten sind `docs/design-decisions.md` und
  `docs/design-qa.md` zu lesen. Ändere dokumentierte Designentscheidungen nicht
  stillschweigend.
- Vor Arbeiten am nächsten VR-Teststand ist zusätzlich
  `docs/vr-test-preparation.md` zu lesen.
- Vor Änderungen an Checklistendaten sind `checklists/data/README.md` und
  `checklists/data/style-guide.md` zu lesen.
- Jede abgeschlossene Änderung muss im selben Arbeitsgang das englische
  `CHANGELOG.md` aktualisieren. Einträge stehen ohne Versionsnummer unter dem
  tatsächlichen Abschlussdatum im ISO-Format `## YYYY-MM-DD`; es gibt keinen
  `Unreleased`-Abschnitt. Weitere Änderungen am selben Tag werden in den
  bestehenden Datumsabschnitt einsortiert.
- Commit und Push erfolgen nur auf ausdrücklichen Wunsch des Benutzers.

## Source of Truth und generierte Dateien

- Das Repository unter WSL2 ist die einzige editierbare Source of Truth.
- Das installierte MSFS-SDK und seine Samples bleiben read-only. Bearbeitet
  werden ausschließlich die in dieses Repository kopierten Quellen.
- Das Windows-Staging unter
  `/mnt/c/dev/msfs2024-vr-checklist-staging` ist ein One-Way-Deployment-Ziel und
  darf nicht als Quelle zurück in das Repository synchronisiert werden.
- `node_modules/`, `dist/` sowie `Packages/`, `PackagesMetadata/` und
  `_PackageInt/` sind generiert und werden nicht manuell bearbeitet oder
  versioniert.
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
  CalVer-Version zu ermitteln und dem Benutzer ausdrücklich zu nennen. Nicht
  lediglich eine Version aus einem früheren lokalen Build angeben.
- Für eine MSFS-Testiteration folgt nach `task deploy` im Project Editor
  **Build All In Project** und im Coherent Debugger **Ignore Cache + Reload**.
- Für reine UI-Änderungen ist kein Neustart von MSFS 2024 und normalerweise
  auch kein neuer Flug erforderlich. Ein neuer Flug ist nur für Lifecycle- oder
  Reset-Verhalten nötig.
- Ein erfolgreicher Build beweist nicht, dass Coherent GT das Styling wie ein
  normaler Browser rendert. Visuelle Änderungen müssen im EFB geprüft werden.

## Coherent-GT-Erfahrungen

- Bevorzuge konservatives CSS: Flexbox, explizite Größen und Margins. Moderne
  Sizing-Funktionen, `gap` und echtes `position: sticky` nur nach erfolgreicher
  Prüfung im MSFS-Laufzeitsystem einsetzen.
- Der sticky wirkende Bereich ist als feste Flex-Struktur umgesetzt: App-Header
  und Abschnittsnavigation bleiben außerhalb des einzigen scrollenden
  Item-Containers. Dieses Layout nicht wieder auf CSS Sticky umstellen.
- Die globalen EFB-Styles für `Button`/`.abstract-button` können lokale
  Hover-, Focus-, Selected- und Active-Regeln überschreiben. Alle Zustände mit
  der tatsächlichen EFB-Komponente und in Coherent prüfen; bei Bedarf spezifische
  Selektoren verwenden.
- Für bedeutungstragende Symbole nicht auf Unicode-Fontabdeckung vertrauen. Das
  X der Checkbox wird deshalb mit CSS-Pseudoelementen gezeichnet.
- Die EFB-App kann einen Free-Flight-Wechsel resident überleben, ohne dass ein
  zuverlässiges View- oder Game-State-Ereignis ankommt. Die Flugzeugkennung wird
  deshalb zusätzlich alle zehn Sekunden geprüft, solange die Ansicht aktiv ist;
  diese Absicherung nicht wieder durch eine reine Lifecycle-Lösung ersetzen.
- Die Custom-App erhielt unter SDK 1.7.3 weder DOM-Enter, die Input-Stack-Aktionen
  `KEY_EFB_VALID`/`KEY_MENU_WM_VALIDATE` noch
  `AppView.routeGamepadInteractionEvent(BUTTON_A)`; letzteres wurde auch mit
  einem physischen Gamepad geprüft. Es ist bewusst kein wirkungsloser
  `VALIDATE`-Listener aktiv. Diesen erst nach einem dokumentierten und im
  Custom-App-Kontext bestätigten Eingabepfad wieder einführen.
- Screenshot-Vergleiche in Originalauflösung durchführen. Zwischenstände in
  `tmp/` dürfen erst nach Auswahl als dauerhafte Referenz nach `docs/assets/`
  übernommen werden.

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
