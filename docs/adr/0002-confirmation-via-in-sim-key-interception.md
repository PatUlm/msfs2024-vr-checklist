# ADR 0002: Confirmation via in-sim key interception

Status: Superseded by [ADR 0011](0011-confirmation-actions-in-the-companion.md).

## Decision and reason

The EFB receives `PLASMA_OFF` directly. Users bind `SET PLASMA OFF` in the
MSFS Controls; the app knows only the event, not a physical key. This provides
the VR benefit without a companion or a system-wide keyboard hook.

The action is confirmed as a shared trigger for the G36, DA42, H125 and MH-60;
the OH-6A/H500C were added later. A custom fleet-wide Controls action from a
pure EFB package is not supported by the reviewed SDK. Technical limits and
unsuitable alternatives are documented only in the
[SDK reference](../msfs-sdk-reference.md#sim-key-events-in-a-custom-efb-app).

## Consequences

- Follow the SDK reference for pass-through, debouncing, visibility and
  re-registration after flight load sequences. No input polling.
- No low-level keyboard hook and no global key capture.
- The event name stays fixed in the private state. **A configurable event
  choice was decided before distribution to others**, because the event can
  operate a system in other aircraft; it is implemented according to
  [ADR 0011](0011-confirmation-actions-in-the-companion.md).
- Relevant SDK or simulator changes may require a reassessment; interception
  is no committed, stable EFB API contract.
