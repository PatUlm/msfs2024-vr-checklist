# Roadmap – MSFS 2024 VR Checklist

Diese Roadmap hält die geplanten Entwicklungsschritte für die native Checklist-App im Electronic Flight Bag (EFB) von Microsoft Flight Simulator 2024 fest. Die App bleibt bewusst schlank, VR-tauglich und im Kern vollständig offline nutzbar.

## Phase 0 – Entwicklungsumgebung

Status: **Abgeschlossen**

- [x] Lokalen Projektordner geprüft
- [x] Git-Repository initialisiert
- [x] Node.js und npm geprüft
- [x] MSFS 2024 Developer Mode aktiviert
- [x] Microsoft Flight Simulator 2024 SDK 1.7.3 installiert
- [x] SDK-Installation unter `C:\MSFS 2024 SDK` verifiziert
- [x] Offizielle VS-Code-Erweiterung `asobostudio.msfs-tools@0.1.15` installiert
- [x] Offizielle MSFS-2024-Samples 1.7.3 installieren
- [x] EFB Template Sample unter `C:\MSFS 2024 SDK\Samples\DevmodeProjects\EFB` lokalisieren und untersuchen
- [x] Build-, Packaging- und Testablauf dokumentieren (siehe [README.md](README.md))

## Phase 0.5 – Beispielchecklisten

Status: **Abgeschlossen**

- [x] Verzeichnisse `checklists/source/` und `checklists/data/` anlegen
- [x] Originaldokumente unabhängig vom Dateiformat standardmäßig von Git ausschließen
- [x] DA42 und MH-60 als lokale ODS-Referenzdokumente aufnehmen
- [x] Format für versionierbare strukturierte Checklistendaten festlegen (siehe [`checklists/data/checklist.schema.json`](checklists/data/checklist.schema.json))

## Phase 1 – Minimaler nativer EFB-Prototyp

Status: **Abgeschlossen – MSFS- und VR-Abnahme am 2026-08-23 erfolgreich**

Ziel: Eine eigene App erscheint im nativen MSFS-2024-EFB, lädt eine gebündelte versionierte JSON-Checkliste und zeigt deren Einträge mit anklickbaren Checkboxen.

Abnahmekriterien:

- [x] Die App lässt sich mit dem offiziellen EFB-Template bauen.
- [x] Das Paket lässt sich in MSFS 2024 laden.
- [x] Die App erscheint im EFB aller unterstützten Flugzeuge.
- [x] Die angezeigten Checklist-Inhalte stammen ausschließlich aus den versionierten JSON-Dateien unter `checklists/data/`; im App-Code wird keine zweite Checklist-Liste gepflegt.
- [x] Checklisteneinträge können in VR gut gelesen und angeklickt werden.
- [x] Einträge mit `needsReview: true` zeigen in der Liste einen sichtbaren Review-Hinweis; die `reviewNote` erklärt den offenen Punkt.
- [x] Der Prototyp benötigt weder Backend noch Internetverbindung.

Die automatische Flugzeugerkennung und ein eng begrenzter Fortschritts-Snapshot
für VR-Moduswechsel wurden bereits in dieser Phase umgesetzt. PDF-Konvertierung,
KI, Cloud-Dienste, TTS und komplexe Persistenz bleiben spätere Meilensteine.

## Phase 2 – Begleit-App: Abhaken per Tastendruck und Fortschrittsanzeige

Status: **Geplant – Tech-Stack-Evaluation steht aus**

Der verbindliche Research-first-Ablauf steht in
[`docs/phase-2-tech-stack-plan.md`](docs/phase-2-tech-stack-plan.md). Vor der
Technologieentscheidung und ihrer ausdrücklichen Freigabe wird kein
Begleit-App-Code implementiert.

Die Recherche entscheidet den Stack für Phase 2, muss die Anforderungen von
Phase 3 aber ausdrücklich mitbewerten. Eine Entscheidung, die nur für das
Abhaken und die Anzeige passt und für die Sprachausgabe später gewechselt werden
müsste, gilt als nicht bestanden.

