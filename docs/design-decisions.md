# Designentscheidungen

Hier stehen bewusst gewählte Produktregeln, die bei einer Überarbeitung
sonst verloren gehen könnten. Keine Abnahmechronik, CSS-Abschrift oder
vollständige Aufzählung aller UI-Zustände. Maße und technische Details stehen
im Code; MSFS-Besonderheiten in [msfs-sdk-reference.md](msfs-sdk-reference.md),
offene Sichtprüfungen in [design-qa.md](design-qa.md).

## EFB: Lesbarkeit und Aufbau

- VR-Lesbarkeit und große Interaktionsziele gehen vor Informationsdichte.
  Größen folgen der Root-Schriftgröße und der eigenen Layoutbox, ohne globalen
  CSS-Transform. Montiert wird immer das VR-Dichteprofil verwendet; außerhalb
  von VR zeigt das gelöste Panel mehr Inhalt. Small/Medium/Large verändert
  innerhalb eines Profils die physische Größe, nicht den sichtbaren Ausschnitt.
- Genau eine Gruppe ist sichtbar. Reihenfolge: App-Header, Navigation,
  Gruppenüberschrift, Items. Nur die Item-Liste scrollt. Ihr Scrollbarplatz
  bleibt reserviert; Navigation und Items behalten dieselbe sichtbare Flucht.
- Zwei gleich breite Navigationsbuttons zeigen mittig nur die benachbarten
  Gruppennamen, ohne Nummern, Richtungspfeile oder Previous/Next-Zusätze.
  Ihre Schrift ist so groß wie Itemtext; Listenenden heißen `Start` und `Complete`.
- Der Gruppenname dominiert. Die Phase steht kleiner als hellblauer,
  abgerundeter Outline-Tag rechts daneben, ohne eigene Interaktion.
  Bei Platzmangel bricht der ganze Tag um; alle Phasen haben dieselbe Farbe.
- Der separate `Skip phase`-Button trägt ein Kapitel-Skip-Symbol und Tooltip.
  Er bleibt mit dem Phasen-Tag zusammen und hat dieselbe Hover-Sprache wie die
  Navigation. Gruppenüberschrift und Navigation haben transparenten Hintergrund.
- Die Version steht klein und blass unten rechts. Das Versionsformat regelt
  [release.md](release.md).

## Items und Fortschritt

- Hauptzeile: Challenge, gepunktete Führung, Response, Checkbox rechts.
  Die ganze Zeile einschließlich des Checkbox-Randes ist anklickbar.
- `action` hat kein Typ-Label und keinen linken Farbmarker. `verify`,
  `communication` und `optional` erhalten Label und Farbmarker;
  `communication` heißt sichtbar `ATC`, `optional` ist gedämpft grau-blau.
- Optionale Items zählen nicht im Pflichtfortschritt. Gruppen-Haken und
  automatischer Gruppenwechsel erfordern trotzdem **alle** Items: Der Pilot
  entscheidet selbst über ein Überspringen.
- Erledigte Items sind grün und tragen ein X in der Checkbox. Vollständige
  Gruppen tragen einen grünen Haken vor ihrem Namen in Überschrift und
  Navigation. Bedeutungsvolle Symbole werden als CSS-Geometrie oder Asset
  gezeichnet, nicht aus ungesicherter Font-Abdeckung übernommen.
- Hover hellt den Hintergrund auf; keine weiße Umrandung. Kontrast und
  Erledigt-Zustand bleiben erkennbar.
- `Review required` ist neutral, ohne zusätzliche Signalfarbe. Detail-Labels
  wie `Condition:` und `Note:` haben einen Doppelpunkt und dieselbe Textgröße
  wie ihr Inhalt. Schreibweisen stehen ausschließlich im
  [Style Guide](../checklists/data/style-guide.md).

## Navigation, Eingabe und Reset

- Nach dem letzten offenen Item folgt nach kurzer Bestätigungspause die nächste
  Gruppe. Taste/HOTAS bestätigt nur das nächste offene Item der **angezeigten**
  Gruppe, nur bei sichtbarer App. Eine vollständige Gruppe bleibt dabei unverändert.
- `Skip phase` erledigt alle offenen Items des zusammenhängenden Phasenblocks,
  einschließlich optionaler Items und früherer Gruppen derselben Phase.
  Es öffnet die erste Gruppe des nächsten Blocks am Listenanfang; deren
  Fortschritt bleibt erhalten. In der letzten Phase bleibt die letzte Gruppe
  sichtbar. Sind dort alle Items erledigt, ist Skip deaktiviert, bis eines
  wieder geöffnet wird. Der Companion erhält nur den Endzustand: einmaliger
  Abschluss, danach gegebenenfalls das nächste offene Item.
