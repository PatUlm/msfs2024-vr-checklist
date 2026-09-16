# Changelog

User-visible changes to the released app, checklists, and distribution are
recorded here. Internal documentation, research, QA evidence, tests, and
project-process changes are intentionally excluded. The format follows Keep a
Changelog, and the project uses Semantic Versioning.

## [Unreleased]

## [0.10.0] - 2026-09-16

### Added

- Added a modal companion settings dialog to select and remember a Windows
  audio output independently of the system default. A test button in the
  dialog plays "Checklist completed" on that output. Unavailable
  devices keep their selection until they reconnect or another output is chosen.
  Windows default stays first in the device list, followed by the most recently
  selected outputs; this order is remembered across app restarts and explained
  beside the device selection.

## [0.9.1] - 2026-09-14

### Changed

- Section navigation buttons now sit above the group heading, keeping the
  heading next to its checklist items. Buttons are about one third shorter
  while retaining their text size.

## [0.9.0] - 2026-09-13

### Added

- The group header and the navigation buttons show a green check mark in front
  of every group whose items are all ticked, so completed groups are
  recognisable before they are opened and when paging back to them.
- The companion app plays a "Checklist completed" announcement on the Windows
  default output device each time a checklist group is fully ticked. The clip
  is a placeholder rendered with a Windows system voice; the final voice is
  still to be chosen. Repeated snapshots, reconnects, resets and a companion
  start with groups already completed do not trigger the announcement.
- The companion status window shows a green check mark in front of the
  checklist once every required item is ticked, and in front of the active
  group once all of its items are ticked.
- The transport probe accepts `--play-completion-sound` to play the embedded
  announcement once without MSFS.

### Changed

- The group header and the navigation buttons no longer show group numbers.
  Checklists always run in order, so the numbers added nothing and took space
  from the group names.
- The companion app marks development builds with the same `-dev.<timestamp>`
  suffix as the EFB app; releases keep the plain version.

### Fixed

- The companion app reports a missing `SimConnect.dll` in its status line
  instead of waiting for MSFS indefinitely.

## [0.8.3] - 2026-09-07

### Added

- Added a `Copy` button to the companion dashboard for aircraft without
  a matching checklist. It copies the original ATC MODEL, ATC TYPE and TITLE
  values as labeled lines and briefly confirms success with `Copied`.

## [0.8.2] - 2026-09-07

### Added

- Added a minimal, POH-based Cessna 152 checklist with automatic aircraft
  selection, takeoff and landing flap settings, rotation and approach speeds,
  normal climb and Vy guidance, and mixture reminders above 3,000 ft and before
  landing. Speeds use knots indicated and the applicable V-speed abbreviations.

## [0.8.1] - 2026-09-05

### Changed

- The transport probe console tool now proves the CommBus channel with a
  checklist state request and reports the EFB version, instance, selected
  checklist and progress from the answering snapshot. The EFB app no longer
  answers the separate ping message, which no shipped component used.

## [0.8.0] - 2026-09-05

### Changed

- The checklist now scales with the EFB layout area instead of using fixed
  pixel sizes. The mounted tablet and the detached panel show the same amount
  of checklist content in every EFB size (Small, Medium, Large); the size
  setting only changes how large the app appears. Outside VR, the mounted
  tablet uses the same compact layout as in VR, and the detached panel shows
  more content per screen than in VR.

## [0.7.1] - 2026-09-04

### Added

- Added an `Airbus A400M` checklist with electrical power up, FSM init,
  engine start and after start sections. The FSM init items are marked for
  review until they are verified in the simulator.

## [0.7.0] - 2026-09-04

### Added

- Added a `PDF` button to the Windows companion checklist window. It saves the
  selected checklist as a printable A4 PDF in the two-column layout of the
  checklist source sheets, with framed sections, kind-based row colours and
  `<title> Checklist – <revision>.pdf` as suggested file name, and opens the
  saved file with the default PDF viewer.

### Changed

