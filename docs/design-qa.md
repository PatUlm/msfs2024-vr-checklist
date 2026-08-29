# Design QA

Dieses Dokument enthält ausschließlich offene visuelle Abweichungen und die
Referenzen für den nächsten UI- oder VR-Teststand. Dauerhaft akzeptierte
Entscheidungen stehen in [`design-decisions.md`](design-decisions.md), technische
Laufzeitfakten in [`msfs-sdk-reference.md`](msfs-sdk-reference.md), behobene
Untersuchungen bleiben über die Git-Historie und das `CHANGELOG.md`
nachvollziehbar.

## Offene visuelle Nachweise

- [ ] Die aktuelle links/rechts angeordnete App-Icon-Komposition im kleinen
  EFB-Raster erneut in VR prüfen; das ursprüngliche Motiv sowie Normal-, Hover-
  und Selected-Zustand der korrigierten Variante sind bereits akzeptiert.

## Akzeptierte Laufzeitreferenz

- [`assets/vr-g36-accepted-layout.png`](assets/vr-g36-accepted-layout.png) zeigt
  das am 2026-08-23 abgenommene kompakte VR-Layout in Originalauflösung
  861 × 948 Pixel. Es ist eine Layout-, keine Inhaltsreferenz.
- Release 0.2.2 bestätigte die zentrierten Navigationsbuttons mit langen
  DA42-Gruppennamen in VR.

## Historische Bildreferenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png):
  ursprüngliche Hauptzeile; der blaue Action-Marker ist verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png):
  inzwischen behobene rechte Fehlflucht der Navigation.
- [`assets/content-manager-thumbnail-version-finding.png`](assets/content-manager-thumbnail-version-finding.png):
  behobener Thumbnail- und Versionsbefund.
- [`assets/efb-icon-fill-finding.png`](assets/efb-icon-fill-finding.png):
  behobene SVG-Füllung im EFB-App-Icon.
