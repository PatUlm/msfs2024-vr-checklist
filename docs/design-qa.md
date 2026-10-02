# Design QA

This list holds only open visual deviations and the screenshots they need
under `docs/assets/`. Once resolved, the item and any images no longer needed
are removed. No log of passed visual checks. Permanent product decisions are in
[design-decisions.md](design-decisions.md), technical MSFS findings in
[msfs-sdk-reference.md](msfs-sdk-reference.md).

There is no binding overall reference image; VR-relevant changes are checked
in the actual EFB.

## Companion: `Test sound` icon sits too high

In Settings, the speaker icon of `Test sound` is probably about 2 px above the
text line. Cause as for the `Allow` check on the update notice: with
`Stretch="Uniform"` in the 16×16 box, Avalonia places a geometry that is wider
than tall at the top instead of centering it. Next step: give this `Path` a
height that matches its aspect ratio, as done for `Allow` in
`MainWindow.axaml`, and compare it in the running companion.
