# MSFS-2024-SDK: Lessons learned

Einziger Ort für bestätigte MSFS-/Coherent-Besonderheiten, die einen künftigen
Fehler verhindern. Pro Erkenntnis: Geltungsbereich und Handlungsregel.
Keine Rohlogs, Testchronik oder Wiederholung gewöhnlichen API-Verhaltens.
Produktregeln stehen in [design-decisions.md](design-decisions.md), Architektur
in den [ADRs](adr/README.md), offene Tests in [open-tests.md](open-tests.md).

`[RT]` bedeutet im Projekt zur Laufzeit bestätigt, `[SDK]` in SDK/Sample/Doku
belegt, `[NEG]` einen nachweislich ungeeigneten naheliegenden Weg. Marker nur
verwenden, wenn sie zur Einordnung beitragen.

## Geltungsbereich

MSFS 2024 SDK / EFB Template 1.7.3, EFB-API 1.0.3, MSFS-SDK-Paket 2.1.1 und
MSFS-Typen 1.14.6. Nach Updates nur betroffene Erkenntnisse neu bewerten.

## Paketierung und Testiteration

- **[NEG]** `fspackagetool.exe` kann sich bei laufendem MSFS an den Simulator
  hängen und ohne Neubau auf dessen Ende warten. MSFS vor CLI-Release-Builds
  beenden und erst danach den Build starten.
- **[RT]** DevMode-Pakete haben im VFS Vorrang vor gleichnamigen
  Community-Paketen; für Entwicklung muss die Installation nicht entfernt werden.
- **[RT]** Coherent kann nach normalem Reload alte Assets verwenden:
  **Ignore Cache + Reload** nach jedem neuen Build.
- **[RT]** UI-Änderungen benötigen keinen Neustart/neuen Flug, Lifecycle- und
  Resetprüfungen dagegen einen neuen Flug.
- **[SDK]/[RT]** My-Library-Bilder benötigen 360 × 240 Pixel. Metadaten liefern
  Titel, Hersteller und Version separat.
- **[RT]** `fspackagetool.exe -mirroring` entfernt alte Builddateien. Paketinhalt
  und `layout.json` müssen vollständig übereinstimmen.

## EFB-App-Lifecycle und geteilter Zustand

- **[RT]** Die App kann einen Flugwechsel resident ohne neues `onResume()`
  überleben. View- oder Game-State-Übergänge allein erkennen neue Flüge nicht.
- **[RT]** VR-Wechsel können einen neuen EFB-Kontext erzeugen. Mehrere sichtbare
  Debugger-Einträge belegen keine gleichzeitige Sende-/Schreibaktivität.
- **[RT]** SDK-`DataStore` überlebt Kontextwechsel **und** zeitnahe
  Simulatorneustarts. Nicht als flüchtigen Sitzungsspeicher behandeln oder
  seine Lebensdauer durch Timeouts nachbilden. Explizite Reset-Bedingungen
  verwenden, siehe [ADR 0009](adr/0009-fortschritt-ueber-efb-kontextwechsel.md).
- **[RT]** `E:IS IN VR` ist das verlässliche Modussignal. Ein VR-Wechsel sendet
  kein `FltLoad` und ist kein neuer Flug.

## Flug-Lifecycle und Reset

- **[SDK]/[RT]** Flow API: `RegisterViewListener("JS_LISTENER_COMM_BUS")`,
  Event `__FLOW_API__`, JSON-Payload mit numerischer Event-ID und optionalem
  `flt_path`.
- **[RT]** Ein Free Flight erzeugt mehrere Ladefolgen, auch nach `FlightStart`.
  Reset an `FltLoad` binden und idempotent ausführen; nicht auf das erste
  `FltLoaded` als Ende aller Ladevorgänge vertrauen.
- **[NEG]** `GameStateProvider` kann beim Flugwechsel durchgehend `ingame`
  bleiben. `GameModeManager.isInMenu` unterscheidet Flugwechsel und Config-Menü
  nicht. Keiner darf allein den Reset steuern. Settings/Save/Resume sendet
  kein `FltLoad` und erhält Fortschritt.
- Reset nicht auf `FlightEnd` vorziehen: Der letzte Stand soll bis zum Laden
  des nächsten Fluges sichtbar bleiben.

## SimVars und Persistenz

- **[RT]** `ATC MODEL`, `ATC TYPE`, `TITLE` können Lokalisierungstokens und
  Sonderzeichen enthalten. Normalisieren und Regeln aus angezeigten SimVars
  ableiten; gestreamte `aircraft.cfg` kann in geschützten Archiven liegen.
