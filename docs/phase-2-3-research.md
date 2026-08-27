# Technische Recherche für Phase 2 und Phase 3

Ergebnis der Recherche-Session vom 2026-08-26 zum Abhaken per Tastendruck, zum
Kanal zwischen EFB-App und einer lokalen Begleit-App und zur Sprachausgabe.
Grundlage war der inzwischen abgeschlossene Auftrag in
[`phase-2-tech-stack-plan.md`](phase-2-tech-stack-plan.md).

Zwei Ergebnisse haben den Phasenzuschnitt verändert: Der Tastendruck kann die
EFB-App direkt erreichen, und der Transportweg für den Rückkanal ist
dokumentiert vorhanden. **Phase 2 ist deshalb die EFB-App allein**; Begleit-App,
Rückkanal und Sprachausgabe bilden gemeinsam Phase 3. Siehe
[ADR 0005](adr/0005-phase-2-auf-die-efb-app-verkuerzen.md) und
[`../ROADMAP.md`](../ROADMAP.md). Die Abschnitte unten behalten die
Themenzuordnung der Recherche, nicht die der Phasen.

Dieses Dokument hält die **Begründungen** fest: welche Wege es gibt, was
belegt ist, was nicht, und was gegen die jeweils naheliegende Alternative
spricht. Die daraus abgeleiteten **normativen Aussagen** stehen kurz in
[`msfs-sdk-reference.md`](msfs-sdk-reference.md); die **getroffenen
Entscheidungen** stehen in den ADRs unter [`adr/`](adr/). Hier wird nichts
entschieden.

## Nachweisstufen

Jede Aussage trägt ihre Belegstufe. Die Reihenfolge ist absteigend belastbar.

| Stufe | Bedeutung |
| --- | --- |
| `[RT]` | In diesem Projekt zur Laufzeit in MSFS beobachtet |
| `[SDK]` | Im installierten SDK 1.7.3 belegt, mit Datei und Zeile |
| `[DOC]` | Offizielle MSFS- oder Microsoft-Dokumentation |
| `[SAMPLE]` | Offizielles SDK-Sample |
| `[OSS]` | Open-Source-Code gelesen, mit Repository und Datei |
| `[SHIP]` | Ausgeliefertes Produkt auf dieser Maschine, Code gelesen |
| `[FORUM]` | Aussage im offiziellen DevSupport-Forum; Asobo-Aussagen sind als solche gekennzeichnet |
| `[ANNAHME]` | Plausibel, aber unbelegt |
| `[OPEN]` | Ungeklärt, Nachweis erforderlich |

## Randbedingungen dieser Recherche

Diese Kriterien waren Ausschlusskriterien, nicht Wünsche.

- **Alles Open Source.** Für jede Bibliothek, jedes Modell und jede Stimme ist
  die Lizenz einzeln zu belegen. Bei KI-Modellen sind Code-Lizenz,
  Gewichte-Lizenz und Trainingsdaten-Lizenz getrennt zu bewerten.
- **Keine Visual-Studio-Lizenz vorhanden.** Der gesamte Build muss ohne die
  Visual-Studio-IDE laufen.
- **MSFS behält die GPU, und die FPS sind ein eigenständiges
  Qualitätskriterium.** Kein Polling, keine Arbeit pro Frame, keine GPU-Last
  durch die Begleit-App.
- **Offline-fähig**, ohne Konto- oder Token-Zwang.
- **Datenschutz:** Die Eingabeerkennung reagiert ausschließlich auf die
  konfigurierte Eingabe, zeichnet keine weiteren Eingaben auf und protokolliert
  keine Tastenanschläge. Kandidaten werden ausdrücklich danach bewertet, ob sie
  diese Zusage *technisch* stützen oder nur organisatorisch.
- **Das installierte SDK bleibt read-only.**

---

## 1. Transportkanal zwischen EFB-App und Begleit-App

Die zentrale offene Frage aus dem Plan: Welcher dokumentierte Weg transportiert
eine Nachricht zwischen einem externen SimConnect-Client und dem
JavaScript-Kontext der EFB-App, in beiden Richtungen?

**Ergebnis: Es gibt einen dokumentierten Weg, und er braucht kein
WASM-Modul.** Seit SDK 1.6.4 hat die SimConnect-Seite Zugriff auf den CommBus.

### 1.1 K1 — CommBus direkt zwischen SimConnect-Client und EFB-JS

Der empfohlene Kandidat.

**Extern → EFB**
`SimConnect_CallCommBusEvent(h, "<name>", SIMCONNECT_COMM_BUS_BROADCAST_TO_JS, len, buf)`.
Der Eventname muss **nicht** vorab registriert werden; das steht ausdrücklich in
der Funktionsdokumentation. `[DOC]`

**EFB → extern**
JS ruft `callSimConnect("<name>", jsonString)` auf dem CommBus-Listener; der
Client empfängt über `SimConnect_SubscribeToCommBusEvent(h, id, "<name>")` ein
`SIMCONNECT_RECV_COMM_BUS`. Nachrichten kommen **gechunkt** über
`dwEntryNumber`/`dwOutOf` — die Reassembly ist Pflicht. `[DOC]` `[SDK]`

**Belege**

- `[SDK]` `/mnt/c/MSFS 2024 SDK/SimConnect SDK/include/SimConnect.h:1130-1132`
  (die drei Funktionen), `:438-445`
  (`SIMCONNECT_COMM_BUS_BROADCAST_TO_JS = 1<<0`), `:131`
  (`SIMCONNECT_RECV_ID_COMM_BUS`), `:997-1001` (`SIMCONNECT_RECV_COMM_BUS`).
- `[SDK]` Exporte vorhanden in `SimConnect SDK/lib/SimConnect.dll` und im
  Managed-Wrapper `SimConnect SDK/lib/managed/Microsoft.FlightSimulator.SimConnect.dll`.
- `[SAMPLE]` `Samples/VisualStudio/SimConnectSamples/CommBus/CommBus.cpp` —
  vollständiger bidirektionaler Client. JS-Gegenstück:
  `Samples/DevmodeProjects/SimObjects/Aircraft/WasmAircraft/PackageSources/Copys/aircraft-wasm-commbus/MyCompany_CommBus_Aircraft_HtmlGauge/ModuleCommJsGauge.js`.
- `[DOC]` SDK-Release-Notes 1.6.4: „Added possibility to use CommBus with
  Simconnect". In 1.7.3 enthalten.
- `[DOC]` SDK-Release-Notes 1.7.3: „Fixed rare random deadlocks when using the
  CommBus API" — die API hatte Deadlock-Fehler, 1.7.3 enthält den Fix.
- `[OSS]` `node-simconnect` 4.2.0 implementiert `subscribeToCommBusEvent`,
  `callCommBusEvent` und `RecvCommBus` in reinem TypeScript
  (`src/SimConnectConnection.ts:1989-2022`, `src/enums/CommBusBroadcastTo.ts`,
  `src/recv/RecvCommBus.ts`). Die Aufrufe sind auf `Protocol.SunRise` (0x6)
  gegated, also **MSFS 2024 exklusiv**.
- `[FORUM]` Asobo (FlyingRaccoon, 2026-07-07): „CommBus events are handled
  separately, so you can reuse IDs …". Im selben Thread berichtet ein
  Entwickler von zwei funktionierenden Demos „to and from JavaScript
  communication with this".

**Der EFB-Kontext ist kein Hindernis.** Das ist nicht erschlossen, sondern
belegt: `[RT]` Unsere App registriert in
`msfs/PackageSources/VRChecklist/src/VRChecklist.tsx:337-341`
`RegisterViewListener("JS_LISTENER_COMM_BUS")` und empfängt darüber
`__FLOW_API__`-Events. Diese Events stammen aus dem Sim-Kern, also von
**außerhalb** unseres Pakets. Der CommBus ist damit nachweislich nicht paket-
oder view-lokal. Zusätzlich `[FORUM]` devsupport 15285 „Is CommBus available in
EFB?" (2025-08): der Viewlistener funktioniert in der EFB, der korrekte Name
ist `JS_LISTENER_COMM_BUS` (nicht `JS_LISTENER_COMMBUS`).

**Keine Typisierung vorhanden.** „CommBus" kommt nicht vor in
`@microsoft/msfs-sdk` 2.1.1, auch nicht in der neuesten Version 2.3.3 (geprüft:
0 Treffer), nicht in `@microsoft/msfs-types` 1.14.6 und nicht in
`@efb/efb-api` 1.0.3. Der Kanal ist wie `RegisterViewListener` heute per
eigener Ambient-Deklaration anzubinden.

**Risiken**

- `[DOC]` Known Issue: Bei pausierter Simulation laufen WASM und SimConnect
  weiter, **JavaScript nicht**. Events an JS werden in eine Queue gelegt und
  erst beim Fortsetzen verarbeitet. Bei Stau ist ein Freeze möglich. Der
  Rückkanal braucht daher eine Ratenbegrenzung und darf nur bei Änderung
  senden.
- Maximale Nutzlast pro Aufruf und tatsächliche Chunk-Größe sind nirgends
  dokumentiert. `[OPEN]`

### 1.2 K2 — WASM-Brückenmodul plus CommBus

Externe App ⇄ WASM über `SimConnect_CallCommBusEvent`/`fsCommBusRegister` oder
Client Data Areas mit `SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET`; WASM ⇄ JS über
`fsCommBusCall(..., FsCommBusBroadcast_JS)`. `[SDK]`
`WASM/include/MSFS/MSFS_CommBus.h:17` (`FsCommBusBroadcast_SimConnect = 1<<3`),
`[SAMPLE]` `CommBusModule/WasmGauge.cpp`, `StandaloneModule/Sources/Code/Module.cpp`.

Aufwand hoch: C++-Modul, zweites Paket, zweiter Build. **Nutzen gegenüber K1:
keiner**, solange K1 trägt. Reine Rückfalloption.

Ein Standalone-Modul wäre paketierungsseitig unproblematisch: `[SAMPLE]`
`Samples/DevmodeProjects/Misc/StandaloneModule/PackageDefinitions/mycompany-module-standalone.xml`
mit `ContentType MISC` und `AssetDir PackageSources\modules\`. `[SHIP]` Reales
Beispiel auf dieser Maschine: `Packages/Community/mobiflight-event-module/`
besteht nur aus `manifest.json`, `layout.json` und
`modules/MobiFlightWasmModule.wasm`.

### 1.3 K3 — Key-Event-Interception (nur Hinkanal, und für extern nicht nutzbar)

Siehe Abschnitt 2. Für den *Transport* von einer externen App aus ist dieser Weg
**ausgeschlossen**: `[FORUM]` Asobo (FlyingRaccoon, 2024-02-27, Topic 8320 #6):
„SimConnect_TransmitClientEvent, just like `trigger_key_event` and
`execute_calculator_code` in the Gauge API **will bypass JS and Input Event
interception** and call the sim event directly." Eine externe App kann die
EFB-App über Key-Events also nicht erreichen. Als *Eingabeweg für den Menschen*
bleibt der Pfad dagegen der interessanteste Kandidat überhaupt.

### 1.4 K4 — localhost-WebSocket oder `fetch` aus dem Coherent-GT-JS

Der pragmatisch billigste Weg, empirisch belegt, aber mit erheblichen Risiken.

**Belege, dass es funktioniert**

- `[SHIP]` **In einer EFB-App**:
  `Packages/Community/mamudesign-efb-animatelifts/html_ui/efb_ui/efb_apps/AnimateLiftsEfbApp/AnimateLiftsEfbApp.js:5453`
  ruft `fetch("http://localhost:8080/", {method:"POST", body: JSON.stringify({message})})`
  direkt aus dem EFB-App-Kontext auf. Das ist der belastbarste Einzelnachweis,
  weil es genau unser Kontext ist.
- `[SHIP]` **In einem InGamePanel**: BeyondATC, `ws://127.0.0.1:41716` mit
  Hostliste `["127.0.0.1","localhost"]`, Generation-Counter,
  8-Sekunden-Connect-Watchdog, Reconnect-Timer, Keep-Alive und
  `probeLoopback()`. Die Windows-Seite ist ein eigener Prozess
  `simconnect_ws.exe`, der SimConnect nach WebSocket brückt.
- `[SHIP]` `Packages/Community/sayintentions-efb` nutzt `fetch()` gegen
  `https://lambda.sayintentions.ai` und `https://portal.sayintentions.ai` sowie
  `localStorage` aus dem EFB-Kontext. Netzwerkzugriff ist dort also nicht per
  CSP gesperrt.
- `[OSS]` FlyByWire SimBridge ↔ flyPad/MCDU über `ws://localhost:8380` und
  `fetch`. Im Code steht der sprechende Kommentar
  `// AbortController not available in Coherent -_-`
  (`fbw-common/src/systems/shared/src/simbridge/common.ts`).
- `[FORUM]` runshotgun (Parallel 42, 2024-07-24): „create a WebSocket server in
  your C# app and make your JS connect to it."
- `[FORUM]` tracernz (FlyByWire, 2025-10-17): „you can use either regular HTTP
  calls (fetch), or websockets from a JS instrument. It doesn't need HTTPS, but
  does need correct CORS headers for some things."

**Risiken, und sie sind gewichtig**

- **Nicht dokumentiert.** In der gesamten SDK-Doku und im installierten SDK
  1.7.3 kommt „WebSocket" **kein einziges Mal** vor; ebenso keine CSP-, CORS-
  oder Whitelist-Angaben. Die EFB-API-Doku sagt zu Netzwerk gar nichts.
- `[DOC]` Die **WASM**-Netzwerk-API ist ausdrücklich auf HTTPS beschränkt
  („only https requests are permitted by the API", maximal 3 parallele Requests
  global). Das ist der einzige dokumentierte Netzwerkweg — und er kann localhost
  gerade nicht. Ein Indiz, dass der JS-Weg geduldet, nicht gewollt ist.
- `[FORUM]` **Von Asobo bestätigte Coherent-GT-Fehler**: „Websockets not being
  cleaned up" (FlyByWire, 2022, Fix in SU10 bestätigt) und „Multiple WebSocket
  creation in JS causes CTD" (2024-03, Absturz in `CoherentUIGT.dll`, von
  FlyingRaccoon ins Backlog übernommen, ab etwa 60 bis 100 Sockets). **Ein
  leckender Reconnect-Loop kann den Simulator zum Absturz bringen.** BeyondATCs
  defensiver Code ist genau darauf zugeschnitten.
