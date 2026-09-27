# Design decisions

This document holds deliberately chosen product rules that could otherwise get
lost in a rework. It is no acceptance log, CSS transcript or complete list of
all UI states. Dimensions and technical details are in the code, MSFS
specifics in [msfs-sdk-reference.md](msfs-sdk-reference.md), open visual
checks in [design-qa.md](design-qa.md).

## EFB: readability and layout

- VR readability and large interaction targets take precedence over
  information density. Sizes follow the root font size and the app's own
  layout box, without a global CSS transform. When mounted, the VR density
  profile is always used; outside VR, the detached panel shows more content.
  Small/Medium/Large changes the physical size within a profile, not the
  visible section.
- Exactly one group is visible. Order: app header, navigation, group heading,
  items. Only the item list scrolls. Its scrollbar space stays reserved;
  navigation and items keep the same visible alignment.
- Two equally wide navigation buttons show only the neighboring group names,
  centered, without numbers, direction arrows or Previous/Next additions. Their
  font is as large as the item text; the list ends are called `Start` and
  `Complete`.
- The group name dominates. The phase is shown smaller as a light blue,
  rounded outline tag to its right, without its own interaction. If space is
  short, the whole tag wraps; all phases have the same color.
- The separate `Skip phase` button has a chapter-skip icon and a tooltip. It
  stays together with the phase tag and uses the same hover language as the
  navigation. Group heading and navigation have a transparent background.
- The version is shown small and faint at the bottom right. The version format
  is defined in [release.md](release.md).

## Items and progress

- Main row: challenge, dotted leader, response, checkbox on the right. The
  whole row including the checkbox border is clickable.
- `action` has no type label and no left color marker. `verify`,
  `communication` and `optional` get a label and a color marker;
  `communication` is shown as `ATC`, `optional` is a muted gray-blue.
- Optional items do not count toward the required progress. Group checkmarks
  and the automatic group change still require **all** items: the pilot
  decides on skipping.
- Completed items are green and show an X in the checkbox. Complete groups
  show a green checkmark before their name in the heading and the navigation.
  Meaningful symbols are drawn as CSS geometry or assets, not taken from
  unreliable font coverage.
- Hover brightens the background; no white outline. Contrast and the
  completed state remain recognizable.
- `Review required` is neutral, without an additional signal color. Detail
  labels such as `Condition:` and `Note:` have a colon and the same text size
  as their content. Spelling conventions are defined only in the
  [style guide](../checklists/data/style-guide.md).

## Navigation, input and reset

- After the last open item, the next group follows after a short confirmation
  pause. Key/HOTAS confirms only the next open item of the **displayed** group,
  and only while the app is visible. A complete group remains unchanged.
- `Skip phase` completes all open items of the contiguous phase block,
  including optional items and earlier groups of the same phase. It opens the
  first group of the next block at the top of the list; its progress is kept.
  In the last phase, the last group stays visible. When all its items are
  done, Skip is disabled until one is reopened. The companion receives only
  the final state: a single completion, followed by the next open item if
  there is one.
- A new flight resets progress and the active group on **loading**, not on
  `FlightEnd`. The last state may still be visible in the menu. Aircraft
  changes and simulator restarts also reset; VR switches and pause do not.
  Context handover without a timeout according to
  [ADR 0009](adr/0009-progress-across-efb-context-changes.md).
- The app selects automatically through explicit aircraft rules, also in the
  free flight configuration. Missing or ambiguous matches show
  `No checklist available` and a subtle diagnostic line with
  `ATC MODEL`, `ATC TYPE`, `TITLE`; there is no default checklist.
- The event choice is defined by
  [ADR 0011](adr/0011-confirmation-actions-in-the-companion.md).

## Companion: window and status

- Minimizing keeps the connection and audio running; closing exits the app.
  No tray icon. `Escape` closes the active secondary window, not the
  dashboard.
- `Settings` is at the top right next to `Release Notes` and is modal;
  `Checklists` is a single non-modal window that comes to the front when
  opened again. Connection and audio keep running.
- Settings sections follow the order heading, explanation, control. Audio
  comes before `EFB Keybindings`. A switch as for audio enables confirmation;
  the dropdown is next to it. When off, the selection is kept and the dropdown
  is locked and grayed out. The setting can be edited offline. The companion
  stores the desired value locally; text reports a pending transfer or errors
  and disappears once the EFB has confirmed applying it. Storage and event
  choice according to
  [ADR 0011](adr/0011-confirmation-actions-in-the-companion.md).
