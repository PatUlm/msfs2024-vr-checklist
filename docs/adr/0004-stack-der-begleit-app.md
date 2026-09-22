# ADR 0004: .NET 10 mit Avalonia

Status: Akzeptiert (2026-08-26).

## Entscheidung und Grund

Die Windows-Begleit-App verwendet .NET 10, Avalonia und eigenes P/Invoke gegen
die native `SimConnect.dll`. NAudio übernimmt Audio über WASAPI Shared Mode.
Der Stack lässt sich aus WSL2 per CLI bauen und hält die kleine Begleit-App
unabhängig von einer Visual-Studio-IDE.

## Konsequenzen

- Kein NativeAOT, kein Exclusive-Audio-Modus und kein systemweiter
  Low-Latency-Pfad. Audiostreams nur bei Bedarf öffnen; Geräte über stabile ID
  speichern.
- `SimConnect.dll` wird nicht mitgeliefert. Der aktuelle Installationsweg
  verweist auf das lokale SDK, siehe [Companion](../../companion/README.md).
- Der Managed-Wrapper aus dem SDK ist unter modernem .NET nicht ladbar;
  Nachweis in der [SDK-Referenz](../msfs-sdk-reference.md#commbus-und-externe-begleit-app).
- Falls künftig Geheimnisse nötig werden, Windows `CredWrite`/`CredRead`
  verwenden. Die aktuelle App benötigt keine TTS-Zugangsdaten.

Electron wäre für diese kleine App schwerer; Rust/Tauri und WinUI erforderten
zusätzliche UI-/Windows-Buildkomplexität. Python passte nicht zum vorgesehenen
Cross-Build und Distributionsumfang.
