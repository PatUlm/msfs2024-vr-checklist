# OH-6A / H500C references

This folder documents the narrowly scoped provenance of the compact
OH-6A/H500C checklist data. The derivation serves only the simulator app and
does not replace a flight manual approved for a real helicopter.

## Primary source of the add-on

- Document: *OH6A - H500C - Flight Manual*
- Publisher: Taog's Hangar
- Product page:
  <https://www.taogshangar.com/oh6a-cayuse-msfs242>
- Manual:
  <https://msfs.dev-pset.com/assets/docs/OH6A-H500C-MANUAL.pdf>
- Retrieved: 2026-08-31
- Installed Marketplace package: `taog-oh6a-cayuse`, version `1.1.9`
- PDF pages used: 27 to 33, in particular `Preflight Internal Cockpit
  Checks`, `Engine Start`, `Engine Run-up`, `Before Takeoff` and `Shutdown`

The app checklist reduces the add-on's detailed Expert checklist to a
deliberately chosen common start, takeoff and shutdown core for the OH-6A and
H500C. The lighting item compactly summarizes the manual entry `Lights (Cabin,
Panel, Instruments) – AS REQUIRED`. Neither the internal cockpit check nor the
manual's engine start and run-up mention a fuel pump; therefore the compact
checklist contains no such step either. Variant-specific system tests and the
H500C deceleration test are deliberately not included.

## Identity matching

The installed package lists the variants as `OH6A` and `500C`; the product
manifest names `OH6A Hughes`. The `TITLE` rules therefore use the normalized
features `OH6A` and `H500C`. Both rules were confirmed in the simulator on
2026-09-05; the H500C reports `ATC MODEL` `H500C`, `ATC TYPE` `Hughes` and
`TITLE` `H500C`. The confirmation input `SET PLASMA OFF` works in both
variants.
