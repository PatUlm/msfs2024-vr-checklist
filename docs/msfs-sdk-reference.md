# MSFS 2024 SDK: lessons learned

The single place for confirmed MSFS/Coherent specifics that prevent a future
bug. Each finding states its scope and a rule of action. No raw logs, test
history or repetition of ordinary API behavior. Product rules are in
[design-decisions.md](design-decisions.md), architecture in the
[ADRs](adr/README.md), open tests in [open-tests.md](open-tests.md).

`[RT]` means confirmed at runtime in this project, `[SDK]` documented in the
SDK, samples or documentation, `[NEG]` an obvious approach that proved
unsuitable. Use markers only where they help classify a finding.

## Scope

MSFS 2024 SDK / EFB Template 1.7.3, EFB API 1.0.3, MSFS SDK package 2.1.1 and
MSFS types 1.14.6. After updates, reassess only the affected findings.

## Packaging and test iteration

- **[NEG]** With MSFS running, `fspackagetool.exe` can attach to the simulator
  and wait for it to exit without building. Exit MSFS before CLI release
  builds and only then start the build.
- **[RT]** In the VFS, DevMode packages take precedence over Community packages
  of the same name; the installation does not need to be removed for
  development.
- **[RT]** After a normal reload, Coherent may use old assets: use
  **Ignore Cache + Reload** after every new build.
- **[RT]** UI changes need no restart or new flight; lifecycle and reset checks
  do need a new flight.
- **[SDK]/[RT]** My Library images must be 360 × 240 pixels. Metadata supply
  title, creator and version separately.
- **[RT]** `fspackagetool.exe -mirroring` removes old build files. Package
  content and `layout.json` must match completely.

## EFB app lifecycle and shared state

- **[RT]** The app can survive a flight change while resident, without a new
  `onResume()`. View or game state transitions alone do not detect new
  flights.
- **[RT]** VR switches can create a new EFB context. Several entries visible in
  the debugger do not prove simultaneous sending or writing.
- **[RT]** The SDK `DataStore` survives context changes **and** quick
  simulator restarts. Do not treat it as volatile session storage or emulate
  its lifetime with timeouts. Use explicit reset conditions, see
  [ADR 0009](adr/0009-progress-across-efb-context-changes.md).
- **[RT]** `E:IS IN VR` is the reliable mode signal. A VR switch sends no
  `FltLoad` and is not a new flight.

## Flight lifecycle and reset

- **[SDK]/[RT]** Flow API: `RegisterViewListener("JS_LISTENER_COMM_BUS")`,
  event `__FLOW_API__`, JSON payload with a numeric event ID and an optional
  `flt_path`.
- **[RT]** A free flight produces several load sequences, even after
  `FlightStart`. Bind the reset to `FltLoad` and make it idempotent; do not
  rely on the first `FltLoaded` as the end of all loading.
- **[NEG]** `GameStateProvider` can stay `ingame` throughout a flight change.
  `GameModeManager.isInMenu` does not distinguish a flight change from the
  config menu. Neither may control the reset alone. Settings/Save/Resume sends
  no `FltLoad` and keeps progress.
- Do not move the reset forward to `FlightEnd`: the last state should remain
  visible until the next flight loads.

## SimVars and persistence

- **[RT]** `ATC MODEL`, `ATC TYPE` and `TITLE` can contain localization tokens
  and special characters. Normalize them and derive rules from the displayed
  SimVars; a streamed `aircraft.cfg` may be in protected archives.
- **[RT]** `E:SIMULATION TIME` stands still during pause, increases
  monotonically within a session and starts at zero after a restart.
- **[NEG]** `Date.now() - E:SIMULATION TIME` is no stable session start: pauses
  shift it. For restart detection, use only the monotonicity of the raw value.
- Do not read string SimVars every frame. Events plus a slow fallback that
  stops while the app is invisible are sufficient.

## Sim key events in a custom EFB app

Mechanism: `RegisterViewListener("JS_LISTENER_KEYEVENT")`,
`Coherent.call("INTERCEPT_KEY_EVENT", …)` and `keyIntercepted`.

- **[RT]** Works with keyboard/HOTAS and delivers the event, not the key.
- **[SDK]/[RT]** There is no usable unregister call. Delivery can go silent
  after loading: use only `passThrough = true`, register sparingly, invalidate
  on `FltLoad` and register again only after the final `RTCEnd` or the end of
  an observed `GameState.loading`. The first `FltLoaded` is too early.
- **[RT]** A single press can arrive several times even with a single
  registration; additional registrations add deliveries. Always debounce.
- **[RT]** Events arrive even with the EFB closed. Guard product logic by
  `AppView` visibility.
- **[RT]** The Controls display name and the event name can differ. Profiles
  can overlap; for tests, check for a deliberate, non-duplicate binding.
  `PLASMA_OFF` is called `SET PLASMA OFF`; delivery is confirmed in the G36,
  DA42, H125, MH-60, OH-6A and H500C.
