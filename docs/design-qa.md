# Design QA

- Source visual truth: `tmp/03.png`
- Implementation screenshot: unavailable until the revised package is rendered in MSFS 2024
- Source pixels: 668 × 56 at 1× density
- Intended implementation viewport: approximately 668 CSS px item width in the EFB
- State: default, unchecked action item
- Density normalization: not applicable until the implementation screenshot exists

## Full-view comparison evidence

Blocked. The source crop was opened and inspected at its original resolution, but the MSFS/Coherent runtime cannot be captured from this workspace.

## Focused-region comparison evidence

The source is already a focused crop of one default checklist item. It specifies a compact single row with challenge, dotted leader, response, and a right-aligned checkbox. A corresponding rendered implementation crop is still required.

## Findings

- [P1] Runtime comparison is missing.
  - Location: default action item in the MSFS EFB.
  - Evidence: source image is available; no post-change implementation screenshot exists yet.
  - Impact: typography, exact vertical centering, and Coherent-specific CSS behavior cannot be verified from build output alone.
  - Fix: build the deployed package, reload the EFB with Coherent resource caching disabled, and capture the same default item state.

## Implemented changes awaiting visual verification

- Default item minimum height reduced to 60 px.
- Base font set to 20 px, slightly larger than the source mock.
- Challenge, dotted leader, response, and 40 px checkbox share one horizontal row.
- Checkbox is aligned at the right edge.
- Item spacing is 8 px, exceeding the requested minimum of 2 px.
- Additional verify/review content may still expand an item vertically.

## Comparison history

- Initial implementation pass completed from `tmp/03.png`.
- No post-fix visual iteration is possible until a new MSFS screenshot is available.

## Next iteration

- Give the two action-bar navigation buttons the same background-based hover treatment as the checklist items instead of a white outline.
- Align the action bar's right edge with the checklist items; its left edge already aligns correctly. See `tmp/09.png`.
- Investigate the perceptible delay before item hover feedback, especially whether an inherited CSS transition causes it.

final result: blocked
