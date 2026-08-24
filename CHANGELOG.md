# Changelog

Notable project changes are recorded here. The format follows Keep a
Changelog, and the project uses Semantic Versioning.

## [Unreleased]

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
