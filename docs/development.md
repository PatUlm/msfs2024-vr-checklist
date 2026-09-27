# Development

This guide describes the current path from a clone to a simulator test. Task
implementations and past test runs are not retold here.

## Prerequisites and setup

- Windows with MSFS 2024 and the installed SDK 1.7.3 for `task install`,
  simulator tests and packaging. `task install` copies the EFB API and the
  MSFS SDK package from the SDK's EFB sample, because the SDK EULA does not
  allow redistributing them in the repository; the installed SDK stays
  read-only.
- Repository in the Linux file system of WSL2, Node.js 24, npm and Task 3.
- Docker for the .NET SDK container pinned in `Taskfile.yml`; no local Visual
  Studio installation is needed.
- Launching the companion on Windows has its own
  [companion prerequisites](../companion/README.md#launch-and-diagnostics).
- New or changed speech assets have their own prerequisites and render process
  in the [audio guide](../assets/audio/README.md#render-prerequisites).

From the repository root:

```bash
cp .env.example .env
task init
task install
task check
```

Adjust the paths in `.env`; credentials stay local there. Normal builds need
neither ElevenLabs access nor FFmpeg, since the audio is already versioned.
`task --list` shows all tasks, `Taskfile.yml` their definitions.

## Workflow

| Purpose                          | Task                        |
|----------------------------------|-----------------------------|
| Validate checklist data          | `task validate`             |
| Build EFB app / watch changes    | `task build` / `task watch` |
| All local checks                 | `task check`                |
| Deploy EFB app for the simulator | `task deploy`               |
| Deploy companion for Windows     | `task companion:deploy`     |

After app or data changes, run `task check` first, then `task deploy`; after
companion changes, also run `task companion:deploy`. Documentation-only
changes need no deployment.

The default deployment targets are:

- EFB app: `C:\dev\msfs2024-vr-checklist-staging`
- Companion: `C:\dev\msfs2024-vr-checklist-companion-staging`

Both are strictly one-way targets from the WSL repository. EFB sources and SDK
copies are never edited there or synchronized back. The scripts manage only
their own inputs; packages built by the Project Editor remain in the staging
folder. A different EFB drive can be chosen with
`task deploy STAGING_DIR=/mnt/d/dev/msfs2024-vr-checklist-staging`.

## Testing in MSFS

1. After `task deploy`, start MSFS with Developer Mode.
2. In the Project Editor, open
   `C:\dev\msfs2024-vr-checklist-staging\VRChecklistProject.xml` and run
   **Build All In Project**.
3. Start a flight with a matching aircraft and open **VR Checklist** in the
   EFB.
4. After subsequent builds, use **Ignore Cache + Reload** in the Coherent
   Debugger.
5. Check the changed standard flow; check VR-relevant styling in the EFB in VR.

Pure UI changes normally need no new flight. Lifecycle or reset changes do.
Pending verifications are listed in [open-tests.md](open-tests.md) and
[design-qa.md](design-qa.md). After a deployment, check the version identifier
actually written instead of relying on that of an earlier build.

After `task companion:deploy`, start `VRChecklist.Companion.exe` in the
companion staging folder. DLL configuration, the diagnostic tool and the
source structure are described in the [companion README](../companion/README.md).

## Orientation for contributions

- [AGENTS.md](../AGENTS.md): working, review and commit rules.
- [Checklist data](../checklists/data/README.md) and
  [style guide](../checklists/data/style-guide.md): new or corrected content.
- [Design decisions](design-decisions.md): deliberately chosen behavior.
- [SDK reference](msfs-sdk-reference.md): MSFS and Coherent pitfalls.
- [ADRs](adr/README.md): architecture and its reasons.
- [Audio](../assets/audio/README.md) and [branding](../assets/branding/README.md):
  editing assets.
- [Release](release.md): versioning, packaging and local installation.
- [Third-party licenses](third-party-licenses.md): dependencies and origin.

Implement changes as small, working increments on `master`. Bug reports should
include the app version, aircraft or add-on, steps to reproduce and expected
versus actual behavior; for display bugs, also a screenshot and whether it
occurred in VR or non-VR.
