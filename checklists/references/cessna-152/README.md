# Cessna 152 reference

Source: Cessna Aircraft Company, *Model 152 Pilot's Operating Handbook*,
Normal Procedures, page revision April 18, 1980; provided as
[1981-C152-POH.pdf](https://aceshighaviation.com/wp-content/uploads/2020/10/1981-C152-POH.pdf)
by Aces High Aviation. Retrieved on 2026-09-07.

The facts used were checked directly against the scanned original pages; page
references and the selection for the app are in the table below.

Like the existing checklists, the app writes the unit as `kt`. All C152 speeds
refer to IAS (KIAS in the POH); the checklist states this at the first speed.
`Vr` marks raising the nose, `Vy` the best rate of climb and `Vapp` the chosen
final approach value. The 85 kt flap limit is labeled `Vfe` (POH 2-4, PDF
page 11: upper end of the white arc). The normal 75 kt climb has no V-speed
abbreviation of its own here.

## Derivation for the simulator app

| Topic                   | POH page (PDF page) | Basis and compact selection                                                                                              |
|-------------------------|---------------------|--------------------------------------------------------------------------------------------------------------------------|
| Takeoff flaps           | 4-8 (27)            | 0–10° permitted; chosen for a normal takeoff: 0°.                                                                        |
| Rotation                | 4-8 (27)            | Raise the nose at 50 KIAS.                                                                                               |
| Climb                   | 4-3 (24), 4-8 (27)  | Normal 70–80 KIAS: 75 KIAS chosen, flaps retracted. Vy separately as a note: 67 KIAS at sea level, 61 KIAS at 10,000 ft. |
| Mixture                 | 4-8/4-9 (27)        | In the climb above 3,000 ft, lean for maximum RPM; full rich before landing.                                             |
| Approach flaps          | 4-9 (27)            | As required below 85 KIAS; 10° is a chosen intermediate setting, not a fixed POH requirement.                            |
| Landing flaps and speed | 4-3 (24), 4-9 (27)  | Normal final approach with 30° and 55–65 KIAS: 60 KIAS chosen. No target touchdown speed.                                |

A deliberately incomplete memory aid for the requested values, not a complete
normal or short-field checklist. The flap and speed selection refers to a
normal approach without special wind conditions.

## Identity matching

On 2026-09-07, the companion copy button returned the following unchanged
MSFS values, confirmed in the simulator:

```text
ATC MODEL: TT:ATCCOM.AC_MODEL C152.0.text
ATC TYPE: TT:ATCCOM.ATC_NAME CESSNA.0.text
TITLE: Cessna C152 Aerial Advertising
```

The rule uses `AC_MODEL C152` from these values and therefore depends neither
on the surrounding localization token nor on the title variant. Additional
`ATC TYPE` or `TITLE` rules are not needed.
