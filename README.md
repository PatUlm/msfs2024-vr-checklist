# MSFS 2024 VR Checklist

Offline checklists for the Electronic Flight Bag (EFB) in Microsoft Flight
Simulator 2024, with large controls for VR and an optional Windows companion
app for spoken announcements.

The release goal is in the [roadmap](ROADMAP.md), open work in the
[backlog](BACKLOG.md).

## Features

- Automatic aircraft selection, large clickable rows and confirmation by key
  or HOTAS.
- Group navigation, phase skipping and progress display.
- Progress survives switching between VR and non-VR; a new flight resets it.
- Optional companion with English announcements in the ElevenLabs voice Brian,
  a switchable radio effect and a selectable audio output. No cloud connection
  in flight.
- View checklists in the companion, copy them as text or save them as PDF;
  read the release notes offline.

Included are the Airbus A400M, Airbus H125, Beechcraft Bonanza G36,
Cessna 152, Diamond DA42, Hughes OH-6A/500C and Sikorsky MH-60. Scope and
coverage differ by aircraft.

The checklists are memory aids for the **game**, edited with AI assistance,
not flight documents for real-world aviation. Their
[sources and limitations](checklists/data/README.md#content-provenance) are
documented.

## Installation and launch

A release consists of two files of the same version. Always update the EFB
app and the companion together; otherwise the announcements stay silent.

1. **EFB app:** Extract `patulm-vr-checklist-X.Y.Z.zip` into the MSFS 2024
   Community folder so that it contains the folder `patulm-vr-checklist`.
   Delete the old folder before an update.
2. **Companion (optional):** Run `VRChecklist.Companion-win-Setup.exe`. It
   installs without administrator rights to
   `%LOCALAPPDATA%\VRChecklist.Companion` and creates shortcuts on the desktop
   and in the Start menu. Neither .NET, the MSFS SDK nor a separate
   `SimConnect.dll` is required. The setup is not signed; at the SmartScreen
   warning, choose **More info** and then **Run anyway**. Uninstall it from the
   Windows apps list; settings are kept.

After installation, open **VR Checklist** in the EFB. The app works without a
running companion. For announcements and to configure confirmation actions,
also start **VR Checklist Companion**. For problems, see
[Companion: launch and diagnostics](companion/README.md#launch-and-diagnostics).
Custom builds are covered by [development](docs/development.md) and
[release](docs/release.md).

## Usage

Clicking a row checks it off or reopens it. Once all items of a group are
done, the next group follows automatically. Optional items do not count
toward the progress bar, but they hold the automatic group change until they
are done or you page on manually.

`Skip phase` completes the contiguous current phase block, including optional
items, and opens the next phase. In the last phase, it completes the remaining
items.

For a key or HOTAS, bind the action **SET PLASMA OFF** in the MSFS
**Controls** (event `PLASMA_OFF`; the display name may differ by simulator
language). It confirms the next open item of the displayed group while the app
is open in the EFB. The event is passed on to the simulator; side effects in
other aircraft cannot be ruled out. The reasons for this event are given in
[ADR 0011](docs/adr/0011-confirmation-actions-in-the-companion.md).

In the companion under **Settings**:

- **EFB Keybindings**: the switch enables confirmation; the dropdown next to it
  selects the MSFS action, currently `SET PLASMA OFF`. On by default. When off,
  the selection is kept. Editable without the simulator: the companion stores
  the selection locally and transfers it as soon as VR Checklist is reachable
  in the EFB. Notices about a pending transfer disappear once the EFB has
  applied it. The EFB keeps the last applied value without the companion,
  across flight changes and simulator restarts. Off only stops checklist
  confirmation; the event still reaches the aircraft.
- `Read checklist items`: reads the next open item aloud; on by default.
- `Radio effect`: switches the sound filter on or off live; on by default.
- `Audio output` and `Test sound`: select and test the output device. An
  unavailable device stays selected until it returns or is replaced.

Group completion and the test sound also work with item announcements turned
off. Minimizing keeps the connection and audio running; closing exits the
companion.

## Issues and contributing

If an aircraft has no checklist, report the diagnostic values `ATC MODEL`,
`ATC TYPE` and `TITLE`; the companion copies them with `Copy`. For other bugs,
the version, aircraft, steps to reproduce and, if useful, a screenshot help.

- [Development](docs/development.md): setup, tests and simulator iteration.
- [Checklist data](checklists/data/README.md): add or correct content.
- [Backlog](BACKLOG.md): upcoming work.
- [Changelog](CHANGELOG.md): changes per version.
- [Third-party licenses](docs/third-party-licenses.md): components and primary
  sources.

The project's own code and content are licensed under the
[MIT License](LICENSE). Excluded are the configuration files taken from the
MSFS SDK EFB template ([origin](msfs/PackageSources/README.md)), the
[third-party components](docs/third-party-licenses.md) and the voice
recordings, which have their own [audio terms](assets/audio/LICENSE):
redistribution and modification are allowed, while AI training and the other
limits of the ElevenLabs usage policy still apply.
