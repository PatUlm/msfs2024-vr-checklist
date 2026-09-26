# Agent instructions

Diese Regeln gelten für das gesamte Repository. Das Produkt ist ein kostenloses
Spiele-Add-on mit geplanter Open-Source-Veröffentlichung, kein System für reale
Luftfahrt. Aufwand und Dokumentation richten sich nach diesem Zweck.

## Zusammenarbeit

- Deutsch verwenden, solange der Benutzer nicht die Sprache wechselt.
- Vor Änderungen `git status --short` prüfen und vorhandene, besonders
  unbeteiligte Änderungen erhalten.
- Gemeldete Bugs untersuchen, beheben und angemessen prüfen. Ist die Bearbeitung
  bewusst vertagt, Reproduktion, Auswirkung, Kenntnisstand und nächsten Schritt
  knapp am zuständigen Ort dokumentieren; nicht nur im Gespräch offenlassen.
- Vor UI-Arbeiten `docs/design-decisions.md` und `docs/design-qa.md` lesen;
  vor einem VR-Teststand zusätzlich `docs/open-tests.md`.
- Vor Architektur-/Companion-Arbeiten `docs/adr/README.md` und die betroffenen
  ADRs lesen. Produktentscheidungen nicht stillschweigend ändern; eine
  Architekturkehrtwende erhält ein ersetzendes ADR.
- Vor MSFS-abhängigen Änderungen `docs/msfs-sdk-reference.md` und vorhandenen
  Code prüfen. SDK/Samples erneut untersuchen, wenn die Referenz nicht reicht,
  sich das SDK geändert hat oder Beobachtungen widersprechen.
- Vor Checklistendatenänderungen `checklists/data/README.md` und
  `checklists/data/style-guide.md` lesen. Bei Inhaltsprüfungen zuerst kanonische
  Daten und Quellenverweise, dann nötigenfalls die Original-Primärquelle prüfen.
  Keine dauerhafte lokale Handbuchsammlung anlegen.

## Dokumentation: so viel wie nötig

- Eine Information bleibt nur, wenn sie Bedienung, Beiträge, Wartung oder
  konkrete Weitergaberechte unterstützt. Keine vorsorglichen Unternehmens-,
  Zertifizierungs- oder Freigabeprozesse für das Spiele-Add-on ergänzen.
- Aktuellen Zustand und Gründe dokumentieren, keine Sitzungsverläufe,
  erledigten Phasenpläne, Stimmenranglisten, Rohlogs oder Erfolgschroniken.
  Historie bleibt in Git; veröffentlichte Produktänderungen im Changelog.
- Jede Information hat genau einen zuständigen Ort gemäß der Tabelle unten.
  Andere Dokumente verlinken dorthin, ohne Status oder nächste Schritte zu
  wiederholen. Anleitungen beschreiben den Ablauf, ADRs die Entscheidung;
  der Bearbeitungsstand gehört ausschließlich zur zuständigen Aufgabenliste.
- `docs/design-decisions.md` enthält bewusste Produktregeln, keine vollständige
  UI-Spezifikation oder Abschrift von CSS-Werten. ADRs enthalten Problem,
  Entscheidung und nötige Konsequenz, normalerweise in 15–35 Zeilen.
  Erledigte reine Ablaufplanung darf entfallen; ADR-Nummern nicht neu vergeben.
- `docs/msfs-sdk-reference.md` enthält nur künftig relevante, bestätigte
  MSFS-/Coherent-Fallen mit Geltungsbereich und Handlungsregel. Normales
  API-Verhalten und aus dem Code ersichtliche Details nicht wiederholen.
  `[NEG]` für naheliegende, nachweislich ungeeignete Wege erhalten.
- Offene visuelle Punkte ausschließlich in `docs/design-qa.md`, offene
  MSFS-Laufzeitnachweise ausschließlich in `docs/open-tests.md`. Nach Klärung
  löschen; nur neue relevante Erkenntnisse in die zuständige Referenz übernehmen.
  Nicht mehr benötigte QA-Bilder entfernen, statt sie als Fehlerarchiv zu behalten.