- Connection attempts calmly show `Connecting` and `Waiting for MSFS 2024.`,
  a connection shows `Connected`. Yellow/green complements the visible text.
  The EFB status stays separate: SimConnect alone does not mean a snapshot.
  Actual errors such as a missing DLL remain recognizable as errors.
- The active phase appears next to `Active Group` in the same tag style as in
  the EFB; without a phase, the tag stays hidden. The detail card and the
  window follow the content height, without artificial empty space below the
  progress.
- For an unknown aircraft, `Copy` copies the three unchanged diagnostic values
  as labeled lines. The button appears only with a matching current snapshot;
  success is briefly reported as `Copied` in the button.
- Buttons have light text on a dark blue surface, visible hover and their own
  icon to the left of the text. Theme default colors must not override the
  contrast; icons do not replace text.

## Companion: audio

- EFB operation stays independent of connection and audio. No microphone
  recording, speech recognition or online TTS in flight.
- `Read checklist items` and `Radio effect` are on by default and are saved.
  A deliberately saved off state is kept.
- Item announcements read the current open item, also after being switched on
  or on the first matching snapshot. New items replace old announcements; no
  queue. Repeated snapshots, reconnects and VR switches do not repeat the same
  item. A new flight or checklist change discards old announcements; loss of
  connection and protocol errors stop playback.
- The first item of each group starts with `<group name> Checklist.` and a
  short natural sentence pause. This also applies when that item is read
  again; when continuing with a later item, the group name is omitted.
- A newly completed group says `Checklist completed` once. Groups already
  complete at startup or reconnect are not announced afterwards. After
  reopening and completing it again, the group may speak again. The completion
  announcement finishes before the item that has become current in the
  meantime.
- Turning off item announcements leaves group completion and `Test sound`
  available. A differing checklist revision reports an audio error instead of
  reading the wrong text.
- `Radio effect` applies live to the same clean recording; off plays it
  unchanged. No intercom variant, see
  [ADR 0010](adr/0010-radio-effect-during-playback.md).
- `Audio output` saves the selection immediately and uses it from the next
  announcement. `Windows default` comes first, followed by recently selected
  devices, the rest alphabetically. The saved order appears the next time the
  list is opened; Windows default does not clear the device history.
- Missing devices stay selected with `(unavailable)`, without a silent
  replacement. The list refreshes when the window or dropdown is opened or
  activated; returning devices are recognized by their ID.
- `Test sound` is only in Settings, plays the completion sound on the selected
  output and does not change any progress. It plays to the end regardless of
  the simulator connection and checklist events. Cancellations, storage and
  playback errors are reported as text.

## Companion: checklists and export

- The sorted list contains all shipped checklists. When opened, the current
  checklist is selected, otherwise the first one. Later aircraft changes do not
  change a selection that is already open.
- One card per group from the canonical data, with its phase and the same item
  parts as in the EFB. No second editorial data source.
- `Copy` produces Markdown-like text with title, group/phase and item details;
  feedback appears directly as `Copied`. Texts remain individually selectable.
- `PDF` uses the native save dialog, suggests
  `<title> Checklist – <revision>.pdf` and opens the default PDF viewer. A4,
  two column pairs, gray-filled group headers with a white centered heading
  including the phase, borders and closing lines. Groups stay together as long
  as they fit in one column, otherwise they continue with a continuation
  header. Verify rows are light blue, ATC violet, optional gray; action rows
  have no fill. Details are small and italic; review notes are not printed.
- PDFs stay small and embed no fonts; the custom writer uses the PDF standard
  fonts. No rendering path that embeds complete fonts.
- `Release Notes` is offline, newest version first, with date, an optional
  main feature and short one-liners ordered by importance. Editorial rules and
  the reconciliation with the changelog are in [AGENTS.md](../AGENTS.md).

## Branding and markup

- Shared mark: clipboard, gray lines on the left, blue checkmarks on the
  right, white outer contour. Transparent in the EFB, on a dark round tile on
  Windows. The My Library thumbnail additionally shows `VR Checklist`, no
  version. Sources and image formats: [branding](../assets/branding/README.md).
- By maintainer decision, the app's own EFB markup contains no `aria-*` attributes or
  ARIA roles. Display, operation, SDK references and explanatory tooltips
  remain; unused IDs and SEO metadata are omitted. This rule does not apply to
  the versioned SDK templates.
