# ADR 0001: Licensing and publication strategy

Status: Accepted (2026-08-26). The `UNLICENSED` decision is superseded by
[ADR 0013](0013-project-license.md). The condition for the private status, a
rights review, is met by the completed [license audit](../license-audit.md).
The selection rules for dependencies still apply.

## Decision and reason

Until the rights are clarified, the project stays private and its own code
`UNLICENSED`. Dependencies should allow a later release: prefer permissive
building blocks and avoid copyleft in the shipped scope, but not at any cost.
Pure development tools are assessed separately. Package manager labels do not
replace checking the primary source.

## Consequences

- Evidence is in [third-party-licenses.md](../third-party-licenses.md),
  specific open release questions in [license-audit.md](../license-audit.md).
- TTS models and phonemizers are not shipped, according to
  [ADR 0006](0006-pre-rendered-speech.md). Audio still needs its own
  redistribution rights.
- Excluded so far: `sherpa-onnx` in the shipped scope because of the GPL
  phonemizer, Lessac-based Piper voices because of restricted TTS/derivative
  rights, `msfs-simconnect-api-wrapper` because of non-commercial terms, and
  DECtalk without a separate license. The sources at the time are in Git; a
  new selection requires a new specific rights review.
- The public license decision supersedes this ADR; it must clearly separate
  the project's own code, third-party SDK parts and audio.
