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

### Navigation endpoint placeholders

The disabled `Start` and `Complete` navigation placeholders no longer render
direction arrows, while navigation buttons with real section targets keep their
arrows and alignment. Both endpoints were accepted in release 0.1.6.

## Lifecycle regression follow-up

Release 0.1.5 still retained all completed H125 items after ending a Free
Flight and starting another H125 Free Flight in the same MSFS process. Waiting
longer than the 15-second display-mode handoff did not change the result. Code
inspection confirms that the timeout only removes the `DataStore` handoff;
the resident `ChecklistRuntimeState` has no timeout and remains completed when
neither `GameState.loading` nor an aircraft identity change is observed.

The first diagnostic build showed `GameModeManager.isInMenu` changing from
`false` to `true` when leaving Free Flight and back to `false` when the next
Free Flight started. The counter-test ESC → Settings → Save → Resume produced
the identical `true`/`false` sequence. `isInMenu` is therefore explicitly
rejected as a reset trigger because it cannot distinguish the Config menu from
the end of a flight.

The installed SDK 1.7.3, its `FlowAircraft` sample, and the official JavaScript
Flow API documentation identify `__FLOW_API__` as the direct JavaScript path
for global flight-flow events. Development build
`0.1.5-dev.20260825194948` received the following same-aircraft transition in
the resident Custom EFB while `GameStateProvider` stayed `ingame` and the H125
identity remained unchanged:

- `FlightEnd`
- `FltLoad` / `FltLoaded` for `apron.flt`
- `FltLoad` / `FltLoaded` for `CustomFlight.FLT`
- `TeleportStart` / `TeleportDone`
- `FlightStart`, followed by another `apron.flt` load and `RTCStart` / `RTCEnd`

Each `FltLoad` reset is intentionally idempotent. The console confirmed the
reset callback, and the user confirmed that the new H125 Free Flight started
without the completed state from the previous flight. The original
same-aircraft regression is therefore runtime-verified as fixed.

The `FltLoad` reset was checked against the earlier `isInMenu` counter-test on
build `0.1.5-dev.20260825200349`: ESC → Settings → Save → Resume kept every
checked item and produced no reset. The Config menu therefore does not emit a
`FltLoad` event, which is what disqualified `isInMenu` as a trigger.

The non-VR → VR → non-VR round trip was accepted in the Phase 1 runtime pass
and has not been re-verified against the Flow API listener. VR display-mode
changes do not emit `FltLoad`, so the single-use `DataStore` handoff is expected
to remain unaffected. A regression here is tracked as a new bug report rather
than as a release blocker.

Release 0.1.6 confirmed two further runtime behaviors. Opening the app from the
Free Flight configuration screen already selects the matching checklist, and
changing the aircraft there updates the open EFB. The reset is also observably
bound to the load of the next flight rather than to the end of the previous
one: reopening the EFB in the menu after ending a flight still shows the
previous session. Both results are accepted and recorded in
`design-decisions.md`.

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

Release 0.1.6 resolved all three findings in MSFS. My Library shows the full
uncropped 360 × 240 thumbnail including its centered title, and its version
matches the app footer now that both read the canonical `VERSION`. The
clipboard interior stays transparent in the normal, hover, and selected
app-list states, so the explicit `fill="none"` declarations hold in Coherent GT.

The revised icon was not re-checked in VR for this release. The original motif
was accepted in VR on 2026-08-24, and the revision changed only the fill
declarations and the left/right composition, not the shape weight that carries
VR legibility.

current result: release branding accepted in MSFS with release 0.1.6

## Resolved bug: VR and non-VR kept separate checklist state

Reported by the user on 2026-08-26 against release 0.1.6, rebuilt and
**verified in MSFS on 2026-08-27**, released with 0.1.7. The fix and its
reasoning are in
[ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md); the section
below keeps the original report and what the verification run showed.

**Expected:** One checklist state that survives a display-mode change. Whatever
is checked off stays checked off in both VR and non-VR.

