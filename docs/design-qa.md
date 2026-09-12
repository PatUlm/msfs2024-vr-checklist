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

## Offene visuelle Nachweise

- Der grüne Gruppen-Haken in den Navigationsbuttons ist ein mit zwei Borders
  gezeichnetes, um 45 Grad gedrehtes L. Zu prüfen in Coherent GT: Größe und
  vertikale Lage neben dem Gruppennamen, der Abstand zum Namen, und dass die
  Ellipse langer Gruppennamen weiterhin funktioniert (DA42 als Referenz).

## Historische Bildreferenzen

- [`assets/default-item-reference.png`](assets/default-item-reference.png):
  ursprüngliche Hauptzeile; der blaue Action-Marker ist verworfen.
- [`assets/action-bar-alignment.png`](assets/action-bar-alignment.png):
  inzwischen behobene rechte Fehlflucht der Navigation.
- [`assets/content-manager-thumbnail-version-finding.png`](assets/content-manager-thumbnail-version-finding.png):
  behobener Thumbnail- und Versionsbefund.
- [`assets/efb-icon-fill-finding.png`](assets/efb-icon-fill-finding.png):
  behobene SVG-Füllung im EFB-App-Icon.
