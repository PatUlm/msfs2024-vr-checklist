# Designentscheidungen

Dieses Dokument beschreibt die dauerhaft akzeptierte Produktsprache der VR
Checklist. Beobachtungen, noch nicht gelöste Abweichungen und die nächste
Iteration stehen separat in `design-qa.md`.

## Dichteprofile und Skalierung

- Alle Größen des Stylesheets stehen in `em` und folgen einer einzigen
  Root-Schriftgröße, die die App zur Laufzeit auf ihr Wurzelelement setzt.
  Ein globaler CSS-Transform wird nicht verwendet, damit Layoutbreiten und
  Interaktionsziele stabil bleiben.
- Die Root-Schriftgröße ist die kurze Seite der Layoutbox der App geteilt
  durch eine Profilkonstante, kontinuierlich und auf 0,1 px gerundet. Innerhalb
  eines Profils zeigt die App dadurch immer denselben Ausschnitt, unabhängig
  davon, ob das EFB montiert oder gelöst ist und welche EFB-Größe gewählt ist.
  Small/Medium/Large ändern nur die physische Größe, nie den Inhalt; die App
  wertet `efbSize` nicht aus. Mehr oder weniger sehen regelt der Benutzer über
  EFB-Größe und Distanz.
- Das VR-Profil zeigt 27,5 em Breite (Konstante 27,5; 17 px auf dem
  montierten Tablet mit 468 px Layoutbox). Das Nicht-VR-Profil zeigt 39 em
  (Konstante 39; 16 / 19,1 / 22,1 px auf dem gelösten Panel in Small / Medium
  / Large).
- Profilwahl: `E:IS IN VR` ergibt das VR-Profil. Ohne VR erhält eine Layoutbox
  mit kurzer Seite unter 546 px, also das montierte Tablet, ebenfalls das
  VR-Profil; das gelöste Panel erhält das Nicht-VR-Profil. Montiert gilt
  damit in beiden Modi die VR-Ansicht, „etwas mehr sehen“ nur gelöst außerhalb
  von VR.
- Die Dichte der Items ist in beiden Profilen gleich: 3 em Mindesthöhe für
  einfache Items, 2 em Checkbox, 2,47 em Navigationshöhe, 0,41 em Abstand
  zwischen Items. Condition, Alternative, Note oder Review-Inhalt dürfen das
  Item vertikal vergrößern. Im VR-Profil steht der Fortschrittsbalken unter
  dem Flugzeugnamen, im Nicht-VR-Profil daneben.
- Abgenommen am 2026-09-05 im H500C: VR montiert und schwebend Small / Medium
  / Large, Nicht-VR montiert und gelöst Small / Medium / Large, einschließlich
  der Schärfe dünner Rahmen bei rund 12,5 px Root-Schrift.
- Lesbarkeit und robuste Interaktion sind wichtiger als die maximale Anzahl
  gleichzeitig sichtbarer Items.

## Seiten- und Abschnittsaufbau

- Auf dem Bildschirm ist genau eine Checklistengruppe sichtbar.
- Der aktuelle Gruppenname ist visuell dominant. Gruppennummern werden nicht
  angezeigt: Die Checklisten sind immer fortlaufend, die Nummer trug keine
  zusätzliche Information und kostete Platz in den Navigationsbuttons.
- Oberhalb des Gruppennamens liegen zwei gleichwertige Navigationsbuttons mit
  jeweils 50 Prozent Breite. Die Reihenfolge lautet Navigation, Gruppenname,
  Item-Liste, damit die Überschrift direkt bei ihrer Checkliste steht. Die
  Buttons sind mit 2,47 em Mindesthöhe rund ein Drittel flacher als zuvor;
  ihre Schriftgröße bleibt erhalten.
  Sie zeigen ausschließlich den Namen der vorherigen beziehungsweise
  nächsten Gruppe; zusätzliche Texte wie `PREVIOUS` und `NEXT` sowie
  Richtungspfeile sind visuell redundant. Der Verzicht auf die Pfeile schafft
  Platz, der gerade in VR zählt, und lässt die Leiste ruhiger wirken. Die
  Richtung selbst ist nachrangig, weil die Gruppen fortlaufend sind; der
  vorherige Button steht links und der nächste rechts.
