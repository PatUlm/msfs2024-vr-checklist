# Open runtime verifications

The only list of pending MSFS tests: one short standard flow each, with the
expected result. Remove an entry once it is resolved; only a new technical
finding relevant in the future goes into
[msfs-sdk-reference.md](msfs-sdk-reference.md). Successful routine checks leave
no permanent report. Visual items are in [design-qa.md](design-qa.md).

## A400M approach preparation and descent

On an ILS arrival with the A400M checklist:

- After entering wind, OAT, QNH, minimum and TRANS on the PERF APPR page,
  check whether `APPR PERF COMPUTATION` exists and must be pressed. If so, add
  it to the APPR items.
- In managed NAV, check whether the approach phase activates automatically at
  the DECEL point `D` (speed target drops, PERF switches to APPR). If so, turn
  `ACTIVATE APPR` into a verify item.

## A400M CAS messages before departure

After working through the A400M checklist up to takeoff, note which CAS
messages remain on the E/WD. Then decide whether a step is missing or an
`ECAM Messages...Check + Clear` item after engine start is needed.
