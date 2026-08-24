# Phase 2: Tech-Stack- und TTS-Evaluationsplan

Status: **Geplant – Recherche und Architekturentscheidung stehen vor jeder
Implementierung.**

## Ziel

Phase 2 beginnt mit einer aktuellen, quellenbasierten Technologieentscheidung
für eine lokale Windows-Begleit-App. Erst danach entsteht Anwendungscode. Die
Entscheidung muss sowohl eine kleine System-Tray-Oberfläche als auch lokale,
Cloud-basierte und hybride TTS-Varianten berücksichtigen.

Das Ergebnis ist keine lose Marktübersicht, sondern eine begründete
Zielarchitektur mit einem bewusst kleinen technischen Proof of Concept.

## Verbindliche Produktanforderungen

- Die bestehende EFB-Checkliste bleibt ohne Begleit-App und ohne Internet voll
  bedienbar.
- Die Begleit-App läuft in der angemeldeten Windows-Sitzung als
  System-Tray-Anwendung, nicht als Windows-Dienst.
- Ein kleines Einstellungsfenster ermöglicht mindestens TTS-Auswahl,
  Audioausgabegerät, Klangprofil und sichere Eingabe eines optionalen API-Keys.
- API-Keys und andere Geheimnisse gelangen niemals in das EFB-Paket, dessen
  JavaScript, Logdateien oder normale Konfigurationsdateien.
- Audio muss zuverlässig über das gewünschte Windows- beziehungsweise
  VR-Ausgabegerät hörbar sein.
- Laufzeitaufwand, Speicherbedarf und Hintergrundaktivität dürfen MSFS-FPS
  nicht unnötig beeinträchtigen.
- Englisch ist die erste Ausgabesprache. Weitere Sprachen sind nicht Teil des
  ersten Proof of Concept.
- Es findet keine Mikrofonaufnahme und keine Spracherkennung statt.
- TTS- und Audiofehler blockieren niemals die normale Checklistennutzung.

## Noch nicht getroffene Entscheidungen

### 1. Sprache und Desktop-Runtime

C#/.NET ist wegen Windows-Integration, SimConnect, Audio-APIs und sicherer
Credential-Speicherung die erste Arbeitshypothese, aber noch keine Entscheidung.
Mindestens folgende realistische Kandidaten werden anhand aktueller
Primärquellen verglichen:

- aktuelles unterstütztes C#/.NET mit WPF, WinUI oder Avalonia,
- Rust mit Tauri,
- Electron/Node.js als funktionale, aber potenziell ressourcenintensivere
  Vergleichsbasis,
- native C++-Entwicklung nur dann, wenn sie einen belegbaren technischen Vorteil
  bietet, der den höheren Entwicklungsaufwand rechtfertigt.

Der Vergleich betrachtet Tray-Support, kleine Settings-UIs, SimConnect- und
Windows-API-Anbindung, Audio-Bibliotheken, Debugging, Packaging, Autostart,
Updates, Ressourcenbedarf und langfristige Wartbarkeit.

### 2. UI- und Tray-Technik

Zu klären ist, welches Framework eine kleine, robuste Windows-Oberfläche ohne
unnötige Laufzeitlast ermöglicht. Der erste UI-Scope umfasst:

- Tray-Icon mit Status und Öffnen/Beenden,
- kleines Einstellungsfenster,
- Auswahl von TTS-Engine, Stimme und Audiogerät,
- Auswahl `Clean`, `Intercom` oder `Radio`,
- Eingabe, Ersetzen und Löschen eines API-Keys,
- Test-Button für eine feste Sprachprobe,
- dezente Fehler- und Verbindungsanzeige.

Ein modernes Erscheinungsbild ist wünschenswert, aber Robustheit und geringer
Overhead sind wichtiger als ein großes UI-Framework.

### 3. Kommunikation mit MSFS und EFB

Die Recherche prüft ausschließlich dokumentierte Wege:

- MSFS Communication API für den Nachrichtenaustausch mit der EFB-App,
- SimConnect für die lokale Begleit-App,
- Lebenszyklus, Verbindungsaufbau, Wiederverbindung und Fehlerverhalten.

Eine direkte, undokumentierte Verbindung der EFB-WebView zu `localhost` bleibt
außerhalb der Zielarchitektur. Die Eingabeaktion `VALIDATE` wird nicht erneut
implementiert, solange kein dokumentierter und im Custom-App-Kontext
bestätigter Eventpfad existiert.

### 4. TTS-Strategie

Der aktuelle Markt wird zum Recherchezeitpunkt anhand offizieller Quellen,
Projekt-Repositories und gültiger Lizenzen neu bewertet. Zu vergleichen sind:

