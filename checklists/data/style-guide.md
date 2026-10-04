# Checklist Style Guide

This style guide records the language conventions for all JSON checklists.
Identical or similar actions should be structured and named the same way
across aircraft.

## Title

- `title` names only the aircraft, i.e. manufacturer and model, for example
  `Diamond DA42` or `Sikorsky MH-60`.
- Additions such as `Checklist`, `+ ATC` or `Minimal` do not belong in the
  title. The displays and the PDF file name add the fact that it is a
  checklist themselves; scope and provenance are in the documentation.

## Challenge and response

- The challenge clearly names the system to operate or check. This includes
  side and component numbers.
- The response contains only the required state or the action to perform.
- Numbers that themselves represent a target position or a target value stay
  in the response.
- For `communication` items, the challenge is `COM: <station>`, for example
  `COM: ATIS`, `COM: Clearance`, `COM: Ground` or `COM: Tower`. `COM:` names
  the radio to operate (COM 1 or COM 2 is to be tuned to this station), not the
  kind of action "communication". It thus follows the same logic as every
  other challenge that names a system, and it does not repeat the type label
  `ATC`, which marks the kind of action.
- A skippable item gets the kind `optional`. Its optionality is not
  additionally written into the response; `As required` is reserved for items
  that must be worked through but whose target state depends on the
  situation.

Examples:

| Challenge              | Response     | Reason                             |
|------------------------|--------------|------------------------------------|
| Fuel Boost Pumps [1+2] | On           | `[1+2]` identifies the pumps.      |
| Engine 1               | Start + IDLE | `1` identifies the engine.         |
| Flaps                  | 2 (Full)     | `2` is the required flap position. |
| Landing Speed          | 80 kt        | `80 kt` is the required value.     |

## Numbered components

- A component pair meant together is written compactly as `[1+2]` in the
  challenge. There are no spaces between the digits and the plus sign.
- Square brackets mark the pair as a component scope and clearly separate it
  from the actual challenge name. Parentheses are reserved for explanatory
  additions, for example the target position `1 (Approach)`.
- `1/2` is not used, because the slash can also express an alternative or a
  fraction.
- A single component is written with a space, for example `Engine 1`.
- Controls that are confirmed independently get separate items. They are not
  combined into one challenge with a plus sign just because a source document
  is compact; this way, for example, `SAS [1+2]` and `TRIM` remain separately
  noticeable.
- If a plus sign combines several states or actions within a response, it is
  surrounded by spaces for readability, for example `Start + IDLE`.
- An optional `speech` text spells out component numbers naturally, for
  example `one and two`; the compact on-screen notation is not read aloud.
  Values such as `73 knots` may stay digits; the voice reads them correctly.

## Units and terms

- Units follow the value after a space, for example `80 kt` or `100 %`.
  Plane angles in degrees take no space, for example `10°`.
- Established challenge names are reused for identical procedures. New
  aircraft checklists first follow existing entries before introducing new
  synonyms.
- For speeds, a suitable abbreviation is added, such as
  `Rotation Speed (Vr)`, `Climb Speed (Vy)` or `Approach Speed (Vapp)`. Limits
  in conditions also state their abbreviation, such as `Vfe` for the maximum
  speed with flaps extended. A normal climb is labeled `Vy` only if the speed
  for the best rate of climb is actually meant; a chosen approach value is not
  declared `Vref` without source evidence.
- Speeds in `kt` are indicated airspeeds and need no note. A ground speed,
  for example while taxiing, is always marked as such, for example
  `Maximum 20 kt ground speed`.
- Abbreviations may appear in the visible text. If the automatic
  pronunciation would be unclear, the entry gets a fully worded `speech` text.

## Spoken announcements (`speech`)

- `speech` contains the complete English announcement of an entry: the system
  and the required action or target state, plus the associated conditions,
  alternatives and operating notes from `notes`. The entry should be
  understandable and executable by listening, without additional reading.
- Notes on location of controls, order, waiting times, limits and the meaning
  of required inputs are spoken along. Pure source references or editorial
  explanations without operational use may be omitted.
- The announcement may rephrase and combine notes naturally, but must not lose
  any information relevant for execution or add new technical details. Use
  short, clear sentences.
- `speech` fully replaces the automatic announcement
  `<challenge>: <response>`. `condition`, `alternatives` and `notes` are not
  appended automatically. Without `speech`, an entry is only fully voiced if
  the challenge and response already contain all the information needed for
  the announcement. An entry gets its own `speech` only when needed, for
  example when notes must be spoken or the automatic announcement sounds
  wrong.
- When changing an entry, also reconcile `speech` with all changed fields;
  then update the affected [audio assets](../../assets/audio/README.md).
- Every entry with `kind: "verify"` gets a `speech` text starting with
  `Verify `, for example `Verify A P U indicator: On.`. The visible challenge
  stays the system name; the existing verify badge marks the checking action
  in the UI.

Example: `Altimeters [1+2]: Set QNH` with the note `Use ATIS or METAR` gets
the announcement `Altimeters one and two: Set Q N H from A T I S or M E T A R.`.
