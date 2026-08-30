# MSFS-2024-SDK: Lessons learned

Dieses Dokument ist die einzige technische Referenz für überraschendes oder
fehleranfälliges Verhalten des MSFS-2024-SDK, der EFB-API und von Coherent GT
in diesem Projekt. Es beschreibt nur Erkenntnisse, die eine künftige
Implementierung beeinflussen oder einen wahrscheinlich wiederholten Fehler
verhindern. Normales SDK-Verhalten und aus dem Anwendungscode ersichtliche
Details werden nicht wiederholt.

Produktentscheidungen stehen in [`design-decisions.md`](design-decisions.md)
und den [ADRs](adr/README.md), offene Laufzeitnachweise ausschließlich in
[`open-tests.md`](open-tests.md). Das frühere ausführliche Recherchedokument ist
ein [historischer Überblick](phase-2-3-research.md), keine zweite Referenz.

Marker werden nur verwendet, wenn die Herkunft für die spätere Bewertung
wichtig ist:

- **[RT]** im Custom-EFB-Kontext dieses Projekts in MSFS reproduziert;
- **[SDK]** im installierten SDK, einem offiziellen Sample oder der offiziellen
  Dokumentation belegt;
- **[NEG]** naheliegender, aber nachweislich ungeeigneter Weg, der nicht ohne
  neuen Beleg erneut versucht werden soll.

## Geltungsbereich

Die Laufzeitnachweise wurden mit MSFS 2024 SDK `1.7.3`, EFB Template Sample
`1.7.3`, `@efb/efb-api` `1.0.3`, `@microsoft/msfs-sdk` `2.1.1` und
`@microsoft/msfs-types` `1.14.6` geführt. Nach einem SDK-Update sind nur die
davon betroffenen Lessons neu zu bewerten, nicht die gesamte Recherche zu
wiederholen.

## Paketierung und Testiteration

- **[RT]** Eine im DevMode gebaute Version desselben Pakets hat im VFS Vorrang
  vor der installierten Community-Version. Das Community-Paket muss für
  Entwicklungsiterationen nicht deaktiviert werden.
- **[RT]** Coherent kann nach einem normalen Reload weiterhin alte Assets
  verwenden. Nach jedem neuen Build ist im Coherent Debugger **Ignore Cache +
  Reload** erforderlich.
- **[RT]** Reine UI-Änderungen brauchen weder einen Simulatorneustart noch
  einen neuen Flug. Lifecycle- und Reset-Verhalten müssen dagegen mit einem
  neuen Flug geprüft werden.
- **[SDK]/[RT]** Community-My-Library-Bilder müssen 360 × 240 Pixel groß sein;
  andere Seitenverhältnisse werden beschnitten. Titel, Hersteller und Version
  kommen aus den Paketmetadaten und gehören nicht in das Bild.
- **[RT]** `fspackagetool.exe -mirroring` entfernt veraltete Dateien eines
  früheren Builds. Jede ausgelieferte Datei muss zugleich in `layout.json`
  stehen; fehlende oder zusätzliche Dateien machen das Paket unvollständig.

## EFB-App-Lifecycle und geteilter Zustand

- **[RT]** Eine EFB-App kann einen Flugwechsel resident überleben, ohne dass
  `onResume()` erneut aufgerufen wird. Ein View- oder Game-State-Übergang allein
  ist deshalb kein verlässliches Signal für einen neuen Flug.
- **[RT]** Beim Wechsel zwischen VR und Nicht-VR kann MSFS den EFB-App-Kontext
  neu erzeugen; reiner In-Memory-Zustand geht dann verloren. Ob zeitweise eine
  oder mehrere Instanzen leben, darf für die Korrektheit keine Rolle spielen.
- **[RT]** Der SDK-`DataStore` überlebt sowohl die Neuerzeugung des
  EFB-Kontexts als auch einen zeitnahen vollständigen Simulatorneustart.
  **DON'T:** Ihn als flüchtigen Sitzungsspeicher behandeln oder seine
  Lebensdauer mit einem Timeout nachbilden.