- Bei Abschluss den Eintrag in der zuständigen Aufgabenliste entfernen und
  betroffene Bedien- oder Referenztexte aktualisieren. Bestätigte Nutzertests
  gelten als Nachweis. Vor Statusauskünften vom Backlog aus die verlinkten
  Fachlisten lesen und mit Code/Daten sowie Changelog abgleichen; bei
  Widersprüchen gezielt die Git-Historie prüfen.
  Externe Werkzeugfehler nur so lange dokumentieren,
  wie eine laufende Untersuchung es braucht; kompakte Reproduktion und Ticketlink
  genügen, private Personen-/Firmendetails gehören nicht in öffentliche Projektdocs.
- Quellen, Lizenztexte und noch benötigte Rechtebelege nicht als bloße Historie
  löschen. Lizenzarbeit auf tatsächlich veröffentlichte Bestandteile und
  konkrete ungeklärte Rechte begrenzen; keine pauschalen Herstelleranfragen
  nur wegen technischer Checklisteneinträge oder ihres Umfangs.
- Keine zweite Protokoll-/Schema-/Versionsliste von Hand pflegen, wenn Code,
  Schema oder Lockfile die Information verbindlich enthält. Neue Dateien nur
  bei eigenständigem, wiederkehrendem Nutzen; Kürzungen nicht durch lange
  Reviewberichte oder neue Archivdokumente wieder auffüllen.

| Information                                             | Zuständiger Ort                                                                            |
|---------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Nutzen, Bedienung und nutzerrelevante Grenzen           | `README.md`                                                                                |
| Nächster Produktmeilenstein                             | `ROADMAP.md`, ohne Aufgaben oder Statuskopien                                              |
| Offene Umsetzung und Veröffentlichung                   | `BACKLOG.md`; Einstieg mit Links auf Fachlisten                                            |
| Ausstehende MSFS-Tests / visuelle Prüfungen             | `docs/open-tests.md` / `docs/design-qa.md`                                                 |
| Offene Rechtefragen mit Befund und nächstem Schritt     | `docs/license-audit.md`                                                                    |
| Komponentenlizenzen und Primärnachweise                 | `docs/third-party-licenses.md`; Checklistenbewertung in `docs/checklist-license-review.md` |
| Entwicklungssetup, lokale Tests und Simulator-Iteration | `docs/development.md`                                                                      |
| Release-Befehle und lokale Installation                 | `docs/release.md`                                                                          |
| Windows-Voraussetzungen und Companion-Diagnose          | `companion/README.md`                                                                      |
| Produktentscheidungen / Architekturgründe / MSFS-Fallen | `docs/design-decisions.md` / `docs/adr/` / `docs/msfs-sdk-reference.md`                    |
| Datenpflege, Schreibweise und Quellen                   | `checklists/data/README.md`, `style-guide.md` und referenzierte Quellenbelege              |
| Assetpflege und Herkunft                                | README und Metadaten bei den jeweiligen Assets                                             |
| Veröffentlichte Produktänderungen                       | `CHANGELOG.md`; Git für Implementierungshistorie                                           |
| Arbeits-, Review- und Commitregeln                      | `AGENTS.md`                                                                                |

Fachlisten bleiben über den Backlog erreichbar, auch wenn sie leer sind.
ADR-Übersichten enthalten nur Links und Themen; die Gültigkeit steht im ADR.

## Prüfungen und Deployment

- Projektabläufe vom Root über `Taskfile.yml`; npm nur für app-interne Aufgaben.
  Nach frischem Clone: `task init`, `task install`, `task check`.
- Solange fachliche Fragen zur Änderung offen sind, nur gezielte Prüfungen für
  die Abstimmung; noch kein `task check` oder Deployment des Zwischenstands.