Ziel: Eine funktionierende lokale Windows-Begleit-App. Ein Tastendruck hakt auch
ohne fokussiertes EFB das erste noch offene Item ab, und die Begleit-App zeigt
den aktuellen Checklistenstand als lesbare Anzeige. Sprachausgabe ist nicht Teil
dieser Phase.

### Geplanter Funktionsumfang

- Hinkanal: Die Begleit-App erkennt in der angemeldeten Windows-Sitzung einen
  konfigurierbaren Tastendruck und sendet daraus eine Bestätigungsnachricht an
  die EFB-App. Die App hakt genau das erste offene Item in
  Checklist-Reihenfolge ab.
- Rückkanal: Die EFB-App meldet jede relevante Zustandsänderung mit Checkliste,
  Flugzeug, aktiver Gruppe, nächstem offenem Item und Fortschritt an die
  Begleit-App.
- Die Begleit-App stellt diesen Stand als lesbare Item- und
  Fortschrittsanzeige dar, nicht als Logausgabe.
- Der Übergang der Checkliste von unvollständig auf vollständig erledigt wird
  als eigenes Ereignis über den Rückkanal gemeldet. Phase 2 zeigt es an;
  Phase 3 verwendet genau dieses Ereignis als TTS-Auslöser.
- Der Transport verwendet ausschließlich dokumentierte MSFS-Wege. Auf der
  JavaScript-Seite ist das der in Phase 1 bereits genutzte
  Communication-API-Kanal `JS_LISTENER_COMM_BUS`. Welcher dokumentierte Weg eine
  Nachricht zwischen einem externen SimConnect-Client und diesem Kanal
  transportiert, ist noch offen und ausdrücklich Teil der Recherche.
- Die MSFS-EFB-Aktion `VALIDATE` wird nicht erneut implementiert; sie ist unter
  SDK 1.7.3 nachweislich nicht erreichbar. Siehe
  [`docs/msfs-sdk-reference.md`](docs/msfs-sdk-reference.md).
- Eine direkte, undokumentierte Verbindung der EFB-WebView zu `localhost` bleibt
  ausgeschlossen. Im EFB-Kontext entsteht kein lokaler Webserver.
- Eine frei belegbare Taste für Joystick oder VR-Controller bleibt eine spätere
  optionale Erweiterung derselben Bestätigungsnachricht.

### Abnahmekriterien

- Der konfigurierte Tastendruck hakt bei nicht fokussiertem EFB und in VR genau
  das erste offene Item ab und verändert nichts anderes.
- Ohne offenes Item, ohne zugeordnete Checkliste und ohne laufenden Flug bleibt
  der Tastendruck wirkungslos und erzeugt keinen Fehlerzustand.
- Die Begleit-App zeigt Checkliste, aktive Gruppe, nächstes offenes Item und
  Fortschritt und zieht eine Änderung ohne merkbare Verzögerung nach.
- Ohne laufende Begleit-App bleibt die EFB-App unverändert vollständig
  bedienbar.
- Beide Richtungen arbeiten ereignisgesteuert. Es entsteht kein Polling und
  keine messbare Belastung der MSFS-Framerate.
- Neustart von MSFS, Flugwechsel und Neustart der Begleit-App in beliebiger
  Reihenfolge führen zu einem definierten Zustand ohne manuelles Aufräumen.
- Der gewählte Stack deckt die Anforderungen von Phase 3 nachweislich ab, ohne
  dass die Begleit-App dafür ersetzt werden muss.

### Arbeitshypothese für die Begleit-App

```text
Native EFB-App (TypeScript/TSX)
        ⇅ JSON über einen dokumentierten MSFS-Kanal (Transportweg noch offen)
          hin: Bestätigung – zurück: Checklistenstand und Abschluss
Lokale Windows-Begleit-App mit SimConnect und globaler Tastenerkennung
        ⇅ HTTPS (erst Phase 3)
Optionaler TTS-Anbieter
        → Audioausgabe im aktiven Windows-/VR-Audiogerät (erst Phase 3)
```