- **DO:** Fachlichen Zustand instanzunabhängig führen und an explizite
  Reset-Bedingungen binden. Die Produktentscheidung für den
  Checklistenfortschritt steht in
  [ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md).
- **[RT]** `E:IS IN VR` ist die verlässliche Quelle für den Darstellungsmodus.
  Ein VR-Wechsel ist kein neuer Flug und sendet kein `FltLoad`; er darf den
  Fortschritt nicht zurücksetzen.

## Flug-Lifecycle und Reset

- **[SDK]/[RT]** Die globale Flow API erreicht die EFB über
  `RegisterViewListener("JS_LISTENER_COMM_BUS")` und das Event `__FLOW_API__`.
  Die Payload ist ein JSON-String mit numerischer Event-ID und optionalem
  `flt_path`.
- **[RT]** Ein neuer Free Flight erzeugt mehrere Ladefolgen. Beobachtet wurden
  unter anderem `FltLoad`/`FltLoaded` für `apron.flt` und `CustomFlight.FLT`,
  danach `FlightStart` sowie eine weitere Ladefolge mit `RTCStart`/`RTCEnd`.
  **DO:** Reset-Logik an `FltLoad` binden und idempotent ausführen.
- **[RT]** Beim Wechsel in einen neuen Flug kann `GameStateProvider`
  durchgehend `ingame` bleiben. ESC → Settings → Save → Resume sendet dagegen
  kein `FltLoad` und behält den Fortschritt.
- **[NEG]** `GameModeManager.isInMenu` unterscheidet einen Flugwechsel nicht
  vom Öffnen des Config-Menüs. `GameStateProvider` allein übersieht
  Flugwechsel, bei denen der Zustand `ingame` bleibt. Keiner der beiden Wege
  darf allein den Reset steuern.
- **DON'T:** Den Reset auf `FlightEnd` vorziehen. Der Fortschritt soll gemäß
  [`design-decisions.md`](design-decisions.md) bis zum Laden des nächsten
  Fluges sichtbar bleiben.

## SimVars und Persistenz

- **[RT]** Flugzeugidentitäten aus `ATC MODEL`, `ATC TYPE` und `TITLE` können
  Lokalisierungs-Tokens und Sonderzeichen enthalten. Sie müssen vor dem
  Vergleich normalisiert werden. Bei gestreamten Asobo-Paketen können die
  zugrunde liegenden `aircraft.cfg`-Werte in geschützten `fsarchive`-Dateien
  liegen; neue Match-Regeln werden daher aus den tatsächlich angezeigten
  SimVar-Werten abgeleitet. Das Datenformat steht in
  [`../checklists/data/README.md`](../checklists/data/README.md).
- **[RT]** `E:SIMULATION TIME` zählt nur aktive Simulationszeit und steht bei
  einer Pause still. Innerhalb einer Sitzung steigt der Wert monoton und
  beginnt nach einem Neustart wieder bei null.
- **[NEG]** Aus `Date.now() - E:SIMULATION TIME` keinen Sitzungsstart ableiten.
  Jede Pause verschiebt diesen Zeitpunkt und kann dadurch gültigen Zustand
  verwerfen. Für eine Neustarterkennung darf nur die Monotonie des Rohwerts
  verwendet werden.
- **DON'T:** String-SimVars pro Frame lesen. Ereignisgesteuerte Auswertung mit
  einem langsamen, bei unsichtbarer App gestoppten Fallback genügt.

## Sim-Key-Events in einer Custom-EFB-App

Der verwendete Mechanismus besteht aus
`RegisterViewListener("JS_LISTENER_KEYEVENT")`,
`Coherent.call("INTERCEPT_KEY_EVENT", …)` und dem Event `keyIntercepted`.

- **[RT]** Der Mechanismus funktioniert in einer sichtbaren Custom-EFB-App mit
  Tastatur und HOTAS. Er liefert nur das Sim-Key-Event, nicht die physische
  Taste oder den Knopf.
