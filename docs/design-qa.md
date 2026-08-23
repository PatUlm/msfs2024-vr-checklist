# Design QA

- Layout reference: [`assets/default-item-reference.png`](assets/default-item-reference.png)
- Current MSFS capture: [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png)
- Reference pixels: 668 × 56 at 1× density
- Current capture pixels: 741 × 360 at 1× density
- Intended implementation viewport: approximately 668 CSS px item width in the EFB
- Current state: completed Action-Item hovered in the first checklist group

## Full-view comparison evidence

The current implementation has been captured from the MSFS/Coherent runtime.
It confirms the overall hierarchy, the background-based item hover, the CSS X,
the dotted leader and the right-aligned checkbox. The action bar extends farther
right than the item list while both left edges align.

## Focused-region comparison evidence

The reference is a focused crop of one default checklist item. It specifies a
compact single row with challenge, dotted leader, response, and a right-aligned
checkbox. The current MSFS capture shows this structure in the completed and
hovered state. The historical blue Action marker in the reference is no longer
desired; `design-decisions.md` supersedes it.

## Findings

- [P1] The action bar is wider than the item list on the right.
  - Location: first checklist group in `assets/action-bar-alignment.png`.
  - Evidence: both left edges align, but the navigation reaches farther right.
  - Impact: the main vertical alignment looks imprecise.
  - First runtime result: with a short, non-scrolling section the item edge is
    about 1 px inside the navigation edge; with a scrolling section the
    difference grows to about 11 px.
  - Implemented locally: the list always reserves Coherent's scrollbar track,
    while the scroll container extends that track into the right outer padding.
    Navigation and visible items therefore use the same full content width.
  - Runtime result: verified; both right edges and the visible outer padding now
    align with and without a visible scrollbar.
- [P2] The navigation buttons still use a white/accent outline on hover.
  - Location: previous/next buttons.
  - Impact: navigation and checklist items use different interaction feedback.
  - Implemented locally: navigation now uses the same lighter background and
    keeps its regular border.
- [P2] Item hover feedback feels delayed in the MSFS runtime.
  - Location: checklist items.
  - Evidence: visual response follows the pointer with a perceptible delay.
  - Implemented locally: local and inherited button transitions are disabled
    for checklist items and section navigation.
  - Runtime result: verified; hover timing now feels substantially more
    responsive.

## Visually verified implementation

- Default item minimum height reduced to 60 px.
- Base font set to 20 px, slightly larger than the source mock.
- Challenge, dotted leader, response, and 40 px checkbox share one horizontal row.
- Checkbox is aligned at the right edge.
- Item spacing is 8 px, exceeding the requested minimum of 2 px.
- Additional verify/review content expands an item vertically.
- Completed state uses a font-independent CSS X.
- Item hover uses a lighter background rather than a white outline.

## Comparison history

- Initial implementation pass used the now-versioned default-item reference.
- The current MSFS capture verifies the completed item and records the remaining
  action-bar alignment issue.

## Next runtime verification

- Verify that completed items and the active section survive switching from VR
  to non-VR and back. The EFB may recreate the app context during this switch;
  the new transient DataStore snapshot should restore the same aircraft and
  checklist revision without weakening the new-flight reset.
- Verify that a real new-flight loading transition still clears both the visible
  state and the transient progress snapshot. The console should report
  `Flight loading detected; progress reset.`.
- Verify that the console reports `Display mode detected: VR` after entering VR
  and `non-VR` after leaving it.
- Runtime result: the 17 px VR typography, equal visible left/right padding and
  compact VR density profile with 62 px navigation, 51 px default items and
  34 px checkboxes are accepted for the next flight. The non-VR cockpit tablet
  retains its accepted 20 px baseline.
- Verify that both navigation buttons use immediate background hover without a
  white outline.
- Verify that the larger navigation group names remain readable without
  truncation after removing `PREVIOUS` and `NEXT`, and that their blue section
  numbers share a clean baseline with the names.
- Verify that the CalVer identifier remains unobtrusive in both checklist and
  empty states.
- [Blocked] Confirm the first open item through MSFS `VALIDATE`.
  - First runtime result: registering `KEY_EFB_VALID` immediately on resume for
    the `released` signal did not receive the configured Enter input.
  - Second implementation: wait until the input stack reports ready, then
    register both `KEY_EFB_VALID` and the SDK input-profile action
    `KEY_MENU_WM_VALIDATE` for `pressed`. Diagnostic console messages distinguish
    listener readiness, registration and received actions.
  - Second runtime result: the stack reported ready and both actions were
    registered, but pressing Enter produced no input callback.
  - Third implementation: use the `AppView.routeGamepadInteractionEvent()` hook
    through which the EFB routes its abstract `GamepadEvents.BUTTON_A`
    confirmation to the visible app.
  - Third runtime result: neither Enter nor a physical gamepad produced the
    expected callback or diagnostic output. The unrelated
    `Trying to enable gamepad inputs that are already enabled` warning came from
    `atlasapp.js`, not VR Checklist.
  - Resolution: all inactive input hooks were removed. The source documents the
    tested paths; implementation waits for a documented and runtime-verified
    custom-app input route.

## Aircraft-selection runtime findings

- The centered empty state and the bottom `Model:` line were visually accepted
  with the DA62.
- The DA42, G36 and MH-60 are matched successfully.
- The initially estimated G36 and MH-60 aliases were replaced with rules based
  on these observed identities:
  - MH-60: `60 | $$:MH-60 | MH60 Tango`
  - G36: `TT:ATCCOM.AC_MODEL_BE36.0.text |
    TT:ATCCOM.ATC_NAME_BEECHCFRAFT.0.text | Beechcraft Bonanza`
- Switching between aircraft now replaces the active checklist correctly; the
  previously observed stale DA42 checklist no longer remains visible.

## Version indicator

- Implemented locally at the lower-right edge in the development format
  `YYYY.0M-dev.SSSSSSS`.
- The numeric suffix contains UTC seconds since the start of the month and is
  padded to seven digits. Runtime appearance is pending verification.

## Planned TTS completion announcement

- When the entire checklist changes from incomplete to complete, speak
  `Checklist completed` once.
- Not implemented yet. The implementation must share the existing/future TTS
  path with item speech, avoid duplicate announcements and be verified in the
  MSFS/Coherent runtime.

final result: pending next visual iteration