Die Begleit-App bleibt ein normaler SimConnect-Client; C#/.NET ist dafür ein zu
prüfender Ausgangskandidat und noch keine getroffene Stack-Entscheidung. Für
Anzeige, Tastenerkennung und die späteren Audioausgaben wird eine kleine
Tray-App in der angemeldeten Windows-Sitzung gegenüber einem echten
Windows-Dienst bevorzugt, weil alle drei Aufgaben eine Benutzersitzung mit
Fenster, Eingabe und Audiogerät benötigen. Die EFB-App und die Begleit-App
kommunizieren ausschließlich über einen dokumentierten MSFS-Weg; welcher das
ist, entscheidet die Recherche. Eine direkte, undokumentierte Verbindung aus dem
EFB zu `localhost` ist nicht Grundlage des Designs.

### Offline- und Sicherheitsanforderungen

Diese Anforderungen gelten für Phase 2 und Phase 3.

- Die eigentliche Checklist-App funktioniert immer ohne Begleit-App und ohne Internet.
- Bestätigungskanal und TTS sind optional und dürfen den normalen Checklist-Ablauf bei einem Fehler nicht blockieren.
- Die globale Tastenerkennung reagiert ausschließlich auf die konfigurierte Taste; sie zeichnet keine Eingaben auf und protokolliert keine Tastenanschläge.
- API-Schlüssel werden niemals im EFB-Paket oder dessen JavaScript abgelegt.
- Zugangsdaten verbleiben in der lokalen Begleit-App und werden nach Möglichkeit über den Windows Credential Manager geschützt.
- Bereits erzeugte Audiodateien können lokal gecacht werden.
- Für feste Checklistentexte wird geprüft, ob vorab generierte und mitgelieferte Audiodateien die bessere vollständig offlinefähige Lösung sind.
- Der konkrete TTS-Anbieter wird erst nach einem Vergleich von Qualität, Latenz, Kosten, Lizenzbedingungen und API-Unterstützung ausgewählt.

## Phase 3 – Sprachausgabe

Status: **Geplant – setzt eine abgenommene Phase 2 voraus**

Ziel: Checklisteneinträge und der Abschluss der Checkliste werden verständlich
vorgelesen. Die Sprachausgabe entsteht in derselben Begleit-App und nutzt den in
Phase 2 verifizierten Kanal; ein Technologiewechsel ist ausdrücklich nicht
vorgesehen.

### Geplanter Funktionsumfang

- Optionales Vorlesen des aktuellen Checklisteneintrags per Text-to-Speech (TTS)
- Einmalige Ansage `Checklist completed` beim Übergang auf vollständig erledigt, ausgelöst über das Abschluss-Ereignis aus Phase 2
- Englisch als erste TTS-Sprache; weitere Sprachen sind nicht Teil des ersten TTS-Meilensteins
- Einfacher TTS-Fallback aus `<challenge>: <response>` und optionaler `speech`-Override für natürlich formulierte Sonderfälle
- Beispiel für einen vollständig formulierten `speech`-Override: `Flaps: Up, Alternative Short Field TO: Flaps: App (1)`
- Klangprofile `Clean`, `Intercom` und `Radio` für die Ausgabe
- Keine Mikrofonaufnahme und keine Spracherkennung erforderlich

### Abnahmekriterien

- Ein aktivierter TTS-Modus liest den aktuellen Checklisteneintrag verständlich vor.
- Die Ansage `Checklist completed` erfolgt genau einmal pro Übergang und nicht nach einem Reset.
- Es findet keine Mikrofonaufnahme statt.
- Ohne Internet, API-Guthaben oder laufende Begleit-App bleibt die Checkliste vollständig bedienbar.
- Geheimnisse sind weder im Quellpaket noch in den gebauten EFB-Dateien enthalten.
- Fehler und Verbindungsstatus werden dezent angezeigt, ohne die VR-Bedienung zu stören.

## Leitlinien für alle Meilensteine

- Offizielles MSFS-2024-EFB-Template als technische Grundlage verwenden
- SDK-Dateien niemals direkt verändern
- TypeScript entsprechend dem Microsoft-Template bevorzugen
- Möglichst wenige zusätzliche Abhängigkeiten verwenden
- Quellmaterial, strukturierte Daten, Anwendungscode und Build-Artefakte klar trennen
- Tatsächliche Build-, Installations- und Testschritte im README dokumentieren
- Erweiterungen erst aufnehmen, nachdem der vorherige Meilenstein zuverlässig funktioniert
