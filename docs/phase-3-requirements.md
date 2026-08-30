# Produktanforderungen für Phase 3

Dieses Dokument beschreibt den verbindlichen Produktumfang der geplanten
Windows-Begleit-App. Technische Entscheidungen stehen in den
[ADRs](adr/README.md), SDK- und Laufzeitfakten in der
[SDK-Referenz](msfs-sdk-reference.md), noch zu führende Laufzeitnachweise in
[open-tests.md](open-tests.md).

Status: **In Umsetzung — Transportdurchstich und Status-App sind in MSFS
bestätigt; als Nächstes folgen die Release Notes in der Companion-App und danach
der Audio-Nachweis mit einer Dummy-Datei.**

## Umsetzungsreihenfolge

Phase 3 wird in fünf aufeinander aufbauenden Ausbaustufen umgesetzt. Das sind
keine getrennten Produktphasen; der verbindliche Gesamtumfang und die
Abnahmekriterien weiter unten bleiben bestehen.

1. **Transportdurchstich:** Ein möglichst kleiner Konsolenclient verwendet das
   in [ADR 0004](adr/0004-stack-der-begleit-app.md) vorgesehene P/Invoke und
   weist ein selbst benanntes CommBus-Event in beide Richtungen zwischen
   SimConnect und EFB-App nach. Erst nach diesem Laufzeitnachweis wird die
   Oberfläche ausgebaut.
2. **Status-App:** Die Avalonia-App zeigt Simulatorverbindung und empfangenen
   EFB-Zustand getrennt. Eine aktive SimConnect-Verbindung allein gilt nicht als
   Nachweis, dass die EFB-App bereits ausgeführt wurde oder aktuell Nachrichten
   empfangen kann.
3. **Release Notes:** Ein Button `Release Notes` öffnet in der Companion-App
   eine lokal mitgelieferte, nach Versionen gegliederte Änderungshistorie. Jede
   Version zeigt ihr Veröffentlichungsdatum, stellt ihr Hauptmerkmal als kurzen
   Text voran und führt danach Features und Fehlerkorrekturen als knappe,
   innerhalb der Version nach Wichtigkeit sortierte Einzeiler auf.
4. **Audio-Nachweis:** Eine selbst erstellte Dummy-Audiodatei wird beim
   eindeutigen Übergang zur vollständig erledigten Checkliste genau einmal über
   das Windows-Standardgerät abgespielt. Die Wahl von Stimme und TTS-Anbieter
   ist dafür ausdrücklich keine Voraussetzung.
5. **Produktive Audioausgabe:** Gerätewahl und WASAPI Shared Mode werden mit dem
   VR-Audiogerät bestätigt. Erst danach werden Stimme, Anbieter und Klangprofile
   entschieden und die produktiven Sprachassets vorab gerendert.

Der Transport verwendet ein versioniertes Nachrichtenprotokoll. Ein
vollständiger Zustandssnapshot enthält mindestens Protokollversion, EFB-Version,
Sitzungs-ID, Flugzeugidentität, Checklisten-ID und -Revision, aktive Gruppe,
nächstes offenes Item, erledigte und gesamte Pflichtitems, Abschlusszustand und
eine monoton steigende Sequenznummer. Beim ersten Kontakt und nach einem
Reconnect wird ein vollständiger Snapshot übertragen; danach genügen
Zustandsänderungen. Bestätigung, Sitzungs-ID und Sequenznummer verhindern, dass
ein alter oder wiederholter Zustand einen Abschlussimpuls erneut auslöst.

Die erste Oberfläche unterscheidet mindestens:

- `Simulator: Connecting` mit gelbem oder `Connected` mit grünem Statuspunkt;
- `Checklist: Waiting for EFB` oder `State received`;
- Version der Begleit-App und die von der EFB-App gemeldete Version;
- Flugzeug, Checkliste, aktive Gruppe, nächstes offenes Item und
  Pflichtfortschritt als Anzahl und Prozentwert;
- Protokoll- oder Versionsinkompatibilitäten sowie Transportfehler.

## Funktionsumfang

- Die lokale Begleit-App zeigt Flugzeug, Checkliste, aktive Gruppe, nächstes
  offenes Item und Fortschritt als ruhige Oberfläche mit Tray-Icon und
  Einstellungsfenster, nicht als Logausgabe.
- Ein sichtbarer Button `Release Notes` öffnet die mit der App ausgelieferten
  Hinweise ohne Netzwerkzugriff. Die neueste Version steht zuerst. Eine eigene,
  app-lesbare und versionierte Release-Notes-Quelle ergänzt das englische
  `CHANGELOG.md`: Das Changelog bleibt vollständig und chronologisch, während
  die Release Notes für Nutzer redaktionell verdichtet und nach Wichtigkeit
  geordnet sind. Version und Datum müssen mit den Release-Metadaten
  übereinstimmen.
- Zustandsänderungen der EFB-App erscheinen ohne merkbare Verzögerung in der
  Begleit-App. Der Rückkanal überträgt nur Änderungen und ein eigenes Ereignis
  für den Übergang zur vollständig erledigten Checkliste.
- Der aktuelle Checklisteneintrag ist das nächste offene Item der im EFB
  sichtbaren Gruppe. Bei aktiviertem Sprachmodus wird er genau einmal
  vorgelesen, wenn er sich durch Abhaken, Wiederöffnen oder einen
  Gruppenwechsel tatsächlich ändert. Eine erneute Übertragung desselben
  Zustands, etwa nach einem Reconnect, wiederholt die Ansage nicht. Die erste
  Sprache ist Englisch; die Klangprofile sind `Clean`, `Intercom` und `Radio`.
  Weitere Sprachen sind nicht Teil dieses Meilensteins.
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
- Die Release Notes sind vollständig offline verfügbar, zeigen mindestens die
  ausgelieferten Companion-Versionen und ordnen innerhalb jeder Version zuerst
  das Hauptmerkmal, danach alle übrigen Features und Fehlerkorrekturen nach
  abnehmender Wichtigkeit.
- Beide Transportrichtungen arbeiten ereignisgesteuert und ratenbegrenzt; es
  entsteht kein Polling und keine messbare Belastung der MSFS-Framerate.
- Die Audioausgabe erreicht bei laufendem MSFS das gewählte Gerät, ohne MSFS
  stummzuschalten oder dessen Audiopuffer-Periode zu verkleinern.
- Ohne laufende Begleit-App verhält sich die EFB-App unverändert.
- Derselbe aktuelle Eintrag wird bei wiederholter Zustandsübertragung oder
  erneutem Verbindungsaufbau nicht ein zweites Mal angesagt.
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
