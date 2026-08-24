# Design QA

- Historical item reference:
  [`assets/default-item-reference.png`](assets/default-item-reference.png)
- Historical alignment finding:
  [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png)
- Accepted VR runtime capture:
  [`assets/vr-g36-accepted-layout.png`](assets/vr-g36-accepted-layout.png)
- My Library branding finding:
  [`assets/content-manager-thumbnail-version-finding.png`](assets/content-manager-thumbnail-version-finding.png)
- EFB icon fill finding:
  [`assets/efb-icon-fill-finding.png`](assets/efb-icon-fill-finding.png)
- Accepted capture size: 861 × 948 pixels at original resolution

The accepted capture shows the compact Phase 1 layout in the G36 cockpit. It
predates the final two G36 content additions and is a visual layout reference,
not a canonical checklist-content reference.

## Phase 1 runtime acceptance

The first free-flight VR test was completed successfully on 2026-08-23. The
checklist remained readable and easy to operate in normal use. The following
runtime behavior is accepted:

- The non-VR cockpit tablet retains its readable 20 px baseline.
- VR uses the accepted compact profile with 17 px typography, 62 px navigation,
  51 px default items, 34 px checkboxes, and proportionally reduced padding.
- Navigation and checklist items have equal visible left/right padding with and
  without a visible scrollbar.
- Checklist rows remain fully clickable and use immediate background hover.
- The CSS-drawn completion X is independent of font glyph coverage.
- Challenge, dotted leader, response, and checkbox remain aligned; additional
  condition, note, alternative, or review content expands vertically.
- The larger section names, blue section numbers, and `Start`/`Complete`
  placeholders remain legible in VR.
- The build identifier remains unobtrusive at the lower-right edge.
- Switching non-VR → VR → non-VR preserves completed items and the active
  section through the transient SDK DataStore snapshot.

## Resolved findings

### Navigation and item alignment

The original runtime capture showed the navigation extending about 1 px beyond
a short list and about 11 px beyond a scrolling list. The list now permanently
reserves Coherent's scrollbar track while extending that track into the right
outer padding. Navigation and visible items therefore use the same content
width. The result is accepted in non-VR and VR.

### Hover behavior

Inherited EFB button transitions caused delayed checklist hover, and the global
button styles could add a white outline. Checklist rows and section navigation
now disable those transitions and use the same lighter-background feedback.
The runtime response is accepted.

### Aircraft selection

- DA42, G36, and MH-60 matching is confirmed in MSFS.
- The DA62 correctly shows the empty state and centered `Model:` diagnostics.
- A resident EFB switches checklists correctly after changing aircraft.
- An unknown aircraft never retains or falls back to the DA42 checklist.

Observed identities used by the match rules:

- MH-60: `60 | $$:MH-60 | MH60 Tango`
- G36: `TT:ATCCOM.AC_MODEL_BE36.0.text |
  TT:ATCCOM.ATC_NAME_BEECHCFRAFT.0.text | Beechcraft Bonanza`

## Remaining lifecycle regression check

A real new-flight loading transition must continue to clear visible progress
and the transient progress snapshot. This behavior existed before the display
mode persistence fix and remains explicit in the implementation, but should be
rechecked when lifecycle/reset behavior is changed again. It does not block the
accepted Phase 1 VR result.

## Deferred VALIDATE input

Confirming the first open item through MSFS `VALIDATE` is deferred. SDK 1.7.3
did not deliver a callback to the custom EFB app through any tested path:

- DOM `keydown` for Enter, Return, or Numpad Enter
- `KEY_EFB_VALID` or `KEY_MENU_WM_VALIDATE` through the EFB input stack
- `AppView.routeGamepadInteractionEvent(BUTTON_A)`, including a physical
  gamepad

All ineffective listeners were removed. The feature waits for a documented and
runtime-verified custom-app input route or a deliberately designed external
event.

## Planned TTS completion announcement

When the entire checklist changes from incomplete to complete, a future TTS
implementation should speak `Checklist completed` once. It must share the
item-speech path, avoid duplicate announcements, and remain optional.

final result: Phase 1 accepted in MSFS and VR on 2026-08-23

## Release-branding runtime follow-up

The copied EFB template icon and placeholder ContentInfo thumbnail were
replaced on 2026-08-24 with a project-specific checklist mark and matching
release thumbnail. The candidate sources are:

- `../assets/branding/app-icon.svg`
- `../assets/branding/content-info-thumbnail.svg`

The first 26 × 27 app icon was checked in the EFB app list on 2026-08-24:
hover and selected states render correctly, and the motif remains clear in VR.
A later original-resolution review found three remaining release-branding
issues:

- The 412 × 170 ContentInfo image was cropped in My Library.
- My Library showed manifest version `0.1.0`, while the app footer showed the
  separate release identifier `2026.08`.
- Coherent GT filled the clipboard interior white even though the root SVG
  declared a transparent fill.

The `0.1.1` candidate used a text-free 360 × 240 thumbnail, one shared SemVer
value, and explicit `fill="none"` on every icon outline. The editable sources
remain under `../assets/branding/`; both finding screenshots are stored above.

The source composition accepted for `0.1.2` moves the gray item lines to the
left and the blue checkmarks to the right with a visible gap, matching the app's
checklist rows. The My Library thumbnail now adds the centered product name
`VR Checklist` below the mark. Both local original-resolution previews were
accepted on 2026-08-24.

Pending runtime checks for this revised candidate:

- Confirm that My Library displays the full uncropped thumbnail, including its
  centered title, and the same SemVer version as the app footer.
- Confirm the transparent clipboard interior in normal, hover, and selected
  app-list states.
- Confirm that the revised icon remains clear in VR.

current result: source composition accepted for release 0.1.2; revised
transparency, thumbnail crop/title, and unified version pending MSFS runtime
verification