- Die Gruppennamen in den Navigationsbuttons verwenden dieselbe Schriftgröße
  wie die Texte der Checklist-Items und bleiben dadurch in VR gleich gut lesbar.
- Der Name steht mittig im Navigationsbutton, nicht an dessen Außenkanten. An
  den deaktivierten Listenenden bleiben die Platzhalter `Start` und `Complete`
  sichtbar.
- Ist eine Gruppe vollständig erledigt, steht vor ihrem Namen ein grüner Haken
  in der Erledigt-Farbe der Items, sowohl im Navigationsbutton als auch in der
  Gruppenüberschrift. Er markiert die Gruppe als abgeschlossenen
  Arbeitsschritt, bevor der Pilot sie öffnet, und bestätigt sie beim
  Zurückblättern. Der Haken wird wie der Item-Haken mit CSS gezeichnet, nicht als
  Font-Glyphe, damit er in Coherent GT nicht von der Glyphenabdeckung der
  Schrift abhängt. Er folgt derselben Regel wie der automatische Wechsel: Auch
  ein offenes `optional`-Item hält ihn zurück.
- Sind alle Items einer Gruppe erledigt, wechselt die App nach einer kurzen
  Bestätigungspause automatisch zur nächsten Gruppe. Auch ein offenes
  `optional`-Item hält den Wechsel auf: Es zu überspringen ist eine bewusste
  Entscheidung des Piloten, und die Gruppe darf ihm nicht vorher unter den
  Augen weglaufen.
- App-Header, Gruppenname und Navigation bleiben stehen; ausschließlich die
  Item-Liste scrollt. Das wird durch die Flex-Struktur und nicht durch
  `position: sticky` erreicht.
- Der Hintergrund hinter Gruppenname und Navigation ist transparent, damit der
  Bereich nicht wie eine zusätzliche schwere Leiste wirkt.
- Der Platz für die vertikale Scrollbar wird auch bei kurzen Gruppen dauerhaft
  reserviert. Navigation und Item-Liste behalten dadurch unabhängig vom
  Overflow dieselbe rechte Flucht.
- Der reservierte Scrollbarbereich liegt innerhalb des rechten Außenpaddings,
  nicht innerhalb der sichtbaren Itembreite. Navigation und Items haben dadurch
  links und rechts denselben sichtbaren Außenabstand.

## Aufbau eines Checklist-Items

- Die Hauptzeile besteht aus Challenge, gut sichtbarer gepunkteter Führung,
  Response und einer rechts ausgerichteten Checkbox auf gleicher Höhe.
- Die gesamte Item-Fläche ist das Interaktionsziel, einschließlich des Randes
  um die Checkbox.
- Der Default-Typ `action` erhält weder ein sichtbares Typ-Label noch einen
  farbigen linken Marker.
- `verify`, `communication` und `optional` bleiben sichtbar gekennzeichnet und
  erhalten einen semantischen linken Farbmarker.
- `optional` kennzeichnet ein Item, das übersprungen werden darf. Es ist der
  einzige Typ, der weniger statt mehr Aufmerksamkeit verlangt, und trägt daher
  ein gedämpftes Grau-Blau statt einer Signalfarbe.
- Ein `optional`-Item zählt nicht in die Fortschrittsanzeige. Der Balken misst
  die Pflichtarbeit, die 100 Prozent sind daher ohne die optionalen Items
  erreichbar. Abhaken und Speichern funktionieren wie bei jedem anderen Item.
- Das Typ-Label folgt der Cockpit-Sprache, nicht dem Datenfeld: `communication`
  wird als `ATC` angezeigt.