- Ein neuer Flug setzt Fortschritt und aktive Gruppe beim **Laden** zurück,
  nicht bei `FlightEnd`. Im Menü darf der letzte Stand noch sichtbar sein.
  Flugzeugwechsel und Simulatorneustart setzen ebenfalls zurück; VR-Wechsel
  und Pause nicht. Kontextübergabe ohne Timeout gemäß
  [ADR 0009](adr/0009-fortschritt-ueber-efb-kontextwechsel.md).
- Die App wählt automatisch über explizite Flugzeugregeln, auch in der
  Free-Flight-Konfiguration. Fehlende oder mehrdeutige Treffer zeigen
  `Keine Checkliste vorhanden` und eine dezente Diagnosezeile mit
  `ATC MODEL`, `ATC TYPE`, `TITLE`; keine Default-Checkliste.
- Die Eventwahl regelt
  [ADR 0011](adr/0011-bestaetigungsaktionen-im-companion.md).

## Companion: Fenster und Status

- Minimieren lässt Verbindung und Audio weiterlaufen; Schließen beendet die
  App. Kein Tray-Icon. `Escape` schließt das aktive Nebenfenster, nicht das Dashboard.
- `Settings` steht oben rechts neben `Release Notes` und ist modal; `Checklists` ein einzelnes nicht modales Fenster, das
  bei erneutem Öffnen nach vorn kommt. Verbindung und Audio laufen weiter.
- Settings-Bereiche folgen der Reihenfolge Überschrift, Erklärung, Bedienelement.
  Audio steht vor `EFB Keybindings`. Ein Schalter wie bei Audio
  aktiviert die Bestätigung; das Dropdown steht rechts daneben. Bei Aus
  bleibt die Auswahl erhalten und das Dropdown ist gesperrt und ausgegraut.
  Die Einstellung ist offline bearbeitbar. Der Companion speichert den Wunsch
  lokal; Text meldet ausstehende Übertragung oder Fehler und entfällt nach
  bestätigter EFB-Übernahme. Speicherung und Eventwahl gemäß
  [ADR 0011](adr/0011-bestaetigungsaktionen-im-companion.md).
- Verbindungsversuche zeigen ruhig `Connecting` und `Waiting for MSFS 2024.`,
  eine Verbindung `Connected`. Gelb/Grün ergänzt den sichtbaren Text.
  Der EFB-Status bleibt separat: SimConnect allein bedeutet keinen Snapshot.
  Tatsächliche Fehler wie eine fehlende DLL bleiben als Fehler erkennbar.
- Die aktive Phase erscheint neben `Active Group` im gleichen Tag-Stil wie
  im EFB; ohne Phase bleibt der Tag verborgen. Die Detailkarte und das Fenster
  folgen der Inhaltshöhe, ohne künstliche Leerfläche unter dem Fortschritt.
- Bei unbekanntem Flugzeug kopiert `Copy` die unveränderten drei Diagnosewerte
  als beschriftete Zeilen. Der Button erscheint nur bei passendem aktuellem
  Snapshot; Erfolg wird kurz als `Copied` im Button gemeldet.
- Buttons haben hellen Text auf dunkelblauer Fläche, sichtbares Hover und ein
  eigenes Symbol links vom Text. Theme-Standardfarben dürfen den Kontrast
  nicht überschreiben; Symbole ersetzen keinen Text.

## Companion: Audio

- EFB-Bedienung bleibt unabhängig von Verbindung und Audio. Keine
  Mikrofonaufnahme, Spracherkennung oder Online-TTS im Flug.
- `Read checklist items` und `Radio effect` sind standardmäßig an und werden
  gespeichert. Bewusst gespeichertes Aus bleibt erhalten.
- Itemansagen lesen den aktuellen offenen Eintrag, auch nach Einschalten oder
  dem ersten passenden Snapshot. Neue Items ersetzen alte Ansagen; keine
  Warteschlange. Wiederholte Snapshots, Reconnects und VR-Wechsel wiederholen
  dasselbe Item nicht. Ein neuer Flug oder Checklistenwechsel verwirft alte Ansagen;
  Verbindungsverlust und Protokollfehler stoppen die Wiedergabe.