- **[NEG]** `AUTOCOORD_ON` is not generated despite a binding. A nominally
  unused event is not automatically a conflict-free trigger. `LEAD POLE ON` is
  missing for the H125/MH-60: Controls actions depend on the aircraft
  category. A shared trigger must be available and free of side effects.
- **[SDK]** SDK 1.7.3, the EFB and InputProfiles samples and the reviewed
  DevSupport answers show no way to add a new global Controls action from a
  pure EFB package. Profiles bind existing actions; documented new actions
  come from Model Behavior input events of an aircraft node. Do not confuse an
  input profile with registering an action.
- **[NEG]** `VALIDATE` cannot be reached freely through DOM `keydown`,
  `InputStackListener` or `routeGamepadInteractionEvent`; `KEY_EFB_*` carries
  `norebind_kbmpad`.
- **[NEG]** `SimConnect_TransmitClientEvent`, `trigger_key_event` and
  `execute_calculator_code` do not reach the JS interception. No external
  transport path to the EFB.

## CommBus and external companion app

- **[SDK]/[RT]** SimConnect CommBus since SDK 1.6.4; bidirectional operation
  with a custom EFB confirmed using a custom .NET P/Invoke client. Load the
  JavaScript helper from `/JS/Services/CommBus.js` with a load callback first,
  then register listeners. The TypeScript packages used need their own ambient
  declaration.
- **[RT]** When switching EFB apps with `AppSuspendMode.SLEEP`, the
  registration stays usable. Do not register again just because of
  suspend/resume.
- **[RT]** Non-VR → VR → non-VR keeps state and delivery. New instances may
  send their first snapshot only after aircraft selection and restore; a
  provisional empty snapshot can reset the announcement deduplication in the
  companion.
- **[SDK]** Towards SimConnect, messages can arrive chunked via
  `dwEntryNumber`/`dwOutOf`; reassemble them.
- **[SDK]** While JavaScript is halted, SimConnect/WASM keep running; queued
  events can freeze the simulator. Send only state changes, rate-limited.
- **[RT]** The tested in-game pause did not halt EFB JavaScript: operation and
  snapshot requests remained possible. A paused aircraft does not prove halted
  JavaScript.
- **[NEG]** `Microsoft.FlightSimulator.SimConnect.dll` from SDK 1.7.3 is a
  mixed-mode C++/CLI assembly for .NET Framework 4.6.1, not for modern .NET.
  Use custom P/Invoke against the native DLL according to
  [ADR 0004](adr/0004-companion-app-stack.md).
- **[NEG]** Client Data Areas do not reach EFB JavaScript without WASM; LVars
  require client-side polling; external clients cannot send H events
  directly.
- **[NEG]** Localhost WebSockets are no committed SDK contract. Asobo has
  confirmed a Coherent GT crash when many sockets are created. No reconnect
  loop or localhost path without a new explicit decision.

## Coherent GT and EFB rendering

- **[RT]** A successful browser test or build does not prove correct Coherent
  styling. Check in the EFB, and VR-relevant changes additionally in VR.
- **[SDK]/[RT]** Scope styles to `.efb-view.<app directory name>`; otherwise
  they apply globally. Global EFB button rules can override local hover,
  focus, selected and active states; check all of them on the real EFB button.
- No global `transform: scale`: layout box, scroll range and hit area do not
  follow it reliably, and text can become blurry. Scale layout sizes instead.
- **[SDK]** `efbSize` passes Small/Medium/Large only as `SET_SIZE` and provides
  no app layout rule. The settings manager is injected into `App`; `AppView`
  needs it explicitly as a prop, otherwise the getter can throw.
- **[RT]** Measured with SU6 1.8.14.0: when mounted, the layout box stays at
  468 × 661 CSS pixels with `devicePixelRatio = 1`. When detached, the layout
  box is smaller than the window, outside VR larger than when mounted, and in
  VR partly smaller. Use `clientWidth`/`clientHeight` of the app's own root
  element, not `window.innerWidth`/`innerHeight`.
- **[RT]** Mounted ↔ detached sends `resize` before the layout box is updated;
  the new box follows within about 50 ms without another event. On
  `onResume`, the box can be 0 × 0. Measure again with a short delay after
  both events.
- **[NEG]** The saved EFB setting `mode` (2D/3D) does not reliably indicate
  mounted/detached.
- **[RT]** When debugging in VR, select the new entry under "Inspectable web
  views"; the previous context may no longer deliver lifecycle logs.
- **[SDK]** The EFB `Button` does not pass `title` on to the HTML element. Set
  the tooltip on the app's own DOM child or specifically on the button DOM.
- **[NEG]** Do not make meaningful symbols depend on Unicode font coverage;
  use CSS geometry or assets.
- **[RT]** SVG paths need their own `fill="none"` to stay transparent; the root
  fill is not inherited reliably.
- Do not introduce `gap`, `position: sticky` or modern sizing functions
  without a targeted Coherent runtime verification.

## Primary sources

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
- The installed SDK 1.7.3 and its samples (read-only)