- Ein `communication`-Item trägt das zu bedienende Gerät in der Challenge:
  `COM: Ground`. Das Typ-Label `ATC` sagt, um welche Art Handlung es sich
  handelt, die Challenge sagt, was einzustellen ist. Beides steht
  nebeneinander, ohne sich zu wiederholen; die Wortwahl steht im
  [Style Guide](../checklists/data/style-guide.md).
- `Review required` ist ein neutraler Zusatzstatus und bekommt keine eigene
  Signalfarbe.
- Labels wie `Condition:` und `Note:` enden mit Doppelpunkt und haben dieselbe
  Schriftgröße wie der nachfolgende Text.

## Zustände und Rückmeldung

- Erledigte Items verwenden einen grünen Hintergrund und ein X in der
  Checkbox. Das X wird mit CSS-Linien gezeichnet, nicht als Font-Glyphe.
- Hover hebt ein Item durch einen helleren Hintergrund hervor, nicht durch eine
  weiße Umrandung. Textkontrast und Erledigt-Status müssen erhalten bleiben.
- Die Abschnittsnavigation soll dieselbe zurückhaltende, hintergrundbasierte
  Hover-Sprache verwenden.
- Beim Start beziehungsweise Laden eines neuen Fluges werden alle Items, der
  Fortschritt und die aktive Gruppe zurückgesetzt.
- Der Reset ist bewusst an das Laden des nächsten Fluges (`FltLoad`) gebunden
  und nicht an das Ende des vorherigen Fluges (`FlightEnd`). Wer das EFB nach
  dem Beenden eines Fluges im Menü öffnet, sieht deshalb noch den Zustand der
  letzten Session. Dieses Verhalten ist mit Release 0.1.6 in MSFS beobachtet
  und ausdrücklich akzeptiert: Der Fortschritt bleibt bis zum tatsächlichen
  Beginn des nächsten Fluges lesbar. Den Reset nicht ohne neue ausdrückliche
  Entscheidung auf `FlightEnd` vorziehen.
- Ein Wechsel zwischen VR und Nicht-VR ist kein neuer Flug und darf den
  Fortschritt nicht zurücksetzen.
- Der Fortschritt wird über den SDK-`DataStore` zwischen resident gehaltenen
  oder nacheinander aktiven EFB-Kontexten derselben Simulatorsitzung übergeben.
  Jedes Abhaken und jeder Abschnittswechsel schreibt den vollständigen
  Datensatz; ein neu erzeugter oder wieder aktivierter Kontext übernimmt den
  letzten kompatiblen Stand. Gleichzeitig schreibende Instanzen sind keine
  unbelegte Produktanforderung. Die Begründung steht in
  [`adr/0009-fortschritt-ueber-efb-kontextwechsel.md`](adr/0009-fortschritt-ueber-efb-kontextwechsel.md).
- Der Datensatz hat bewusst **keine Frist**. Er endet an fachlichen
  Bedingungen: `FltLoad` und der Ladezustand löschen ihn, Flugzeugidentität,
  Checklisten-ID und Checklistenrevision müssen übereinstimmen, und ein
  MSFS-Neustart wird an der Monotonie der Simulationszeit erkannt. Die
  frühere, auf 15 Sekunden begrenzte Einmal-Übergabe ist damit abgelöst: Sie
  war eine Notbremse aus der Zeit vor dem `FltLoad`-Reset und keine Eigenschaft
  des Darstellungswechsels.
- Ein MSFS-Neustart, ein neuer Flug, ein Ladezustand oder ein Flugzeugwechsel
  setzt den Fortschritt weiterhin immer zurück.

## Flugzeugauswahl und Leerzustand

- Die App wählt automatisch die zum aktuell geladenen Flugzeug oder
  Hubschrauber passende JSON-Checkliste.
- Die Zuordnung erfolgt über explizite, versionierte Match-Regeln für
  `ATC MODEL`, `ATC TYPE` und `TITLE`. Eine Regel darf pro Feld bewusst `equals`
  oder `contains` verwenden; mehrere Felder derselben Regel müssen gemeinsam
  passen. Es gibt keine implizite Teilstring-Heuristik und keine heimliche
  Default-Checkliste. Mehrdeutige Treffer führen ebenfalls in den Leerzustand.
