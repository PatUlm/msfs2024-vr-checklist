# Changelog

Notable project changes are recorded here. The format follows Keep a
Changelog, and the project uses Semantic Versioning.

## [Unreleased]

### Documented

- The release 0.2.2 VR acceptance pass confirms that `LEAD POLE ON` continues
  to confirm exactly one item across a non-VR to VR round trip and that the
  longer DA42 section names remain readable in the reduced navigation buttons.

## [0.2.2] - 2026-08-28

### Changed

- Communication items name the radio to set: `COM: Ground` instead of `Ground`.
  The `COM:` prefix means COM 1 or COM 2 is tuned to that station; the `ATC`
  badge keeps marking the kind of action. The spoken text is unchanged.

### Fixed

- The key event interception is marked stale for every load in a flight-start
  sequence and renewed after `RTCEnd`. Renewing it after the first `FltLoaded`
  was too early: later loads followed, and the bound press was silent after
  returning from H125 and MH-60 flights to the DA42. The corrected sequence is
  verified across that complete round trip in MSFS.

### Documented

- The README now says which name to search for in the MSFS controls
  (`LEAD POLE ON`), that the press only acts while the app is open, and that
  helicopters do not offer the action at all.
- `LEAD POLE ON` cannot be bound in the MH-60 or the H125, because the controls
  menu only lists actions of the loaded aircraft category. ADR 0002 keeps the
  interception mechanism and records that the chosen trigger does not carry the
  whole fleet.

## [0.2.1] - 2026-08-28

### Added

- A fourth item kind `optional` marks an item that may be skipped. It carries an
  `Optional` badge and a muted grey-blue left marker rather than a signal
  colour. Optional items stay out of the `x / y` progress count, so the bar
  measures the mandatory work and reaches 100 % without them. The automatic
  section advance still waits for them, because skipping one is the pilot's call
  to make.

### Changed

- Items of kind `communication` now carry the badge `ATC` instead of
  `Communication`. Only the label changed; the checklist data keeps the kind
  `communication`.
- The previous and next buttons dropped their direction arrows and centre
  number and name instead. This frees up space that matters in VR and calms the
  bar down; numbered sections carry the ordering.
- DA42 radio items name the station alone — `ATIS`, `Clearance`, `Ground`,
  `Tower` — because the `ATC` badge already supplies that context. The spoken
  text is unchanged.
- The DA42 items `Gear/Fire Warning`, `Engine Warm-Up` and `ECU Test [1+2]` are
  `optional`.

### Fixed

- The DA42 item `Flight Plan` is an `action`, not a `verify`. It therefore loses
  the type badge and the coloured left marker.

## [0.2.0] - 2026-08-27

### Added

- The EFB app confirms the next open item of the section on screen when the sim
  key event `LEAD_POLE_ON` fires. The user binds it in the MSFS controls, so any
  device works, including a HOTAS button; the app only learns that the event
  fired, never which key was pressed. A section that is already complete leaves
  the press without effect. Phase 2 per
  [ADR 0002](docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md).
- The app version is logged on startup.

### Documented

- Key-event interception is proven to work in a custom EFB app, and the trigger
  event is chosen. Facts in `docs/msfs-sdk-reference.md`, decision in ADR 0002,
  remaining proofs in the new `docs/open-tests.md`.

## [0.1.7] - 2026-08-27

### Added

- Added `docs/phase-2-3-research.md` with the full technical research for phases
  2 and 3: transport candidates between the EFB app and an external process, the
  confirmation input path, the companion-app stack, text-to-speech models and
  their licenses, the radio and intercom chain, Windows audio output, the
  evaluation of BeyondATC as a building block, open-source prior art, and the
  Visual-Studio-free toolchain. Every statement carries its evidence level.
- Added `docs/adr/` with the documentation split between facts, research, and
  decisions, plus the decisions taken on 2026-08-26 as an interim record until
  the individual records are written.
