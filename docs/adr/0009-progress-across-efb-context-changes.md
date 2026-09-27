# ADR 0009: Progress across EFB context changes

Status: Accepted (2026-08-30); supersedes the time-limited one-time handover.

## Decision and reason

The SDK `DataStore` hands progress over between resident or successively
active EFB contexts of the same simulator session. Pure in-memory state is not
enough for a VR switch; a timeout does not model the lifecycle reliably.
Technical basis:
[SDK reference](../msfs-sdk-reference.md#efb-app-lifecycle-and-shared-state).

## Consequences

- Every user change and every group change writes the complete record; new or
  reactivated contexts take over the compatible state.
- Aircraft identity, checklist ID and revision must match. `savedAt` detects
  an updated state; it is no distributed conflict resolution.
- `FltLoad`, observed loading, aircraft/checklist changes and a detected
  simulator restart reset the state. VR switches and pause do not.
- Restart detection uses the monotonicity of the simulation time, not an
  expiry time of the record. The slow reconciliation stops while the app is
  inactive.
- No precautionary multi-writer synchronization: simultaneously writing
  instances are no proven product need. Only a specific runtime conflict
  would justify this extension.

A handover only on close/pause relies on hooks that are not guaranteed;
periodically discarding the state after a deadline can miss legitimate
context changes.