- Die Auswahl wird primär ereignisgesteuert beim Öffnen der Ansicht und bei
  beobachteten Ladezustandswechseln aktualisiert. Solange die App sichtbar ist,
  prüft ein zusätzlicher Fallback die Identität nur alle zehn Sekunden. Damit
  wird ein Flugzeugwechsel auch erkannt, wenn die residente EFB-App kein
  zuverlässiges View- oder Ladezustandsereignis erhält.
- Ist keine Match-Regel zugeordnet, bleibt die App verfügbar und zeigt
  zentriert die Meldung `Keine Checkliste vorhanden`. Am unteren Rand steht eine
  einzelne, zentrierte und blasse Diagnosezeile `Model:`, gefolgt von
  `ATC MODEL`, `ATC TYPE` und `TITLE`. So kann eine neue Match-Regel anhand eines
  Screenshots oder Berichts ergänzt werden.
- Die Zuordnung greift auch schon in der Free-Flight-Konfiguration, bevor ein
  Flug gestartet ist. Mit Release 0.1.6 ist in MSFS bestätigt, dass ein dort
  vorgenommener Flugzeugwechsel die passende Checkliste im bereits geöffneten
  EFB nachzieht.
- Ein unbekanntes Modell darf niemals versehentlich die DA42-Checkliste laden.

## Laufzeitperformance

- Die App arbeitet event-first und führt keine eigene Logik pro Render-Frame
  aus.
- Periodische Arbeit ist nur als langsamer Sicherheitsmechanismus zulässig und
  wird beendet, sobald die App nicht sichtbar ist.
- Ein bequemeres Verhalten darf nicht unbemerkt zulasten der MSFS-Framerate
  gehen. Performance und FPS-Verträglichkeit sind explizite Qualitätskriterien.

## Fensterverhalten der Begleit-App

- `Escape` schließt das aktive Fenster `Checklists`, `Settings` oder
  `Release Notes` wie dessen
  `Close`-Button. Das Dashboard und die laufende Simulatorverbindung bleiben
  dabei geöffnet.
- Normales Minimieren reicht aus: Die App bleibt über die Windows-Taskleiste
  erreichbar; Simulatorverbindung und Audio laufen im Hintergrund weiter.
- Schließen beendet die App vollständig. Es gibt kein Verbergen im Tray.
- Ein Tray-Icon ist nicht vorgesehen. Die ursprünglich geplante Ergänzung
  entfällt auf Nutzerentscheidung vom 2026-09-19.

## Verbindungsstatus der Begleit-App

- Der Simulatorstatus kennt sichtbar nur `Connecting` und `Connected`.
  Fehlgeschlagene Verbindungsversuche bleiben `Connecting`, weil die App im
  Hintergrund weiter verbindet; ein Wechsel zu `Disconnected` oder `Error`
  zwischen den Versuchen erzeugt nur visuelle Unruhe.
- Auch der Detailtext bleibt während aller Verbindungsversuche unverändert bei
  `Waiting for MSFS 2024.`. Technisch gleichwertige Retry-Phasen bekommen keine
  wechselnden Formulierungen.
- Ein gelber Kreis kennzeichnet `Connecting`, ein grüner Kreis `Connected`.
  Der Text bleibt zusätzlich sichtbar, damit die Farbe nie allein den Zustand
  vermittelt.
- Der getrennte Checklistenstatus zeigt weiterhin, ob tatsächlich ein
  EFB-Snapshot empfangen wurde. Eine SimConnect-Verbindung allein reicht dafür
  nicht aus.
- Die Detailkarte endet nach der Fortschrittsanzeige auf Inhaltshöhe. Bei einem
  höheren Inhalt wächst das Fenster mit; eine flexible Restzeile erzeugt weder
  scheinbares Innenpadding noch einen leeren Bereich vor dem Footer.
