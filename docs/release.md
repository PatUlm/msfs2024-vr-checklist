# Release and local installation

This guide describes the current maintainer process. It documents the
necessary commands and pitfalls; internal verification steps are in the code.

## One-time setup

Prerequisites and clone setup are described in
[development.md](development.md). Adjust the Windows paths in the ignored
`.env` based on [.env.example](../.env.example):

- `VR_CHECKLIST_MSFS_SDK_ROOT`: installed SDK folder.
- `VR_CHECKLIST_COMMUNITY_DIR`: actual `Community2024` folder.
- `VR_CHECKLIST_COMPANION_INSTALL_DIR`:
  `%LOCALAPPDATA%\VRChecklist.Companion` as a WSL path; the setup installs
  there.
- `VR_CHECKLIST_RELEASE_DIR`: `/mnt/c/dev/msfs2024-vr-checklist-releases` by
  default.

The scripts require the target names `Community2024`,
`msfs2024-vr-checklist-releases` and `AppData/Local/VRChecklist.Companion` to
prevent accidental changes to unrelated folders.

## Version and release

`VERSION` is the canonical SemVer version for the EFB app, the MSFS package and
the companion. Development builds additionally show `-dev.YYYYMMDDHHMMSS` in
UTC; releases show exactly `MAJOR.MINOR.PATCH`.

1. Complete functional changes including the necessary simulator
   verifications and have them approved according to the
   [review rules](../AGENTS.md).
2. Increase `VERSION` and mirror it in
   `msfs/PackageDefinitions/patulm-vr-checklist.xml`,
   `msfs/PackageSources/VRChecklist/package.json` and the two root version
   entries of the `package-lock.json` there.
3. Move user-facing changes in `CHANGELOG.md` under the new version with its
   date. Update `companion/release-notes.json` with the same date and version,
   most important change first.
4. Run `task check` successfully. Exit MSFS and the companion.
5. Run `task release`. It builds both apps, creates the EFB ZIP and the
   companion setup, and adds an immutable release in the configured release
   folder. `SimConnect.dll` comes from the configured SDK.
6. Commit the release metadata as `chore(release): publish version X.Y.Z` and
   put an annotated tag `vX.Y.Z` exactly on that commit.
7. Run `task release:install` and check the versions actually installed. Only
   then is the local release step complete.

The release folder contains `release.json`, the MSFS package
`patulm-vr-checklist/` for the local junction, the download ZIP
`patulm-vr-checklist-X.Y.Z.zip` and, under `VRChecklist.Companion/`, the
Velopack output: `VRChecklist.Companion-win-Setup.exe`, the full `.nupkg` and
the update feed `releases.win.json`. Existing versions are never overwritten.

The GitHub release is titled exactly like its tag, `vX.Y.Z`, and gets the ZIP
and the setup attached. The `.nupkg` and `releases.win.json` are only needed
by the companion's update check; attach them from the first release that
contains it onward.

Both artifacts contain `LICENSE.txt` and the `THIRD-PARTY-NOTICES.txt`
generated from [licenses/](../licenses/README.md): the EFB package in its root,
the companion additionally with `AUDIO-LICENSE.txt`. `task release` aborts if
a shipped package has no matching entry in `licenses/notices.json`.

Finally, `task release` removes older releases; this step can also be run on
its own as `task release:prune`. It keeps the three newest `MAJOR.MINOR` lines
with all their patches and the release linked in `Community2024`.

Preparing public releases is tracked in the [backlog](../BACKLOG.md). The
local release task publishes nothing on GitHub; pushes and publication happen
only on explicit request.

## Installation and rollback

```bash
task release:install
```

This installs the previously built version from `VERSION`. Individual
components can be installed with `task community:install` or
`task companion:install`. To install another existing release (local releases
up to 0.17.0 still use the former package name and cannot be installed this
way):

```bash
task release:install VERSION=X.Y.Z
```

The Community package is installed as a native Windows junction to the
release. **Do not delete the linked release folder** while it is installed.
Linux symlinks on `/mnt/c` are no substitute: Windows does not recognize them
as junctions. The installer creates and checks the link through Windows.

The companion is installed through the setup just like for players, here with
`--silent`. The setup exits a running companion from this folder and replaces
the existing installation. Afterwards, start **VR Checklist Companion**.

On a normal simulator start, the Community package is available without
Developer Mode. A build of the same package from the Project Editor takes
precedence, so the Community installation does not need to be removed for
development.