- in Windows integrierte und offline verfügbare Stimmen,
- aktuelle lokale neuronale Engines und ONNX-basierte Modelle,
- vorab erzeugte und mitgelieferte Audiodateien für feste Checklistentexte,
- aktuelle Cloud-TTS-Anbieter,
- eine hybride Lösung mit lokaler Engine oder mitgeliefertem Audio als Fallback
  und optional besserer Cloud-Stimme,
- lokaler Cache für synthetisierte und nachbearbeitete Ausgaben.

Beispiele wie Piper, Kokoro oder andere lokale Modelle sind nur Kandidaten. Ihr
aktueller Wartungszustand, ihre Modell- und Code-Lizenzen, Hardwareanforderungen
und Windows-Tauglichkeit werden recherchiert und nicht aus früherem Wissen
abgeleitet.

Für jede Option werden mindestens Sprachqualität, englische Stimmen, Latenz,
Offlinefähigkeit, CPU/GPU/RAM, Speicherbedarf, Lizenz, Datenschutz, Kosten,
Caching-Regeln, kommerzielle beziehungsweise öffentliche Weitergabe und
Wartungsrisiko bewertet.

### 5. Audioausgabe und Funk-/Intercom-Simulation

Die TTS-Engine erzeugt möglichst eine trockene Sprachdatei oder einen
PCM-Datenstrom. Eine eigene providerunabhängige Nachbearbeitung erzeugt daraus
optional drei Profile:

- `Clean`: unveränderte, normalisierte TTS-Ausgabe,
- `Intercom`: moderater Bandpass, leichte Kompression und sehr dezentes
  Headset-Rauschen,
- `Radio`: engerer Bandpass, Kompression, leichte Sättigung, Funkrauschen und
  kurze Squelch-/Klickgeräusche am Anfang und Ende.

Die Recherche bewertet geeignete lokale DSP-Bibliotheken und eine mögliche
Kette aus Resampling, Mono-Mix, Bandpass, Kompressor, leichter Sättigung,
Rauschzumischung, Squelch-Samples, Normalisierung und Limiter. Die konkrete
Kette muss in VR verständlich und über längere Zeit ermüdungsarm bleiben.

Effekte sind deaktivierbar und in ihrer Stärke konfigurierbar. Rauschen wird nur
während einer Ansage verarbeitet; es gibt keinen dauerhaft laufenden
Audiostream. Das fertig synthetisierte und nachbearbeitete Ergebnis wird nach
Möglichkeit gecacht. Communication-Items können später ein stärkeres
Radio-Profil verwenden, während normale Checklistensprache eher über Intercom
ausgegeben wird.

### 6. Geheimnisse und Einstellungen

Zu vergleichen sind mindestens Windows Credential Manager und eine geeignete
DPAPI-basierte Lösung. Die Entscheidung muss erklären:

- wie ein API-Key geschrieben, gelesen, ersetzt und gelöscht wird,
- welche nicht geheimen Einstellungen in einer normalen Konfiguration liegen,
- wie Logs und Diagnosen Geheimnisse zuverlässig auslassen,
- wie sich ein Benutzer bei einem ungültigen Schlüssel wieder erholen kann,
- wie portable Entwicklung und eine installierte Anwendung getrennt behandelt
  werden.

### 7. Packaging, Autostart und Updates

Die Zielarchitektur beschreibt außerdem:

- Installer- beziehungsweise Packaging-Format,
- benutzerbezogenen Autostart als optionale Einstellung,
- Speicherorte für Einstellungen, Credentials, Cache und Logs,
- saubere Deinstallation einschließlich optionaler Cache- und Credential-Löschung,
- Update-Strategie ohne ungefragte Hintergrunddownloads,
- Entwicklungs- und Release-Builds sowie eine zum Projekt passende
  SemVer-Strategie auf Basis der kanonischen Root-Datei `VERSION`.

## Bewertungsmethode

Die Recherche verwendet zwei getrennte Vergleichsmatrizen: eine für den
Desktop-Stack und eine für die TTS-/Audio-Strategie. Jede Bewertung verlinkt
eine aktuelle Primärquelle und kennzeichnet Schlussfolgerungen ausdrücklich als
Inference.

Vorgeschlagene Gewichtung für die abschließende Empfehlung:

| Kriterium | Gewicht |
| --- | ---: |
| Sprachqualität und Verständlichkeit in VR | 20 % |
| MSFS-Integration und Windows-Audio | 15 % |
| Offlinefähigkeit und Fehlerresilienz | 15 % |
| CPU-, GPU-, RAM- und Hintergrundlast | 15 % |
| Sicherheit und Datenschutz | 10 % |
| Wartbarkeit und Support-Lebenszyklus | 10 % |
| Tray-/Settings-UI und Bedienbarkeit | 5 % |
| Packaging, Autostart und Updates | 5 % |
| Lizenz und laufende Kosten | 5 % |