- Meldet ein aktueller EFB-Snapshot keine passende Checkliste, erscheint unter
  dem Flugzeugnamen `Copy` mit Zwischenablage-Symbol. Der Button kopiert
  die unveränderten Werte als drei beschriftete Zeilen `ATC MODEL:`,
  `ATC TYPE:` und `TITLE:` und meldet kurz `Copied` im eigenen Label. Ohne
  Kennung, bei erkannter Checkliste, nach Verbindungswechseln oder einem
  Protokollfehler ist er ausgeblendet, bis wieder ein passender Snapshot vorliegt.

## Audioeinstellungen der Begleit-App

- Eine neu vollständig erledigte Gruppe löst einmal `Checklist completed`
  aus. Initial empfangene oder nach einem Reconnect bereits erledigte Gruppen
  lösen keine rückwirkende Abschlussansage aus. Wird ein Item wieder geöffnet
  und die Gruppe erneut abgeschlossen, ist eine neue Abschlussansage zulässig.
- Die EFB-App bleibt ohne Begleit-App vollständig bedienbar. Verbindungs- und
  Audiofehler dürfen ihren Ablauf nicht blockieren. Die Begleit-App arbeitet
  im Flug offline; Mikrofonaufnahme und Spracherkennung sind nicht Teil des
  Produkts.

- `Read checklist items` aktiviert das Vorlesen des aktuellen offenen Eintrags.
  Der Schalter ist standardmäßig an und wird gespeichert; eine explizit
  gespeicherte Off-Auswahl bleibt erhalten. Einschalten liest den
  bereits empfangenen aktuellen Eintrag; bei aktiviertem Start liest der erste
  passende Snapshot den aktuellen Eintrag. Ausschalten stoppt Itemansagen,
  während Gruppenabschluss und `Test sound` verfügbar bleiben.
- Ein neuer aktueller Eintrag ersetzt eine laufende Itemansage. Eine
  Abschlussansage läuft zu Ende; danach wird höchstens der neueste inzwischen
  aktuelle Eintrag gelesen. Es gibt keine Warteschlange veralteter Items.
  Wiederholte Snapshots und Reconnects lesen denselben Eintrag nicht erneut.
  Verbindungsverlust und Protokollfehler stoppen die Wiedergabe; ein neuer
  Flug oder Checklistenwechsel verwirft alte Ansagen.
- Itemansagen verwenden dieselbe Gerätewahl und denselben Radiofilter.
  Abweichende Checklistenrevisionen werden als Audiofehler gemeldet, statt
  möglicherweise falsche Texte vorzulesen. Die acht vorerst ausgelassenen
  A400M-Schritte unter `FSM Init` bleiben stumm.

- `Radio effect` schaltet den lokalen Radiofilter während der Wiedergabe ein
  oder aus; ausgeschaltet bleibt die Clean-Aufnahme unverändert. Der Schalter
  ist standardmäßig an, wird gespeichert und bleibt während `Test sound`
  bedienbar. Pro Ansage gibt es nur eine Datei. Intercom entfällt; siehe
  [ADR 0010](adr/0010-radioeffekt-bei-der-wiedergabe.md).
- `Settings` öffnet einen modalen Dialog über dem Dashboard. Die kurzen
  Einstellungen brauchen keine parallele Bedienung des Hauptfensters;
  Simulatorverbindung und Sprachausgabe laufen im Hintergrund weiter.
- `Audio output` bietet `Windows default` und die aktiven Windows-Ausgabegeräte.
  Die Auswahl wird sofort gespeichert und gilt ab der nächsten Ansage.
  `Test sound` steht ausschließlich im Settings-Dialog und spielt
  `Checklist completed` auf dieser Auswahl ab, ohne den Checklistenfortschritt
  zu ändern. Der Testton läuft unabhängig von Simulatorverbindung,
  Verbindungsversuchen, Flugwechseln und Gruppenabschlussereignissen zu Ende.
  Ein tatsächlicher Wiedergabeabbruch wird nicht als erfolgreicher Test gemeldet.
