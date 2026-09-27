# ADR 0003: CommBus over SimConnect

Status: Accepted (2026-08-26).

## Decision and reason

The EFB app and the companion exchange named CommBus events over SimConnect.
This bidirectional SDK channel needs neither an additional WASM bridge nor a
localhost network connection and fits the event-driven app.

## Consequences

- Transfer the complete versioned state on first contact, after a reconnect
  and on changes. Group completions are derived from the state so that rate
  limiting does not lose individual completion pulses.
- A session/instance identifier and a sequence number distinguish old and
  repeated states. The concrete data contract is in the code, not
  additionally in the ADR.
- A small summary without checklist texts or item lists. The maximum CommBus
  payload has not been measured; large messages need evidence first.
- Chunk reassembly, rate limiting, script load order and pause behavior
  according to the
  [SDK reference](../msfs-sdk-reference.md#commbus-and-external-companion-app).
- The EFB app stays fully usable without the companion.

WebSockets have no committed EFB contract; Client Data Areas do not reach
JavaScript directly, and LVars need polling. An additional WASM bridge would
open the same channel with more build and packaging effort.