- Nach abgestimmten Datenänderungen `task validate`, vor Abschluss jeder
  Änderung `task check`. Angemessene lokale Prüfungen und für Korrektheit nötige
  MSFS-Nachweise müssen vor Abschluss erfolgreich sein.
- Nach abgestimmten app-wirksamen Code-, UI- oder Datenänderungen nach erfolgreicher
  Prüfung automatisch `task deploy`; bei Companion-Änderungen zusätzlich
  `task companion:deploy`. Reine Dokumentation braucht kein Deployment.
- Nach Deployment die tatsächlich ins Windows-Staging geschriebene
  Versionskennung ermitteln und dem Benutzer nennen.
- Simulator-Iteration: `task deploy` → **Build All In Project** im Project
  Editor → **Ignore Cache + Reload** im Coherent Debugger. UI-Änderungen
  brauchen keinen Simulatorneustart und normalerweise keinen neuen Flug;
  Lifecycle-/Reset-Prüfungen brauchen einen neuen Flug.
- Ein Build beweist kein Coherent-Styling: Visuelles im EFB prüfen.
  Manuelle Laufzeitnachweise prüfen den normalen Bedienablauf. Grenzfälle
  durch Unit-/Self-Tests abdecken; zusätzliche manuelle Schritte brauchen
  einen konkreten MSFS-Grund, den lokale Tests nicht abdecken können.
- Ungeklärtes Laufzeitverhalten darf mit eng begrenzter Diagnose geprüft werden.
  Rohlogs, Testskripte und Untersuchungsweg bleiben temporär. Dauerhaft bleiben
  nur relevante Ergebnisse, Geltungsbereich und DO-/DON'T-Regeln.
- Reichen SDK, offizielle Doku und Samples nicht, DevSupport und andere
  Primärquellen nutzen. Community-Vermutungen sind kein API-Vertrag.

## Review, Commits und Releases

- Trunk-Based Development auf `master`: kleine, fachlich geschlossene,
  lauffähige Inkremente; keine langlebigen Feature-Branches oder Sammel-Commits.
- Der Benutzer reviewt und stagt fachliche Änderungen; Staging ist Freigabe.
  Staged Diff nicht erneut reviewen. Selbst stagen nur auf ausdrücklichen
  Auftrag oder nach den folgenden Ausnahmen.
- Review und Commit trennen: Solange reviewpflichtige Änderungen offen sind
  oder entstehen, keine Commits. Im Commit-Schritt keine neuen fachlichen
  Änderungen anfangen.
- Rein dokumentarische Abschlussarbeiten an freigegebenen Änderungen dürfen
  selbst nachgestagt werden, etwa bestätigte Testpunkte entfernen.
- Fertige, vollständig freigegebene Inkremente zeitnah ohne erneute Rückfrage
  committen, nach nötigen Prüfungen, Deployments und Laufzeitnachweisen.
  Unfertige oder nicht lauffähige Stände nicht als abgeschlossen committen.
- Commits nach Kontext trennen, etwa Daten, Anwendung und allgemeine Doku.
  Unmittelbar zugehörige Tests und Dokumentation dürfen zusammenbleiben.
- Bei ausdrücklich beauftragten reinen Releases dürfen mechanische
  Versionsspiegelungen, Changelog und Release Notes nach erfolgreichen
  Prüfungen selbst gestagt, committed und getaggt werden. Neue fachliche
  Änderungen sind davon ausgenommen.
- Jeder `chore(release): publish version X.Y.Z` erhält den annotierten Tag
  `vX.Y.Z` exakt auf diesem Commit. Nach Build und Release-Commit
  `task release:install` ausführen: Erst mit aktualisiertem Community-Paket
  und installierter Companion-EXE ist das Release lokal abgeschlossen.
- Pushes nur auf ausdrücklichen Wunsch.

## Changelog und Lizenzen