- `Windows default` steht immer zuerst. Danach folgen Geräte nach der letzten
  bewussten Auswahl, zuletzt gewählt zuerst; noch nie gewählte Geräte folgen
  alphabetisch. Die Reihenfolge bleibt über Neustarts und Gerätewechsel hinweg
  gespeichert. Der Wechsel auf `Windows default` erhält die Gerätehistorie.
  Die neue Reihenfolge erscheint beim nächsten Öffnen der Liste.
- Ein fehlendes Gerät bleibt mit dem Zusatz `(unavailable)` ausgewählt; es gibt
  keinen stillen Wechsel auf ein anderes Gerät. Die Geräteliste aktualisiert
  sich beim Öffnen und Aktivieren des Fensters sowie beim Öffnen des Dropdowns.
  Ein wieder verfügbares Gerät wird über seine gespeicherte ID erkannt.
- Speicher- und Wiedergabefehler erscheinen als Text im Settings-Dialog. Der
  Checklistenablauf bleibt unabhängig davon bedienbar.

## Release Notes der Begleit-App

- Die Companion-App bietet einen sichtbar benannten Button `Release Notes`.
- Die Ansicht ist vollständig offline und zeigt die neueste Version zuerst.
  Jede Version trägt neben ihrer SemVer-Version ausdrücklich das
  Veröffentlichungsdatum, damit das Alter des installierten Stands ohne externe
  Recherche erkennbar ist.
- Das wichtigste Merkmal einer Version darf als kurzer einleitender Text vor
  der Liste stehen. Danach folgen alle weiteren Features und Fehlerkorrekturen
  als knappe Bulletpoint-Einzeiler, innerhalb der Version nach abnehmender
  Wichtigkeit sortiert.
- Die Release Notes ersetzen das englische `CHANGELOG.md` nicht. Eine eigene,
  app-lesbare Quelle dient der kuratierten Darstellung in der Companion-App;
  das Changelog bleibt die vollständige chronologische Historie
  nutzerwirksamer Änderungen. Version und Datum dürfen zwischen beiden Quellen
  nicht auseinanderlaufen.
- Alle Buttons der Begleit-App behalten in Grund-, Hover- und Pressed-Zustand
  hellen Text auf einer dunkelblauen Fläche. Hover hellt die Fläche sichtbar
  auf; Fluent-Theme-Standardfarben dürfen den Textkontrast nicht überschreiben.
- Jeder Button trägt links neben seinem Text ein passendes Symbol (Liste mit
  Haken, Dokument, Zwischenablage, Kreuz). Die Symbole sind eigene, in der App
  abgelegte Geometrien; ein Icon-Font wird nicht vorausgesetzt. Das Symbol
  ersetzt den Text nicht.

## Checklistenansicht der Begleit-App

- Der Button `Checklists` öffnet ein eigenständiges, nicht modales Fenster.
  Das Dashboard bleibt bedienbar und aktualisiert sich weiter; ein erneuter
  Klick holt das offene Fenster nach vorn, statt ein zweites zu öffnen.
- Das Dropdown führt alle ausgelieferten Checklisten nach Titel sortiert. Beim
  Öffnen ist die auf dem Dashboard angezeigte Checkliste vorausgewählt; ohne
  passenden Snapshot die erste im Dropdown. Ein späterer Flugzeugwechsel
  ändert eine bereits offene Auswahl nicht.
- Der Inhalt wird direkt aus den Daten gerendert: eine Karte je Abschnitt,
  darin je Item Challenge, gepunktete Führungslinie, Response und ein Badge für
  `Verify`, `ATC` oder `Optional`; Bedingung, Alternativen, Notizen und
  Review-Hinweise stehen eingerückt darunter. Ein Markdown-Renderer wird nicht
  verwendet: Avalonia bringt keinen mit, und ein generisches Drittpaket brächte
  eine unsichere Avalonia-12-Kompatibilität ohne gestalterischen Gewinn.