- **[RT]** `E:SIMULATION TIME` steht bei Pause still, steigt innerhalb einer
  Sitzung monoton und beginnt nach Neustart bei null.
- **[NEG]** `Date.now() - E:SIMULATION TIME` ist kein stabiler Sitzungsstart:
  Pausen verschieben ihn. Für Neustarterkennung nur die Monotonie des Rohwerts
  verwenden.
- String-SimVars nicht pro Frame lesen. Ereignisse plus langsamer, bei
  unsichtbarer App gestoppter Fallback genügen.

## Sim-Key-Events in einer Custom-EFB-App

Mechanismus: `RegisterViewListener("JS_LISTENER_KEYEVENT")`,
`Coherent.call("INTERCEPT_KEY_EVENT", …)` und `keyIntercepted`.

- **[RT]** Funktioniert mit Tastatur/HOTAS und liefert das Event, keine Taste.
- **[SDK]/[RT]** Kein nutzbarer Unregister-Aufruf. Zustellung kann nach Laden
  verstummen: nur `passThrough = true`, sparsam registrieren, bei `FltLoad`
  invalidieren und erst nach abschließendem `RTCEnd` beziehungsweise Ende von
  beobachtetem `GameState.loading` erneut registrieren. Erstes `FltLoaded` ist
  zu früh.
- **[RT]** Ein Druck kann selbst bei einmaliger Registrierung mehrfach
  eintreffen; zusätzliche Registrierungen addieren Zustellungen. Immer entprellen.
- **[RT]** Events kommen auch bei geschlossener EFB an. Produktlogik gegen
  `AppView`-Sichtbarkeit absichern.
- **[RT]** Controls-Anzeigename und Eventname können abweichen. Profile können
  sich überlagern; für Tests bewusste, nicht doppelte Belegung prüfen.
  `PLASMA_OFF` heißt `SET PLASMA OFF`; Zustellung ist in G36, DA42, H125,
  MH-60, OH-6A und H500C bestätigt.
- **[NEG]** `AUTOCOORD_ON` wird trotz Belegung nicht erzeugt. Ein nominell
  unbenutztes Event eignet sich nicht automatisch als konfliktfreier Auslöser.
  `LEAD POLE ON` fehlt bei H125/MH-60: Controls-Actions hängen von der
  Flugzeugkategorie ab. Ein gemeinsamer Auslöser muss verfügbar und folgenlos sein.
- **[SDK]** SDK 1.7.3, EFB-/InputProfiles-Samples und die geprüften
  DevSupport-Antworten belegen keine neue globale Controls-Action aus einem
  reinen EFB-Paket. Profile belegen bestehende Actions; dokumentierte neue
  Actions kommen aus Model-Behavior-Input-Events eines Flugzeugknotens.
  Ein Input-Profil nicht mit Action-Registrierung verwechseln.
- **[NEG]** `VALIDATE` ist über DOM-`keydown`, `InputStackListener` und
  `routeGamepadInteractionEvent` nicht frei erreichbar; `KEY_EFB_*` trägt
  `norebind_kbmpad`.
- **[NEG]** `SimConnect_TransmitClientEvent`, `trigger_key_event` und
  `execute_calculator_code` erreichen die JS-Interception nicht. Kein
  externer Transportweg zur EFB.

## CommBus und externe Begleit-App

- **[SDK]/[RT]** SimConnect-CommBus seit SDK 1.6.4, eigener .NET-P/Invoke-Client
  zur Custom-EFB bidirektional bestätigt. JavaScript-Helper zuerst per
  Lade-Callback aus `/JS/Services/CommBus.js` laden, danach Listener registrieren.
  Die verwendeten TypeScript-Pakete benötigen eine eigene Ambient-Deklaration.
- **[RT]** Beim EFB-Appwechsel mit `AppSuspendMode.SLEEP` bleibt die
  Registrierung nutzbar. Nicht allein wegen Suspend/Resume erneut registrieren.
- **[RT]** Nicht-VR → VR → Nicht-VR erhält Zustand und Zustellung. Neue Instanzen
  dürfen ihren ersten Snapshot erst nach Flugzeugauswahl und Restore senden;
  ein vorläufig leerer Snapshot kann im Companion die Ansage-Deduplizierung
  zurücksetzen.