- `[FORUM]` B21 (2025-10-14) zur Risikofrage: „It's possible the JS http support
  will die followed by a statement that it has never been a supported feature in
  the sim." Es gibt keine Asobo-Ankündigung, den Weg zu schließen — aber auch
  keine Zusage, dass er bleibt.
- Sicherheitsprofil: offener lokaler TCP-Port ohne Authentisierung, von jedem
  Prozess der Sitzung erreichbar; Firewall-Prompt beim ersten Listen;
  Portkollisionen.
- Zu erlaubten Ports, `wss://`-Zwang, Marketplace-Sonderverhalten und
  VR-Spezifika existiert **keine** Quelle. `[OPEN]`

**Verhältnis zur Projektregel:** Dieser Weg widerspricht der geltenden Regel
„keine undokumentierte localhost-Verbindung aus der EFB-WebView, kein lokaler
Webserver im EFB-Kontext". Die Regel ist eine Projektentscheidung, nicht eine
technische Grenze — sie kann bewusst geändert werden, aber nicht stillschweigend.

### 1.5 K5 — SimConnect Client Data Areas allein

`MapClientDataNameToID`, `CreateClientData`, `SetClientData`,
`RequestClientData` mit `SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET` — event-getrieben
und strukturiert. `[SDK]` `SimConnect.h:1079-1084`. `[OSS]` Muster im
MobiFlight-WASM-Modul und in FlyByWires `terronnd`.

**Als Transport zum EFB ausgeschlossen:** Es gibt keine JS-API für Client Data
Areas. Ohne WASM-Brücke erreicht das den EFB-Kontext nicht. Nur als Bestandteil
von K2 relevant.

### 1.6 K6 — LVars, H-Events, `ExecuteAction`, Input Events

- LVars: JS kann lesen und schreiben, die SimConnect-Seite braucht periodische
  Requests, also Polling. Durch die Projektregeln ausgeschlossen. `[FORUM]`
  devsupport 18023 dokumentiert die Verlustprobleme dieses Wegs; dort empfehlen
  tracernz und Jayshrike stattdessen den CommBus.
- H-Events: WASM kann sie senden (`fsEventsHEventCall`, SDK 1.6.4), JS empfängt
  über `hEvent`. Ein externer SimConnect-Client kann **nicht** direkt einen
  H-Event senden — braucht also wieder WASM.
- `SimConnect_ExecuteAction`, `EnumerateInputEvents`, `SetInputEvent`: Sim-
  Aktionen bzw. Aircraft-Input-Events, kein Nachrichtenkanal zum EFB-JS.
  `[SDK]` `SimConnect.h:1102-1108`.
- Es gibt in SDK 1.7.3 **keine** weitere „SimConnect-zu-CommBus-Brücke" und
  keine „External Application API". Die neueste dokumentierte SDK-Version ist
  1.7.3; danach existiert keine.

### 1.7 Bewertung

| Kriterium | K1 CommBus direkt | K4 localhost-WS | K2 WASM + CommBus |
| --- | --- | --- | --- |
| Dokumentiert | ja, mit Sample | **nein** | ja |
| Zusatzartefakte | keine | keine | WASM-Modul, zweites Paket |
| Toolchain | keine | keine | clang aus dem SDK |
| Latenz | Sim-Tick-gebunden | am niedrigsten | Sim-Tick-gebunden |
| Robustheit gegen Sim-Updates | gut | **schwach**, CTD-Risiko | gut |
| Sicherheitsfläche | keine | offener lokaler Port | keine |
| Projektregel-Konflikt | nein | **ja** | nein |
| Vollständig Open Source machbar | ja, über `node-simconnect` | ja | ja |

### 1.8 Offene Nachweise zum Transport

1. `[OPEN]` Kommt ein von SimConnect mit `BROADCAST_TO_JS` gesendeter,
   **selbst benannter** Event in der residenten EFB-App an? Der Mechanismus ist
   derselbe wie bei `__FLOW_API__`, der Beleg fehlt.
2. `[OPEN]` Wie sendet die EFB-App? Existiert `RegisterCommBusListener`
   beziehungsweise `Include.addScript("/JS/Services/CommBus.js")` im
   EFB-Kontext? Im Coherent-Debugger `typeof RegisterCommBusListener` prüfen und
   `coui://html_ui/JS/Services/CommBus.js` lesen — dort steht auch der
   Coherent-Eventname der SimConnect-Richtung. Dokumentiert ist nur
   `COMM_BUS_WASM_CALLBACK`. `[DOC]`
3. `[OPEN]` Maximale Nutzlast pro CommBus-Aufruf und tatsächliche Chunk-Größe.
4. `[OPEN]` **Lebensdauer der Registrierung.** Unsere App läuft mit
   `AppBootMode.COLD` und `AppSuspendMode.SLEEP`
   (`VRChecklist.tsx:1125-1126`), und der Listener entsteht im
   `AppView`-Konstruktor. **Vor dem ersten Öffnen der App existiert also kein
   Empfänger.** Für einen Kanal, der ohne Benutzerinteraktion bereitstehen soll,
   muss die Registrierung nach `App.install()` wandern oder der BootMode auf
   `WARM`/`HOT` wechseln — beides inklusive FPS-Wirkung zu prüfen.
5. `[OPEN]` Verhalten bei pausiertem Sim (Queue-Effekt) und beim Neustart der
   Begleit-App mitten im Flug.

---

## 2. Bestätigungseingabe: der Tastendruck zum Abhaken

Hier hat die Recherche das Bild am stärksten verändert. Es gibt einen Weg, der
**ganz ohne externe App und ohne Windows-Eingabe-API** auskommt.

### 2.1 Der In-Sim-Weg: `INTERCEPT_KEY_EVENT`

