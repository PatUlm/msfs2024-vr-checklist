# Produktanforderungen für Phase 3

Dieses Dokument beschreibt den verbindlichen Produktumfang der geplanten
Windows-Begleit-App. Technische Entscheidungen stehen in den
[ADRs](adr/README.md), SDK- und Laufzeitfakten in der
[SDK-Referenz](msfs-sdk-reference.md), noch zu führende Laufzeitnachweise in
[open-tests.md](open-tests.md).

Status: **Geplant — beginnt nach der Abnahme von Phase 2.**

## Funktionsumfang

- Die lokale Begleit-App zeigt Flugzeug, Checkliste, aktive Gruppe, nächstes
  offenes Item und Fortschritt als ruhige Oberfläche mit Tray-Icon und
  Einstellungsfenster, nicht als Logausgabe.
- Zustandsänderungen der EFB-App erscheinen ohne merkbare Verzögerung in der
  Begleit-App. Der Rückkanal überträgt nur Änderungen und ein eigenes Ereignis
  für den Übergang zur vollständig erledigten Checkliste.
- Der aktuelle Checklisteneintrag kann optional aus vorab gerenderten
  Audiodateien vorgelesen werden. Die erste Sprache ist Englisch; die
  Klangprofile sind `Clean`, `Intercom` und `Radio`. Weitere Sprachen sind nicht
  Teil dieses Meilensteins.
- Der Nutzer wählt das Windows-Ausgabegerät, damit die Ansage gezielt im
  VR-Headset wiedergegeben werden kann.
- Beim Übergang von unvollständig zu vollständig wird genau einmal
  `Checklist completed` gesprochen. Ein Reset oder das Laden einer bereits
  leeren Checkliste löst keine Ansage aus. Wird ein abgeschlossenes Item wieder
  geöffnet und die Checkliste danach erneut vervollständigt, ist eine neue
  Ansage zulässig.
- Fehler und Verbindungsstatus werden dezent angezeigt, ohne die Bedienung im
  EFB oder in VR zu stören.
- Mikrofonaufnahme und Spracherkennung sind nicht Teil des Produkts.

Das Sprachschema aus `<challenge>: <response>` und dem optionalen `speech`-
Override ist Teil des kanonischen Datenvertrags in
[`checklists/data/README.md`](../checklists/data/README.md).

## Unabhängigkeit und Sicherheit

- Die EFB-App bleibt ohne Begleit-App und ohne Internet vollständig bedienbar,
  einschließlich der Bestätigung aus Phase 2.
- Fehler in Rückkanal, Begleit-App oder Sprachausgabe dürfen den normalen
  Checklistenablauf nicht blockieren.
- Die ausgelieferte Begleit-App arbeitet im Flug offline. Sie enthält weder
  TTS-Modell noch Phonemizer und kontaktiert keinen TTS-Anbieter.
- Geheimnisse liegen weder im EFB-Quellpaket noch in gebauten EFB-Dateien. Falls
  eine spätere lokale Funktion Zugangsdaten benötigt, werden sie über den
  Windows Credential Manager gespeichert.
- Ein TTS-Anbieter darf nur beim Vorab-Rendern durch den Entwickler kontaktiert
  werden. Vor der Anbieterwahl muss die Weitergabe der erzeugten Audiodateien
  ausdrücklich zulässig sein.

## Abnahmekriterien

- Neustart von MSFS, Flugwechsel und Neustart der Begleit-App führen in jeder
  Reihenfolge zu einem definierten Zustand ohne manuelles Aufräumen.
- Beide Transportrichtungen arbeiten ereignisgesteuert und ratenbegrenzt; es
  entsteht kein Polling und keine messbare Belastung der MSFS-Framerate.
- Die Audioausgabe erreicht bei laufendem MSFS das gewählte Gerät, ohne MSFS
  stummzuschalten oder dessen Audiopuffer-Periode zu verkleinern.
- Ohne laufende Begleit-App verhält sich die EFB-App unverändert.
- Die noch fehlenden Nachweise unter „Phase 3“ in
  [`open-tests.md`](open-tests.md) sind geführt.

## Zugehörige Entscheidungen

- [ADR 0003](adr/0003-transportkanal-commbus-ueber-simconnect.md): CommBus über
  SimConnect als Transportkanal, noch unter Laufzeitvorbehalt
- [ADR 0004](adr/0004-stack-der-begleit-app.md): .NET 10, Avalonia, eigenes
  SimConnect-P/Invoke und NAudio
- [ADR 0006](adr/0006-tts-vorab-synthese.md): Vorab-Synthese statt TTS zur
  Laufzeit
- [ADR 0007](adr/0007-ablage-der-gerenderten-audiodateien.md): gerenderte
  Audiodateien unter `assets/`
- [ADR 0008](adr/0008-stimme-und-tts-anbieter.md): Stimme und Anbieter noch
  offen
