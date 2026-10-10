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

### Checklist audit findings before 0.19.4

The pre-release wording audit of 0.19.4 reported findings in existing
content; the release went out without them. Each needs a decision, some a
source or simulator check first.

- **DA42:** `Start Key` items name no side; the ECU test omits the return to
  idle from the COWS guide and says CAP instead of CAS; the transponder
  `VFR | ALT` is ambiguous; four verify items have no target state (`Check`,
  `Wait`); the fuel pumps "At TOD" sit in the approach phase; `HDG` and other
  cockpit labels lack README evidence.
- **OH-6:** The start condition N1 ≥ 20 % (manual: 12–15 % and TOT < 150 °C)
  and the avionics as `OH-6A only` lack a recorded reason.
- **Others:** MH-60 `Day/Night` responses instead of alternatives; A400M
  parking brake `On` versus DA42 `Set`; H125 `Battery / Master`,
  `(Beacon)` and the pitot heat order versus the data README; C152 notes
  versus speech; no style-guide rule for `Approx.`
- **Next step:** Re-run the audit with `vr-checklist-editor` and decide the
  findings one by one.

## Topic lists

- [License and redistribution questions](docs/license-audit.md)
- [MSFS runtime verifications](docs/open-tests.md)
- [Visual verifications](docs/design-qa.md)