- Documented that MSFS 2024 exposes a documented bidirectional channel between
  an out-of-process SimConnect client and the EFB app's JavaScript context since
  SDK 1.6.4, so no WASM module is required, together with the client-side
  constraints: the managed SimConnect wrapper cannot be loaded from modern .NET,
  the native library exports the CommBus functions directly, and the SDK licence
  does not clearly permit redistributing it.
- Documented the previously untested in-simulator input path that intercepts a
  named sim key event in JavaScript, including its semantics, the absence of an
  unregister call, suitable unused key events, the confirmation that joystick
  bindings trigger it, and the unresolved helicopter defect that makes a test
  with the H125 and MH-60 mandatory.
- Documented the cause of the earlier input failures: every `KEY_EFB_*` action
  is tagged `norebind_kbmpad` in the SDK input database and therefore cannot be
  bound to a key, mouse, or pad at all.
- Added `docs/msfs-sdk-reference.md` as the single technical reference for MSFS
  SDK, EFB API, flight lifecycle, SimVar, Coherent GT, and packaging behavior.
  It consolidates knowledge that was previously spread across the agent rules,
  README, design documents, VR test notes, release notes, changelog, and source
  comments, and marks every statement as runtime-verified, documented,
  disproven, or open.
- Added a minimal `CLAUDE.md` that forwards to `AGENTS.md`, so tools which do
  not read `AGENTS.md` automatically still load the repository work rules from
  the single existing source.

### Changed

- Reduced the Coherent GT section of the agent rules to a pointer at the new SDK
  reference so the runtime facts have a single home; the binding effect of its
  documented don'ts and disproven paths is stated explicitly.
- Accepted and documented that the checklist reset is bound to the load of the
  next flight rather than to the end of the previous one, so reopening the EFB
  in the menu after a flight still shows the previous session.
- Documented that checklist matching already works in the Free Flight
  configuration screen and follows an aircraft change made there.
- Accepted the release branding in MSFS: My Library shows the full uncropped
  thumbnail with its centered title and the same SemVer version as the app
  footer, and the clipboard interior stays transparent in the normal, hover,
  and selected app-list states.
- Accepted the arrow-free `Start` and `Complete` navigation placeholders.
- Reduced phase 2 to the EFB app alone: a freely bindable, otherwise unused sim
  key event is intercepted in the app itself and checks off the first open item,
  so no Windows companion app is required to confirm an item. The companion app,
  the return channel, and the progress display moved into phase 3, where they
  are built together with the speech output because they share the same app and
  the same completion event.
- Recorded the decision to confirm items through a sim key event the user binds
  in the MSFS control settings, instead of the MSFS `VALIDATE` action that
  SDK 1.7.3 does not deliver to a custom app. The event is intercepted without
  masking, and which item is the first open one is decided by the EFB app alone.
  The path is still subject to a runtime proof that must include the H125 and
  the MH-60.
- Replaced the earlier working assumption about bridging an out-of-process
  SimConnect client and the JavaScript CommBus with the documented API that has
  existed since SDK 1.6.4, so no WASM module and no C++ toolchain are required,
  and recorded the client-side constraints that come with it.
- Chose .NET 10 with Avalonia for the companion app, with SimConnect bound
  through the native exports rather than the managed wrapper, which cannot be
  loaded from modern .NET at all.
- Decided to render the speech output ahead of time and ship only audio files,
  so neither a text-to-speech model nor a phonemizer becomes part of the
  delivery, and recorded the versioning exception this creates for `assets/`.
- Retired `docs/phase-2-tech-stack-plan.md` to a pointer at the three documents
  that replace it, now that its research assignment is complete.
- Documented the correctness bug reported against 0.1.6 — VR and non-VR keeping
  separate checklist state — with its reproduction, its impact, the reading of
  the single-use display-mode handoff that caused it, and the alternative
  explanations considered. Kept as the record behind the fix below.