**Observed:** VR and non-VR behave as if each had its own state.

**Reproduction:**

1. In VR, check off one or more items.
2. Switch to non-VR and check off different items.
3. Switch back to VR.
4. The previous VR state is shown, not the state left behind in non-VR.

**Impact:** The checklist can silently show an outdated set of completed items
after a display-mode change. In the worst case a pilot believes an item is still
open, or believes one is done when it is not. That makes it a correctness bug,
not a cosmetic one.

**State of knowledge at the time of the report**, from reading the 0.1.6 code.
The symbols named here no longer exist:

- Progress crosses a display-mode change through a **single-use handoff** in the
  `DataStore` (`persistSelectedChecklistProgress` /
  `restoreStoredChecklistProgress` in `VRChecklist.tsx`). The snapshot carries
  `sourceVrMode` and `targetVrMode`, and restoration requires
  `targetVrMode === currentVrMode` plus an age of at most
  `DISPLAY_MODE_HANDOFF_MAX_AGE_MS` (15 s). A timer clears the snapshot after
  that window.
- That design assumes MSFS **destroys and recreates** the EFB app context on a
  display-mode change, so that exactly one instance is alive at a time.
- The reported behavior fits the hypothesis that this assumption no longer
  holds: if the VR EFB and the 2D EFB stay alive as **two parallel instances**,
  each keeps its own resident `ChecklistRuntimeState`. Coming back, the 15-second
  window has long expired, nothing is restored, and the other instance's stale
  in-memory state is what the user sees.
- Alternative explanations not yet ruled out: the handoff is written but rejected
  on restore for another reason (aircraft identity key, checklist revision,
  simulator session tolerance); or `refreshVrMode` does not observe the
  transition in one direction, so no snapshot is written at all.

**What was done instead of a diagnostic run first.** The planned next step was
to reproduce with logging and only then choose a fix. That order was dropped on
purpose: all three candidate explanations — recreated app context, two parallel
instances, a rejected handoff — share one cause, namely that the authoritative
state lived in one app instance and crossed to another only through a narrow,
time-limited special case. The rebuild removes that cause and holds under all
three, so it does not need the diagnosis to be chosen. The narrow logging was
built anyway, so the verification run answers the open questions in the same
pass.

**The fix.** The `DataStore` record is now the authoritative progress state for
the simulator session; an instance's memory is only a view of it. Every toggle
and every section change writes it, and every instance reconciles against it on
resume, on a detected `IS IN VR` change, on the flight-lifecycle events and on
the existing slow aircraft fallback. A record with a newer `savedAt` than this
instance's own last write is adopted. The 15-second window, the single-use
delete and the stored display mode are gone. The reset now hangs on `FltLoad`,
`GameState.loading`, the aircraft identity, the checklist id and revision, and
the monotonicity of `E:SIMULATION TIME`. Details and the discarded alternatives
are in ADR 0009.

**Verification in MSFS, 2026-08-27 with `0.1.6-dev.20260827171941`.** All four
cases confirmed by the user:

1. VR: check off items. Switch to non-VR: the same items are checked. Check off
   more. Switch back to VR: everything checked in either mode is checked.
2. A new flight with the same aircraft starts with an empty checklist.
3. An aircraft change starts with an empty checklist.
4. Pausing the simulator for well over a minute does not clear progress — the
   case the old derived session start would have broken.

**Still unanswered, and deliberately so:** how many EFB app instances a
display-mode change produces. The rebuild makes that irrelevant to correctness,
which is the point of ADR 0009, so it was not worth a separate run. The
diagnostics that answer it stay in the code and cost nothing outside state
transitions:

- `App instance <id> created` — whether a switch creates a new instance.
- `Instance <id> resumed/paused/closed` — which lifecycle hooks an instance
  receives on a display-mode change.
- `Instance <id> adopted N completed items…` — that the reconcile fires, and in
  which direction.
- `Instance <id> discards the stored progress: <reason>` — expected on an
  aircraft change and after a restart, not during a plain display-mode change.
