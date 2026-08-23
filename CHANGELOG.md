# Changelog

Notable project changes are recorded under their completion date.

## 2026-08-23

### Added

- Added automatic aircraft-specific checklist selection with model diagnostics
  and an empty state for unsupported aircraft.
- Added a minimal Beechcraft Bonanza G36 checklist, including a 100 kt climb
  speed and an 80 kt landing speed.
- Added a visible development CalVer identifier and permanent design, QA, and
  agent guidance for future work sessions.

### Changed

- Refined the checklist layout for VR and cockpit-tablet use with dedicated VR
  typography, spacing, navigation, item, and checkbox dimensions.
- Added the researched `Utility Hydraulic Pump: Off` step immediately after APU
  shutdown in the MH-60 checklist.
- Standardized paired-component labels as `[1+2]` across checklist data.
- Improved checklist navigation, scrollbar alignment, hover feedback, and
  aircraft changes during a resident EFB session.
- Completed Phase 1 after a successful free-flight VR acceptance test.

### Fixed

- Preserved completed items and the active section when MSFS recreates the EFB
  app context while switching between VR and non-VR; the round trip was
  verified in MSFS.
- Kept new-flight and aircraft-change resets independent from display-mode
  changes.

## 2026-08-22

### Added

- Added the native offline MSFS 2024 EFB application prototype and its
  deterministic WSL2-to-Windows deployment workflow.
- Added structured DA42 and MH-60 checklist data, a JSON schema, and validation
  tooling.
- Added repository-level Task commands for setup, validation, builds, checks,
  and deployment.

### Changed

- Normalized checklist challenges, responses, conditions, notes, and speech
  overrides into a single canonical data model.
- Refined the initial checklist UI into a single-section, VR-first layout with
  large clickable rows and automatic section advancement.