Ein JS-Kontext in MSFS kann ein benanntes Sim-Key-Event abfangen und direkt in
JavaScript empfangen. Eingeführt in MSFS 2020 SU4 („Ability to intercept and
mask key events has been added to the JS key event listener").

**Die API liegt bereits im Projekt.** `[OSS]` `KeyEventManager` in unserem
vendorten `@microsoft/msfs-sdk` 2.1.1:

- `node_modules/@microsoft/msfs-sdk/msfssdk.js:2677` —
  `RegisterViewListener('JS_LISTENER_KEYEVENT', …)`
- `:2630` — `Coherent.call('INTERCEPT_KEY_EVENT', key, passThrough ? 0 : 1)`
- `:2596` — `Coherent.on('keyIntercepted', …)`
- Typen: `msfssdk.d.ts:18712-18787`, Export `KeyEventData, KeyEventManager,
  KeyEvents` bei `:50163`

Upstream: `microsoft/msfs-avionics-mirror`, `src/sdk/data/KeyEventManager.ts`.
Lizenz **MIT mit Addendum** — „licensed only for usage in Microsoft Flight
Simulator", was für eine MSFS-EFB-App genau der erlaubte Zweck ist.

**Semantik des zweiten Parameters, geklärt.** `[OSS]`
`interceptKey(key, passThrough)` ruft
`Coherent.call('INTERCEPT_KEY_EVENT', key, passThrough ? 0 : 1)`. Also:

- **`1` = abfangen und vor dem Sim verschlucken** (Maskierung)
- **`0` = abfangen und an den Sim durchreichen**

Das deckt sich mit dem SU4-Wortlaut „intercept **and mask**". Die verbreitete
Community-Deutung, der dritte Parameter sei ein register/unregister-Flag, ist
**falsch** (`[FORUM]` Topic 3221 #10).

**Payload.** `[OSS]` `onKeyIntercepted(key, value1?, value0?, value2?)` — die
Reihenfolge ist **vertauscht**: Argument 2 ist `value1` (bei indizierten Events
oft der Index), Argument 3 ist `value0` (der Datenwert), Argument 4 ist
`value2`. `value0` wird von uint32 nach sint32 korrigiert. Auf den Event-Bus
geht `{ key, value0, value1, value2 }` unter dem Topic `key_intercept`. **Kein
Down/Up-Flag** — ein Key-Event ist ein einzelner Impuls. Auto-Repeat bei
gehaltener Taste: `[OPEN]`.

**Mehrere Events gleichzeitig: ja**, ein `INTERCEPT_KEY_EVENT`-Aufruf pro
Eventname, ein gemeinsamer Callback, Filterung über den Namen. So ist der
`KeyEventManager` gebaut, und so macht es auch FlyByWire.

**Es gibt keinen Unregister-Aufruf.** Die Familie besteht nur aus
`INTERCEPT_KEY_EVENT` und `TRIGGER_KEY_EVENT`; ein grep über das gesamte SDK
findet nichts weiteres, und `[FORUM]` Topic 3221 bestätigt: „Stop listening"
existiert nicht. Ein einmal gesetzter Intercept gilt für die Lebensdauer der
View. **Konsequenz: Maskieren nur, wenn es wirklich nötig ist.**

**Der Intercept-Zustand ist offenbar sim-global pro Key-Event, nicht pro View.**
Indiz: `TRIGGER_KEY_EVENT(key, bypass, v0, v1, v2)` hat einen ausdrücklichen
`bypass`-Parameter, um Intercepts zu umgehen. `[ANNAHME]` Praktische Folge:
**`ATC_MENU_0` ist verbrannt**, weil BeyondATC es mit Flag `1` maskiert.

**Dokumentationslage.** `[DOC]` Die Seite `JS_LISTENER_KEYEVENT` existiert und
listet `INTERCEPT_KEY_EVENT` und `TRIGGER_KEY_EVENT` — trägt aber den Vermerk
„This page is currently a Work In Progress", und die Spalten *Parameters* und
*Description* sind leer. `keyIntercepted` wird dort nicht erwähnt. Der
Mechanismus ist damit **benannt, aber nicht als API-Vertrag zugesagt**. Im
installierten SDK gibt es außer zwei Navigationslinks in eingebetteten
Doku-Dumps (`Tools/Blender/addons/lod_tools_msfs_2024/documentation.html:4077`)
keine Fundstelle.

**Auslösung durch verschiedene Geräte**

- **Tastatur:** funktioniert. `[FORUM]` Topics 3221, 4906, 6335.
- **Joystick, HOTAS, Gamepad: ja.** `[FORUM]` Topic 6335 #3:
  Xbox-Controller-Buttons lösen Intercepts aus. Topic 4906: der
  H145-Entwickler baut sein komplettes Hardware-Binding-System darauf auf
  („users bind their hardware to functions"). Der Pfad ist Gerät → Input Action
  → Key Event; die Belegungsart ist unerheblich.
- **SimConnect `TransmitClientEvent`: nein.** Siehe 1.3. Asobo-Aussage.

**Verfügbarkeit im EFB-Kontext.** `RegisterViewListener` und `Coherent` sind
ambiente Globals jeder Coherent-GT-View: `[SDK]` `@microsoft/msfs-types` 1.14.6,
`js/common.d.ts:528` und `:115`. Das EFB-Framework selbst benutzt sie: `[SDK]`
`Samples/DevmodeProjects/EFB/PackageSources/efb_api/dist/index.js:1754`
(`JS_LISTENER_INPUTS`), `:1764` (`JS_LISTENER_INPUT_STACK`), plus vier
`Coherent.call`. `[FORUM]` Topic 15285 bestätigt beliebige View-Listener in der
EFB. `[RT]` In unserer App bewiesen für `JS_LISTENER_COMM_BUS`.

**Was damit noch nicht bewiesen ist:** dass der Sim das `keyIntercepted`-Event
auch in eine **EFB-View** routet. BeyondATC beweist es für ein InGamePanel.
Dafür gibt es in keine Richtung einen Beleg — **das entscheidet nur der
Simulator.** `[OPEN]`

### 2.2 Kandidaten für das Sim-Key-Event

Das SDK liefert die vollständige Input-Action-Datenbank mit: `[SDK]`
`Tools/Setup_InputProfiles/action.actiondb`, 985 Contexts, 3084 Actions als XML.
Der Action-Name ist `KEY_` + Key-Event-Name; ein leeres `TT_Tag` bedeutet „in
den Steuerungsoptionen frei belegbar". Tag-Verteilung: leer 2279, `main` 196,
`norebind` 139, `obsolete` 125, `wip` 119, `norebind_kbmpad` 100, `noconsole`
89, `debug` 17, `new` 16, `vr` 4.

| Kandidat | Context | Tag | Bewertung |
| --- | --- | --- | --- |
| `AUTOCOORD_ON` / `_OFF` / `_SET` | AIRCRAFT | – | **Beste Wahl.** `[DOC]` „Not used in the simulation." Frei belegbar. Achtung: `AUTOCOORD_TOGGLE` **hat** eine Wirkung (Y-Achse invertieren) — nicht nehmen. |
| `EXTERNAL_SYSTEM_TOGGLE` | AIRCRAFT | – | `[DOC]` „Generic key event to toggle a value on/off" — ausdrücklich generisch. Restrisiko: ein Flugzeug könnte es in Model Behaviours nutzen. |
| `ATC_MENU_1` … `_9` | ATC | – | Stärkster Praxisnachweis (BeyondATC), aber Nebenwirkung im offenen ATC-Menü; braucht dann Maskierung. |
| `ATC_MENU_0` | ATC | – | **Nicht nehmen** — von BeyondATC maskiert. |
| `CHECKLIST` | INGAME_UI | – | Semantisch am schönsten, aber Maskierung würde die Stock-Checkliste dauerhaft unterdrücken. |
| `KEY_3RD_PARTY_WINDOW_VALIDATE` | 3RD_PARTY | `norebind` | Klingt ideal, ist aber **nicht umbindbar**. |
| `KEY_EFB_*` (16 in `EFB`, 6 in `EFB_CORE`) | EFB | `norebind_kbmpad` | Für Tastatur, Maus und Pad **nicht belegbar**. |
| `ROTOR_BRAKE*` | HELICOPTER | – | Real implementiert; für H125 und MH-60 ausgeschlossen. |
| `KNEEBOARD`, `OVERLAYMENU`, `PANEL_SELECT_1/2`, `LOD_ZOOM_*` … | **DEBUG** | – | Laut Doku funktionslos, aber Context `DEBUG`. Ob sie im Retail-UI erscheinen: `[OPEN]`. Nur Reserve. |

**Empfehlung: `AUTOCOORD_ON` mit `passThrough = true`.** Bei einem
funktionslosen Event brauchen wir keine Maskierung — und weil es keinen
Unregister gibt, ist eine nicht gesetzte Maske die einzige, die man nicht
bereuen kann. Damit ist auch ein Konflikt mit BeyondATC oder dem Flugzeug
konstruktiv ausgeschlossen.

**Eine eigene Action ist keine Option.** `[DOC]` Transversal Input Profiles
binden nur *vorhandene* Actions aus der Core-ActionDB; Aircraft-Specific
Profiles gelten für Flugzeugpakete. Ein MISC-EFB-Paket kann keinen eigenen
Eintrag ins Controls-UI legen.

**Nebenbefund, der einen alten Fehlschlag erklärt.** `[SDK]` `KEY_EFB_VALID`
steht in `action.actiondb` im Context `EFB` mit `norebind_kbmpad`. Alle
`KEY_EFB_*`-Actions tragen dieses Tag. Der frühere `InputStackListener`-Versuch
auf `KEY_EFB_VALID` **konnte** also gar nicht feuern — der bestehende
`[NEG]`-Eintrag hat damit eine Ursache statt nur einer Beobachtung.

### 2.3 Das Risiko, das unser Projekt direkt trifft: Hubschrauber

`[FORUM]` Topic 4906, „SU11 Helicopter — `INTERCEPT_KEY_EVENT` is disabled for
Helicopters only?" (2022-11): `keyIntercepted` feuerte in Cabri und 407
überhaupt nicht, in Fixed-Wing schon. Asobo (FlyingRaccoon, 2022-11-16): „We
were able to reproduce the problem and can confirm there's an issue on our side.
This will be fixed in a future update." **Es gibt keinen Folgebericht, keine
Bestätigung des Fixes und keinen MSFS-2024-Datenpunkt.**

Unsere Checklisten sind H125 und MH-60. Der Laufzeittest muss zwingend mit einem
Hubschrauber laufen, nicht nur mit der G36. Der damalige Workaround war
SimConnect in Native Code — für uns wegen der Asobo-Aussage aus Topic 8320
nicht nutzbar.

Weitere offene Punkte: Verhalten bei suspendierter oder geschlossener EFB-App
und nach dem VR-Wechsel, der laut `msfs-sdk-reference.md` den App-Kontext neu
erzeugt — Intercepts müssen dann neu gesetzt werden. `[OPEN]`

### 2.4 Der offiziell für EFB gedachte Weg: `InputStackListener`

`[SDK]` `Samples/DevmodeProjects/EFB/PackageSources/efb_api/dist/Listeners/InputStackListener.d.ts`,
`Input/InputManager.d.ts`, `Input/InputAction.d.ts`:

```ts
addInputAction(input: string, callback: (value: number) => boolean,
               inputType?: 'pressed' | 'released' | 'axis',
               context?: string): InputActionDestructor;
```

Intern `RegisterViewListener('JS_LISTENER_INPUT_STACK')` plus Event
`ON_INPUT_TRIGGERED(task, value, activeId, uuid)`. Die Klassendoku sagt: „The
manager that uses the InputStackListener in order to deliver a toolbox for
**gamepad** input use cases."

Vorteil: dokumentierte, nicht als deprecated markierte EFB-API. Nachteil: die
`KEY_EFB_*`-Actions tragen alle `norebind_kbmpad`, eine freie Tasten- oder
Pad-Belegung durch den Nutzer ist also nicht möglich; die Gamepad-Defaults
(X/Y/LB/RB/LT/RT) sind fest. Als Gamepad-Ergänzung brauchbar, nicht als freie
Eingabewahl. Die ältere `InputsListener`-Variante (`JS_LISTENER_INPUTS`,
`ADD_INPUT_WATCHER`) ist im Typing ausdrücklich `@deprecated`.

### 2.5 Externe Wege, falls der In-Sim-Weg fällt

| Weg | Fokus/VR | Datenschutz | Bewertung |
| --- | --- | --- | --- |
| **DirectInput auf einen HOTAS-Knopf**, `DISCL_BACKGROUND \| DISCL_NONEXCLUSIVE` + `SetEventNotification` | **fokusunabhängig** | **sehr gut** — nur dieses Gerät, kein Tastaturzugriff | **Bester externer Weg.** `[OSS]` Produktiv bewiesen in OpenKneeboard, `src/app/app-common/UserInput/DirectInputListener.cpp:45-48`, für MSFS in VR. Event-getrieben über ein Windows-Event-Handle, kein Busy-Polling. .NET-Binding `Vortice.DirectInput` (**MIT**, gepflegt). OpenKneeboard selbst steht unter „OpenKneeboard Public License v1" (GPLv2-Derivat mit Branding-Klausel) — als Referenz lesbar, nicht als Copy-Paste-Quelle. |
| **SimConnect `MapInputEventToClientEvent_EX1`** mit genau einer Taste | nur mit MSFS-Fokus | **bestmöglich** — die App ruft keine Windows-Input-API auf | Sauber im Ansatz, in der Praxis aber belastet: `bMaskable` ist seit 2021 wirkungslos und laut Asobo bewusst nicht gefixt (Topic 3119) → Doppelbelegung unvermeidbar, es muss eine in MSFS unbelegte Taste sein. Input-Strings wechseln zwischen SU-Versionen (`"F1"` vs. `"VK_F1"`, Topic 18357 vom 2026-08-19). F13–F22 kommen in MSFS 2024 nicht an (Topic 13023). Tastendrücke feuern auch bei fokussiertem Textfeld, ohne dass man das erkennen kann (Topic 16727). Der Joystick-Pfad ist derzeit fragil: Device-IDs müssen undokumentiert über `EnumerateControllers` geholt werden, das laut Asobo (2026-08-17) „does not return a correct list"; das SDK-Sample stürzt ab. SimConnect selbst ist nicht Open Source. |
| **`RegisterHotKey`** | **unklar** | **bestmöglich** — nur diese Kombination | `[DOC]` Eine Raw-Input-App im Vordergrund kann per `RIDEV_NOHOTKEYS` app-definierte Hotkeys abschalten. Ob MSFS 2024 das setzt: `[OPEN]`. Kein Pass-Through-Steuerungsflag. `F12` ist reserviert. Rust `global-hotkey` v0.8.0 (**MIT OR Apache-2.0**). |
| **Raw Input `RIDEV_INPUTSINK`** | fokusunabhängig | **mittelmäßig für Tastatur** — man registriert die ganze Usage Page und filtert erst in der App | Von Microsoft ausdrücklich gegenüber Low-Level-Hooks empfohlen. Kein Konsumieren möglich → Doppelbelegung. Gut für ein dediziertes HID-Gerät, nicht für die Tastatur. |
| **Fußpedal, Stream Deck, MIDI** | fokusunabhängig | **bestmöglich** bei Vendor-HID | Ergonomisch in VR hervorragend. Harte Grenze: Windows öffnet HID-**Keyboard**-Collections exklusiv über die Systemtreiber, `hidapi` kann sie nicht öffnen. Ein Pedal, das sich als HID-Keyboard meldet, ist damit nur über die Tastaturebene erfassbar. `hidapi` ist dreifach lizenziert (GPLv3 **oder** BSD-3-Clause **oder** die originale HIDAPI-Lizenz, Wahl frei). |
| **XInput / Windows.Gaming.Input** | **kein Hintergrundzugriff** | – | `[OSS]` OpenKneeboard-FAQ: „Microsoft restricted Windows so that these kinds of controllers are only usable by the active Window." XInput hat zudem keine Event-API, nur Polling. **Verwerfen.** |
| **GameInput API (GDK)** | theoretisch ja | – | `SetFocusPolicy(GameInputEnableBackgroundInput)` existiert, aber offene GDK-Issues (#30, #104) melden, dass die Focus-Policy für Gamepads nicht wirkt. Nicht Open Source. |
| **VR-Controller über OpenXR** | **verschlossen** | – | `[DOC]` OpenXR-Spec, `input.adoc:1344`: „If `session` is not focused, the runtime **must** return `XR_SESSION_NOT_FOCUSED`, and all action states in the session **must** be inactive." Solange MSFS die Session hält, bekommt kein zweiter Prozess Controller-Input. `XR_EXTX_overlay` ist provisorisch und wird nur von Monado implementiert, nicht von SteamVR oder Oculus. Härtestes Praxisindiz: OpenKneeboard, das reifste OSS-VR-Overlay für MSFS, unterstützt **keine** VR-Controller. **Verwerfen.** |
| **`WH_KEYBOARD_LL`** | funktioniert | **schlecht** — sieht jeden Tastenanschlag | `[DOC]` Seit Win10 1709 ist `LowLevelHooksTimeout` auf 1000 ms gedeckelt, und bei Timeout wird der Hook **ab Win7 stillschweigend entfernt, ohne Rückmeldung**. Microsoft empfiehlt selbst Raw Input stattdessen. Sitzt im kritischen Eingabepfad, verzögert also auch MSFS. EDR-Heuristiken erkennen genau dieses Muster (MITRE T1056.001). **Verwerfen** — es widerspricht der Datenschutzzusage direkt. |

**Störfaktoren, unabhängig vom Weg**

- MSFS 2024 nutzt **kein** Anti-Cheat; Overlays sind unbeschränkt.
- Der **MSFS-2024-VR-Fokusverlust ist real** — die dokumentierte Abhilfe bei
  fehlendem VR-Cursor ist Alt+Tab weg und zurück. Das trifft jeden
  fokusabhängigen Pfad, also auch SimConnect-Keys, aber **nicht** den
  In-Sim-Intercept und **nicht** DirectInput mit `DISCL_BACKGROUND`.
- BeyondATCs eigenes Push-to-Talk ist ein Warnhinweis für den externen Weg:
  `[COMMUNITY]` Button-Index ohne Geräte-GUID (ein Knopf löst auf drei Geräten
  aus), Geräteerkennung nur beim Start, und in VR Berichte über „huge delay or
  sometimes does not react at all", teils durch Overlays und
  Frame-Generation-Tools komplett unterbunden.

**Geräteempfehlung, architekturunabhängig: ein freier HOTAS- oder Yoke-Knopf,
nicht die Tastatur.** Er ist mit aufgesetztem Headset blind erreichbar, und
derselbe Knopf funktioniert in *beiden* Architekturen — im JS-Weg über die
MSFS-Belegung auf das gewählte Key-Event, im Fallback über DirectInput. Die
Tastatur bleibt der bequeme Weg für den ersten Laufzeittest am Desktop.

### 2.6 Kleinster Laufzeitnachweis

In `VRChecklist.tsx`, nach `GameState.ingame`:

```ts
import { KeyEventData, KeyEventManager, KeyEvents } from "@microsoft/msfs-sdk";

const PROBE_KEYS = ["AUTOCOORD_ON", "EXTERNAL_SYSTEM_TOGGLE", "ATC_MENU_9"];

KeyEventManager.getManager(this.props.bus)
  .then((manager) => {
    console.info("[VRC][KEYPROBE] manager ready");
    for (const key of PROBE_KEYS) {
      manager.interceptKey(key, true); // passThrough -> Flag 0, nichts maskieren
      console.info(`[VRC][KEYPROBE] intercept requested: ${key}`);
    }
    this.props.bus
      .getSubscriber<KeyEvents>()
      .on("key_intercept")
      .handle((d: KeyEventData) => {
        console.info(
          `[VRC][KEYPROBE] hit key=${d.key} v0=${d.value0} v1=${d.value1} v2=${d.value2}`
        );
      });
  })
  .catch((e) => console.error("[VRC][KEYPROBE] manager failed", e));
```

Der Nutzer belegt in den MSFS-Steuerungen dieselbe Aktion **zweimal** — einmal
Tastatur, einmal HOTAS-Knopf — primär `AUTOCOORD_ON` (Kategorie *Instrumente und
Systeme › Fluginstrumente*). Dann Coherent Debugger, `Ignore Cache + Reload`,
EFB-App öffnen, drücken.

Deutung der Logzeilen:

1. `manager ready` **fehlt** → der Listener oder das GameState-Gate löst in der
   EFB-View nicht auf. Gegenprobe mit dem Rohweg ohne `GameStateProvider`.
2. `manager ready` da, aber **kein** `hit` → der Sim routet `keyIntercepted`
   nicht in die EFB-View. **Damit ist der Weg für EFB-Apps widerlegt.**
3. `hit key=AUTOCOORD_ON …` → bewiesen, inklusive Payload-Format.

Testmatrix im selben Durchgang, je einmal Tastatur und HOTAS: zuerst eine
GA-Maschine, danach **H125 und MH-60** wegen Topic 4906. Zusätzlich mit
fokussierter und nicht fokussierter EFB, um eine Verdrängung durch den
EFB-Input-Context auszuschließen. Ergänzend der Konsum-Test mit `ATC_MENU_9`:
mit `passThrough=false` darf im offenen ATC-Menü kein Punkt 9 gewählt werden,
mit `true` muss er gewählt werden.

### 2.7 Ergebnis des Laufzeitnachweises (2026-08-27)

Der Pfad trägt. Die geltenden Fakten stehen in
[`msfs-sdk-reference.md`](msfs-sdk-reference.md), Abschnitt „Eingaben", die
Entscheidung in [ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
Hier nur, was die Kandidatenbewertung aus 2.2 korrigiert:

- Die dortige Empfehlung `AUTOCOORD_ON` ist **widerlegt**. Ein Event ohne
  Wirkung wird nicht erzeugt; „folgenlos" und „als Auslöser brauchbar"
  schließen sich aus.
- Brauchbar ist die Gegenklasse: ein real implementiertes Event, dessen System
  das geflogene Flugzeug nicht besitzt. Geprüft und ankommend: `SPRAY_ON`,
  `GRAPPLE_HOOK_ON`, `LEAD_POLE_ON`, `SKYDIVE_DOORLIGHTS_JUMP`.
- Gewählt ist `LEAD_POLE_ON`. `SPRAY_ON` scheidet aus, weil die H125 es selbst
  bindet; `GRAPPLE_HOOK_ON`, weil die MH-60 einen Lastenhaken führen kann.


## 3. Sprachausgabe (Phase 3)

### 3.1 Referenzpunkt: was BeyondATC tatsächlich tut

Der Nutzer schätzt die Sprachqualität von BeyondATC ausdrücklich. Die
Untersuchung der Installation unter `C:\games\BeyondATC` zeigt:

- `[SHIP]` `BeyondATC_Data/Plugins/x86_64/` enthält `onnxruntime.dll` und
  `LocalVoice.dll` (96 MB) — **lokale ONNX-Inferenz auf der CPU**, kein
  Cloud-TTS für die Controller-Stimmen.
- `[SHIP]` In `LocalVoice.dll` stehen die Marker `"phoneme_type": "espeak"`,
  `"phoneme_id_map"`, `LocalVoice_InitPhonemizerFromFile`,
  `LocalVoice_InitPhonemizerFromResource`, `[Phonemizer] Missing phoneme:` und
  ein großes englisches Lexikon. Der Gegentest gegen die
  Original-Piper-Stimmkonfiguration (`en_US-ljspeech-high.onnx.json`) bestätigt:
  **das ist das Piper-Voice-Format eins zu eins**, inklusive
  `"inference": {"noise_scale", "length_scale", "noise_w"}` und
  `"audio": {"sample_rate": 22050}`. Die Gewichte liegen als DLL-Ressource,
  sind also eigene, selbst trainierte Stimmen.
- `[SHIP]` Für ATIS wird separat **DECtalk** genutzt (`dectalk.dll`,
  `dtalk_us.dic`) — bewusst die alte Roboterstimme.
- `[SHIP]` Zusätzlich ein lokales LLM (`batcllm.gguf`, 208 MB) über
  LLMUnity/llama.cpp plus RAG über USearch, für die Phraseologie.
- `[ENTWICKLER]` simFlight, 2023-12: „we are very excited to announce we will be
  offering an **offline voice option**. This voice is generated offline, locally
  on the user's machine, meaning it incurs **zero cost**." Windows SAPI wurde
  ausdrücklich als Rückschritt verworfen.
- `[ENTWICKLER]` MSFS-Forum, 2026-02-11: „they run **entirely offline** on your
  machine … **training and fine-tuning these models** requires large amounts of
  high-quality data and significant processing time (we are talking about
  hundreds of hours)."

**Die praktisch wichtigste Erkenntnis dieser Recherche zum Thema Sprache:** Das
Qualitätsniveau, das der Nutzer hört, ist eine **gut trainierte Piper-VITS-Stimme
in `high`-Qualität** — nicht ein größeres Modell. Der Hebel liegt bei der
Stimme und der Trainingsdatenqualität, nicht bei der Modellarchitektur. Das Ziel
ist mit offenen Mitteln erreichbar.

`length_scale` ist dabei der Sprechtempo-Regler; leicht über 1 wirkt ruhiger,
was für Checklisten-Ansagen relevant ist.

### 3.2 Die Grundentscheidung: Vorab-Synthese statt Echtzeit

Unsere Datenlage macht das eindeutig: **125 `challenge`-Einträge über vier
Flugzeuge**, alle Texte statisch (`challenge`, `response`, `alternatives`,
optionaler `speech`-Override), keine dynamischen Werte. Etwa 140 Ansagen à rund
2 Sekunden sind ungefähr 5 Minuten Audio — als 22,05-kHz-Mono-WAV etwa 12 MB,
als Opus mit 32 kbit/s etwa 1,2 MB.

Was Vorab-Rendern kauft:

- **Die Modellwahl wird von der Laufzeitperformance entkoppelt.** Beim Rendern
  darf das Modell einen RTF von 5 haben — MSFS läuft dann nicht.
- **Null CPU-Last und null Latenz zur Flugzeit.** Genau die Projektregel „keine
  unnötige Arbeit pro Frame".
- **Die Aussprache ist einmalig verifizierbar.** Jede der 140 Ansagen kann
  abgehört und per `speech`-Override oder IPA korrigiert werden, statt auf ein
  Laufzeit-G2P zu hoffen. Für „APU", „Ng" und „SAS 1 plus 2" ist das der
  entscheidende Punkt.
- **Weder Modell noch Phonemizer werden ausgeliefert.** Damit verschwindet die
  gesamte GPL-Frage aus der Begleit-App, wenn das Rendern ein
  Entwickler-Werkzeugschritt bleibt und nur WAV oder Opus ausgeliefert wird. Das
  ist der stärkste Einzelvorteil.

Dagegen: ein einmaliger Build- oder Erstlaufschritt, Neu-Rendern bei
Stimmwechsel, und Cache-Invalidierung bei Textänderungen — letzteres löst ein
Dateiname aus Hash über `speech`-Text, Stimme und Klangprofil.

### 3.3 Modellkandidaten

Die RTF-Werte der sherpa-onnx-Dokumentation sind auf einem **Raspberry Pi 4
Model B** gemessen (1 Thread / 4 Threads). Eine Desktop-CPU liegt grob eine
Größenordnung darüber; für eine x86-Windows-Zahl gibt es **keine belastbare
Quelle**, das ist zu messen.

| Modell | Code-Lizenz | Gewichte/Stimmen | Größe | CPU-RTF (Quelle) | ONNX gepflegt? | Aussprachekontrolle | Eignung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Piper-VITS** (`piper1-gpl` 1.7.0, 2026-08-15) | **GPL-3.0-or-later** | Repo-Tag „mit", faktisch **pro Stimme die Datensatzlizenz** | 30–75 MB | **0,79 / 0,36** (libritts_r-medium, Pi 4) | ja, natives Format | **Beste im Feld:** rohe espeak-Phoneme inline `[[ … ]]`, `--ipa=3`, Lexikon vorschaltbar | **Zweitwahl**, echtzeitfähig |
| **Kokoro-82M** (v1.0, 2025-01-27) | Apache-2.0 | **Apache-2.0** | ONNX q8 **92 MB** | **6,63 / 2,77** (Pi 4) | teils — `onnx-community/Kokoro-82M-v1.0-ONNX` letzte Änderung 2025-02; `kokoro-onnx` (MIT) aktiv | gut: `[wort](/ipa/)`, rohe Phoneme, Limit 510 Phoneme/Chunk; G2P = misaki (Apache-2.0) | **Erstwahl für Vorab-Synthese** |
| **Chatterbox Nano** (Resemble AI) | **MIT** | **MIT**, konsistent | 110M | „3x faster than realtime on CPU – 8 cores" (Modellkarte) | ja, offiziell, fp32/fp16/q8/q4 | keine dokumentierte Phonem-Eingabe | beobachten; PerTh-Watermark nicht abschaltbar |
| **PocketTTS** (Kyutai, 2026) | MIT | **CC-BY-4.0, aber gated** (Konto nötig) | 100M | „~6x realtime auf MacBook Air M4 CPU" | Community-ONNX, in sherpa-onnx | nicht dokumentiert | Gating verstößt gegen „ohne Konto" |
| **Supertonic 3** | MIT (nur Sample-Code) | **OpenRAIL-M**, nutzungsbeschränkt | ~99M | 0,012–0,015 (M4 Pro, self-reported) | ja, ONNX ist der Kern | **keine** Phonem-Eingabe | **aus** — Archivierung angekündigt |
| **Kitten TTS 0.8.1** | Apache-2.0 | Apache-2.0 | nano 15M / 25 MB int8 | keine belastbare Quelle | ja | keine öffentliche Phonem-API, intern espeak | nachrangig, „Developer preview" |
| **Matcha-TTS** | MIT | Checkpoints **ohne Lizenzangabe** | 71–73 MB | **0,94 / 0,41** (Pi 4) | ja | Phonem-Pipeline | Fallback, dormant seit 12/2024 |
| **MeloTTS** | MIT | MIT | 163 MB | **6,73 / 2,52** (Pi 4) | kein offizieller Export | G2P je Sprache | aus, unmaintained |
| **Qwen3-TTS** (2026-01-22) | Apache-2.0 | Apache-2.0 | 0,9–1,7B | keine CPU-Angabe | **kein ONNX** | – | GPU-Klasse, nachrangig |
| **eSpeak-NG 1.52** | **GPL-3.0-or-later** | – | ~2 MB | trivial | – | vollständig | Fallback und Phonemizer |
| **WinRT `SpeechSynthesizer`** | proprietär, lizenzfrei nutzbar | OneCore-Stimmen des OS | 0 | trivial | – | **SSML 1.1 mit `<phoneme alphabet="ipa">`, `<say-as>`, `<break>`** | **Nullvariante** |

**Wegen GPU-Zwang nachrangig oder ausgeschlossen:** Zonos (Linux, 6 GB VRAM,
README: CPU „won't be sufficient for interactive use"), Dia, Maya1 (16 GB
VRAM), IndexTTS, Higgs v2, Orpheus-3B, CSM-1B, Marvis (nur MLX).

### 3.4 Neu in 2025 und 2026

- **Piper hat die Lizenz gewechselt.** `rhasspy/piper` (MIT) ist seit
  **2025-10-06 archiviert**. Nachfolger `OHF-Voice/piper1-gpl` ist
  **GPL-3.0-or-later**; Grund laut CHANGELOG 1.3.0: „Embed espeak-ng directly
  instead of using separate piper-phonemize library / Change license to GPLv3".
  Aktiv gepflegt, aber das README sucht Maintainer.
- **Supertonic kam und geht wieder.** v3 mit 31 Sprachen (2026-04-29), beste
  publizierte CPU-RTFs, Bindings für C#, Rust und Node — und am 2026-07-23 die
  Ankündigung der Archivierung.
- **sherpa-onnx ist das Integrations-Ökosystem geworden.** v1.13.6
  (2026-08-18), Apache-2.0, bündelt Piper, Kokoro, Kitten, Matcha, Supertonic,
  PocketTTS, ZipVoice, MMS, MeloTTS. Offizielle Pakete für NuGet (.NET 8/10),
  npm, crates.io (seit 2026-02) und PyPI. Für eine .NET-Begleit-App der kürzeste
  Weg zu ONNX-TTS ohne Python — mit einer Lizenzfalle, siehe 3.6.
- **misaki-rs 0.3.0 (2026-02-07), MIT**: eigenständiger Rust-Port des
  Kokoro-G2P, espeak-ng nur als **abschaltbares** Default-Feature,
  Lexikondaten zur Compile-Zeit eingebettet, Zahl-zu-Wort inklusive. Das ist der
  GPL-freie Aussprachepfad.
- **Leaderboards taugen für unsere Frage nicht.** TTS Arena V2 ist die einzige
  lebende Crowd-Rangliste, mischt aber Cloud-APIs mit Open Weights, bewertet nur
  Naturalness auf frei eingegebenem Text, und die kleinen CPU-Modelle sind kaum
  vertreten (Kokoro etwa Platz 32, Piper gar nicht). **Für „welches kleine
  CPU-Modell klingt am besten" existiert keine belastbare Rangliste** — nur ein
  eigener A/B-Test mit den echten Checklistensätzen.

### 3.5 Stimmen

**Lizenzsaubere englische Stimmen sind rar.** Belegt unbedenklich: Piper
`en_US-ljspeech-high` (Datensatz **public domain**, laut MODEL_CARD „trained
from scratch", also nicht vom Lessac-Checkpoint kontaminiert), Piper
`en_US-libritts-high` (CC BY 4.0), Kokoros 54 Stimmen (Apache-2.0). Bei Kokoro
sind die männlichen Stimmen schwach (Bestnote C+ bei `am_michael`/`am_puck`),
die weiblichen stark (`af_heart` Note A). Für eine männliche Cockpit-Stimme ist
Piper `high` daher die bessere Wahl.

**Eigenes Fine-Tuning ist realistisch, aber GPU-gebunden.** Laut
`piper1-gpl/docs/TRAINING.md` wurden die meisten Piper-Stimmen auf A6000 (48 GB)
oder 3090 (24 GB) trainiert; Nutzer berichten Erfolg ab 8 GB VRAM. Nur
`medium`-Checkpoints sind ohne weitere Anpassung als Startpunkt unterstützt. Eine
Datenmengenangabe fehlt in der Doku; als Referenzpunkt entstand
`en_US-bryce-medium` laut MODEL_CARD aus **etwa 750 Aufnahmen**.

**Lizenz-Nuance, die oft falsch verstanden wird:** Die Trainingspipeline ist
GPL-3.0, aber die erzeugten Gewichte sind kein Derivat des Trainingscodes — GPL
färbt nicht auf eigene Stimmen ab. Was färbt, ist der **Basis-Checkpoint**: von
`en_US-lessac-medium` feingetunt bedeutet Blizzard-2013-Bedingungen, also
research only.

### 3.6 Lizenzfallen

**Die größte: espeak-ng zieht GPL-3.0 durch fast das ganze Feld.**
`espeak-ng` ist GPL-3.0-or-later **ohne Linking Exception**. Als Bibliothek
eingebettet färbt es auf das Gesamtwerk ab; der Aufruf als separates Programm
hält den Copyleft-Perimeter außerhalb des eigenen Codes. Betroffen:
`piper1-gpl` (embeddet es), Kitten TTS (`phonemizer` GPLv3+,
`espeakng_loader` liefert die GPL-Bibliothek im Wheel mit), Kokoro
(OOV-Fallback über `phonemizer-fork`), StyleTTS 2.

**`sherpa-onnx` ist der subtilste Fall.** Projektlizenz Apache-2.0, aber
`CMakeLists.txt` hat `SHERPA_ONNX_ENABLE_TTS` **per Default ON** und zieht über
`cmake/espeak-ng-for-piper.cmake` einen espeak-ng-Fork per FetchContent hinein.
**Ein TTS-fähiges sherpa-onnx-Binary — inklusive der NuGet-, npm- und
crates.io-Pakete — enthält GPL-3.0-Code.** Das Projekt dokumentiert diese
Konsequenz nicht.

**GPL-freie Auswege:** misaki (Apache-2.0) mit `fallback=None`; misaki-rs (MIT)
mit `default-features = false`; Modelle mit Byte- oder Zeicheneingabe (Supertonic,
Chatterbox) brauchen gar keinen Phonemizer; oder — für uns der beste Weg —
Vorab-Synthese, bei der weder Modell noch Phonemizer ausgeliefert werden.

**Piper-Stimmen: der Repository-Tag trägt nicht.** `rhasspy/piper-voices` ist
auf HuggingFace mit `license: mit` getaggt, aber jede der 175 MODEL_CARDs nennt
die Lizenz ihres Trainingsdatensatzes:

| Stimme | Tatsächliche Datensatzlizenz |
| --- | --- |
| `en_US-ljspeech-high` | **public domain**, from scratch ✓ |
| `en_US-libritts-high` / `libritts_r-medium` | CC BY 4.0 — aber `libritts_r-medium` ist „finetuned from English lessac medium" |
| `en_US-lessac-*` | **Blizzard-2013-Sonderlizenz**: „Research Purposes" only, „excludes … any commercial purpose", verbietet ausdrücklich „development, marketing, commercialisation, sale or licencing of voice synthesis … products" und die Weitergabe von Derivaten |
| `en_US-ryan-high` | CC BY-NC-SA 4.0 |
| `en_US-hfc_male` / `hfc_female` | CC BY-NC-SA 4.0 |
| `en_US-amy-medium` | „See URL" — nicht auflösbar; zusätzlich von lessac feingetunt |
| `en_GB-alba-medium` | CC BY 4.0-Datensatz, aber von lessac feingetunt |
| `de_DE-thorsten*` | **CC0** ✓ |
| `de_DE-pavoque` | CC BY-NC-SA 4.0 |

Die piper1-gpl-Doku sagt es selbst: „Piper is intended for personal use and text
to speech research only … Some voices may have restrictive licenses." Die
Lessac-Kontamination durch Fine-Tuning ist der unangenehme Teil, weil sie viele
nominell CC-BY-Stimmen betrifft.

**Weitere Fallen, an der Quelle geprüft**

- **XTTS-v2 (CPML):** „Non-commercial purposes … but only so far as you **do not
  receive any direct or indirect payment** arising from the use of the model **or
  its output**". Der Fork `idiap/coqui-ai-TTS` ist MPL-2.0 — das ändert nichts
  an der Gewichte-Lizenz.
- **F5-TTS:** Code MIT, Gewichte **CC-BY-NC** wegen der Emilia-Trainingsdaten.
  Bei **ZipVoice** (Apache-2.0-Tag) ist Emilia ebenfalls im Spiel — vor einer
  Nutzung zu klären.
- **Fish-Speech/OpenAudio:** „Fish Audio Research License", S2-Pro „Commercial
  use requires a separate license", S1-mini CC-BY-NC-SA-4.0. In jeder Generation
  gesperrt.
- **OuteTTS:** CC-BY-NC-SA-4.0.
- **Kani-TTS:** Finetune-Tag Apache-2.0, Basis **LiquidAI LFM2-350M** unter „LFM
  Open License v1.0" mit einer Umsatzschwelle von 10 Mio USD, Klausel deckt
  Derivative Works. Ungelöster Konflikt.
- **NeuTTS Air:** HF-Tag `apache-2.0`, Repo-LICENSE „NeuTTS Open License v1.0"
  mit 5-Mio-USD-Schwelle. **Echter Widerspruch**, nicht Auslegungssache.
- **Orpheus-TTS, CSM-1B, Higgs v2:** Apache-Tag auf Gewichten, die
  **Llama-3.2-Derivate** sind → die Llama Community License bleibt gebunden.
  Wird auf den Modellkarten nicht erwähnt.
- **Higgs Audio v3:** „Research and Non-Commercial License".
- **VibeVoice:** Microsoft hat den TTS-Code aus dem Repository entfernt;
  `VibeVoice-Large` liefert 401; die 1.5B-Karte sagt „limited to research purpose
  use" bei MIT-Tag.
- **StyleTTS 2:** Die Gewichte auf HuggingFace haben **überhaupt keine
  Lizenzangabe**.
- **mimic3:** AGPL-3.0, tot.
- **Kokoro:** Apache-2.0 ist konsistent — aber die Trainingsdaten enthalten laut
  Autor „synthetic audio generated by closed TTS models from large providers".
  Die Apache-Lizenz kann fremde API-Nutzungsbedingungen nicht heilen. Für ein
  privates Projekt praktisch irrelevant, für eine Veröffentlichung ein
  Restrisiko.
- **DECtalk:** `github.com/dectalk/dectalk` hat **keine Lizenzerteilung** —
  keine LICENSE-Datei, kein SPDX-Tag, kein Copyright-Verzicht; die Quellen
  wurden 2015 vom verstorbenen Originalentwickler auf einer Mailingliste
  geteilt. Das Copyright liegt weiter bei Fonix- und DEC-Nachfolgern. Für eine
  Veröffentlichung ausgeschlossen. Als bewusst technisch klingende Variante ist
  **eSpeak-NG** der saubere Ersatz.
- **`pedalboard` (Spotify):** **GPLv3** wegen JUCE. Wird oft für permissiv
  gehalten.
- **BASS/ManagedBass:** nicht frei, kommerzielle Nutzung kostenpflichtig.

**Cloud als Zusatzoption:** Für 140 kurze Ansagen preislich trivial (Azure
Neural 16 USD/1M Zeichen mit 500 000 gratis pro Monat; Deepgram Aura-2 0,030
USD/1000 Zeichen; Cartesia Sonic etwa 40 ms Time-to-first-audio; ElevenLabs
Flash v2.5 etwa 75 ms). Verletzt aber „offline ohne Konto", und Azures
Offline-Weg über Neural-TTS-Container erfordert Antragsgenehmigung und ein
Commitment-Tier. Zur Datenschutzlage der Anbieter (Training auf Input,
Zero-Retention) wurde in dieser Session **keine belastbare Quelle** verifiziert.

**Der Kontext, der über all das entscheidet:** Das Repository ist privat und hat
keine LICENSE-Datei. Solange nichts verteilt wird, sind alle Copyleft-Fragen
theoretisch. Sie werden real, sobald das MSFS-Paket samt Begleit-App
veröffentlicht wird. Das ist eine bewusst zu treffende Entscheidung.

---

## 4. Funk- und Intercom-Kette

### 4.1 Lizenzlage der Werkzeuge

Die gewünschte Filterkette liegt vollständig im **LGPL-2.1+-Kern von FFmpeg**.
Die Dateiheader wurden einzeln geprüft: `af_biquads.c` (highpass, lowpass,
bandpass, peaking), `af_sidechaincompress.c`, `af_alimiter.c`, `af_asoftclip.c`,
`af_acrusher.c`, `af_aecho.c`, `af_adeclick.c`, `af_anlmdn.c` — **alle
LGPL-2.1+**. In FFmpegs GPL-Liste steht **keine einzige `af_*.c`-Datei**;
GPL-only sind ausschließlich Videofilter und externe Bibliotheken. `--enable-gpl`
ist also nicht nötig. Aber: die verbreiteten „full"-Windows-Builds sind mit x264
und x265 gebaut und damit GPL — beim Mitliefern zu beachten.

**SoX ist faktisch tot** (letzte Release 14.4.2 vom 2015-02-22) und GPL.

### 4.2 Empfohlener Weg: eigene Biquad-Kette

Für Bandpass, Kompressor, Sättigung und Rauschen braucht es keine
Fremdbibliothek. **NAudio (MIT, 3.0.1 vom 2026-08-18)** bringt
`NAudio.Dsp.BiQuadFilter` mit `HighPassFilter`, `LowPassFilter` und `PeakingEQ`
mit; ergänzend **NWaves (MIT)**. Eine RBJ-Biquad-Kette ist etwa 150 Zeilen und
lizenzfrei. Da die Ansagen vorab gerendert werden, kann die Kette ohnehin
offline laufen — drei Cache-Varianten pro Ansage (Clean, Intercom, Radio) kosten
etwa 3,6 MB Opus.

### 4.3 Konkrete Parameter aus der Domänen-Referenz

**DCS-SimpleRadioStandalone** macht genau diese Kette für einen Flugsimulator
und hat die Werte über Jahre gegen echten Funk getunt. Die Presets stammen aus
`Common/Audio/Models/RadioModel.cs`. **Das Projekt ist GPLv3 — der Code darf
nicht übernommen werden.** Die Parameterwerte selbst sind Zahlen; die Kette ist
mit NAudio-Biquads eigenständig nachzubauen. Sample-Rate der Presets: 48 kHz.

**Radio-Profil (ARC-210, Sendekette, in dieser Reihenfolge)**

| Stufe | Parameter |
| --- | --- |
| 1 Biquad Highpass | f = 1700 Hz, Q = 0,53 |
| 2 Biquad Peaking EQ | f = 2801 Hz, Q = 0,5, Gain = +5 dB |
| 3 First-Order Lowpass | f = 5538 Hz |
| 4 Saturation (`tanh`) | Gain = +9 dB, Threshold = −23 dB |
| 5 Sidechain-Kompressor | Attack 10 ms, Release 200 ms, Threshold −33 dB, Ratio 1,18, Makeup +6 dB, Sidechain = First-Order Highpass 709 Hz |
| 6 Biquad Highpass | f = 456 Hz, Q = 0,36 |
| 7 Biquad Lowpass | f = 5435 Hz, Q = 0,39 |
| 8 Gain | +12 dB |
| Hard-Clip (global) | ± 4000/32768 ≈ ±0,122 (etwa −18,3 dBFS) |
| Rauschen | Gaussian White Noise (Box-Muller), Gain −33 dB |
| Empfangsseite | First-Order Highpass 270 Hz + First-Order Lowpass 4500 Hz |

**Intercom-Profil**

| Stufe | Parameter |
| --- | --- |
| 1 Biquad Highpass | f = 207 Hz, Q = 0,5 |
| 2 Biquad Peaking EQ | f = 3112 Hz, Q = 0,4, Gain = +16 dB |
| 3 Biquad Lowpass | f = 6036 Hz, Q = 0,4 |
| 4 First-Order Lowpass | f = 5538 Hz |
| 5 Saturation (`tanh`) | Gain = +2 dB, Threshold = −33 dB |
| 6 Sidechain-Kompressor | Attack 10 ms, Release 200 ms, Threshold −17 dB, Ratio 1,18, Makeup −1 dB, Sidechain-HP 709 Hz |
| 7 Biquad Highpass | f = 393 Hz, Q = 0,43 |
| 8 Biquad Lowpass | f = 4875 Hz, Q = 0,3 |
| 9 Gain | +8 dB |
| Rauschen | −60 dB, also praktisch trocken |
| Empfangsseite | Highpass 270 Hz + Lowpass 4500 Hz |

Bemerkenswert: Die Werte sind **nicht** das Telefonie-Klischee 300–3400 Hz. Der
Radio-Sendezweig setzt den Highpass auf 1700 Hz und holt Präsenz über einen
+5-dB-Peak bei 2,8 kHz zurück — das erzeugt das typisch dünne, nasale Funkbild
deutlich überzeugender als ein symmetrischer Bandpass. Die Sättigung ist ein
echter `tanh`, kombiniert mit einem *harten* Clip bei nur ±0,122 nach der
+12-dB-Anhebung; dort entsteht der Funk-Charakter.

**Squelch-Klick nicht synthetisieren.** DCS-SRS verwendet vorgefertigte
WAV-Samples. Für uns: zwei kurze eigene Klick-Samples von 30 bis 60 ms vor und
nach der Ansage in den Cache mischen. Das ist einfacher und klingt besser als
jede Gate-Simulation. Für Codec-Artefakte gibt es `acrusher=bits=6..8` (LGPL)
oder einen GSM-FR-Round-Trip über `--enable-libgsm` (libgsm ist ISC, kein
`--enable-gpl` nötig); AMR-NB würde FFmpeg über OpenCORE zwingend auf LGPLv3
heben.

**Flugfunk-Realität, belegt:** A3E-AM, 117,975–137,000 MHz, Kanalraster in
Europa 8,33 kHz (Verordnung (EU) 1079/2012) → theoretische Audio-Obergrenze
4,166 kHz. Die Gerätespezifikation ED-23C fordert einen Audiofrequenzgang von
300–2500 Hz innerhalb von höchstens 6 dB. Wer das Radio-Profil realistischer
will, geht auf 300/2500 statt 456/5435 — das ist dann aber weniger
verständlich, und **Verständlichkeit hat bei einer Checkliste Vorrang**.

---

## 5. Audioausgabe unter Windows

**Gemeinsame Regeln, dokumentbelegt**

- **Shared Mode, Default-Periode (10 ms). Kein Exclusive Mode** — der würde
  MSFS stummschalten oder mit `AUDCLNT_E_DEVICE_IN_USE` scheitern.
- **Kein `IAudioClient3`-Low-Latency-Pfad.** `[DOC]` Fordert eine App kleine
  Puffer, wechseln **alle Apps am selben Endpoint** auf diese Periode — das
  würde MSFS' Audiostream mitziehen und FPS kosten. 10 bis 50 ms Latenz sind für
  eine Ansage irrelevant.
- **Gerät über `IMMDevice::GetId()` persistieren, nie über den FriendlyName** —
  der ist nicht eindeutig und ändert sich.
- **`IMMNotificationClient` registrieren**, Callbacks nur als Signal in eine
  eigene Queue posten. Bei Geräteverlust liefert der Stream
  `AUDCLNT_E_DEVICE_INVALIDATED` — dann `IAudioClient` **vollständig freigeben**
  und neu über die MMDevice-API holen; ein erneutes `Initialize()` auf demselben
  Objekt scheitert mit `E_ALREADY_INITIALIZED`.
- **Stream lazy öffnen und nach kurzer Idle-Zeit schließen.** Dann überlebt die
  App SteamVR- und OpenXR-Start sowie Headset-Abstecken automatisch.
  Fallback-Kette: gewähltes Gerät → Systemstandard → Ansage verwerfen und
  loggen.

| Stack | Empfehlung | Lizenz |
| --- | --- | --- |
| **.NET** | **NAudio** — `MMDeviceEnumerator.EnumerateAudioEndPoints(Render, Active)`, `GetDevice(savedId)`, `new WasapiOut(dev, AudioClientShareMode.Shared, false, 50)`, Gerätebenachrichtigungen über `RegisterEndpointNotificationCallback` | **MIT**, aktiv (3.0.1, 2026-08-18) |
| Rust | **cpal** für Enumeration und Ausgabe, **rodio** oder **kira** zum Abspielen, **fundsp** für die Filterkette | cpal Apache-2.0; rodio, kira, fundsp MIT OR Apache-2.0 |
| Python | **sounddevice** plus PortAudio, Dateien über **soundfile** — Achtung: libsndfile ist LGPL-2.1+ | sounddevice MIT; soundfile BSD-3 |
| Node | **naudiodon** ist der einzige echte PortAudio-Weg, Pflegezustand schwach. Für diesen Zweck der schlechteste Stack — gerätegenaue WASAPI-Auswahl ist hier am wenigsten gut unterstützt | – |

**MSFS-2024-spezifisch:** MSFS hat eine eigene Geräteauswahl (Options → General
→ Sound → Sound Output Device, plus ein separates „Communications"-Gerät).
Empfehlung aus einer Addon-Herstellerdoku: dasselbe Gerät für Windows,
MSFS-Main und MSFS-Communications, und das Gerät **vor** dem Simulatorstart
anschließen. Es gibt belegte Nutzerberichte, dass MSFS 2024
**Bluetooth-Headsets in den Hands-Free-Mono-Modus zwingt**, wenn dasselbe
BT-Gerät als Ein- und Ausgabe existiert — das würde auch unsere Ausgabe treffen.
**Dass MSFS 2024 den WASAPI Exclusive Mode belegt, ist nicht belegt** — dafür
wurde keine Quelle gefunden. Der saubere Weg nach der Projektregel
„Laufzeitnachweis vor Produktivlogik": eigener Shared-Mode-Init gegen das
VR-Gerät bei laufender MSFS-Session, HRESULT loggen. `S_OK` entlastet,
`AUDCLNT_E_DEVICE_IN_USE` wäre der Gegenbeweis. `[OPEN]`

---

## 6. BeyondATC als Baustein: geprüft und verworfen

Der Nutzer besitzt BeyondATC; die Frage nach einer nutzbaren Schnittstelle war
naheliegend. Ergebnis: **technisch reizvoll, rechtlich ausgeschlossen.**

**Es gibt keine dokumentierte öffentliche API und kein SDK.** `[OFFIZIELL]` Die
vollständige Sitemap des Help Centers und von `beyondatc.net` enthält keinen
Entwickler- oder API-Bereich. Der einzige offizielle Drittentwickler-Pfad ist
**CPDLC/ACARS auf E-Mail-Anfrage**, ausdrücklich „not plug-and-play" und an
Flugzeug-Entwickler adressiert.

**Alle Community-Integrationen arbeiten um BeyondATC herum**, keine spricht ein
BATC-Protokoll: `leftos/vsr-batc` tailt die Unity-Logdatei `Player.log` alle
0,5 s und parst sie per Regex; `Jargendas/BeyondATC-ActiveSky-Bridge` spooft
`aviationweather.gov` per hosts-Datei; `stevetz/remote-beyondatc` fälscht einen
Prozessnamen; `Fragtality/BeyondAudio` schaltet nur das Ausgabegerät um.

**Der WebSocket auf Port 41716 ist kein nutzbarer Weg.** Er ist nirgends
dokumentiert (kein einziger öffentlicher Treffer), nicht konfigurierbar, und er
bricht belegt zwischen Versionen: `[OFFIZIELL]` „Version 3 … **this toolbar is
only compatible on the experimental branch on version 1.10.0+**". Entscheidend
ist die EULA: Ziffer 2.1.3 verbietet Zugriff „by any means other than the user
interfaces provided by Skirmish Mode Games", 2.1.2 „any unauthorised third-party
software designed to modify or interfere with the Application".

**Die Stimmen und Bibliotheken sind nicht verwendbar.** Ziffer 2.1.1 verbietet
„reverse engineer … derive source code from, modify, adapt, merge, disassemble,
decompile, create derivative works"; 3.1 und 3.2 beanspruchen das Eigentum,
teils an Dritt-Lizenzen. `LocalVoice.dll`, die eingebetteten Stimmen,
`batcllm.gguf`, `batc_rag.zip`, `BatcSimConnect.dll`, das Toolbar-Paket und die
DECtalk-Komponente sind damit ausgeschlossen — auch für rein internes
Extrahieren. Ziffer 1.1 beschränkt die Lizenz auf „personal, non-commercial use
only".

**Keine öffentliche Attribution.** Zu DECtalk, espeak-ng, Piper/VITS oder ONNX
existiert öffentlich keine Erwähnung durch BeyondATC; ein `licenses.txt` im
Download ist nicht einsehbar. Widersprüchlich bleibt die eigene FAQ, die
weiterhin „our voices use cloud-based technology" sagt — das gilt für die Tiers
Basic und Premium, nicht für das lokale Modell.

**Legitim bleibt:** die App wie vorgesehen benutzen; das offizielle
CPDLC/ACARS-Partnerprogramm anfragen; die vom Nutzer besessene `Player.log`
lesen (etablierte Community-Praxis, undokumentiert und formatinstabil, verletzt
aber keine Zugriffsklausel — `[ANNAHME]` zur Einordnung, keine Rechtsberatung);
und die *Idee* der Architektur mit eigenen Bausteinen nachbauen.

**Was wir trotzdem gewonnen haben:** den Qualitätsmaßstab und die
Rezeptbestätigung aus Abschnitt 3.1, den Nachweis, dass ein Coherent-JS-Kontext
localhost-WebSockets aufbauen kann (1.4), und den `INTERCEPT_KEY_EVENT`-Pfad
aus Abschnitt 2 — der ohne diesen Blick in ein fremdes Paket nicht gefunden
worden wäre.

**Sicherheitshinweis, unabhängig vom Projekt:** Die verbreitete
ActiveSky-Bridge-Anleitung lässt Nutzer ein selbst erzeugtes Zertifikat in die
*Trusted Root Certification Authorities* der Maschine installieren. Das ist ein
maschinenweiter Trust-Anchor für ein privates Schlüsselpaar. Diese Praxis wird
hier nirgends übernommen oder empfohlen.

---

## 7. Open-Source-Vorbilder

### 7.1 Wiederverwendbare Muster

| Projekt | Lizenz | Stand | Was es beweist | Visual Studio nötig? |
| --- | --- | --- | --- | --- |
| **FlyByWire SimBridge ↔ flyPad/MCDU** | GPL-3.0-only | aktiv (2026-08) | Eine In-Sim-Coherent-GT-App kommuniziert bidirektional mit einer externen Node-App über `fetch` und `WebSocket` auf `localhost:8380`. Kernstelle: `A320_Neo_CDU_MainDisplay.ts::mcduServerClientEventHandler()` — eingehende WS-Nachricht wird zu `SimVar.SetSimVarValue('H:…')`, ausgehend `sendUpdate()` nur bei Zustandsänderung. Externe Seite: NestJS `@WebSocketGateway`. | nein |
| **FlyByWire `terronnd` ↔ SimBridge** | GPL-3.0 | aktiv | Externe App ↔ In-Sim-WASM in beide Richtungen **ohne Polling**, über Client Data Areas mit `ClientDataPeriod.OnSet`. | nein |
| **FlyByWire WASM-Build** | GPL-3.0 | aktiv | `fbw-common/src/wasm/terronnd/build.sh`: `clang++ --sysroot "${MSFS_SDK}/WASM/wasi-sysroot" -target wasm32-unknown-wasi`, dann `wasm-ld`. CI läuft auf `ubuntu-latest` → **MSFS-2024-Targets werden komplett ohne Visual Studio gebaut.** | nein |
| **MobiFlight WASM Module** | MIT | Code eingefroren 2024-03, für MSFS 2024 unterstützt | Client-Data-Protokoll mit `MOBIFLIGHT_CLIENT_DATA_NAME` und Postfixen `.LVars`, `.StringVars`, `.Command`, `.Response`; Fremdclients über `MF.Clients.Add.<Name>`. **Negativ für uns:** `module_init()` abonniert dauerhaft `EVENT_FRAME` und pollt Variablen **pro Frame** — genau das, was unsere FPS-Regel verbietet. | **ja** (`.vcxproj` mit `PlatformToolset MSFS`) |
| **WASimCommander** | Modul und GUI GPL-3.0-only; Client-Library GPL-3.0 **oder** LGPL-3.0 | 1.3.1.0, 2024-11-29, MSFS 2024 unterstützt | **Das wertvolle Muster:** `resumeTriggerEvent()`/`pauseTriggerEvent()` schalten den Frame-Tick über `SimConnect_SetSystemEventState(EVENT_FRAME, ON/OFF)` mit Referenzzähler → **null Frame-Arbeit, solange kein Client eine periodische Subscription hat.** Genau die Regel, die unser Projekt braucht. | **ja** (MSBuild) |
| **OpenKneeboard** | „OpenKneeboard Public License v1" (GPLv2-Derivat mit Branding-Klausel) | aktiv (2026-08) | Fokusunabhängiger HOTAS-Input in MSFS-VR über DirectInput mit `DISCL_BACKGROUND`, event-getrieben. Als Referenz lesbar, nicht als Copy-Paste-Quelle. | – |

### 7.2 SimConnect-Bindings im Vergleich

| Sprache | Paket | Lizenz | Client Data | CommBus | MSFS 2024 | Wartung | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TypeScript | `node-simconnect` (EvenAR) | LGPL-3.0-or-later | ja, komplett | **ja** | ja (`Protocol.SunRise`) | 4.2.0, 2026-05-08 | niedrig. LGPL als separates npm-Modul unkritisch; das selbst implementierte Protokoll könnte bei SU-Updates brechen |
| TypeScript (native) | `@flybywiresim/msfs-nodejs` | MIT | ja | nein | unklar (SDK-Stand 2023) | 0.4.0, 2023-10-18 | mittel bis hoch, veraltet; npm-Tarball enthält aber ein vorgebautes `simconnect.node` |
| C#/.NET | `stopbars/SimConnect.NET` | MIT | ja (P/Invoke) | nein | ja (0.2.2, 2026-07-23) | aktiv, Beta | mittel: braucht die native `SimConnect.dll` (SDK-Redistributable, nicht OSS) |
| C#/.NET Framework | MobiFlight-Connector | MIT (Repo) | ja | nein | ja | aktiv | mittel: nutzt die unfreie `Microsoft.FlightSimulator.SimConnect.dll` |
| C++ | WASimCommander `WASimClient` | GPL-3.0 **oder** LGPL-3.0 | ja | – | ja | 2024-11 | mittel: VS-Build, Copyleft |
| Python | `odwdinc/Python-SimConnect` | **AGPL-3.0** | über Koseng-Extension (MIT) | nein | nicht belegt | letzter Push 2023-02 | hoch: AGPL und tot |
| Rust | `simconnect-sdk` | nicht verifiziert | unklar | nein | nicht belegt | crates.io-Eintrag 2023 | hoch, nicht im Code geprüft |

Nicht Open Source beziehungsweise nicht verifizierbar: **SPAD.neXt** und **Axis
and Ohs** (kein öffentliches Repository gefunden), **FSUIPC-WASM** (Freeware
ohne öffentliches Repository und ohne nachweisbare OSS-Lizenz).

### 7.3 Was öffentlich noch niemand gelöst hat

1. **Keine** externe Windows-App, die mit einer MSFS-2024-**EFB-SDK-App** redet.
   FlyByWires flyPad ist ein Aircraft-Instrument im Coherent-GT-Kontext, keine
   EFB-SDK-App.
2. **Keine** Open-Source-Nutzung der CommBus-**JS**-Seite
   (`RegisterCommBusListener`). node-simconnect implementiert nur die
   SimConnect-Hälfte.
3. **Kein** Projekt, das einen systemweiten Windows-Tastendruck in ein Ereignis
   einer In-Sim-EFB-App überträgt.
4. **Kein** Projekt, das den Fortschritt einer EFB-Checkliste an eine externe
   App spiegelt.
5. **Kein** Projekt, in dem der Sim einen Server betreibt. In allen gefundenen
   Fällen ist die Sim-Seite **Client**, die Windows-App **Server**. Für unser
   Design heißt das im WebSocket-Fall: Begleit-App = Server, EFB = Client.

---

## 8. Toolchain ohne Visual Studio

Die Randbedingung „keine Visual-Studio-Lizenz" hat sich als **nicht
blockierend** erwiesen.

- `[DOC]` Offiziell verlangt das SDK Visual Studio: „a new platform toolset was
  designed for Visual Studio"; die Anleitung „Creating A WASM Project"
  beschreibt ausschließlich VS-Templates. Der MSBuild-Toolset
  `PlatformToolset=MSFS2024` ist auf dieser Maschine nicht installiert.
- `[SDK]` Der Compiler selbst liegt aber vollständig im SDK:
  `WASM/llvm/bin/{clang-cl.exe, wasm-ld.exe, llvm-ar.exe}` plus
  `WASM/wasi-sysroot/` und `WASM/WasmVersions/MSFS_WasmVersions.a`.
  `clang-cl.exe --version` meldet `clang version 15.0.1
  (https://github.com/AsoboStudio/innative-llvm.git …)` — ein öffentlicher
  LLVM-Fork von Asobo; LLVM steht unter Apache-2.0 with LLVM Exception.
- **In dieser Session verifiziert:** `StandaloneModule/Sources/Code/Module.cpp`
  wurde aus WSL2 heraus ohne Visual Studio, ohne MSVC und ohne MSBuild zu einer
  `StandaloneModule.wasm` kompiliert und gelinkt. Kernflags:

  ```
  clang-cl.exe --target=wasm32-unknown-wasi
    "/clang:--sysroot=<SDK>\WASM\wasi-sysroot"
    /clang:-fms-extensions /clang:-fms-compatibility
    -I<SDK>\WASM\include -I"<SDK>\SimConnect SDK\include"
    -D_MSFS_WASM=1 -D_LIBCPP_NO_EXCEPTIONS -D_LIBCPP_HAS_NO_THREADS
    -D_STRING_H_CPLUSPLUS_98_CONFORMANCE_ -D_WCHAR_H_CPLUSPLUS_98_CONFORMANCE_
    /c /EHs- /GR-

  wasm-ld.exe --no-entry --export-dynamic --allow-undefined
    --export=module_init --export=module_deinit
    -L<sysroot>\lib\wasm32-wasi <SDK>\WASM\WasmVersions\MSFS_WasmVersions.a
    -lc -lc++ -lc++abi
  ```

  `-fms-extensions` ist zwingend, sonst scheitert `MSFS_WindowsTypes.h:67` an
  `__int64`.
- **Einschränkung:** Das Modul wurde **nicht** im Simulator geladen. Die Flags
  sind rekonstruiert, nicht die des offiziellen Toolsets; die Referenz-`.wasm`
  des Samples ist 76 KB gegen unsere 21 KB, es fehlen also vermutlich
  Optimierungs- und Speichereinstellungen. Ladefähigkeit: `[OPEN]`.
- `fspackagetool.exe` und der Project Editor **kompilieren kein WASM**; sie
  kopieren nur das fertige `.wasm` und bauen `layout.json`.

---

## 9. Stack der Begleit-App

Bewertet gegen die Randbedingungen: alles Open Source, kein Visual Studio, Build
möglichst aus WSL2, kleines Artefakt, keine GPU-Last, gerätegenaue
Audioausgabe, ruhige lesbare Statusanzeige plus Tray und Einstellungsfenster.

Zwei Kriterien haben sich durch die anderen Stränge **abgeschwächt**: Die
Begleit-App braucht zur Laufzeit **keine ONNX-Inferenz**, weil die Ansagen vorab
gerendert werden (3.2), und sie braucht **möglicherweise keine
Global-Input-Bibliothek**, falls der In-Sim-Weg trägt (2.1). Umgekehrt ist das
Kriterium **SimConnect-Binding mit CommBus** durch Abschnitt 1 zum wichtigsten
geworden.

### 9.1 Rangfolge

**1. .NET 10 LTS mit Avalonia.** Der einzige Kandidat, der alle harten
Kriterien gleichzeitig erfüllt: durchgehend MIT, Build allein mit der `dotnet`
CLI ohne jede C++-Toolchain, `dotnet publish -r win-x64` aus WSL2 möglich,
Artefakt rund 24 bis 42 MiB, Retained-Mode-UI ohne Dauerlast. **NAudio 3.0.1
(MIT, keine native Datei)** liefert über `MMDeviceEnumerator` und `MMDevice.ID`
die präziseste gerätegenaue Audioausgabe im Feld. Restrisiko ist allein die
SimConnect-Bindung — siehe 9.3.

**2. Node und TypeScript mit Electron.** Gewinnt genau dort, wo Stack 1 sein
Restrisiko hat: `node-simconnect` 4.2.0 implementiert Client Data Areas **und
CommBus** in reinem TypeScript, ohne `SimConnect.dll`, ohne Compiler und ohne
EULA-Frage. Dazu ein Stack, ein npm und ein Taskfile für EFB-App und
Begleit-App. Bezahlt wird mit einem Artefakt von 330 bis 400 MB, gemessenen rund
211 MiB PSS über sechs Prozesse und einem GPU-Prozess, der auch bei
`disableHardwareAcceleration()` bestehen bleibt.

**3. Rust.** Sauber lizenziert und klein, aber `simconnect-sdk` 0.2.3 deckt laut
eigener `FEATURES.md` **Client Data Areas gar nicht ab und kennt kein CommBus** —
der entschiedene Transportweg wäre Eigenentwicklung. Slint kostet im freien Weg
GPL-3.0 für die ganze Anwendung, `egui`/`eframe` bringt GPU-Rendering mit, und
der `-msvc`-Pfad führt in die Build-Tools-Lizenzgrauzone.

**4. Python.** Scheitert am Kernkriterium: **kein Freezer cross-kompiliert von
WSL2 nach Windows**, ein Windows-Build-Schritt ist zwingend. Beide
SimConnect-Bindings sind tot (`pysimconnect` letzter Stand 2023-06,
`SimConnect` 2022-06), letzteres ist **AGPL-3.0**. Dazu 250 bis 300 MB entpackt
und LGPL-Pflichten über PySide6.

### 9.2 GUI-Frameworks

| Framework | Exakte Lizenz | Ohne VS-IDE baubar | Eignung Statusanzeige + Tray |
| --- | --- | --- | --- |
| **Avalonia 12.1.1** | **MIT** | **ja**, `dotnet` CLI, kein MSVC | **sehr gut** — `TrayIcon` eingebaut, Windows „Full support", Retained Mode |
| WPF (net10-windows) | MIT | ja auf Windows; aus Linux unklar | gut, aber hardwarebeschleunigt |
| WinUI 3 / Windows App SDK | **nicht MIT** — „Microsoft Software License Terms – Microsoft Windows App SDK" | unklar, CLI-Weg ruht auf einem `0.0.6-alpha`-Template | ungeeignet wegen Lizenz und Tooling |
| Uno Platform | Apache-2.0 (Hot Design nur in Studio Pro, kostenpflichtig) | unklar | keine Erkenntnis zum Tray |
| Eto.Forms 2.11.0 | BSD-3-Clause | ja | keine Erkenntnis zum Tray |
| Photino.NET 4.0.16 | Apache-2.0 | ja | keine Erkenntnis |
| `eframe`/`egui` 0.36.1 | MIT OR Apache-2.0 | ja mit `-gnu`; `-msvc` Grauzone | **GPU-Risiko** — Immediate Mode über wgpu/glow |
| `iced` 0.14.0 | MIT | ja mit `-gnu` | Software-Renderer `tiny-skia` **nicht verifiziert** |
| Slint 1.17.1 | `GPL-3.0-only OR` zwei kommerzielle Alternativen | ja | frei **nur als GPL-3.0-only für die gesamte App** |
| Tauri 2.11.5 | Apache-2.0 OR MIT | **nein** — Prerequisites verlangen „Microsoft C++ Build Tools" | gut, aber Build-Blocker |
| Electron 44 | MIT | **ja**, kein `node-gyp` im Stack | gut — `Tray` eingebaut; 366 MiB entpackt, rund 211 MiB PSS |
| PySide6 6.11.2 | `LGPL-3.0-only OR GPL-2.0-only OR GPL-3.0-only` | ja, Binary-Wheels | gut, `QSystemTrayIcon`; onedir statt onefile wegen LGPL |
| PyQt6 6.11.0 | GPL-3.0-only oder kommerziell — Riverbank: „PyQt is not available under the LGPL" | ja | **Lizenz-Ausschluss** |
| Dear PyGui 2.3.1 | MIT | ja | **disqualifiziert** — DirectX 11, nutzt die GPU, kein Tray |
| flet 0.86.5 | Apache-2.0 | **nein** — Build verlangt VS mit C++-Workload, nur auf Windows | Build-Blocker |
| wxPython 4.3.1 | wxWindows Licence | ja | keine Erkenntnis zum Tray |

### 9.3 SimConnect aus .NET: die Kernfrage von Stack 1

Drei belegte Befunde, die zusammen die Entscheidung prägen:

- **`Microsoft.FlightSimulator.SimConnect.dll` ist unter .NET 8, 9 und 10 nicht
  ladbar.** Eigene PE-Analyse der SDK-1.7.3-Datei: COR20-Flags `0x10`
  (`ILONLY=false`, `NATIVE_ENTRYPOINT=true`), Section `.nep`, Imports
  `mscoree.dll`, `VCRUNTIME140.dll`, `SimConnect.dll`, Target
  `.NETFramework,Version=v4.6.1`. Das ist eine Mixed-Mode-C++/CLI-Assembly;
  laut Microsoft müssten `/clr`-Assemblies mit `/clr:netcore` neu kompiliert
  werden, und NativeAOT schließt C++/CLI ausdrücklich aus. Der Ausweg .NET
  Framework 4.8 bricht Single-File-Publish.
- **Die native `SimConnect.dll` exportiert 117 undekorierte
  `extern "C"`-Funktionen**, einschließlich aller sechs Client-Data-Funktionen
  und `SimConnect_CallCommBusEvent`, `SimConnect_SubscribeToCommBusEvent`,
  `SimConnect_UnsubscribeToCommBusEvent`. **P/Invoke ist damit trivial** — der
  Managed-Wrapper wird nicht gebraucht.
- **Aber der MSFS-SDK-EULA erlaubt die Weitergabe nicht wortlautsicher.** Aus
  dem installierten SDK extrahiert („MS Flight Simulator SDK EULA (11/2019)"),
  §2(e): verboten ist „share, publish, distribute, or lend the Software (except
  for any distributable code, subject to the terms above)". „Distributable code"
  wird nirgends definiert, und „SimConnect" kommt im EULA nicht vor.
  Gegenläufig: das SDK bringt `SimConnect SDK/installer/SimConnect.msi` mit, das
  die DLL nach WinSxS installiert, und die Community liefert sie mit. Drei
  DevSupport-Threads dazu sind seit Juli und August 2026 unbeantwortet.
  **Wortlautsicher ist nur, die DLL nicht mitzuliefern** — also entweder den
  Nutzer die `SimConnect.msi` installieren zu lassen oder `node-simconnect` zu
  verwenden, das sie gar nicht braucht.
- Randnotiz: §1(g) des EULA verbietet die SDK-Nutzung für „AI or machine
  learning". Unser TTS berührt das SDK nicht, aber der Satz ist zu notieren.
- `[OPEN]` Ob `SimConnect.NET` 0.2.2 (MIT, Beta) die drei CommBus-Funktionen
  abdeckt, ist ungeprüft; die Client-Data-Funktionen sind im Quellcode belegt.

### 9.4 Fallstricke

**Heimlicher Bedarf an MSVC oder Windows SDK**

- **NativeAOT in .NET:** Prerequisite ist wörtlich „Visual Studio 2022 or later,
  including the Desktop development with C++ workload"; Cross-OS-Publishing ist
  nicht unterstützt. **DO:** NativeAOT weglassen — dann braucht der .NET-Weg
  nirgends einen C++-Compiler.
- **Tauri v2:** „Microsoft C++ Build Tools … required for development on
  Windows", `-msvc`-Host-Triple, MinGW nicht erwähnt; Cross-Build aus Linux
  offiziell „possible with caveats … not tested as much", `.msi` nur auf
  Windows.
- **flet:** Windows-Build verlangt Visual Studio mit C++-Workload und läuft nur
  auf Windows.
- **npm-Pakete mit `node-gyp rebuild`:** `naudiodon`, `naudiodon2`, `speaker`,
  `node-tray` — alle ausgeschlossen. `audify` lädt Prebuilds über das
  deprecated `prebuild-install` und fällt sonst auf CMake plus MSVC zurück.
- **Rust `-msvc`:** MSVC-Linker und Windows SDK nötig. `cargo-xwin` und `xwin`
  (MIT OR Apache-2.0) beschaffen beides für Linux-Hosts, verlangen aber
  `--accept-license`.
- **Die Build-Tools-Lizenz deckt das eigene Kompilat nicht.** Klausel 1/d
  erlaubt das Kompilieren von C++-Komponenten, die „have been released by **a
  third party** under an open-source software license approved by the Open
  Source Initiative"; der Microsoft-C++-Blog sagt: „if you and your team need to
  compile and develop proprietary C++ code with Visual Studio, a Visual Studio
  license will still be required." **Entschärfung:** Visual Studio **Community**
  ist für Einzelentwickler kostenfrei (Ausschluss erst ab 250 PCs oder über
  1 Mio USD Umsatz) — die IDE muss nie gestartet werden, es geht nur um die
  Berechtigung. Für die empfohlenen Stacks ist das ohnehin gegenstandslos.

**Kommerziell oder Copyleft**

- **`Microsoft.WindowsAppSDK` (WinUI 3) ist nicht MIT**, sondern proprietärer
  Microsoft-EULA, obwohl das Repository MIT ist.
- **Slint:** freier Weg nur GPL-3.0-only. **PyQt6:** GPLv3 oder Kauf.
  **PySide6:** LGPL erfüllbar, verlangt aber austauschbare Qt-DLLs, also onedir
  statt onefile; nur `PySide6-Essentials` nehmen, `PySide6-Addons` enthält
  GPL-3.0-only-Module.
- **LGPL-3.0 im Kern:** `node-simconnect` (LGPL-3.0-or-later — **nicht in ein
  minifiziertes Single-File-Bundle einschmelzen**), `libuiohook` (an den
  Quell-Headern verifiziert) statisch in `uiohook-napi` und `SharpHook`,
  `pynput`, `pystray`.
- **Nuitka ist AGPL-3.0** (die Runtime-Exception schützt nur das Kompilat), nicht
  Apache-2.0. **PyInstaller** ist GPLv2+ mit Bootloader-Exception, die das
  Bundle freistellt.
- **`msfs-simconnect-api-wrapper`:** npm deklariert CC0-1.0, die `LICENSE.md`
  erlaubt nur nicht-kommerzielle Nutzung und verweist auf eine Kauflizenz →
  **kein Open Source.** Merksatz: **die Lizenzfelder von npm und PyPI sind hier
  nicht vertrauenswürdig, die LICENSE-Datei zählt.**

**Weitere Fallstricke**

- **`PasswordVault`** ist laut Klassenreferenz für Desktop-Apps außerhalb eines
  AppContainers freigegeben, wird aber von einem WindowsAppSDK-Maintainer als für
  Full-Trust defekt beschrieben (`0x80070490`) und hat ein Limit von 20
  Credentials. **DO:** `CredWrite`/`CredRead` verwenden.
- **`electron-builder` aus Wine** funktioniert nur, solange keine native
  Dependency ohne Prebuild im Baum ist.
- **Electron `globalShortcut`** ist im Chromium-Quellcode als `RegisterHotKey`
  plus `WM_HOTKEY` verifiziert, kennt nur `MOD_SHIFT|CONTROL|ALT` und scheitert
  bei Konflikt **still**.
- **`onnxruntime-node` zieht in WSL2 CUDA-Binaries** —
  `ONNXRUNTIME_NODE_INSTALL=skip` setzen. Nur relevant, wenn das Vorab-Rendern
  im selben Stack läuft.
- **WebView2** ist laut Microsoft „included as part of the Windows 11 operating
  system" — für WebView-basierte Ansätze auf Windows 11 unkritisch.
- `keytar` ist **tot** (`atom/node-keytar` archiviert am 2022-12-15).
  Electrons `safeStorage` ist DPAPI und schützt laut Doku „not from other apps
  running in the same userspace".

### 9.5 Windows Credential Manager

| Stack | Bibliothek | Lizenz |
| --- | --- | --- |
| .NET | `CredWrite`/`CredRead` per P/Invoke (advapi32, keine Adminrechte, Blob-Grenze 2560 Bytes) oder `Meziantou.Framework.Win32.CredentialManager` 3.0.1 | MIT |
| Node/TS | **`@napi-rs/keyring` 1.3.0** mit Prebuild `win32-x64-msvc` (1,78 MB, kein Build); bindet `keyring-rs` über `Win32_Security_Credentials` | MIT (keyring-rs: MIT OR Apache-2.0) |
| Rust | `keyring` 4.1.6 (2026-08-01) oder das `windows`-Crate mit `CredWriteW`/`CredReadW` | MIT OR Apache-2.0 |
| Python | `keyring` 25.7.0 — `WinVaultKeyring` über `pywin32-ctypes`, kein Compile | MIT |

### 9.6 Build aus WSL2

| Stack | Geht das? | Fall „Build muss doch auf Windows laufen" |
| --- | --- | --- |
| .NET | **Ja.** `dotnet publish -r win-x64` läuft von Linux; die Runtime-Packs sind normale NuGet-Pakete, für Windows-Targets ggf. `EnableWindowsTargeting=true`. **Ausnahme: NativeAOT nicht cross-OS.** | **Gering** — `dotnet` SDK per winget, gleiche Kommandozeile. |
| Node/TS | **Ja, dokumentiert.** `electron-builder` (MIT) baut Windows-Targets aus Linux mit Wine; NSIS braucht kein Mono. Bedingung: keine native Dependency ohne Prebuild. Bonus: `node-simconnect` ist plattformübergreifend. | **Gering** — `npm run` identisch. |
| Rust | **Wahrscheinlich** über `cargo-xwin`; `x86_64-pc-windows-gnu` mit MinGW-w64 ist vollständig Open Source. Testen nur auf Windows. | **Gering** — `rustup` plus MinGW. Aber `-msvc` ist Lizenzgrauzone. |
| Python | **Nein, harter Blocker.** cx_Freeze: „on each platform, it only makes an executable that runs on that platform"; PyInstaller empfiehlt eine VM pro Ziel-OS. | **Der Normalfall, nicht die Ausnahme** — zwingend ein Windows-Build-Schritt oder „run from source" per `uv`. |

### 9.7 Nicht verifiziert

- Der Rust-Detailstand jenseits der zitierten crates.io-Abfragen: `xilem`,
  `masonry`, `dioxus`, `freya`, `native-windows-gui`, `winsafe` (Versionen,
  Lizenzen, Wartungsstand); `rodio`, `fundsp`, `dasp`; die Software-Renderer-
  Optionen bei `iced` und Slint; ob `cargo-xwin` mit einer Vendor-`.lib` wie
  `SimConnect.lib` durchläuft; Binärgrößen und Startzeiten.
- Startzeiten und gemessene Publish-Größen für Avalonia — in dieser
  WSL2-Umgebung ist kein `dotnet` installiert; die 24 bis 42 MiB sind aus
  verifizierten Einzelkomponenten gerechnet, kein durchgeführter Publish.
- Ob `SimConnect.NET` 0.2.2 die drei CommBus-Funktionen abdeckt.
- Ob `setSinkId` unter Electron ein konkretes Windows-Ausgabegerät zuverlässig
  trifft — die Permissions sind belegt, das Laufzeitverhalten nicht.
- Ob `node-simconnect` aus WSL2 per TCP gegen MSFS 2024 arbeitet
  (`SimConnect.xml` mit `<Address>0.0.0.0</Address>`).
- Ob WPF-XAML-Kompilierung mit `EnableWindowsTargeting` heute auf Linux
  durchläuft — `dotnet/wpf#688` ist *declined*, `dotnet/sdk#3803` *not planned*.
- Tray-Eignung von Eto.Forms, Uno, wxPython und Photino.
- Cold-Start-Zahlen für PyInstaller mit PySide6.

## 10. Zusammenfassung: was jetzt entschieden werden muss

| Nr. | Komponente | Aussichtsreichste Option | Hauptalternative | Was daran hängt |
| --- | --- | --- | --- | --- |
| 1 | **Bestätigungseingabe** | `INTERCEPT_KEY_EVENT` in der EFB-App auf `AUTOCOORD_ON`, `passThrough = true` | DirectInput auf einen HOTAS-Knopf in der Begleit-App | Ob Phase 2 für das Abhaken überhaupt eine externe App braucht |
| 2 | **Transportkanal** | CommBus über SimConnect (`BROADCAST_TO_JS`) | localhost-WebSocket, mit Regeländerung | Rückkanal für die Fortschrittsanzeige und den Phase-3-Trigger |
| 3 | **Begleit-App-Stack** | .NET 10 mit Avalonia, SimConnect per P/Invoke | Node und TypeScript mit `node-simconnect` | Ob wir die `SimConnect.dll` anfassen müssen (EULA) und wie groß das Artefakt wird |
| 4 | **TTS-Strategie** | Vorab-Synthese, Kokoro-82M oder Piper `ljspeech-high` | Echtzeit über sherpa-onnx; Nullvariante WinRT | Lizenzprofil der ganzen Auslieferung |
| 5 | **Funk- und Audio-Kette** | eigene Biquad-Kette mit den DCS-SRS-Parametern, NAudio | FFmpeg als separater Prozess | – |
| 6 | **Lizenz- und Veröffentlichungsstrategie** | – | – | **Entscheidet Nr. 4 mit**: solange nichts verteilt wird, sind alle Copyleft-Fragen theoretisch |

---

## 11. Offene Laufzeitnachweise, gesammelt

Nach Priorität. Die ersten beiden entscheiden die Architektur von Phase 2.

1. ~~**Feuert `keyIntercepted` in einer EFB-App?**~~ **Geführt am 2026-08-27**
   in der DA42, siehe 2.8. Offen bleibt der Test mit **H125 und MH-60** wegen
   des Hubschrauber-Bugs aus Topic 4906.
2. **Kommt ein selbst benannter CommBus-Event von SimConnect in der EFB-App an,
   und wie sendet die EFB-App zurück?** Siehe 1.8, Punkte 1 und 2.
3. **Lebensdauer der Listener-Registrierung** bei `AppBootMode.COLD` und
   `AppSuspendMode.SLEEP`, inklusive FPS-Wirkung einer Änderung. Siehe 1.8,
   Punkt 4.
4. **Verhalten nach dem VR-Wechsel**, der den App-Kontext neu erzeugt — müssen
   Intercepts und Listener neu gesetzt werden?
5. **Maximale CommBus-Nutzlast** und Chunk-Verhalten.
6. **WASAPI Shared Mode gegen das VR-Gerät** bei laufender MSFS-Session,
   HRESULT protokollieren.
7. **A/B-Hörtest** der Kandidatenstimmen mit den echten Checklistensätzen — für
   „welches kleine CPU-Modell klingt am besten" existiert keine belastbare
   Rangliste.
8. Nur falls K2 gebraucht wird: **lädt ein mit den rekonstruierten clang-Flags
   gebautes WASM-Modul** im Simulator?

---

## 12. Quellen

### Installiertes SDK 1.7.3 (read-only)

- `SimConnect SDK/include/SimConnect.h` — 131, 438-445, 997-1001, 1079-1084,
  1102-1108, 1130-1132
- `WASM/include/MSFS/MSFS_CommBus.h`, `WASM/include/MSFS/MSFS_Network.h`
- `Samples/VisualStudio/SimConnectSamples/CommBus/CommBus.cpp`
- `Samples/DevmodeProjects/SimObjects/Aircraft/WasmAircraft/PackageSources/Copys/aircraft-wasm-commbus/MyCompany_CommBus_Aircraft_HtmlGauge/ModuleCommJsGauge.js`
- `Samples/DevmodeProjects/Misc/StandaloneModule/` (Projekt- und
  PackageDefinition-XML, `Module.cpp`)
- `Samples/DevmodeProjects/EFB/PackageSources/efb_api/dist/index.js:1754`,
  `:1764`; `Listeners/InputStackListener.d.ts`, `Input/InputManager.d.ts`,
  `Input/InputAction.d.ts`
- `Tools/Setup_InputProfiles/action.actiondb`
- `Tools/Blender/addons/lod_tools_msfs_2024/documentation.html:4077`, `:10329`
- `WASM/llvm/bin/`, `WASM/wasi-sysroot/`, `WASM/WasmVersions/`
- `SimConnect SDK/lib/SimConnect.dll`,
  `SimConnect SDK/lib/managed/Microsoft.FlightSimulator.SimConnect.dll`

### Offizielle Dokumentation

- Communication API, JavaScript-Seite:
  `docs.flightsimulator.com/msfs2024/html/6_Programming_APIs/JavaScript/Communication_API/Communication_API.htm`
- Communication API, WASM- und SimConnect-Seite (gleicher Pfadstamm), sowie
  `SimConnect_CallCommBusEvent`, `SimConnect_SubscribeToCommBusEvent`,
  `SIMCONNECT_COMM_BUS_BROADCAST_TO`
- Network API (WASM), WebAssembly, Creating A WASM Project, Release Notes,
  SDK-Release-Notes
- `JS_LISTENER_KEYEVENT` (2024 und 2020), Miscellaneous Events, Helicopter
  Specific Events, Key Events Index, Transversal Input Profiles
- `SimConnect_MapInputEventToClientEvent_EX1`
- Microsoft Learn: `RegisterHotKey`, `RAWINPUTDEVICE`
  (`RIDEV_INPUTSINK`/`RIDEV_EXINPUTSINK`/`RIDEV_NOHOTKEYS`),
  `LowLevelKeyboardProc`, XInput und DirectInput, GameInput `SetFocusPolicy`,
  Core Audio Exclusive-Mode Streams, Device Events, Low Latency Audio,
  `Windows.Media.SpeechSynthesis`
- OpenXR-Spezifikation, `input.adoc:1344-1346`

### DevSupport-Forum

3119 (Masking, Asobo), 3221 (SU4-Intercept, kein Unregister), 3261
(Toolbar-Panel), 4906 (**Hubschrauber-Regression, Asobo-Bestätigung**), 5001,
6335 (welche Events feuern, Gamepad), 8320 #6 (**Asobo:
`TransmitClientEvent` umgeht JS-Interception**), 8395 und 4003 (**Asobo:
Coherent-GT-WebSocket-CTD**), 13023 (F13–F22), 14177, 15285 (**CommBus in der
EFB**), 16727 (Textfelder), 16832, 17010 und 18345 (`EnumerateControllers`),
18023 (LVar-Latenz), 18029 (MSFS 2024 1.7.27.0, Intercepts im Einsatz), 18142
(Asobo, CommBus-IDs), 18357 (SU6-Input-Strings)

### Open Source

- `github.com/EvenAR/node-simconnect` (LGPL-3.0-or-later, 4.2.0)
- `github.com/microsoft/msfs-avionics-mirror`, `src/sdk/data/KeyEventManager.ts`
  (MIT mit MSFS-Addendum)
- `github.com/flybywiresim/aircraft` und `.../simbridge` (GPL-3.0)
- `github.com/MobiFlight/MobiFlight-WASM-Module` (MIT),
  `.../MobiFlight-Connector` (MIT)
- `github.com/mpaperno/WASimCommander` (GPL-3.0 / LGPL-3.0)
- `github.com/OpenKneeboard/OpenKneeboard`,
  `src/app/app-common/UserInput/DirectInputListener.cpp:45-48`
- `github.com/ciribob/DCS-SimpleRadioStandalone` (GPLv3),
  `Common/Audio/Models/RadioModel.cs`
- `github.com/naudio/NAudio` (MIT), `github.com/AsoboStudio/innative-llvm`
- `github.com/OHF-Voice/piper1-gpl` (GPL-3.0),
  `github.com/rhasspy/piper` (MIT, archiviert 2025-10-06),
  `huggingface.co/rhasspy/piper-voices` (MODEL_CARDs einzeln)
- `huggingface.co/hexgrad/Kokoro-82M` (Apache-2.0),
  `github.com/hexgrad/misaki` (Apache-2.0), `lib.rs/crates/misaki-rs` (MIT),
  `github.com/thewh1teagle/kokoro-onnx` (MIT)
- `github.com/k2-fsa/sherpa-onnx` (Apache-2.0, mit espeak-ng per FetchContent),
  `nuget.org/packages/org.k2fsa.sherpa.onnx`
- `github.com/espeak-ng/espeak-ng` (GPL-3.0-or-later)
- `github.com/tauri-apps/global-hotkey` (MIT OR Apache-2.0),
  `nuget.org/packages/Vortice.DirectInput` (MIT),
  `github.com/libusb/hidapi` (GPLv3 / BSD-3 / original), SDL3 (zlib)
- `github.com/immrk/next-efb` (MIT), `github.com/SnosMe/uiohook-napi` (MIT
  Wrapper, LGPL-3.0 libuiohook)

### Ausgelieferte Pakete auf dieser Maschine

- `Packages/Community/beyondatc-toolbar/html_ui/InGamePanels/beyondatc_toolbar/beyondatc_toolbar.js`
- `Packages/Community/mamudesign-efb-animatelifts/html_ui/efb_ui/efb_apps/AnimateLiftsEfbApp/AnimateLiftsEfbApp.js:5453`
- `Packages/Community/sayintentions-efb/html_ui/efb_ui/efb_apps/SayIntentions/SayIntentions.js`
- `Packages/Community/mobiflight-event-module/`
- `C:\games\BeyondATC\BeyondATC_Data\` (Plugins, StreamingAssets, Managed)
- `beyondatc.net/terms-and-coniditions`, `/privacy-policy`, `/download`;
  `wiki.beyondatc.net` (Help Center)

### Projektintern

- `msfs/PackageSources/VRChecklist/src/VRChecklist.tsx:305-316`, `:333`,
  `:337-341`, `:1125-1126`
- `msfs/PackageSources/VRChecklist/node_modules/@microsoft/msfs-sdk/msfssdk.js:2596`,
  `:2630`, `:2677`; `msfssdk.d.ts:18712-18787`, `:50163`
- `msfs/PackageSources/VRChecklist/node_modules/@microsoft/msfs-types/js/common.d.ts:115`,
  `:508`, `:528`
- `docs/msfs-sdk-reference.md`, `docs/phase-2-tech-stack-plan.md`