- **[SDK]/[RT]** Für einen Intercept gibt es keinen nutzbaren
  Unregister-Aufruf, und die Zustellung kann nach einer Flugladefolge trotzdem
  verstummen. **DO:** Ausschließlich mit `passThrough = true` abfangen, jeden
  `FltLoad` als mögliche Invalidierung behandeln und erst nach dem
  abschließenden `RTCEnd` beziehungsweise dem Ende eines beobachteten
  `GameState.loading` neu registrieren. Das erste `FltLoaded` ist zu früh.
- **[RT]** Ein einzelner Druck kann bei nur einer Registrierung mehrfach in
  wenigen Millisekunden zugestellt werden. Weitere Registrierungen addieren
  zusätzliche Zustellungen; Reloads und Kontextwechsel können erneut
  registrieren. **DO:** sparsam registrieren und unabhängig davon entprellen.
- **[RT]** Das Event wird auch bei geschlossener EFB zugestellt. **DO:** Die
  Produktlogik gegen den Sichtbarkeitszustand der `AppView` absichern.
- **[RT]** Der Anzeigename in den MSFS-Steuerungen kann vom Eventnamen
  abweichen; für `LEAD_POLE_ON` lautet er `LEAD POLE ON`. Vor einem Eingabetest
  muss die Action belegt und nicht doppelt belegt sein. MSFS kann mehrere
  Eingabeprofile desselben Geräts gleichzeitig kombinieren.
- **[RT]** `PLASMA_OFF` wird in G36, DA42, H125 und MH-60 als `SET PLASMA OFF`
  angeboten und nach der jeweiligen Flugladefolge im EFB-JavaScript zugestellt.
  Die beobachtete doppelte Zustellung eines Drucks entspricht der allgemeinen
  Mehrfachzustellung und braucht neben der bestehenden Entprellung keinen
  Sonderpfad.
- **[NEG]** Ein laut Dokumentation unbenutztes Event ist kein guter
  konfliktfreier Auslöser: `AUTOCOORD_ON` wurde trotz Belegung nicht erzeugt.
  Ein Auslöser muss real implementiert, im aktuellen Input-Kontext aktiv und
  auf dem geflogenen Flugzeug folgenlos sein.
