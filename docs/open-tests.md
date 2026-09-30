# Open runtime verifications

The only list of pending MSFS tests: one short standard flow each, with the
expected result. Remove an entry once it is resolved; only a new technical
finding relevant in the future goes into
[msfs-sdk-reference.md](msfs-sdk-reference.md). Successful routine checks leave
no permanent report. Visual items are in [design-qa.md](design-qa.md).

## No-checklist announcement

With the companion running and `Read checklist items` on, load a flight with
an aircraft that has no checklist and open the app in the EFB. Expected:
`No checklist available for this aircraft.` once. A VR switch does not repeat
it; a new flight with the same aircraft announces it again. If the new flight
stays silent, it created a new EFB context without a reset snapshot, which the
companion cannot tell from a VR switch; the EFB then has to share a flight
identity across contexts.
