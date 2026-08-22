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
  - Fix: account for the item list's scrollbar/right padding in the action bar.
- [P2] The navigation buttons still use a white/accent outline on hover.
  - Location: previous/next buttons.
  - Impact: navigation and checklist items use different interaction feedback.
  - Fix: apply the same background-based hover language as the items.
- [P2] Item hover feedback feels delayed in the MSFS runtime.
  - Location: checklist items.
  - Evidence: visual response follows the pointer with a perceptible delay.
  - Fix: inspect inherited EFB transitions and the local 100 ms transition;
    prefer immediate background feedback if the delay persists.

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

## Next iteration

- Give the two action-bar navigation buttons the same background-based hover treatment as the checklist items instead of a white outline.
- Align the action bar's right edge with the checklist items; its left edge already aligns correctly. See `assets/action-bar-alignment.png`.
- Investigate the perceptible delay before item hover feedback, especially whether an inherited CSS transition causes it.

final result: pending next visual iteration
