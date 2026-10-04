# Structured checklist data

These JSON files are the only source of checklist content. The
[schema](checklist.schema.json) defines fields and permitted values,
[style-guide.md](style-guide.md) the binding spelling conventions. This file
keeps only editing rules and source evidence, no second field reference or
change log.

## Editing and matching

- `challenge` names the system, `response` the state or action. Maintain
  conditions, alternatives and notes separately. Texts are single-line; the UI
  wraps them.
- The content and completeness of `speech` follow the
  [style guide](style-guide.md#spoken-announcements-speech).
- `needsReview` and a specific `reviewNote` mark unresolved content.
- `decision` records why an entry deliberately deviates from what the style
  guide or the other checklists would suggest. It is internal: app, companion
  and exports never show or speak it, and reviews do not flag such entries
  again. Changing them needs a new decision.
- Checklist, group (`sections` in the JSON) and item IDs are stable semantic
  slugs in `lower-kebab-case`, even when texts change. Item IDs are unique
  within their group; references look like
  `sikorsky-mh-60/engine-start/engine-1-start`.
- The array order alone determines the sequence; there is no separate
  `order`. Each group gets a phase from the schema. `Engine Start` also covers
  preparation, APU and follow-up work, `Taxi` the taxi preparation,
  `Departure` the takeoff preparation, takeoff and climb. No empty groups for
  unused phases. The G36 group `Approach` stays assigned to this phase despite
  its landing configuration.
- Phases serve the display, `Skip phase` and the phase end: consecutive groups
  with the same phase form one block, and the app stops its automatic advance
  after the block's last group. Check phase changes for this effect as well.
- `aircraft.msfsMatches`: rules are alternatives; all fields of a rule must
  match together. `equals`/`contains` are compared normalized; `contains`
  needs at least four normalized characters. Derive new rules from observed
  MSFS values. Missing or ambiguous matches load no default checklist; the
  displayed diagnostic values help add a rule.

```json
{
  "atcType": { "contains": "MH-60" },
  "title": { "contains": "MH60" }
}
```

After data changes, run `task validate`; before completion, `task check` and
deployment according to [AGENTS.md](../../AGENTS.md). Changed spoken texts
require matching [audio assets](../../assets/audio/README.md).

Source references under `checklists/references/` justify values and
deliberate omissions. Do not version original manuals or complete procedure
transcriptions, and do not maintain a second app checklist in the
documentation.

## Content provenance

The checklists are compilations adapted for the app from in-game procedures
and the manual sources documented below. AI tools were used as aids during
editing; the technical evidence is the original publications named here. The
[provenance review](../../docs/checklist-license-review.md) records the vendor
attribution and the assessment of the reviewed set.

- The minimal Cessna 152 checklist is cross-checked against the original
  Cessna POH. Provenance, page references and the values chosen within the POH
  ranges are in [`../references/cessna-152/`](../references/cessna-152/).
- Behavior changes of the Miltech MH-60 are listed in the changelog of the
  [Miltech Bug Tracker](https://bugs.miltechsimulations.com/) (product
  `MH60`), machine-readable at
  `https://bugs.miltechsimulations.com/api/products` (field `changelog`,
  including `EXPERIMENTAL` builds). The older forum topic
  [MH60 Release Notes](https://miltechsimulations.talkyard.net/-337/miltech-simulations-mh60-release-notes)
  ends at V1.1.0. Keybinds and system description:
  [Miltech Documentation Hub](https://docs.miltechsimulations.com/miltech-simulations-mh60).
- The H125 order for the compact engine start is based on the published
  [AS350/H125 operator checklist](https://aviapages.com/media/2022/03/14/Checklist_H125.pdf):
  pitot heat follows the generator and avionics and comes before moving the
  twist grip to `FLIGHT`.
- The H125 procedures relevant to prestart, engine start, run-up and shutdown
  are recorded with page references and provenance in
  [`../references/h125/`](../references/h125/).
- The compact OH-6A/H500C checklist is derived from the Expert checklist in the
  published Taog's Hangar flight manual. Provenance, variant scope and
  deliberate omissions are in
  [`../references/oh6a-h500c/`](../references/oh6a-h500c/).
- The compact H125 shutdown is based on the published
  [AS350 B3e flight manual excerpt](https://data.ntsb.gov/Docket/Document/docBLOB?FileExtension=.PDF&FileName=Excerpts+from+AS350+Flight+Manual%2C+Revisions+2+%26+3+-+Normal+Procedures-Master.PDF&ID=40431411):
  twist grip to `IDLE`, 30 seconds of cool-down, then switch off the systems
  used, and apply the rotor brake only at 140 rotor RPM or less.
- The A400M checklist reflects an in-game procedure adapted for the app. Page
  names were added according to the
  [iniBuilds manual](https://flightsimulator.azureedge.net/wp-content/uploads/2024/11/Airbus-A400M-MSFS-Manual.pdf).
  `BLOCK` denotes the total fuel on board at the start of the flight, see
  [Airbus: Fuel Leak Management](https://safetyfirst.airbus.com/fuel-leak-management-in-flight/).
  The addition `T.O CONFIG` on the ECAM control panel follows the in-game
  hint; it comes after the takeoff flap configuration. The groups from
  `After Takeoff` onward follow the iniBuilds Quick Reference Card v1.0.0,
  using the challenge names already in use and separate items per control.
  The `Taxi` and `Takeoff` groups and the climb items in `After Takeoff`
  (positive climb, autopilot, F1 marker, managed speed, `MCL`) follow the
  in-game procedure; the Quick Reference Card does not cover them. Probe and
  strobe lights use the cockpit switch positions `OFF`/`DIM`/`BRT` instead of
  the card's `On`.
- The G36 checklist is deliberately a minimal, incomplete memory aid of
  selected speeds, flap and landing gear positions.
