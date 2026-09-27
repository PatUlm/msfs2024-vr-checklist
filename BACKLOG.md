# Open work

Entry point for the question "What is still open?". Tasks are listed in
implementation order. For topic lists, only the link is kept here; status,
findings and next steps are maintained only at the target.

**⚠ Git history:** The history is rewritten exactly once, in item 1 at the
first GitHub push. Items marked ⚠ may identify files that must additionally be
removed from the history at that point.

## Implementation and release

1. **⚠ Rewrite the history and push to GitHub for the first time.** All commit
   hashes and tags change.
   1. Push the current state including tags to Bitbucket. Bitbucket then
      remains a frozen private backup of the old history and receives no
      further pushes. Do not add it as a remote to the rewritten repository,
      so that no fetch brings the old history back.
   2. In a fresh clone from Bitbucket, which also verifies the backup, use
      `git filter-repo` to rewrite author, committer and tagger of all commits
      and tags, including both previously used addresses, to `PatUlm` and the
      GitHub noreply address. Replace the old package and author name in file
      contents and paths of all commits with `patulm-vr-checklist` or `PatUlm`
      respectively, so that the former surname no longer appears anywhere.
      Remove these paths from all commits:
      - the former QA screenshots `docs/assets/action-bar-alignment.png`,
        `content-manager-thumbnail-version-finding.png`,
        `default-item-reference.png`, `efb-icon-fill-finding.png` and
        `vr-g36-accepted-layout.png`: no longer needed; they show the former
        author name, third-party add-ons and game content;
      - `ContentInfo/thumbnail.jpg` of the former package definition and
        `msfs/PackageSources/VRChecklist/src/Assets/app-icon.svg`: unchanged
        EFB template sample assets (EULA 1(b));
      - `assets/audio/checklist-completed.wav` and `.opus`: placeholders using a
        Windows system voice, redistribution right not established; companion
        states from 2026-09-12 to 2026-09-18 can no longer be built afterwards;
      - `msfs/PackageSources/efb_api/` and `msfs/PackageSources/vendor/`: SDK
        sample content (EULA 1(b)); older states then only build with a copy
        taken manually from the SDK.

      Afterwards, set the repository's `user.name` and `user.email`
      accordingly. The clone replaces the working copy at the same path; keep
      the old one aside until the GitHub push is verified.
   3. Update references to the project's own commits in the current state
      using the filter-repo commit map and check the tags. Before pushing, make
      sure the former surname no longer appears in any reachable blob, path,
      commit or tag message, or identity.
   4. Add `https://github.com/PatUlm/msfs2024-vr-checklist` as `origin` and
      push on explicit request. GitHub is the primary remote from then on.
2. **Prepare the GitHub release.** Once the tasks and topic reviews are
   complete, create the release artifacts according to the
   [release process](docs/release.md) and prepare the release description.
   Publish the repository and the GitHub release on explicit request.
3. **Update check in the companion.** According to
   [ADR 0012](docs/adr/0012-distribution-as-zip-and-companion-setup.md), check
   installed versions against GitHub Releases once at startup, download and
   apply updates only after confirmation, and point out the EFB ZIP. The online
   check is opt-in: ask on first launch whether checking is allowed; it can be
   turned off in Settings. Refine the README statement "No cloud connection in
   flight" accordingly. Requires a published GitHub release; users of the first
   release update manually once.

## Topic lists

- [License and redistribution questions](docs/license-audit.md)
- [MSFS runtime verifications](docs/open-tests.md)
- [Visual verifications](docs/design-qa.md)