- Checklist titles now name only the aircraft: `Diamond DA42` and
  `Beechcraft Bonanza G36` replace the former titles with `Checklist + ATC`
  and `Minimal Checklist` suffixes.

## [0.6.2] - 2026-09-03

### Added

- Gave the Windows companion the EFB checklist mark as application icon. The
  EXE, taskbar and all companion windows now show it on a rounded dark tile
  instead of the generic .NET icon.

## [0.6.1] - 2026-09-03

### Changed

- Reordered the OH-6A/H500C before-start flow: anti-collision lights follow
  the battery, a caution and warning lights test follows the cockpit lights
  and the ignition key comes last. Noted that the H500C has no avionics switch
  and replaced the throttle advance hint with the torque range to hold while
  moving the twistgrip to FLIGHT.

## [0.6.0] - 2026-09-02

### Added

- Added a `Checklists` window to the Windows companion that lists every shipped
  checklist by name, preselects the checklist shown on the dashboard, renders
  its sections and items and copies the checklist as Markdown-like text with
  one click.
- Added icons to all Windows companion buttons.

### Changed

- Replaced the OH-6A/H500C taxi light reminder with a position lights step
  before takeoff, moved pitot heat behind the landing light, noted that the
  landing light doubles as taxi light and dropped the duplicate caution and
  warning indicator check during engine start.
- Turned the engine cool-down step of the OH-6A/H500C and H125 shutdowns into a
  regular action instead of a verification.

## [0.5.1] - 2026-09-02

### Changed

- Streamlined the OH-6A/H500C checklist around the user-defined startup flow,
  including explicit starter release, cockpit lighting and before-takeoff light
  reminders.

## [0.5.0] - 2026-08-31

### Added

- Added a compact common startup, before-takeoff and shutdown checklist for
  Taog's Hangar's OH-6A Cayuse and Hughes 500C variants.

## [0.4.2] - 2026-08-30

### Fixed

- Prevented rare Windows companion shutdown races when SimConnect connection or
  dispatch calls outlast the bounded exit wait.
- Kept the Windows companion connected after a malformed CommBus packet and
  allowed the next valid checklist update through instead of turning the
  packet error into a reconnect loop.
- Hardened Windows companion snapshot validation so incomplete checklist,
  group or item records appear as protocol errors instead of partial status
  data.

## [0.4.1] - 2026-08-30

### Added

- Added an explicit H125 day-or-night instrument-lighting selection after
  battery activation and a dedicated `Before Taxi` group with a mandatory taxi
  light reminder and separate landing-light choice.

### Changed

- Reordered the compact H125 prestart and engine-start flow to follow the
  published AS350 B3e normal procedures more closely.

### Fixed

- Moved H125 horn activation after the twist grip reaches `FLIGHT`, gated it at
  340 rotor RPM, and corrected the generator threshold from 60 to 67 percent
  N1.

## [0.4.0] - 2026-08-30

### Added

- Added fully offline release notes to the Windows companion app, with a
  dedicated button and a versioned history showing each release date, its main
  highlight, features and fixes.

## [0.3.1] - 2026-08-30

### Fixed

- Rate-limited spontaneous EFB checklist snapshots and coalesced bursts to the
  latest state, preventing avoidable CommBus backlog while keeping requested
  reconnect snapshots immediate.
- Reset completed items, progress and the active group when switching between
  aircraft identities that use the same checklist.

## [0.3.0] - 2026-08-29

### Added

- Added a Windows companion status app that distinguishes the SimConnect
  connection from receipt of EFB checklist state and shows the aircraft,
  checklist, active group, next open item, mandatory progress and both app
  versions. Its simulator indicator stays yellow and `Connecting` while it
  retries, then turns green and `Connected` without flashing an intermediate
  disconnected state or alternating retry text. The window and detail card
  also end directly after their content rather than reserving empty space below
  progress. It is delivered as a directly launchable Windows EXE alongside the
  MSFS package and can be installed from the same versioned release.