- **[SDK]** Richtung SimConnect können Nachrichten über
  `dwEntryNumber`/`dwOutOf` gechunkt eintreffen; zusammensetzen.
- **[SDK]** Bei angehaltenem JavaScript laufen SimConnect/WASM weiter;
  aufgestaute Events können den Simulator einfrieren. Nur Zustandsänderungen
  senden und ratenbegrenzen.
- **[RT]** Der getestete Ingame-Pausezustand hielt EFB-JavaScript nicht an:
  Bedienung und Snapshot-Anfrage blieben möglich. Ein angehaltenes Flugzeug
  belegt kein angehaltenes JavaScript.
- **[NEG]** `Microsoft.FlightSimulator.SimConnect.dll` aus SDK 1.7.3 ist eine
  Mixed-Mode-C++/CLI-Assembly für .NET Framework 4.6.1, nicht für modernes .NET.
  Eigenes P/Invoke gegen native DLL gemäß [ADR 0004](adr/0004-stack-der-begleit-app.md).
- `SimConnect.dll` ohne geklärte Weitergaberechte nicht ins Paket aufnehmen;
  offene Lizenzfragen stehen in [license-audit.md](license-audit.md).
- **[NEG]** Client Data Areas erreichen EFB-JavaScript ohne WASM nicht;
  LVars verlangen clientseitiges Polling; externe Clients können H-Events
  nicht direkt senden.
- **[NEG]** Localhost-WebSockets sind kein zugesagter SDK-Vertrag. Asobo hat
  einen Coherent-GT-Absturz bei vielen Socket-Erzeugungen bestätigt. Kein
  Reconnect-Loop oder Localhost-Weg ohne neue ausdrückliche Entscheidung.

## Coherent GT und EFB-Rendering

- **[RT]** Browser/Build-Erfolg beweist kein korrektes Coherent-Styling.
  Im EFB prüfen, VR-relevante Änderungen zusätzlich in VR.
- **[SDK]/[RT]** Styles auf `.efb-view.<AppVerzeichnisname>` begrenzen, sonst
  wirken sie global. Globale EFB-Buttonregeln können lokale Hover-, Focus-,
  Selected- und Active-Zustände überstimmen; alle am echten EFB-Button prüfen.
- Kein globales `transform: scale`: Layoutbox, Scrollstrecke und Trefferfläche
  folgen ihm nicht zuverlässig; Text kann unscharf werden. Layoutgrößen skalieren.
- **[SDK]** `efbSize` reicht Small/Medium/Large nur als `SET_SIZE` weiter,
  liefert keine App-Layoutregel. Der Settings-Manager wird in `App` injiziert,
  `AppView` braucht ihn explizit als Prop; der Getter kann sonst werfen.
- **[RT]** Gemessen mit SU6 1.8.14.0: Montiert bleibt die Layoutbox
  468 × 661 CSS-Pixel bei `devicePixelRatio = 1`. Gelöst ist die Layoutbox
  kleiner als das Fenster, außerhalb VR größer als montiert, in VR teilweise
  kleiner. `clientWidth`/`clientHeight` des eigenen Root-Elements verwenden,
  nicht `window.innerWidth`/`innerHeight`.
- **[RT]** Montiert ↔ gelöst sendet `resize` vor Aktualisierung der Layoutbox;
  die neue Box folgt innerhalb etwa 50 ms ohne weiteres Event. Bei `onResume`
  kann die Box 0 × 0 sein. Nach beiden Ereignissen kurz verzögert nachmessen.
- **[NEG]** Die gespeicherte EFB-Einstellung `mode` (2D/3D) zeigt nicht
  zuverlässig montiert/gelöst an.
- **[RT]** In VR beim Debuggen den neuen Eintrag unter „Inspectable web views“
  wählen; der vorherige Kontext liefert unter Umständen keine Lifecycle-Logs mehr.
- **[SDK]** EFB-`Button` reicht `title` nicht an das HTML-Element weiter.
  Tooltip am eigenen DOM-Kind oder gezielt am Button-DOM setzen.
- **[NEG]** Bedeutungstragende Symbole nicht von Unicode-Fontabdeckung abhängig
  machen; CSS-Geometrie oder Assets verwenden.
- **[RT]** SVG-Pfade brauchen eigenes `fill="none"`, wenn sie transparent
  bleiben sollen; die Root-Füllung wird nicht zuverlässig vererbt.
- `gap`, `position: sticky` und moderne Sizing-Funktionen nicht ohne gezielten
  Coherent-Laufzeitnachweis einführen.

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