- Das erste Item jeder Gruppe beginnt mit `<Gruppenname> Checklist.` und
  einer natürlichen kurzen Satzpause. Das gilt auch beim erneuten Vorlesen
  dieses Items; beim Fortsetzen mit einem späteren Item entfällt der Gruppenname.
- Eine neu vollständig erledigte Gruppe sagt einmal `Checklist completed`.
  Bereits erledigte Gruppen beim Start/Reconnect werden nicht nachträglich
  angesagt. Nach Wiederöffnen und erneutem Abschluss darf sie erneut sprechen.
  Die Abschlussansage endet vor dem inzwischen neuesten Item.
- Abschalten der Itemansagen lässt Gruppenabschluss und `Test sound` verfügbar.
  Eine abweichende Checklistenrevision meldet einen Audiofehler, statt falschen
  Text zu lesen.
- `Radio effect` wirkt live auf dieselbe Clean-Aufnahme; Aus spielt sie
  unverändert. Keine Intercom-Variante, siehe
  [ADR 0010](adr/0010-radioeffekt-bei-der-wiedergabe.md).
- `Audio output` speichert die Auswahl sofort und verwendet sie ab der nächsten
  Ansage. `Windows default` steht zuerst, danach zuletzt gewählte Geräte,
  übrige alphabetisch. Die gespeicherte Reihenfolge erscheint beim nächsten
  Öffnen der Liste; Windows default löscht die Gerätehistorie nicht.
- Fehlende Geräte bleiben mit `(unavailable)` ausgewählt, ohne stillen Ersatz.
  Die Liste aktualisiert sich beim Öffnen/Aktivieren des Fensters und Dropdowns;
  zurückkehrende Geräte werden an ihrer ID erkannt.
- `Test sound` steht nur in Settings, spielt den Abschluss auf dem gewählten
  Ausgang und ändert keinen Fortschritt. Er läuft unabhängig von
  Simulatorverbindung und Checklistenevents zu Ende. Abbrüche, Speicher- und
  Wiedergabefehler werden als Text gemeldet.

## Companion: Checklisten und Export

- Die sortierte Liste enthält alle ausgelieferten Checklisten. Beim Öffnen
  wird die aktuelle, sonst die erste ausgewählt. Spätere Flugzeugwechsel
  ändern eine bereits offene Auswahl nicht.
- Pro Gruppe eine Karte aus den kanonischen Daten, mit Phase und den gleichen
  Itembestandteilen wie im EFB. Keine zweite redaktionelle Datenquelle.
- `Copy` liefert Markdown-artigen Text mit Titel, Gruppe/Phase und Itemdetails;
  Rückmeldung direkt als `Copied`. Texte bleiben einzeln markierbar.
- `PDF` nutzt den nativen Speicherdialog, schlägt
  `<Titel> Checklist – <Revision>.pdf` vor und öffnet den Standard-PDF-Viewer.
  A4, zwei Spaltenpaare, grau gefüllte Gruppenköpfe mit weißer zentrierter
  Überschrift samt Phase, Rahmen und Abschlusslinien. Gruppen bleiben zusammen,
  solange sie in eine Spalte passen, sonst mit Fortsetzungskopf.
  Verify-Zeilen sind hellblau, ATC violett, Optional grau; Action ohne Füllung.
  Details klein und kursiv, Review-Hinweise werden nicht gedruckt.
- PDFs bleiben klein und ohne eingebettete Schriften; der eigene Writer nutzt
  PDF-Standardschriften. Kein Renderingpfad, der vollständige Fonts einbettet.
- `Release Notes` ist offline, neueste Version zuerst, mit Datum, optionalem
  Hauptmerkmal und knappen Einzeilern nach Wichtigkeit. Redaktionelle Regeln
  und Abgleich zum Changelog stehen in [AGENTS.md](../AGENTS.md).

## Branding und Markup

- Gemeinsame Marke: Zwischenablage, graue Linien links, blaue Haken rechts,
  weiße Außenkontur. Im EFB transparent, unter Windows auf dunkler runder Kachel.
  Das My-Library-Thumbnail zeigt zusätzlich `VR Checklist`, keine Version.
  Quellen und Bildformate: [Branding](../assets/branding/README.md).
- Das eigene EFB-Markup enthält auf Nutzerentscheidung keine `aria-*`-Attribute
  oder ARIA-Rollen. Darstellung, Bedienung, SDK-Referenzen und erklärende
  Tooltips bleiben; unbenutzte IDs und SEO-Metadaten entfallen. Diese Vorgabe
  betrifft nicht die versionierten SDK-Vorlagen.
