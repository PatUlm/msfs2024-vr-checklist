# Windows companion app

This document contains only companion-specific development and diagnostic
notes. Usage is described in the [root README](../README.md), setup and
deployment in [development.md](../docs/development.md).

## Structure

- `src/VRChecklist.Companion/`: Avalonia app, audio and checklist export.
- `src/VRChecklist.Transport/`: shared SimConnect/CommBus transport.
- `src/VRChecklist.TransportProbe/`: console diagnostics and self-tests.
- `release-notes.json`: embedded offline release notes. Version and date must
  match the changelog; `task validate:release-notes` checks them.

Checklists from `checklists/data/` and announcements from `assets/audio/` are
embedded at build time. The architecture is described in the
[ADRs](../docs/adr/README.md), the chosen behavior in
[design-decisions.md](../docs/design-decisions.md).

## Launch and diagnostics

The release setup contains .NET 10 and the native MSFS 2024 `SimConnect.dll`
according to [ADR 0012](../docs/adr/0012-distribution-as-zip-and-companion-setup.md).

`task companion:deploy`, in contrast, builds the app and probe
framework-dependent into the Windows staging folder; this requires .NET 10 and
the local SDK. The DLL is not copied there. A different search path, also for
installed versions, can be set with:

1. `VR_CHECKLIST_SIMCONNECT_DIR` as a Windows environment variable, or
2. `simconnect-path.txt` next to the EXE containing the Windows directory path,
   for example `C:\MSFS 2024 SDK\SimConnect SDK\lib`.

Deployment writes this file automatically from the configured SDK path. It
stays local and must not be included in a release.

The diagnostic tool is in `tools\transport-probe` in the staging folder. It
requests the EFB state; `--play-completion-sound` checks the audio path once on
the Windows default device, without MSFS.

Audio settings are stored in `%LOCALAPPDATA%\VRChecklist\audio-output.json`.
An unavailable device stays selected; select an available device under
Settings and check it with `Test sound`. If the checklist revisions differ,
bring the EFB app and the companion to the same release.
