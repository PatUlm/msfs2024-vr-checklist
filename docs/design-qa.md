# Design QA

Dieses Dokument enthält ausschließlich offene visuelle Abweichungen und die
Referenzen für den nächsten UI- oder VR-Teststand. Dauerhaft akzeptierte
Entscheidungen stehen in [`design-decisions.md`](design-decisions.md), technische
Laufzeitfakten in [`msfs-sdk-reference.md`](msfs-sdk-reference.md), behobene
Untersuchungen bleiben über die Git-Historie nachvollziehbar.

## Akzeptierte Laufzeitreferenz

- Es gibt kein Referenzbild für das Gesamtlayout. Ob ein Stand passt, wird
  bei jedem VR-Teststand neu am Bild entschieden.
- Release 0.2.2 bestätigte die zentrierten Navigationsbuttons mit langen
  DA42-Gruppennamen in VR.
- Der Teststand vom 2026-09-13 bestätigte den grünen Gruppen-Haken in den
  Navigationsbuttons und in der Gruppenüberschrift.
- Der Teststand vom 2026-09-14 bestätigte außerhalb von VR die Navigation
  oberhalb der Gruppenüberschrift und die flacheren Buttons. Release 0.9.1
  wurde ausdrücklich ohne zusätzlichen VR-Sichttest freigegeben.
- Die Phasenanzeige im EFB und Companion wurde am 2026-09-20 vom Benutzer
  bestätigt (EFB `0.11.1-dev.20260920105232`, Companion
  `0.11.1-dev.20260920105233`). Ein zusätzlicher VR-Nachweis wurde ausdrücklich
  als nicht erforderlich freigegeben.

## Offene visuelle Nachweise

- Derzeit keine.

## Historische Bildreferenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png):
  ursprüngliche Hauptzeile; der blaue Action-Marker ist verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png):
  inzwischen behobene rechte Fehlflucht der Navigation.
- [`assets/content-manager-thumbnail-version-finding.png`](assets/content-manager-thumbnail-version-finding.png):
  behobener Thumbnail- und Versionsbefund.
- [`assets/efb-icon-fill-finding.png`](assets/efb-icon-fill-finding.png):
  behobene SVG-Füllung im EFB-App-Icon.
