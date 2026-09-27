# Agent instructions

These rules apply to the entire repository. The product is a free game add-on
intended for open-source release, not a system for real-world aviation. Effort
and documentation follow this purpose.

## Collaboration

- Reply in the language the user writes in. Write repository content in
  English: documentation, UI texts, code comments, commit messages and
  changelog.
- Before making changes, check `git status --short` and preserve existing
  changes, especially unrelated ones.
- Investigate, fix and appropriately verify reported bugs. If work is
  deliberately postponed, briefly document reproduction, impact, current
  knowledge and the next step at the responsible place; do not leave it open
  only in the conversation.
- Before UI work, read `docs/design-decisions.md` and `docs/design-qa.md`;
  before a VR test session, also `docs/open-tests.md`.
- Before architecture/companion work, read `docs/adr/README.md` and the
  affected ADRs. Do not change product decisions silently; an architectural
  reversal gets a superseding ADR.
- Before MSFS-dependent changes, check `docs/msfs-sdk-reference.md` and the
  existing code. Examine the SDK/samples again if the reference is
  insufficient, the SDK has changed or observations contradict it.
- Before checklist data changes, read `checklists/data/README.md` and
  `checklists/data/style-guide.md`. For content reviews, check the canonical
  data and source references first, then the original primary source if
  needed. Do not build up a permanent local collection of manuals.

## Documentation: as much as necessary

- Information stays only if it supports usage, contributions, maintenance or
  concrete redistribution rights. Do not add precautionary corporate,
  certification or approval processes for the game add-on.
- Document the current state and reasons, not session histories, completed
  phase plans, voice rankings, raw logs or success chronicles. History stays
  in Git; released product changes in the changelog.
- Every piece of information has exactly one responsible place according to
  the table below. Other documents link there without repeating status or next
  steps. Guides describe the process, ADRs the decision; work progress belongs
  exclusively in the responsible task list.
- `docs/design-decisions.md` contains deliberate product rules, not a complete
  UI specification or a transcript of CSS values. ADRs contain the problem,
  the decision and the necessary consequence, normally in 15–35 lines.
  Completed pure process planning may be dropped; never reassign ADR numbers.
- `docs/msfs-sdk-reference.md` contains only confirmed MSFS/Coherent pitfalls
  relevant in the future, with scope and rule of action. Do not repeat normal
  API behavior or details evident from the code. Keep `[NEG]` for obvious
  approaches that proved unsuitable.
- Open visual items go exclusively into `docs/design-qa.md`, open MSFS runtime
  verifications exclusively into `docs/open-tests.md`. Delete them once
  resolved; transfer only new relevant findings into the responsible
  reference. Remove QA images that are no longer needed instead of keeping
  them as an error archive.
- On completion, remove the entry from the responsible task list and update
  affected usage or reference texts. Confirmed user tests count as evidence.
  Before status reports, read the linked topic lists from the backlog and
  reconcile them with code/data and the changelog; in case of contradictions,
  check the Git history specifically.
  Document external tool bugs only as long as an ongoing investigation needs
  them; a compact reproduction and a ticket link are enough, private details
  about persons or companies do not belong in public project docs.
- Do not delete sources, license texts and still-needed evidence of rights as
  mere history. Limit license work to actually published components and
  concrete unresolved rights; no blanket requests to manufacturers merely
  because of technical checklist entries or their extent.
- Do not maintain a second protocol/schema/version list by hand when code,
  schema or a lock file contains the information authoritatively. New files
  only with an independent, recurring benefit; do not refill shortened content
  with long review reports or new archive documents.

| Information                                              | Responsible place                                                                          |
|----------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Purpose, usage and user-relevant limits                  | `README.md`                                                                                |
| Next product milestone                                   | `ROADMAP.md`, without tasks or status copies                                               |
| Open implementation and release work                     | `BACKLOG.md`; entry point with links to topic lists                                        |
| Pending MSFS tests / visual checks                       | `docs/open-tests.md` / `docs/design-qa.md`                                                 |
| Open rights questions with findings and next step        | `docs/license-audit.md`                                                                    |
| Component licenses and primary evidence                  | `docs/third-party-licenses.md`; checklist assessment in `docs/checklist-license-review.md` |
| Development setup, local tests and simulator iteration   | `docs/development.md`                                                                      |
| Release commands and local installation                  | `docs/release.md`                                                                          |
| Windows prerequisites and companion diagnostics          | `companion/README.md`                                                                      |
| Product decisions / architecture reasons / MSFS pitfalls | `docs/design-decisions.md` / `docs/adr/` / `docs/msfs-sdk-reference.md`                    |
| Data maintenance, spelling and sources                   | `checklists/data/README.md`, `style-guide.md` and referenced source evidence               |
| Asset maintenance and origin                             | README and metadata next to the respective assets                                          |
| Released product changes                                 | `CHANGELOG.md`; Git for implementation history                                             |
| Working, review and commit rules                         | `AGENTS.md`                                                                                |

Topic lists stay reachable from the backlog, even when they are empty. ADR
overviews contain only links and topics; validity is stated in the ADR.

## Checks and deployment

- Run project workflows from the root via `Taskfile.yml`; npm only for
  app-internal tasks. After a fresh clone: `task init`, `task install`,
  `task check`.
