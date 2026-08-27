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

## Phase 2 – Abhaken per Tastendruck in der EFB-App

Status: **In MSFS bestätigt für Starrflügler – der Hubschraubertest steht aus**

Ein Tastendruck oder ein HOTAS-Knopf hakt das nächste offene Item der gerade
angezeigten Gruppe ab, ohne Maus und ohne Windows-App. Ist die Gruppe schon
vollständig, bleibt der Druck wirkungslos. Der Auslöser ist das Sim-Key-Event
`LEAD_POLE_ON`, das der Nutzer in den MSFS-Steuerungen selbst belegt.

Grundlage: [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md)
und [ADR 0005](docs/adr/0005-phase-2-auf-die-efb-app-verkuerzen.md). Fakten in
[`docs/msfs-sdk-reference.md`](docs/msfs-sdk-reference.md).

### Abnahme

Erledigt sind Tastatur und HOTAS in der DA42. Offen sind H125, MH-60,
VR-Wechsel und fokussiertes Textfeld — die vollständige Liste steht in
[`docs/open-tests.md`](docs/open-tests.md). Fällt der Hubschraubertest, wird
Phase 2 für die Hubschrauber neu geschnitten und braucht doch eine Begleit-App.

## Phase 3 – Begleit-App mit Fortschrittsanzeige und Sprachausgabe

Status: **Geplant – setzt eine abgenommene Phase 2 voraus**

Ziel: Eine lokale Windows-Begleit-App zeigt den Checklistenstand als lesbare
Item- und Fortschrittsanzeige und liest die Checklisteneinträge vor.
Begleit-App, Rückkanal und Sprachausgabe entstehen gemeinsam, weil sie
technisch zusammengehören — siehe
[ADR 0005](docs/adr/0005-phase-2-auf-die-efb-app-verkuerzen.md).

Der Stack ist entschieden: **.NET 10 mit Avalonia**, SimConnect per eigenem
P/Invoke, NAudio für die Audioausgabe
([ADR 0004](docs/adr/0004-stack-der-begleit-app.md)). Der Kanal ist der
**CommBus über SimConnect**
([ADR 0003](docs/adr/0003-transportkanal-commbus-ueber-simconnect.md)). Die
Sprachausgabe wird **vorab gerendert**, nicht zur Laufzeit synthetisiert
([ADR 0006](docs/adr/0006-tts-vorab-synthese.md)); die Dateien liegen unter
`assets/` ([ADR 0007](docs/adr/0007-ablage-der-gerenderten-audiodateien.md)).
Offen ist allein die Wahl der Stimme
([ADR 0008](docs/adr/0008-stimme-und-tts-anbieter.md)).

### Geplanter Funktionsumfang

- Rückkanal: Die EFB-App meldet jede relevante Zustandsänderung mit Checkliste,
  Flugzeug, aktiver Gruppe, nächstem offenem Item und Fortschritt an die
  Begleit-App — ereignisgesteuert, nur bei Änderung und mit Ratenbegrenzung.
- Die Begleit-App stellt diesen Stand als lesbare Item- und
  Fortschrittsanzeige dar, nicht als Logausgabe. Dazu ein Tray-Icon und ein
  Einstellungsfenster.
- Der Übergang der Checkliste von unvollständig auf vollständig erledigt wird
  als eigenes Ereignis über den Rückkanal gemeldet und löst die Ansage
  `Checklist completed` aus.
- Optionales Vorlesen des aktuellen Checklisteneintrags aus vorab gerenderten
  Audiodateien.
- Englisch als erste Sprache; weitere Sprachen sind nicht Teil dieses
  Meilensteins.
- Einfacher Ansagetext aus `<challenge>: <response>` mit optionalem
  `speech`-Override für natürlich formulierte Sonderfälle. Beispiel:
  `Flaps: Up, Alternative Short Field TO: Flaps: App (1)`
- Klangprofile `Clean`, `Intercom` und `Radio`, ebenfalls vorab gerechnet.
- Auswahl des Windows-Ausgabegeräts, damit die Ansage im VR-Headset landet.
- Keine Mikrofonaufnahme und keine Spracherkennung.