- Jede abgeschlossene nutzerwirksame Änderung im selben Arbeitsgang im
  englischen `CHANGELOG.md` unter `## [Unreleased]` festhalten. Beim Release
  nach `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` verschieben, keine CalVer-Überschriften.
- Nur ausgelieferte App-, Checklisten- und Distributionsänderungen aufnehmen.
  Doku, Tests, QA, Forschung, ADRs, Agentenregeln und interne Build-/Release-
  Abläufe erhalten keinen Eintrag; Begleitdoku keinen separaten Eintrag.
- Fehler innerhalb eines noch unveröffentlichten Features im Feature-Eintrag
  aufgehen lassen. Eigene `Fixed`-Einträge nur für veröffentlichtes Verhalten
  oder unabhängige bestehende Fehler. Kurz die Nutzerwirkung beschreiben,
  keine Implementierungs- und Reviewgeschichte. Veröffentlichte Versionen
  und ihre wesentlichen Änderungen bleiben als Historie erhalten.
- Bei jedem Release `companion/release-notes.json` aktualisieren: gleiche
  Version/Datum wie Changelog, wichtigstes Merkmal zuerst, knappe Feature-/Fix-
  Einzeiler. Das Changelog bleibt die vollständige Produktchronik.
- Neue/aktualisierte direkte Abhängigkeiten und ausgelieferte Drittkomponenten
  im selben Arbeitsgang in `docs/third-party-licenses.md` mit Version, Lizenz
  und Primärquelle nachführen, ausgelieferte zusätzlich mit ihren Lizenztexten
  unter `licenses/`.

## Quellen und generierte Dateien

- Nur das WSL2-Repository ist editierbare Source of Truth. Installiertes SDK
  und Samples bleiben read-only; nur ins Repository kopierte Quellen ändern.
- `/mnt/c/dev/msfs2024-vr-checklist-staging` und
  `/mnt/c/dev/msfs2024-vr-checklist-companion-staging` sind One-Way-Ziele,
  niemals zurücksynchronisieren. Companion-Staging enthält nur gebaute Artefakte.
- `node_modules/`, `msfs/PackageSources/VRChecklist/dist/`, `Packages/`,
  `PackagesMetadata/`, `_PackageInt/` sind generiert, nicht manuell bearbeiten
  oder versionieren. `msfs/PackageSources/efb_api/` und `vendor/` kopiert
  `task install` aus dem lokalen SDK; die SDK-EULA verbietet die Weitergabe
  dieser Sample-Inhalte, daher nie versionieren. Gerenderte Sprachassets
  sind gemäß ADR 0007 versioniert, damit Builds kein TTS benötigen.
- `VERSION` ist die kanonische SemVer für App, Paket und neue Release-Artefakte;
  Paketdefinition und npm-Metadaten spiegeln sie, `task check` prüft Konsistenz.
- `checklists/data/*.json` sind die einzige Quelle der Checklisteninhalte;
  keine zweite Liste im App-Code. `tmp/` ist ignoriert und flüchtig;
  benötigte Dokumentationsbilder liegen mit sprechenden Namen in `docs/assets/`.

## Produktqualität

- MSFS, EFB-SDK und Coherent sind eigene Laufzeiten; ihr Verhalten nicht aus
  allgemeinen Browser-, React- oder OS-Konventionen ableiten.
- VR-first: Lesbarkeit und große Interaktionsziele vor Informationsdichte.
- Event-first, keine unnötige Arbeit pro Frame. Polling nur begründet,
  langsam und bei inaktiver App vollständig gestoppt. MSFS-FPS sind ein
  eigenständiges Qualitätskriterium.
- Reset beim Laden eines neuen Fluges; Änderungen daran gezielt in MSFS prüfen.
- Audioqualität gilt unabhängig vom Ausgabegerät. Keine zusätzlichen manuellen
  Hörtests speziell für Headsets, In-Ears oder andere Kopfhörertypen verlangen.