- While functional questions about a change are open, run only targeted
  checks for the discussion; no `task check` or deployment of the
  intermediate state yet.
- After agreed data changes, run `task validate`; before completing any
  change, `task check`. Appropriate local checks and the MSFS evidence
  required for correctness must succeed before completion.
- After agreed app-affecting code, UI or data changes, run `task deploy`
  automatically once the checks succeed; for companion changes, also
  `task companion:deploy`. Pure documentation needs no deployment.
- After a deployment, determine the version identifier actually written to
  the Windows staging folder and tell the user.
- Simulator iteration: `task deploy` → **Build All In Project** in the Project
  Editor → **Ignore Cache + Reload** in the Coherent Debugger. UI changes need
  no simulator restart and normally no new flight; lifecycle/reset checks need
  a new flight.
- A build does not prove Coherent styling: check visual results in the EFB.
  Manual runtime verifications check the normal operating flow. Cover edge
  cases with unit/self-tests; additional manual steps need a concrete MSFS
  reason that local tests cannot cover.
- Unexplained runtime behavior may be examined with narrowly scoped
  diagnostics. Raw logs, test scripts and the investigation path stay
  temporary. Only relevant results, scope and DO/DON'T rules are kept
  permanently.
- If the SDK, official documentation and samples are insufficient, use
  DevSupport and other primary sources. Community assumptions are no API
  contract.

## Review, commits and releases

- Trunk-based development on `master`: small, functionally complete, working
  increments; no long-lived feature branches or collective commits.
- The user reviews and stages functional changes; staging is approval. Do not
  review the staged diff again. Stage yourself only on explicit request or
  under the following exceptions.
- Keep review and commit separate: as long as changes requiring review are
  open or being created, do not commit. Do not start new functional changes in
  the commit step.
- Purely documentary follow-up work on approved changes may be staged by the
  agent itself, such as removing confirmed test items.
- Commit finished, fully approved increments promptly without asking again,
  after the necessary checks, deployments and runtime verifications. Do not
  commit unfinished or non-working states as complete.
- Separate commits by context, such as data, application and general docs.
  Directly related tests and documentation may stay together.
- For explicitly requested pure releases, mechanical version mirroring, the
  changelog and release notes may be staged, committed and tagged by the agent
  itself after successful checks. New functional changes are excluded from
  this.
- Every `chore(release): publish version X.Y.Z` gets the annotated tag
  `vX.Y.Z` exactly on this commit. After the build and the release commit, run
  `task release:install`: only with the updated Community package and the
  installed companion EXE is the release complete locally.
- Push only on explicit request.

## Changelog and licenses

- Record every completed user-facing change in the same pass in
  `CHANGELOG.md` under `## [Unreleased]`. On release, move it to
  `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`; no CalVer headings.
- Include only shipped app, checklist and distribution changes. Docs, tests,
  QA, research, ADRs, agent rules and internal build/release processes get no
  entry; accompanying docs get no separate entry.
- Fold bugs within a not-yet-released feature into the feature entry.
  Separate `Fixed` entries only for released behavior or independent existing
  bugs. Briefly describe the user impact, not the implementation and review
  history. Released versions and their essential changes remain as history.
- On every release, update `companion/release-notes.json`: same version and
  date as the changelog, most important feature first, brief feature/fix
  one-liners. The changelog remains the complete product chronicle.
- Record new or updated direct dependencies and shipped third-party components
  in the same pass in `docs/third-party-licenses.md` with version, license and
  primary source; shipped ones also with their license texts under
  `licenses/`.

## Sources and generated files

- Only the WSL2 repository is the editable source of truth. The installed SDK
  and samples stay read-only; change only sources copied into the repository.
- `/mnt/c/dev/msfs2024-vr-checklist-staging` and
  `/mnt/c/dev/msfs2024-vr-checklist-companion-staging` are one-way targets;
  never synchronize them back. The companion staging folder contains only
  built artifacts.
- `node_modules/`, `msfs/PackageSources/VRChecklist/dist/`, `Packages/`,
  `PackagesMetadata/` and `_PackageInt/` are generated; do not edit or version
  them manually. `task install` copies `msfs/PackageSources/efb_api/` and
  `vendor/` from the local SDK; the SDK EULA forbids redistributing this
  sample content, so never version it. Rendered speech assets are versioned
  according to ADR 0007 so that builds need no TTS.
- `VERSION` is the canonical SemVer for the app, the package and new release
  artifacts; the package definition and npm metadata mirror it, and
  `task check` verifies consistency.
- `checklists/data/*.json` are the only source of checklist content; no second
  list in the app code. `tmp/` is ignored and volatile; documentation images
  that are needed go into `docs/assets/` with descriptive names.

## Product quality

- MSFS, the EFB SDK and Coherent are runtimes of their own; do not derive
  their behavior from general browser, React or OS conventions.
- VR-first: readability and large interaction targets take precedence over
  information density.
- Event-first, no unnecessary per-frame work. Polling only with a reason,
  slowly and stopped completely while the app is inactive. MSFS FPS are a
  quality criterion of their own.
- Reset when a new flight loads; verify changes to this specifically in MSFS.
- Audio quality applies regardless of the output device. Do not require
  additional manual listening tests specifically for headsets, in-ears or
  other headphone types.