- **[NEG]** `LEAD POLE ON` ist in den Steuerungen von MH-60 und H125 nicht
  verfügbar. Das Steuerungsmenü zeigt nur Actions der geladenen
  Flugzeugkategorie. Ein flottenweiter Auslöser muss deshalb nicht nur folgenlos,
  sondern in jeder benötigten Kategorie belegbar sein; siehe
  [ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
- **[SDK]** Das Input-Profile-System belegt keinen Weg, aus einem reinen
  EFB-Paket eine neue globale Controls-Action anzumelden. Das EFB-Sample aus
  SDK 1.7.3 kopiert nur die gebaute App in `html_ui/efb_ui/efb_apps`; das
  InputProfiles-Sample ordnet bereits vorhandene Actions konkreten Geräten und
  Kategorien zu. Eigene Actions werden in der offiziellen Dokumentation nur
  für Aircraft Specific Input Profiles aus Model-Behavior-Input-Events eines
  Flugzeugknotens in eine ActionDB übernommen. Auch die DevSupport-Antworten
  vom Juli 2026 behandeln ausschließlich diesen flugzeuggebundenen Weg.
  **DON'T:** Ein transversales oder kategorieweises Input-Profil als
  Registrierung einer neuen EFB-Action behandeln. Der flottenweite EFB-Fall
  bleibt ohne zugesagten SDK-Vertrag; siehe [ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
- **[NEG]** Die EFB-Aktion `VALIDATE` ist über DOM-`keydown`,
  `InputStackListener` und `routeGamepadInteractionEvent` nicht als frei
  belegbarer Eingang erreichbar. Alle `KEY_EFB_*`-Actions tragen im SDK das Tag
  `norebind_kbmpad`.
- **[NEG]** `SimConnect_TransmitClientEvent`, `trigger_key_event` und
  `execute_calculator_code` erreichen die JS-Interception nicht. Key-Events
  sind daher kein Transportweg von einer externen App zur EFB.

## CommBus und externe Begleit-App

- **[SDK]** Seit SDK 1.6.4 kann ein externer SimConnect-Client den CommBus
  verwenden. Das SDK enthält die Funktionen
  `SimConnect_CallCommBusEvent`, `SimConnect_SubscribeToCommBusEvent` und
  `SimConnect_UnsubscribeFromCommBusEvent` sowie ein bidirektionales Sample.
- **[RT]** Ein externer .NET-10-Client mit eigenem P/Invoke erreicht die
  geöffnete Custom-EFB-App über ein selbst benanntes CommBus-Event; die EFB-App
  kann auf einem zweiten Event an denselben SimConnect-Client antworten. Der
  bidirektionale Ping/Pong-Durchstich wurde mit EFB-Entwicklungsstand
  `0.2.4-dev.20260829151430` bestätigt.
- **[SDK]** Nachrichten in Richtung SimConnect-Client können über
  `dwEntryNumber`/`dwOutOf` gechunkt eintreffen; die Client-Seite muss sie
  zusammensetzen.
- **[SDK]** In Pausezuständen, die JavaScript anhalten, laufen SimConnect und
  WASM weiter. Events an JavaScript werden dann aufgestaut und erst beim
  Fortsetzen verarbeitet; bei zu großem Stau kann der Simulator einfrieren.
  **DO:** Nur Zustandsänderungen senden und den Kanal ratenbegrenzen.
- **[RT]** Der im Test verwendete Ingame-Pausezustand hält zwar das Flugzeug
  an, lässt den Custom-EFB-JavaScript-Kontext aber weiterlaufen: Die Checkliste
  blieb vollständig bedienbar, ein EFB-Timer lief weiter und eine während der
  Pause neu gestartete Begleit-App erhielt ihren aktuellen Snapshot ohne
  Rückstau. Der SDK-Hinweis gilt damit nicht pauschal für jede sichtbare
  Ingame-Pause. **DON'T:** Aus einem angehaltenen Flugzeug auf angehaltenes
  EFB-JavaScript schließen.
- **[SDK]** Die verwendeten TypeScript-Pakete deklarieren die CommBus-API nicht.
  Die EFB-Seite braucht deshalb eine kleine eigene Ambient-Deklaration. Der
  JavaScript-Helper ist außerdem nicht implizit verfügbar: Beide offiziellen
  CommBus-/Flow-Samples laden zuerst `/JS/Services/CommBus.js` und registrieren
  den Listener erst danach. **DO:** Das Skript mit Lade-Callback einbinden,
  bevor `RegisterCommBusListener` verwendet wird.
- **[NEG]** Der Managed-Wrapper
  `Microsoft.FlightSimulator.SimConnect.dll` aus SDK 1.7.3 ist unter modernen
  .NET-Versionen nicht ladbar; es handelt sich um eine Mixed-Mode-C++/CLI-
  Assembly für .NET Framework 4.6.1. Die geplante Begleit-App verwendet gemäß
  [ADR 0004](adr/0004-stack-der-begleit-app.md) eigenes P/Invoke gegen die
  native Bibliothek.
- **[SDK]** Die SDK-Lizenz benennt `SimConnect.dll` nicht eindeutig als
  weiterverteilbar. **DON'T:** Die DLL ohne geklärte Rechtslage in ein eigenes
  Paket aufnehmen.
- **[NEG]** Client Data Areas erreichen den EFB-JavaScript-Kontext ohne
  zusätzliches WASM-Modul nicht. LVars erfordern auf der SimConnect-Seite
  Polling; ein externer Client kann H-Events nicht direkt senden.
- **[NEG]** Localhost-WebSockets aus Coherent GT sind kein dokumentierter
  SDK-Vertrag. Asobo hat außerdem einen Absturz in `CoherentUIGT.dll` bei vielen
  Socket-Erzeugungen bestätigt. Kein Reconnect-Loop und keine
  localhost-Verbindung ohne ausdrückliche neue Entscheidung.

Der bidirektionale CommBus-Pfad im Custom-EFB-Kontext ist bestätigt. Nutzlast,
Pausenverhalten und EFB-Lifecycle bleiben gesonderte Laufzeitfragen; ihr
konkreter Testumfang steht ausschließlich in [`open-tests.md`](open-tests.md),
die vorläufige Entscheidung in
[ADR 0003](adr/0003-transportkanal-commbus-ueber-simconnect.md).

## Coherent GT und EFB-Rendering

- **[RT]** Ein erfolgreicher Build beweist nicht, dass Coherent GT das Styling
  wie ein Browser rendert. Visuelle Änderungen müssen in der echten EFB und für
  VR-relevante Zustände zusätzlich in VR geprüft werden.
- **[SDK]/[RT]** App-Styles brauchen den Prefix
  `.efb-view.<AppVerzeichnisname>`; ohne ihn wirken Regeln global im EFB.
- **[NEG]** Ein globaler CSS-Transform zum Gegenskalieren der größeren
  VR-Darstellung destabilisiert Breiten und Interaktionsziele. Für VR ist ein
  eigenes Dichteprofil zu verwenden.
- **[RT]** Globale EFB-Regeln für `Button` und `.abstract-button` können lokale
  Hover-, Focus-, Selected- und Active-Zustände überstimmen. Alle Zustände sind
  mit der echten EFB-Komponente zu prüfen.
- **[NEG]** Für bedeutungstragende Symbole nicht auf Unicode-Fontabdeckung
  vertrauen. Einfache Symbole werden mit CSS oder eigenen Assets gezeichnet.
- **[RT]** Coherent GT übernimmt eine am SVG-Root deklarierte transparente
  Füllung nicht zuverlässig für alle Pfade. Konturbasierte Pfade brauchen ein
  eigenes `fill="none"`.
- **DON'T:** Browserfunktionen wie `gap`, echtes `position: sticky` oder moderne
  Sizing-Funktionen ohne gezielten Laufzeitnachweis einführen.

## Primärquellen

- [EFB Template Sample](https://docs.flightsimulator.com/msfs2024/retail/samples-tutorials/samples/efb/efb-template-sample/)
- [Electronic Flight Bag API](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/efb/electronic-flight-bag-api/)
- [JavaScript Flow API](https://docs.flightsimulator.com/msfs2024/html/6_Programming_APIs/JavaScript/Flow_API/Flow_API.htm)
- [Simulation Variables](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/simvars/simulation-variables/)
- [Key Events](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/key-events/key-events-index/)
- [Aircraft Engine Events](https://docs.flightsimulator.com/msfs2024/retail/programming-apis/key-events/aircraft-engine-events/)
- [Miscellaneous Events](https://docs.flightsimulator.com/msfs2024/retail/programming-apis/key-events/miscellaneous-events/)
- [Input Profiles](https://docs.flightsimulator.com/msfs2024/retail/content-configuration/input/input-profiles/)
- [Aircraft Specific Input Profiles](https://docs.flightsimulator.com/msfs2024/retail/content-configuration/input/aircraft-specific-input-profiles/)
- [DevSupport: Custom control bindings](https://devsupport.flightsimulator.com/t/custom-control-bindings/17465)
- [DevSupport: Custom Control Binding menu not appearing](https://devsupport.flightsimulator.com/t/custom-control-binding-menu-not-appearing/18141)
- [Project Editor](https://docs.flightsimulator.com/msfs2024/flighting/devmode/editors/project-editor/the-project-editor/)
- Installiertes SDK 1.7.3 und dessen Samples (read-only)
