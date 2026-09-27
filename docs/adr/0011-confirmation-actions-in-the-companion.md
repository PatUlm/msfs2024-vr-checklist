# ADR 0011: Switching confirmation actions in the companion

Status: Accepted (2026-09-25). Supersedes
[ADR 0002](0002-confirmation-via-in-sim-key-interception.md).

## Problem

Finding an event that is actually available across the fleet took
considerable effort. A free event choice would shift this search to users. In
case of conflicts, confirmation should be switchable off without introducing
an EFB settings page. Settings must also be possible without a running
simulator.

## Decision

The companion settings contain a selection list of proven confirmation
actions with a shared enable switch. Initially only `PLASMA_OFF` is included,
shown as `SET PLASMA OFF` and on by default. Both apps take the catalog from
the same versioned source file; further actions need evidence.

The companion stores the desired state locally and transfers it via CommBus on
EFB contact and after changes. The EFB stores the applied state persistently,
separate from flight progress. The settings report a pending transfer and
errors; the status text disappears after the transfer is confirmed.

## Consequences

- Settings can be edited offline. On contact, the value stored in the
  companion applies; without the companion, the last value stored in the EFB
  applies.
- Flight changes, VR context changes and simulator restarts do not reset these
  values. The companion is required for configuring, not for confirming.
- Off disables the checklist reaction, not the simulator event. Pass-through,
  visibility check, debouncing and lifecycle registration remain according to
  the [SDK reference](../msfs-sdk-reference.md#sim-key-events-in-a-custom-efb-app).
- No free event input, global key capture or additional EFB page.
