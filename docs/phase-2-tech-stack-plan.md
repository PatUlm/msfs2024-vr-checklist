# Tech-Stack- und TTS-Evaluationsplan für Phase 2 und Phase 3

Status: **Geplant – Recherche und Architekturentscheidung stehen vor jeder
Implementierung.**

## Ziel

Phase 2 beginnt mit einer aktuellen, quellenbasierten Technologieentscheidung
für eine lokale Windows-Begleit-App. Erst danach entsteht Anwendungscode. Die
Entscheidung muss die kleine System-Tray-Oberfläche, den bidirektionalen Kanal
zur EFB-App, die globale Tastenerkennung sowie lokale, Cloud-basierte und
hybride TTS-Varianten berücksichtigen.

Umgesetzt wird zuerst nur Phase 2 aus `ROADMAP.md`: der bidirektionale Kanal mit
Hinkanal für das Abhaken des ersten offenen Items und Rückkanal für den
Checklistenstand einschließlich des Übergangs auf vollständig erledigt, dazu die
Item- und Fortschrittsanzeige der Begleit-App. Die Sprachausgabe ist Phase 3 und
nicht Teil dieser Umsetzung.

Entschieden wird der Stack trotzdem für beide Phasen gemeinsam. Die Begleit-App
aus Phase 2 ist dieselbe, die in Phase 3 Sprache synthetisiert, nachbearbeitet
und ausgibt. Die TTS-, Audio- und DSP-Anforderungen von Phase 3 sind deshalb
vollständig Teil dieser Recherche und dieser Bewertung. Ein Kandidat, der
Phase 2 gut löst und für Phase 3 ausgetauscht werden müsste, ist keine gültige
Empfehlung; wo ein Kandidat für Phase 3 nur unter Zusatzaufwand taugt, wird
dieser Aufwand benannt und bewertet.

Das Ergebnis ist keine lose Marktübersicht, sondern eine begründete
Zielarchitektur mit einem bewusst kleinen technischen Proof of Concept.

## Verbindliche Produktanforderungen

Sie gelten für die Begleit-App insgesamt. Die TTS- und Audiopunkte werden erst in
Phase 3 umgesetzt, bestimmen die Technologieentscheidung aber mit.

- Die bestehende EFB-Checkliste bleibt ohne Begleit-App und ohne Internet voll
  bedienbar.
- Die Begleit-App läuft in der angemeldeten Windows-Sitzung als
  System-Tray-Anwendung, nicht als Windows-Dienst.
- Die Begleit-App erkennt einen konfigurierbaren globalen Tastendruck und sendet
  daraus die Bestätigung des ersten offenen Items an die EFB-App. Sie reagiert
  ausschließlich auf diese Taste, zeichnet keine weiteren Eingaben auf und
  protokolliert keine Tastenanschläge.
- Die Begleit-App zeigt den über den Rückkanal gemeldeten Checklistenstand als
  lesbare Item- und Fortschrittsanzeige. Eine reine Log- oder Debugausgabe
  genügt nicht.
- Der Übergang der Checkliste auf vollständig erledigt ist ein eigenes Ereignis
  des Rückkanals und der spätere TTS-Auslöser.
- Ein kleines Einstellungsfenster ermöglicht mindestens die Wahl der
  Bestätigungstaste, TTS-Auswahl, Audioausgabegerät, Klangprofil und sichere
  Eingabe eines optionalen API-Keys.
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
Windows-API-Anbindung, systemweite Tastenerkennung ohne Fokus, laufend
aktualisierte Statusanzeigen, Audio-Bibliotheken, Debugging, Packaging,
Autostart, Updates, Ressourcenbedarf und langfristige Wartbarkeit.

### 2. UI- und Tray-Technik

Zu klären ist, welches Framework eine kleine, robuste Windows-Oberfläche ohne
unnötige Laufzeitlast ermöglicht. Der erste UI-Scope umfasst:

- Tray-Icon mit Status und Öffnen/Beenden,
- Statusfenster mit Checkliste, aktiver Gruppe, nächstem offenem Item und
  Fortschritt in lesbarer Darstellung,
- kleines Einstellungsfenster,
- Wahl der globalen Bestätigungstaste,
- Auswahl von TTS-Engine, Stimme und Audiogerät,
- Auswahl `Clean`, `Intercom` oder `Radio`,
- Eingabe, Ersetzen und Löschen eines API-Keys,
- Test-Button für eine feste Sprachprobe,
- dezente Fehler- und Verbindungsanzeige.

Ein modernes Erscheinungsbild ist wünschenswert, aber Robustheit und geringer
Overhead sind wichtiger als ein großes UI-Framework.

### 3. Bidirektionaler Kanal zwischen Begleit-App und EFB

Dieser Punkt ist das größte technische Risiko der Begleit-App, entscheidet allein
über den Erfolg von Phase 2 und wird vor allen TTS-Fragen geklärt.

Die Recherche prüft ausschließlich dokumentierte Wege:

