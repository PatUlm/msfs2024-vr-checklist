# ADR 0012: Distribution as ZIP and companion setup

Status: Accepted (2026-09-26). Supersedes the consequence "`SimConnect.dll` is
not shipped" from [ADR 0004](0004-companion-app-stack.md).

## Problem

Players should be able to install the add-on without a development
environment and without the MSFS SDK. The previous approach required a local
SDK for the build and for `SimConnect.dll`.

## Decision

- The EFB app is released as a ZIP with the package folder as its only top
  level. Players extract it into their Community folder themselves.
- The companion is released as a per-user Velopack setup without
  administrator rights, with self-contained .NET 10 and the bundled native
  `SimConnect.dll` from the MSFS 2024 SDK. The package is built in the .NET SDK
  container on Linux.
- The setup remains unsigned for now.
- Companion updates are never installed silently. The opt-in update check
  reads GitHub Releases, downloads and installs only after confirmation and
  reminds users to update the EFB ZIP as well.

## Consequences

- SmartScreen warns for every new version; the installation instructions
  describe the path via "More info".
- Installation to `%LOCALAPPDATA%\VRChecklist.Companion`; settings under
  `%LOCALAPPDATA%\VRChecklist` are kept on uninstall. The packId must
  therefore not be `VRChecklist`.
- `VelopackApp` must run first in `Main`, otherwise `vpk pack` aborts.
  Automatic applying at startup is disabled.
- Checklist revisions couple the EFB app and the companion; both artifacts are
  always released with the same version.
- The assessment of redistributing the DLL is in
  [third-party-licenses.md](../third-party-licenses.md); because of this
  proprietary DLL, free OSS code signing programs that require purely
  OSI-licensed content are ruled out.
- MSI and MSIX were rejected: MSI brings no updates and needs Wine on Linux,
  MSIX requires a trusted signature.