- Neben der Gruppenüberschrift steht die Phase als nicht interaktiver,
  hellblauer Outline-Tag mit transparentem Hintergrund und abgerundeten Ecken.
  Der Gruppenname bleibt größer und heller. Der vollständige englische
  Phasenname bleibt einzeilig; bei Platzmangel bricht der gesamte Tag unter
  die Überschrift um. Alle Phasen verwenden dieselbe Farbe.
- Ein Button `Copy` mit dem üblichen Zwischenablage-Symbol legt die gewählte
  Checkliste als Markdown-artigen Text ab: `# Titel`, `## Abschnitt [Phase]`,
  `- [Verify] Challenge...Response`, darunter eingerückte Detailzeilen.
  Kopierter Text taugt damit direkt als Review-Vorlage. Der Button meldet
  `Copied` kurz im eigenen Label statt über einen Dialog. Textzeilen bleiben
  zusätzlich einzeln markierbar.
- Ein Button `PDF` mit Export-Symbol speichert die gewählte Checkliste über
  den nativen Speichern-Dialog als A4-PDF und öffnet die Datei anschließend
  mit dem Windows-Standard-PDF-Handler; ein bestimmter Viewer wird nicht
  erzwungen. Vorgeschlagener Dateiname ist `<Titel> Checklist – <Revision>.pdf`;
  das Wort `Checklist` kommt aus der App, weil der Titel laut Style Guide nur
  das Luftfahrzeug nennt.
- Das PDF folgt dem Layout der ODS-Quellblätter: zwei Spaltenpaare je Seite
  mit Challenge 5,5 cm und Response 3,5 cm, grau gefüllter Gruppenkopf mit
  weißer, horizontal und vertikal zentrierter Überschrift `Abschnitt [Phase]`
  (auch in Fortsetzungsköpfen), Rahmenlinien um
  jede Gruppe, Abschlusslinie unter dem letzten Item.
  Bedingung, Alternativen und Notizen stehen klein und kursiv unter dem Item;
  Review-Hinweise werden nicht gedruckt. Zeilen sind nach Kind eingefärbt:
  `verify` hellblau, `communication` violett, `optional` grau, `action` ohne
  Füllung. Gruppen fließen linke Spalte, rechte Spalte, nächste Seite und
  werden nur geteilt, wenn sie eine ganze Spalte überschreiten. Beschriftungen
  sind englisch.
- Das PDF verwendet ausschließlich die 14 PDF-Standardschriften (Helvetica,
  Helvetica-Bold, Helvetica-Oblique sowie Symbol für `≤`, `≥` und `→`) und
  bettet keine Schrift ein; eine Checkliste bleibt so bei wenigen Kilobyte.
  Ein Rendering über SkiaSharp wurde verworfen, weil dessen PDF-Backend
  Schriften vollständig einbettet und die Datei dadurch auf über 1 MB wächst.
  Der Writer ist ein bewusst kleiner eigener PDF-1.4-Schreiber ohne
  zusätzliche Abhängigkeit.

## Checklistensprache

- Komponenten- oder Triebwerksnummern sind Teil der Challenge; die Response
  enthält nur den geforderten Zustand oder die Aktion.
- Gemeinsam gemeinte Komponentenpaare werden einheitlich und kompakt als
  `[1+2]` geschrieben. Die eckigen Klammern markieren den Komponenten-Scope;
  runde Klammern bleiben erklärenden Zusätzen vorbehalten. Numerische
  Sollstellungen bleiben in der Response.
- Die vollständigen Schreibregeln stehen in
  [`../checklists/data/style-guide.md`](../checklists/data/style-guide.md).

## Sequenzielle Eingabe

- Ein Tastendruck oder HOTAS-Knopf bestätigt das **nächste offene Item der
  gerade angezeigten Gruppe**. Ist sie bereits vollständig, bleibt der Druck
  wirkungslos — die Eingabe greift nie in eine Gruppe, die der Pilot nicht vor
  Augen hat. Wird ein Item das letzte offene seiner Gruppe, greift danach der
  bestehende automatische Wechsel in die nächste.
- Welches Item das nächste offene ist, entscheidet ausschließlich die EFB-App.
  Ein externer Auslöser trägt keinen Item-Index.