- Rebuilt checklist progress into a shared session state instead of per-instance
  memory with a timed handoff. The `DataStore` record is now authoritative for
  the simulator session: every toggle and section change writes it, and every
  app instance reconciles against it on resume, on a detected display-mode
  change, on the flight-lifecycle events, and on the existing slow aircraft
  fallback. A record whose `savedAt` is newer than an instance's own last write
  is adopted, so two instances cannot overwrite each other. Recorded as
  ADR 0009, which replaces the single-use handoff from 0.1.5.
- Stopped deriving a simulator session start from `E:SIMULATION TIME`. The
  counter stands still while the simulator is paused, so the derived start
  drifted with every pause and would have discarded valid progress once the
  record outlived the old 15-second window. Only the monotonicity of the raw
  value is used now, to detect a restart.
- Added narrow lifecycle diagnostics that name the app instance on creation,
  resume, pause and close, and log every adopted or discarded progress record.
  They stay in the code: they cost nothing outside state transitions and are
  the only way to answer later how many EFB app instances a display-mode change
  produces, which remains unmeasured and no longer affects correctness.

### Fixed

- Fixed the reported correctness bug that VR and non-VR keep separate checklist
  state. Progress no longer depends on MSFS destroying and recreating the EFB
  app context within 15 seconds of a display-mode change; a recreated context,
  a resident instance, and two parallel instances now all converge on the same
  state. Verified in MSFS across the full round trip with items checked in both
  display modes, a new flight, an aircraft change, and a simulator pause of over
  a minute.

## [0.1.6] - 2026-08-25

### Added

- Added an annotated `vX.Y.Z` tag convention for every unambiguous SemVer
  release commit and documented it in the contributor and release guidance.
- Added a repository rule requiring MSFS-specific behavior to be verified
  against the installed SDK, official documentation, SDK samples, developer
  support sources, and targeted runtime diagnostics instead of assumptions.
- Added a repository rule requiring reported bugs to be fixed and verified or
  explicitly documented with reproduction details and a concrete follow-up.
- Added a JavaScript Flow API listener for the documented global MSFS flight
  lifecycle events delivered through `__FLOW_API__`, logging every event as a
  single compact line with its name, ID, and optional flight path.

### Changed

- Documented that the phase 2 companion app extends the existing documented
  Communication API channel instead of adding a second transport to the EFB app.

### Fixed

- Reset resident in-memory checklist progress on the `FltLoad` Flow API event.
  A new Free Flight with the same aircraft no longer inherits completed items
  while `GameStateProvider` stays `ingame` and the aircraft identity is
  unchanged. The Config menu emits no `FltLoad`, so ESC, Settings, Save, and
  Resume keep every checked item. Both cases were verified in MSFS.

## [0.1.5] - 2026-08-25

### Added

- Added the researched `Pitot Heat: On` step to the H125 engine-start flow
  after generator and avionics activation.
- Added a compact H125 engine-shutdown section with a 30-second cool-down and
  rotor-brake timing derived from published AS350 B3e normal procedures.

### Changed

- Moved the H125 rotor-brake check into `Before Start` while preserving the
  overall item sequence.
- Removed direction arrows from the disabled `Start` and `Complete` navigation
  placeholders.
- Documented the successful MSFS runtime validation of the Airbus H125
  checklist selection rule.

### Fixed

- Restricted progress restoration to a short, single-use VR display-mode
  handoff so a new Free Flight with the same aircraft cannot inherit completed
  items when MSFS misses the loading transition.

## [0.1.4] - 2026-08-25

### Added

- Added a basic Airbus H125 checklist covering preparation and engine start.

### Fixed

- Prevented checklist progress snapshots from being restored after a complete
  MSFS restart while retaining them across EFB context reloads in the same
  simulator session.

## [0.1.3] - 2026-08-25

### Added

- Added an MH-60 APU indicator check after APU start and a separately
  confirmable `AUTO PLT: Press` action after SAS and trim activation.

