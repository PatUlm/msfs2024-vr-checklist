# Open work

Entry point for the question "What is still open?". Tasks are listed in
implementation order. For topic lists, only the link is kept here; status,
findings and next steps are maintained only at the target.

## Implementation and release

1. **Publish the repository and the first GitHub release.** The draft release
   for `v0.18.1` with description and all release assets is prepared on
   GitHub. On explicit request, make the repository public and publish the
   draft as the latest release, not as a pre-release.
2. **Update check in the companion.** According to
   [ADR 0012](docs/adr/0012-distribution-as-zip-and-companion-setup.md), check
   installed versions against GitHub Releases once at startup, download and
   apply updates only after confirmation, and point out the EFB ZIP. The online
   check is opt-in: ask on first launch whether checking is allowed; it can be
   turned off in Settings. Refine the README statements that the add-on is
   completely offline and uses no internet connection accordingly. Requires a published GitHub release; users of the first
   release update manually once.

## Topic lists

- [License and redistribution questions](docs/license-audit.md)
- [MSFS runtime verifications](docs/open-tests.md)
- [Visual verifications](docs/design-qa.md)
