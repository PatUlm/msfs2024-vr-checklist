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

## Späterer Meilenstein – TTS und schnelle Eingabebestätigung

Status: **Idee vorgemerkt; nicht Teil von Phase 1**

Ziel: Checklisteneinträge können vorgelesen und anschließend ohne Sprachaufnahme per Eingabe bestätigt werden.

### Geplanter Funktionsumfang

- Optionales Vorlesen des aktuellen Checklisteneintrags per Text-to-Speech (TTS)
- Englisch als erste TTS-Sprache; weitere Sprachen sind nicht Teil des ersten TTS-Meilensteins
- Einfacher TTS-Fallback aus `<challenge>: <response>` und optionaler `speech`-Override für natürlich formulierte Sonderfälle
- Beispiel für einen vollständig formulierten `speech`-Override: `Flaps: Up, Alternative Short Field TO: Flaps: App (1)`
- Bestätigung des aktuellen Eintrags mit `Enter`, solange die EFB-App fokussiert ist
- Optional später frei belegbare Taste für Joystick oder VR-Controller
- Optional globale Bestätigung über eine lokale Begleit-App, falls die EFB-App nicht fokussiert ist
- Keine Mikrofonaufnahme und keine Spracherkennung erforderlich

### Bevorzugte Architektur

```text
Native EFB-App (TypeScript/TSX)
        ⇅ JSON über MSFS Communication API
Lokale C#/.NET-Begleit-App mit SimConnect
        ⇅ HTTPS
Optionaler TTS-Anbieter
        → Audioausgabe im aktiven Windows-/VR-Audiogerät
```

Für die Audioausgabe wird eine kleine Tray- oder Hintergrund-App in der angemeldeten Windows-Sitzung gegenüber einem echten Windows-Dienst bevorzugt. Die EFB-App und die Begleit-App kommunizieren über die von MSFS bereitgestellte Communication API beziehungsweise SimConnect; eine direkte, undokumentierte Verbindung aus dem EFB zu `localhost` ist nicht Grundlage des Designs.

### Offline- und Sicherheitsanforderungen

- Die eigentliche Checklist-App funktioniert immer ohne Begleit-App und ohne Internet.
- TTS ist optional und darf den normalen Checklist-Ablauf bei einem Fehler nicht blockieren.
- API-Schlüssel werden niemals im EFB-Paket oder dessen JavaScript abgelegt.
- Zugangsdaten verbleiben in der lokalen Begleit-App und werden nach Möglichkeit über den Windows Credential Manager geschützt.
- Bereits erzeugte Audiodateien können lokal gecacht werden.
- Für feste Checklistentexte wird geprüft, ob vorab generierte und mitgelieferte Audiodateien die bessere vollständig offlinefähige Lösung sind.
- Der konkrete TTS-Anbieter wird erst nach einem Vergleich von Qualität, Latenz, Kosten, Lizenzbedingungen und API-Unterstützung ausgewählt.

### Abnahmekriterien

- Ein aktivierter TTS-Modus liest den aktuellen Checklisteneintrag verständlich vor.
- `Enter` bestätigt genau den aktuell markierten Eintrag und wechselt kontrolliert zum nächsten.
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