## [0.1.2] - 2026-08-24

### Changed

- Moved the blue app-icon checkmarks to the right of the gray item lines to
  match the checklist row composition.
- Added the centered `VR Checklist` product name beneath the mark in the My
  Library thumbnail.

## [0.1.1] - 2026-08-24

### Changed

- Unified the visible app version, MSFS package version, and local release
  artifact version under SemVer with the root `VERSION` file as their
  canonical source.
- Changed the text-free My Library thumbnail to the documented 360 × 240
  aspect ratio so MSFS no longer crops the artwork.
- Refined the EFB icon to use an explicitly transparent interior, a white
  clipboard outline, blue checkmarks, and gray item lines.
- Changed changelog maintenance from date-only sections to versioned releases
  with a permanent `Unreleased` section.

### Fixed

- Prevented Coherent GT from filling the clipboard interior white by declaring
  `fill="none"` on every outline path instead of relying on SVG inheritance.
- Removed the split CalVer/SemVer presentation that made the EFB footer and
  MSFS My Library metadata show different versions.
- Restored complete SDK package output by using the supported 360 × 240
  Community My Library thumbnail dimensions.

## [0.1.0] - 2026-08-24

### Added

- Added guarded tasks for production package builds, immutable versioned
  release artifacts, and atomic installation into the configured MSFS 2024
  `Community2024` directory.
- Added local `.env`-based Windows path configuration, package verification,
  release utility tests, and release workflow documentation.
- Added project-specific vector branding for the EFB app and a matching
  ContentInfo thumbnail with editable sources under `assets/branding/`.
- Added automatic aircraft-specific checklist selection with model diagnostics
  and an empty state for unsupported aircraft.
- Added a minimal Beechcraft Bonanza G36 checklist, including a 100 kt climb
  speed and an 80 kt landing speed.
- Added a visible development build identifier and permanent design, QA, and
  agent guidance for future work sessions.
- Added a research-first Phase 2 plan covering the companion-app stack, secure
  settings, current local and cloud TTS options, VR audio, radio/intercom DSP,
  and a bounded proof of concept.
- Added the native offline MSFS 2024 EFB application prototype and its
  deterministic WSL2-to-Windows deployment workflow.
- Added structured DA42 and MH-60 checklist data, a JSON schema, and validation
  tooling.
- Added repository-level Task commands for setup, validation, builds, checks,
  and deployment.

### Changed

- Reset the copied EFB template package version to the intentional first
  project release version `0.1.0`.
- Extended the complete project check with release utility tests.
- Runtime-tested the initial EFB app icon in hover, selected, and VR
  presentation in MSFS.
- Refined the checklist layout for VR and cockpit-tablet use with dedicated VR
  typography, spacing, navigation, item, and checkbox dimensions.
- Added the researched `Utility Hydraulic Pump: Off` step immediately after APU
  shutdown in the MH-60 checklist.
- Added separate MH-60 engine Ng stability checks after each engine start and
  switched both fuel boost pumps off before the utility hydraulic pump.
- Split the combined MH-60 SAS, trim, and autopilot action into separately
  confirmable `SAS [1+2]: On` and `TRIM: On` items; the autopilot action was
  removed.
- Standardized paired-component labels as `[1+2]` across checklist data.
- Improved checklist navigation, scrollbar alignment, hover feedback, and
  aircraft changes during a resident EFB session.
- Completed Phase 1 after a successful free-flight VR acceptance test.
- Added repository guidance to separate commits by functional context whenever
  practical.
- Normalized checklist challenges, responses, conditions, notes, and speech
  overrides into a single canonical data model.
- Refined the initial checklist UI into a single-section, VR-first layout with
  large clickable rows and automatic section advancement.

### Fixed

- Preserved completed items and the active section when MSFS recreates the EFB
  app context while switching between VR and non-VR; the round trip was
  verified in MSFS.
- Kept new-flight and aircraft-change resets independent from display-mode
  changes.