## [0.2.4] - 2026-08-29

### Changed

- Replaced the user-bindable `LEAD POLE ON` confirmation action with
  `SET PLASMA OFF`, making the same HOTAS or keyboard confirmation path
  available in the G36, DA42, H125 and MH-60. Existing bindings must be
  reassigned in the MSFS controls.

## [0.2.2] - 2026-08-28

### Changed

- Communication items name the radio to set: `COM: Ground` instead of `Ground`.
  The `COM:` prefix means COM 1 or COM 2 is tuned to that station; the `ATC`
  badge keeps marking the kind of action. The spoken text is unchanged.

### Fixed

- Kept `LEAD POLE ON` confirmation working after returning from H125 and MH-60
  flights to the DA42 in the same simulator session.

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
  the press without effect.

## [0.1.7] - 2026-08-27

### Fixed

- Fixed the reported correctness bug that VR and non-VR keep separate checklist
  state. Progress no longer depends on MSFS destroying and recreating the EFB
  app context within 15 seconds of a display-mode change; a recreated context,
  a resident instance, and two parallel instances now all converge on the same
  state.

## [0.1.6] - 2026-08-25

### Fixed

- A new Free Flight with the same aircraft no longer inherits completed items.
  Opening and closing the Config menu still keeps every checked item.

## [0.1.5] - 2026-08-25

### Added

- Added `Pitot Heat: On` to the H125 engine-start flow after generator and
  avionics activation.
- Added a compact H125 engine-shutdown section with a 30-second cool-down and
  rotor-brake timing derived from published AS350 B3e normal procedures.

### Changed

- Moved the H125 rotor-brake check into `Before Start` while preserving the
  overall item sequence.
- Removed direction arrows from the disabled `Start` and `Complete` navigation
  placeholders.

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
- Changed the text-free My Library thumbnail to the required 360 × 240 aspect
  ratio so MSFS no longer crops the artwork.
- Refined the EFB icon to use an explicitly transparent interior, a white
  clipboard outline, blue checkmarks, and gray item lines.

### Fixed

- Prevented Coherent GT from filling the clipboard interior white.
- Removed the split CalVer/SemVer presentation that made the EFB footer and
  MSFS My Library metadata show different versions.
- Restored complete SDK package output by using the supported 360 × 240
  Community My Library thumbnail dimensions.

## [0.1.0] - 2026-08-24

### Added

- Added project-specific branding for the EFB app and its My Library thumbnail.
- Added automatic aircraft-specific checklist selection with model diagnostics
  and an empty state for unsupported aircraft.
- Added a minimal Beechcraft Bonanza G36 checklist, including a 100 kt climb
  speed and an 80 kt landing speed.
- Added a visible development build identifier.
- Added the native offline MSFS 2024 EFB application prototype.
- Added DA42 and MH-60 checklists.

### Changed

- Set the app and package version to the intentional first release version
  `0.1.0`.
- Refined the checklist layout for VR and cockpit-tablet use with dedicated VR
  typography, spacing, navigation, item, and checkbox dimensions.
- Added `Utility Hydraulic Pump: Off` immediately after APU shutdown in the
  MH-60 checklist.
- Added separate MH-60 engine Ng stability checks after each engine start and
  switched both fuel boost pumps off before the utility hydraulic pump.
- Split the combined MH-60 SAS, trim, and autopilot action into separately
  confirmable `SAS [1+2]: On` and `TRIM: On` items; the autopilot action was
  removed.
- Standardized paired-component labels as `[1+2]` across checklist data.
- Improved checklist navigation, scrollbar alignment, hover feedback, and
  aircraft changes during a resident EFB session.
- Refined the initial checklist UI into a single-section, VR-first layout with
  large clickable rows and automatic section advancement.

### Fixed

- Preserved completed items and the active section when MSFS recreates the EFB
  app context while switching between VR and non-VR.
- Kept new-flight and aircraft-change resets independent from display-mode
  changes.
