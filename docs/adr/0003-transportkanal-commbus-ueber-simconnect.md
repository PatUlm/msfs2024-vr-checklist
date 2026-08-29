# ADR 0003: Transportkanal über den CommBus mit SimConnect

- **Status:** Vorgeschlagen — der Laufzeitnachweis steht aus
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3 (nach [ADR 0005](0005-phase-2-auf-die-efb-app-verkuerzen.md))
- **Grundlage:** [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitt 1; normative Fakten in
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md)

## Kontext

Die EFB-App soll ihren Checklistenstand und ein Abschlussereignis an eine lokale
Windows-Begleit-App melden. Bis zu dieser Recherche war unklar, wie eine
Nachricht überhaupt zwischen einem prozessexternen SimConnect-Client und dem
JavaScript-Kontext der EFB-App transportiert wird; die bisherige Annahme, die
Communication API bilde diesen Übergang ab, war ausdrücklich als unbewiesen
gekennzeichnet.

Die Recherche hat den dokumentierten Weg gefunden: Seit SDK 1.6.4 hat auch die
SimConnect-Seite Zugriff auf den CommBus. Es gibt ein offizielles
bidirektionales Sample, und `node-simconnect` implementiert die Pakete in reinem
TypeScript.

## Entscheidung

Der Kanal ist der **CommBus über SimConnect**:

- Extern → EFB:
  `SimConnect_CallCommBusEvent(h, "<name>", SIMCONNECT_COMM_BUS_BROADCAST_TO_JS, len, buf)`
- EFB → extern: JS sendet auf dem CommBus-Listener, der Client empfängt über
  `SimConnect_SubscribeToCommBusEvent` ein `SIMCONNECT_RECV_COMM_BUS` und setzt
  die Chunks über `dwEntryNumber`/`dwOutOf` zusammen.

Kein WASM-Modul, kein zusätzliches Paket, kein C-Compiler.

## Begründung

- **Dokumentiert, mit offiziellem SDK-Sample.** Das ist der wesentliche
  Unterschied zur Alternative.
- Keine zusätzlichen Artefakte und keine Netzwerkfläche.
- Die bestehende Projektregel gegen eine undokumentierte localhost-Verbindung
  aus der EFB-WebView bleibt unberührt.
- Der Kanal ist nachweislich **nicht paket- oder view-lokal**: Unsere EFB-App
  empfängt über `RegisterViewListener("JS_LISTENER_COMM_BUS")` schon heute
  Flow-API-Events, die aus dem Sim-Kern und damit von außerhalb unseres Pakets
  stammen.
- Die App hat den Listener bereits offen; es kommt ein Eventname hinzu, kein
  neuer Mechanismus.

## Verworfene Alternativen

- **localhost-WebSocket.** Der billigste Weg, mit dem stärksten empirischen
  Nachweis: Das ausgelieferte Paket `mamudesign-efb-animatelifts` ruft `fetch`
  gegen `http://localhost:8080/` direkt aus einer EFB-App auf; BeyondATC und
  FlyByWire nutzen WebSockets aus In-Sim-JS. Verworfen, weil er in der gesamten
  SDK-Doku nicht vorkommt, weil Asobo einen Absturz in `CoherentUIGT.dll` bei
  vielen Socket-Erzeugungen bestätigt hat — ein leckender Reconnect-Loop kann
  also den Simulator abschießen —, weil ein unauthentisierter lokaler Port
  entsteht, und weil eine Projektregel dafür geändert werden müsste. Bleibt als
  bewusst dokumentierte Ausnahme in Reserve, falls der Nachweis für den CommBus
  scheitert.
- **WASM-Brückenmodul plus CommBus.** Funktioniert, ist aber in jeder Dimension
  unterlegen: gleicher Kanal, plus ein C++-Modul, ein zweites Paket und ein
  zweiter Build. Nur relevant, wenn der direkte Weg fällt. Die Toolchain wäre
  kein Hindernis — ein WASM-Modul ist mit dem SDK-eigenen clang ohne Visual
  Studio baubar.
- **Client Data Areas allein.** Es gibt keine JS-API dafür; erreicht den
  EFB-Kontext ohne WASM nicht.
- **LVars oder H-Events.** LVars erfordern auf der SimConnect-Seite periodische
  Requests, also Polling — durch die Projektregeln ausgeschlossen. Ein externer
  Client kann keinen H-Event direkt senden.
- **Key-Events aus der externen App.** Asobo hat bestätigt, dass
  `SimConnect_TransmitClientEvent` die JS-Interception umgeht.

## Konsequenzen

- Der Rückkanal sendet **nur bei Zustandsänderung** und mit Ratenbegrenzung.
  Grund: Bei pausierter Simulation laufen WASM und SimConnect weiter,
  JavaScript nicht; Events an JS werden gequeued und erst beim Fortsetzen
  verarbeitet, bei Stau ist ein Freeze möglich.
- Die Chunk-Reassembly ist auf der Client-Seite Pflicht.
- Es gibt **keine Typisierung**: „CommBus" kommt weder in
  `@microsoft/msfs-sdk` 2.1.1 und 2.3.3 noch in `@microsoft/msfs-types` 1.14.6
  oder `@efb/efb-api` 1.0.3 vor. Die Anbindung erfolgt per eigener
  Ambient-Deklaration, wie schon bei `RegisterViewListener`.
- SDK 1.7.3 wird als Minimum vorausgesetzt; es enthält den Fix für „rare random
  deadlocks when using the CommBus API".
- Die CommBus-Pakete sind auf `Protocol.SunRise` gegated, also MSFS 2024
  exklusiv. Für dieses Projekt unerheblich.

## Offene Nachweise

Die Entscheidung bleibt `Vorgeschlagen`, bis der bidirektionale Kanal und sein
Lifecycle in MSFS bestätigt sind. Die einzelnen Nachweise werden ausschließlich
in [`../open-tests.md`](../open-tests.md) gepflegt.