Falls ein sicherheits- oder lizenzkritisches Ausschlusskriterium verletzt wird,
darf eine hohe Gesamtpunktzahl den Kandidaten nicht retten.

## Rechercheanforderungen

- Aktuellen Stand zum Zeitpunkt der Session recherchieren; keine Produkt-,
  Preis-, Lizenz- oder Supportannahmen aus dem Modellwissen übernehmen.
- Technische Aussagen primär auf offizielle Dokumentation, offizielle
  Repositories, veröffentlichte Lizenzen und Herstellerinformationen stützen.
- Versionsnummern, Veröffentlichungs- beziehungsweise Abrufdatum und
  Supportstatus dokumentieren.
- Cloud-Preise nur mit Datum und Region angeben und nicht als dauerhaft stabil
  behandeln.
- Lokale Modelle getrennt nach Code-Lizenz, Modellgewichten, Stimme/Dataset und
  Weitergaberechten bewerten.
- Marketing-Demos nicht mit reproduzierbarer Qualität auf der Zielhardware
  gleichsetzen.

## Erwartete Ergebnisse der Recherche-Session

1. Eine gewichtete Vergleichsmatrix für Sprache, Runtime und UI-Framework.
2. Eine zweite Matrix für lokale, vorab erzeugte, Cloud- und hybride TTS-Pfade.
3. Eine klare Primärempfehlung mit begründetem Fallback.
4. Eine Zielarchitektur einschließlich Prozessgrenzen, Datenfluss,
   Credential-Speicher, Cache und Audioausgabe.
5. Ein Architecture Decision Record unter `docs/architecture/`.
6. Eine aktualisierte Phase 2 in `ROADMAP.md` mit überprüfbaren
   Abnahmekriterien.
7. Ein eng begrenzter Proof-of-Concept-Plan, noch ohne produktive
   MSFS-Integration.

## Kleinster Proof of Concept nach der Entscheidung

Der Proof of Concept soll ausschließlich die risikoreichsten Annahmen prüfen:

1. Tray-App starten und sauber beenden.
2. Kleines Settings-Fenster öffnen.
3. Einen Testschlüssel sicher speichern, lesen und löschen, ohne ihn zu loggen.
4. `Checklist completed` mit der empfohlenen lokalen TTS-Option erzeugen.
5. Dieselbe Ansage mit `Clean`, `Intercom` und `Radio` wiedergeben.
6. Ein konkretes Windows-/VR-Audiogerät auswählen und zuverlässig ansprechen.
7. Erzeugte und bearbeitete Audiodateien deterministisch cachen.
8. Startzeit, Syntheselatenz, CPU, RAM und Leerlauflast messen.
9. Fehlerfälle ohne Stimme, Audiogerät, Netzwerk oder gültigen API-Key sauber
   behandeln.

Noch nicht Teil dieses Proof of Concept sind die produktive EFB-Kommunikation,
SimConnect-Steuerung, globale Eingabebestätigung, automatisches Vorlesen aller
Items, Installer, Autostart und Update-System.

## PoC-Abnahmekriterien

- Eine feste englische Ansage ist über das gewählte VR-Audiogerät verständlich
  hörbar.
- Alle drei Klangprofile funktionieren; `Intercom` und `Radio` bleiben
  verständlich und erzeugen keine Dauerlast im Leerlauf.
- Ein optionaler API-Key kann über die UI sicher verwaltet werden und erscheint
  weder in Logs noch in normalen Konfigurationsdateien.
- Die Tray-App bleibt ohne Netzwerk, Cloud-Konto oder TTS-Modell kontrolliert
  bedienbar und beendet sich sauber.
- Messwerte für Startzeit, erste Ansage, gecachte Ansage, CPU und RAM sind
  dokumentiert.
- Auf Basis des PoC ist eine belastbare Go-/No-Go-Entscheidung für die
  produktive Phase 2 möglich.

## Startprompt für die nächste Session

> Lies `AGENTS.md`, `ROADMAP.md` und
> `docs/phase-2-tech-stack-plan.md`. Phase 1 ist abgeschlossen. Beginne Phase 2
> noch nicht mit Anwendungscode, sondern führe die im Plan beschriebene aktuelle
> Tech-Stack-, TTS-, Audio- und DSP-Recherche durch. Verwende offizielle oder
> primäre Quellen, dokumentiere zeitabhängige Angaben mit Datum, erstelle die
> beiden Vergleichsmatrizen und gib eine konkrete Empfehlung samt Fallback und
> Zielarchitektur ab. Behandle C#/.NET als Arbeitshypothese, nicht als bereits
> getroffene Entscheidung. Implementiere erst nach einer ausdrücklichen
> Entscheidung des Benutzers einen Proof of Concept.
