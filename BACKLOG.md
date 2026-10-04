# Open work

Entry point for the question "What is still open?". Tasks are listed in
implementation order. For topic lists, only the link is kept here; status,
findings and next steps are maintained only at the target.

## Implementation and release

### Progress of a previous session restored in a new flight

- **Observed:** On the first MSFS start of a day (DA42, free flight, EFB
  opened some time after loading), the first group was already complete and
  the companion showed snapshot 8. Later sessions did not repeat it.
- **Likely cause:** The progress record survives simulator restarts in the
  SDK `DataStore`. An EFB app that boots only when opened misses the reset on
  flight loading, and restart detection discards only records whose
  simulation time is ahead of the current one
  ([ADR 0009](docs/adr/0009-progress-across-efb-context-changes.md)). After a
  short previous session, a later opened EFB adopts the old record when
  aircraft and checklist revision match.
- **Impact:** Items of an earlier session appear ticked in a new flight; rare.
- **Next step:** Identify the simulator session explicitly, for example with
  a random token in an L variable. First verify in MSFS that L variables are
  shared between EFB contexts and reset on a simulator restart; a changed
  decision gets an ADR superseding ADR 0009.

## Topic lists

- [License and redistribution questions](docs/license-audit.md)
- [MSFS runtime verifications](docs/open-tests.md)
- [Visual verifications](docs/design-qa.md)
