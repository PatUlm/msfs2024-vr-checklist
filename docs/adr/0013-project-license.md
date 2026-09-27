# ADR 0013: Project license

Status: Accepted (2026-09-26). Supersedes the decision in
[ADR 0001](0001-licensing-and-publication-strategy.md) that the project's own
code stays `UNLICENSED`.

## Problem

For the open-source release, the project's own code and content need a
license and a rights holder. At the same time, the repository contains
third-party parts with their own terms.

## Decision

- The project's own code and content (checklist data, documentation,
  branding) are licensed together under the [MIT License](../../LICENSE).
- The rights holder in the copyright notice is the pseudonym `PatUlm`,
  matching the pseudonymous release.

## Consequences

- Excluded are the configuration files taken from the EFB template
  ([origin](../../msfs/PackageSources/README.md)), third-party components
  ([overview](../third-party-licenses.md)) and the audio recordings under their
  own [audio terms](../../assets/audio/LICENSE). The README separates them; the
  repository is never described as entirely MIT.
- GPL is ruled out because the EFB app and the companion build on proprietary
  parts (MSFS SDK, `SimConnect.dll`). Apache-2.0 and MPL-2.0 would impose
  additional obligations on forks without notable benefit for the add-on.
- MIT also allows closed and commercial reuse; only the copyright and license
  notice must be preserved.
- The selection rules for dependencies from ADR 0001 still apply.