- Der Auslöser ist ein abgefangenes Sim-Key-Event, das der Nutzer selbst in den
  MSFS-Steuerungen belegt. Welches und warum steht in
  [`adr/0002-bestaetigungseingabe-in-sim-key-interception.md`](adr/0002-bestaetigungseingabe-in-sim-key-interception.md),
  der Phasenzuschnitt in
  [`adr/0005-phase-2-auf-die-efb-app-verkuerzen.md`](adr/0005-phase-2-auf-die-efb-app-verkuerzen.md).
- **Die Wahl des Events ist bewusst nicht konfigurierbar**, solange das Paket
  privat bleibt. Sie wird es, sobald es an Fremde geht: Ein für unsere Flotte
  folgenloses Event kann in einer anderen ein reales System bedienen.
- Die App enthält keine wirkungslosen Eingabe-Listener und pollt nicht auf
  Eingaben.

## Versionsanzeige

- Die App-Version steht sehr klein und blass am unteren rechten Rand, ohne die
  Checkliste visuell zu stören.
- Die Root-Datei `VERSION` ist die kanonische Quelle für eine gemeinsame
  SemVer-Version `MAJOR.MINOR.PATCH`. Ein Release zeigt diesen Wert in der App,
  im MSFS-Manifest und als Namen des lokalen Release-Artefakts identisch an.
- Entwicklungsbuilds ergänzen die aktuelle Projektversion automatisch um
  `-dev.YYYYMMDDHHMMSS` in UTC. Dadurch bleiben sie eindeutig und lassen sich
  klar von einem Release unterscheiden.
- Neue Produktstände erhöhen `VERSION` bewusst nach SemVer. Ein separates
  CalVer-Schema wird nicht parallel gepflegt, weil MSFS in My Library ohnehin
  die dreiteilige Manifest-Version anzeigt.

## App-Icon und Release-Branding

- Das EFB-App-Icon verwendet eine reduzierte Zwischenablage mit drei blauen
  Häkchen, grauen Item-Linien und einer weißen Außenkontur auf transparentem
  Hintergrund. Alle konturbasierten SVG-Pfade deklarieren `fill="none"`
  ausdrücklich, weil Coherent GT die vererbte SVG-Füllung nicht zuverlässig
  respektiert.
- Die grauen Item-Linien stehen links und die blauen Häkchen mit sichtbarem
  Abstand rechts. Diese Leserichtung entspricht dem Aufbau der Checklist-Zeilen
  mit der Bestätigung am rechten Rand.
- Die kräftigen Formen bleiben im kleinen 26 × 27-Pixel-Raster und in VR
  eindeutig lesbar. Die aktuelle links/rechts angeordnete Komposition sowie
  Normal-, Hover- und Selected-Darstellung sind einschließlich der korrigierten
  Transparenz akzeptiert.
- Das 360 × 240 Pixel große My-Library-Thumbnail verwendet dieselbe dunkle
  Oberfläche, Akzentfarbe und Bildmarke wie die App. Unter der zentrierten
  Bildmarke steht der Produktname `VR Checklist`; ein Versionswert wird nicht
  in das Bild eingebettet.
- Die Windows-Begleit-App verwendet dieselbe Bildmarke als EXE- und
  Fenster-Icon. Weil Windows Icons auch auf hellen Flächen zeigt, liegt die
  Marke dort auf einer abgerundeten Kachel in der dunklen Thumbnail-Oberfläche
  statt auf transparentem Hintergrund.
- Die editierbaren Branding-Quellen liegen dauerhaft unter
  `assets/branding/`. App-Build und MSFS-Staging beziehen ihre Ausgaben aus
  diesem gemeinsamen Ursprung.

## Referenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png) ist
  die historische Layoutreferenz für die kompakte Hauptzeile. Ihr blauer linker
  Action-Marker wurde durch eine spätere Entscheidung verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png) hält die
  inzwischen behobene rechte Fehlflucht der Abschnittsnavigation fest.
