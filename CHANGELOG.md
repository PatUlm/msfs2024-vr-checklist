# Changelog

Notable project changes are recorded here. The format follows Keep a
Changelog, and the project uses Semantic Versioning.

## [Unreleased]

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
