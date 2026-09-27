# Checklists: provenance and review

As of 2026-09-21, app 0.13.3. The content and provenance review of the 207
entries is complete. Only the assessment and provenance of the reviewed set
remain here; recheck source changes specifically and do not add a log of past
review tasks. **Blanket requests to manufacturers are not a prerequisite for
completing the project.**

## Result

The app mainly contains technical values, switch positions and brief
instructions in a selection adapted for the simulator. The review identified
no specific creative third-party text from which a general permission
requirement for these checklists could be derived. A larger number of entries
does not by itself establish protection.

Technical procedures and simple facts must be distinguished from protected
texts, graphics or a creative compilation: German Copyright Act
[§2 UrhG](https://www.gesetze-im-internet.de/urhg/__2.html) and
[§4 UrhG](https://www.gesetze-im-internet.de/urhg/__4.html), and for the US
perspective [Copyright Office, Circular 33](https://www.copyright.gov/circs/circ33.pdf).
This is the working assessment for the reviewed set, not a blanket license for
the original sources. Specific indications of a protected adoption or a
relevant contractual restriction are reviewed individually.

The published terms of
[Miltech](https://docs.miltechsimulations.com/miltech-simulations-mh60/product-information/disclaimer-and-credits),
[iniBuilds](https://inibuilds.com/pages/eula) and
[Orbx](https://orbxstudios.com/eula/) contain redistribution restrictions for
their products. These are neither lifted nor interpreted as an open license.
No infringement by a specific app entry was found. Microsoft's
[Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules) are
likewise no unrestricted MIT permission.

## Provenance

The app summarizes selected in-game procedures and manual information.
Publicly verifiable sources are listed in the
[data README](../checklists/data/README.md). Personal working templates are
not independent evidence of sources or licenses.

| Checklist   | Attributed origin                                                                                                 |
|-------------|-------------------------------------------------------------------------------------------------------------------|
| DA42        | COWS, distributed via Orbx/Marketplace; locally `fs20-orbx-aircraft-da42b` with `cows_da42tdi` and `cows_da42vi`. |
| MH60        | Miltech/Vantech with Blackbird; locally `miltechsimulations-aircraft-mh60` 1.1.6.                                 |
| G36         | Asobo default package; selected technical values.                                                                 |
| C152        | Asobo default package; additionally cross-checked against the Cessna POH.                                         |
| H125        | Asobo default package; supplementary manufacturer and operator sources.                                           |
| A400M       | Microsoft/iniBuilds; additionally a publicly provided QRC for comparison.                                         |
| OH-6A/H500C | Taog's Hangar; shortened procedure from the Expert checklist.                                                     |

The source evidence remains in the [inventory](license-audit-inventory.json)
under `checklistRightsReview`. The historical in-game wording could not be
fully compared for all packages; vendor terms reflect the publicly available
version, not proof of the respective purchase contract.

## Conclusion

Provenance and the project's own editing remain traceable. Source references
contain only brief facts with page references, no transcriptions of manuals.
There are no pending requests to manufacturers. A provenance note and AI
assistance grant no rights of use; the separate software and SDK licenses are
covered in [third-party-licenses.md](third-party-licenses.md), the audio by the
[audio terms](../assets/audio/LICENSE).