- MSFS Communication API für den Nachrichtenaustausch mit der EFB-App,
- SimConnect für die lokale Begleit-App,
- Lebenszyklus, Verbindungsaufbau, Wiederverbindung und Fehlerverhalten.

Die in Phase 1 eingeführte JavaScript-Flow-API nutzt bereits den dokumentierten
Communication-API-Kanal `JS_LISTENER_COMM_BUS`. Phase 2 soll diese
ereignisbasierte Infrastruktur erweitern, statt daneben einen zweiten
proprietären Transport in der EFB-App aufzubauen. Die Begleit-App bleibt ein
normaler SimConnect-Client.

Offene Kernfrage: Wie erreicht eine Nachricht aus einem prozessexternen
SimConnect-Client den JavaScript-seitigen CommBus – und umgekehrt? Dass die
Communication API diesen Übergang leistet, ist bisher eine Arbeitsannahme und
kein nachgewiesener API-Vertrag. Zu prüfen und gegeneinander zu bewerten sind
mindestens:

- die CommBus-Funktionen eines eigenen kleinen WASM-Moduls im Paket als
  ausdrückliche Brücke zwischen SimConnect und JavaScript,
- SimConnect Client Data Areas als gemeinsamer Speicher zwischen Begleit-App und
  einer In-Process-Komponente,
- eigene, über SimConnect ausgelöste Custom- beziehungsweise H-Events und deren
  Sichtbarkeit im JavaScript-Kontext,
- LVars als letzte Rückfalloption, ausdrücklich unter dem Vorbehalt, dass die
  Projektregeln kein Polling erlauben.

Für jeden Kandidaten sind Richtung, Nutzlastgröße, Latenz, Verlustverhalten und
Zusatzaufwand im Build zu dokumentieren. Bleibt die Faktenlage nach
Dokumentation, Samples und DevSupport-Recherche unklar, entsteht zuerst ein eng
begrenzter Diagnosestand nach den Regeln in `AGENTS.md`, bevor Produktivlogik an
einen Pfad gebunden wird. Der gewählte Weg gilt erst nach einem Laufzeitnachweis
im residenten Custom-EFB-Kontext als bestätigt und wird mit seiner
Nachweisstufe in `docs/msfs-sdk-reference.md` festgehalten.

Der Nachrichtenvertrag selbst wird bewusst klein gehalten und ist Teil der
Zielarchitektur:

- Hinkanal Begleit-App → EFB: eine einzige Bestätigungsnachricht ohne Zielindex.
  Die EFB-App entscheidet allein, welches Item das erste offene ist.
- Rückkanal EFB → Begleit-App: der aktuelle Stand mit Checkliste, Flugzeug,
  aktiver Gruppe, nächstem offenem Item, Fortschritt und einer laufenden
  Sequenznummer, gesendet nur bei Änderung.
- Der Übergang auf vollständig erledigt ist ein eigenes Ereignis, damit die
  Begleit-App ihn ohne Zustandsvergleich erkennt.

Eine direkte, undokumentierte Verbindung der EFB-WebView zu `localhost` bleibt
außerhalb der Zielarchitektur. Die Eingabeaktion `VALIDATE` wird nicht erneut
implementiert, solange kein dokumentierter und im Custom-App-Kontext
bestätigter Eventpfad existiert; die globale Bestätigung ist genau deshalb ein
bewusst eigenes externes Ereignis der Begleit-App und kein Ersatzversuch für
`VALIDATE`.

Für die Windows-Seite ist zusätzlich zu recherchieren, welcher dokumentierte
Weg einen konfigurierbaren Tastendruck systemweit erkennt, während MSFS im
Vollbild oder in VR den Fokus hält, welche Rechte er benötigt und wie er sich
gegenüber Antivirus- und Anti-Cheat-Mechanismen verhält.

### 4. TTS-Strategie (Umsetzung erst in Phase 3)

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

### 5. Audioausgabe und Funk-/Intercom-Simulation (Umsetzung erst in Phase 3)

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
| Sprachqualität und Verständlichkeit in VR | 15 % |
| MSFS-Kanalanbindung und Windows-Audio | 15 % |
| Globale Tastenerkennung und Statusanzeige | 5 % |
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
3. Eine begründete Entscheidung für den bidirektionalen Transport zwischen
   Begleit-App und EFB-App, mit Nachweisstufe je Kandidat, benannter
   Rückfalloption und den noch offenen Nachweisen.
4. Eine klare Primärempfehlung mit begründetem Fallback.
5. Eine Zielarchitektur einschließlich Prozessgrenzen, Datenfluss,
   Nachrichtenvertrag beider Kanalrichtungen, Credential-Speicher, Cache und
   Audioausgabe.
6. Ein Architecture Decision Record unter `docs/architecture/`.
7. Eine aktualisierte Phase 2 in `ROADMAP.md` mit überprüfbaren
   Abnahmekriterien.
8. Ein eng begrenzter Proof-of-Concept-Plan, getrennt nach Phase 2 und
   Phase 3.

## Kleinster Proof of Concept nach der Entscheidung