### Abnahmekriterien

- Die Begleit-App zeigt Checkliste, aktive Gruppe, nächstes offenes Item und
  Fortschritt und zieht eine Änderung ohne merkbare Verzögerung nach.
- Ohne laufende Begleit-App bleibt die EFB-App unverändert vollständig
  bedienbar, einschließlich des Abhakens aus Phase 2.
- Ein aktivierter Sprachmodus liest den aktuellen Eintrag verständlich vor.
- Die Ansage `Checklist completed` erfolgt genau einmal pro Übergang und nicht
  nach einem Reset.
- Die Ausgabe landet auf dem gewählten Gerät, während MSFS läuft, ohne dass
  MSFS stummgeschaltet oder in eine kleinere Audiopuffer-Periode gezogen wird.
- Beide Richtungen arbeiten ereignisgesteuert. Es entsteht kein Polling und
  keine messbare Belastung der MSFS-Framerate.
- Neustart von MSFS, Flugwechsel und Neustart der Begleit-App in beliebiger
  Reihenfolge führen zu einem definierten Zustand ohne manuelles Aufräumen.
- Es findet keine Mikrofonaufnahme statt.
- Geheimnisse sind weder im Quellpaket noch in den gebauten EFB-Dateien
  enthalten.
- Fehler und Verbindungsstatus werden dezent angezeigt, ohne die VR-Bedienung
  zu stören.

### Aufbau

```text
Native EFB-App (TypeScript/TSX)
        ⇅ JSON über den CommBus, SimConnect-Seite: CallCommBusEvent /
          SubscribeToCommBusEvent
          zurück: Checklistenstand und Abschlussereignis
Lokale Windows-Begleit-App (.NET 10, Avalonia, SimConnect per P/Invoke)
        → Audioausgabe aus vorab gerenderten Dateien auf das gewählte
          Windows-/VR-Audiogerät
```

Die Begleit-App bleibt ein normaler SimConnect-Client und läuft als kleine
Tray-App in der angemeldeten Windows-Sitzung, nicht als Windows-Dienst — Anzeige
und Audiogerät brauchen eine Benutzersitzung. Eine direkte, undokumentierte
Verbindung der EFB-WebView zu `localhost` bleibt ausgeschlossen; im EFB-Kontext
entsteht kein lokaler Webserver.

### Offline- und Sicherheitsanforderungen

- Die eigentliche Checklist-App funktioniert immer ohne Begleit-App und ohne
  Internet.
- Rückkanal und Sprachausgabe sind optional und dürfen den normalen
  Checklist-Ablauf bei einem Fehler nicht blockieren.
- API-Schlüssel werden niemals im EFB-Paket oder dessen JavaScript abgelegt.
- Zugangsdaten verbleiben in der lokalen Begleit-App und werden über den
  Windows Credential Manager geschützt.
- Die ausgelieferte Begleit-App enthält kein TTS-Modell und keinen Phonemizer;
  das Rendern ist ein Entwicklerschritt. Damit bleibt die Auslieferung frei von
  Copyleft-Komponenten und vollständig offlinefähig.
- Ein etwaiger TTS-Anbieter wird nur beim Vorab-Rendern kontaktiert, niemals zur
  Flugzeit. Vor der Anbieterwahl ist zu klären, ob dessen Nutzungsbedingungen
  die Weitergabe der erzeugten Audiodateien erlauben.

## Leitlinien für alle Meilensteine

- Offizielles MSFS-2024-EFB-Template als technische Grundlage verwenden
- SDK-Dateien niemals direkt verändern
- TypeScript entsprechend dem Microsoft-Template bevorzugen
- Möglichst wenige zusätzliche Abhängigkeiten verwenden
- Quellmaterial, strukturierte Daten, Anwendungscode und Build-Artefakte klar trennen
- Tatsächliche Build-, Installations- und Testschritte im README dokumentieren
- Erweiterungen erst aufnehmen, nachdem der vorherige Meilenstein zuverlässig funktioniert