Der Proof of Concept soll ausschließlich die risikoreichsten Annahmen prüfen und
ist wie die Meilensteine geteilt. Nur PoC A gehört zu Phase 2; PoC B ist die
Vorbereitung von Phase 3 und wird nur so weit vorgezogen, wie es die
Technologieentscheidung erfordert.

### PoC A – Kanal und Bestätigung (Phase 2)

1. Tray-App starten und sauber beenden.
2. Statusfenster öffnen, das einen Beispielstand als lesbare Item- und
   Fortschrittsanzeige darstellt.
3. Verbindung zu MSFS aufbauen, Verbindungsverlust erkennen und ohne
   Benutzereingriff wiederherstellen.
4. Einen konfigurierbaren Tastendruck systemweit erkennen, während MSFS im
   Vollbild oder in VR den Fokus hält.
5. Eine Bestätigungsnachricht über den gewählten Transportweg an einen
   Testempfänger in der EFB-App übertragen und dort nachweisen.
6. Dieselbe Strecke rückwärts nachweisen: Die EFB-App sendet einen
   Beispielstand, die Begleit-App zeigt ihn an.
7. Latenz von Tastendruck bis Anzeigeänderung, Leerlauflast und FPS-Wirkung
   messen.
8. Fehlerfälle ohne laufendes MSFS, ohne Flug, ohne zugeordnete Checkliste und
   bei beendeter Begleit-App sauber behandeln.

### PoC B – Sprachausgabe (Phase 3)

1. Kleines Settings-Fenster öffnen.
2. Einen Testschlüssel sicher speichern, lesen und löschen, ohne ihn zu loggen.
3. `Checklist completed` mit der empfohlenen lokalen TTS-Option erzeugen.
4. Dieselbe Ansage mit `Clean`, `Intercom` und `Radio` wiedergeben.
5. Ein konkretes Windows-/VR-Audiogerät auswählen und zuverlässig ansprechen.
6. Erzeugte und bearbeitete Audiodateien deterministisch cachen.
7. Startzeit, Syntheselatenz, CPU, RAM und Leerlauflast messen.
8. Fehlerfälle ohne Stimme, Audiogerät, Netzwerk oder gültigen API-Key sauber
   behandeln.

Noch nicht Teil dieses Proof of Concept sind die produktive Bestätigungslogik in
der Checkliste, das automatische Vorlesen aller Items, Installer, Autostart und
Update-System. PoC A verwendet auf der EFB-Seite bewusst einen Testempfänger und
nicht die fertige Item-Logik.

## PoC-Abnahmekriterien

Die ersten vier Kriterien entscheiden über Phase 2, die übrigen über die
Freigabe von Phase 3.

- Ein Tastendruck außerhalb des EFB-Fokus erreicht die EFB-App nachweisbar, und
  ein Zustandswechsel der EFB-App erreicht nachweisbar die Begleit-App.
- Der gewählte Transportweg ist im residenten Custom-EFB-Kontext
  runtime-verifiziert und mit Nachweisstufe dokumentiert.
- Die Item- und Fortschrittsanzeige der Begleit-App ist ohne Kenntnis der
  internen Nachrichten verständlich und wirkt nicht wie eine Debugausgabe.
- Weder Hin- noch Rückkanal erzeugt Polling oder eine messbare Wirkung auf die
  MSFS-Framerate.
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
  produktive Phase 2 möglich, einschließlich einer begründeten Aussage, ob
  derselbe Stack Phase 3 ohne Wechsel trägt.

## Startprompt für die nächste Session

> Lies `AGENTS.md`, `ROADMAP.md`, `docs/msfs-sdk-reference.md` und
> `docs/phase-2-tech-stack-plan.md`. Phase 1 ist abgeschlossen. Beginne Phase 2
> noch nicht mit Anwendungscode, sondern führe die im Plan beschriebene aktuelle
> Recherche durch. Kläre zuerst den bidirektionalen Kanal aus Phase 2: Welcher
> dokumentierte Weg transportiert eine Nachricht zwischen einem externen
> SimConnect-Client und dem JavaScript-CommBus der EFB-App in beiden Richtungen,
> und welcher Weg erkennt einen Tastendruck systemweit, während MSFS den Fokus
> hält? Behandle die bisherige Annahme über die Communication API als
> unbewiesen. Umgesetzt wird nur Phase 2, also Abhaken per Tastendruck und
> Fortschrittsanzeige in der Begleit-App. Entscheide den Stack trotzdem für
> Phase 2 und Phase 3 gemeinsam und bewerte die TTS-, Audio- und DSP-Anforderungen
> von Phase 3 vollständig mit; ein Kandidat, der für Phase 3 gewechselt werden
> müsste, ist keine gültige Empfehlung. Verwende offizielle oder primäre Quellen,
> dokumentiere zeitabhängige Angaben mit Datum, erstelle die Vergleichsmatrizen
> und gib eine konkrete Empfehlung samt Fallback und Zielarchitektur ab. Behandle
> C#/.NET als Arbeitshypothese, nicht als bereits getroffene Entscheidung.
> Implementiere erst nach einer ausdrücklichen Entscheidung des Benutzers einen
> Proof of Concept.
