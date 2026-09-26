# ADR 0004: .NET 10 mit Avalonia

Status: Akzeptiert (2026-08-26). Die SimConnect-Konsequenz ist durch
[ADR 0012](0012-veroeffentlichung-als-zip-und-companion-setup.md) ersetzt.

## Entscheidung und Grund

Die Windows-Begleit-App verwendet .NET 10, Avalonia und eigenes P/Invoke gegen
die native `SimConnect.dll`. NAudio übernimmt Audio über WASAPI Shared Mode.
Der Stack lässt sich aus WSL2 per CLI bauen und hält die kleine Begleit-App
unabhängig von einer Visual-Studio-IDE.

## Konsequenzen

- Kein NativeAOT, kein Exclusive-Audio-Modus und kein systemweiter
  Low-Latency-Pfad. Audiostreams nur bei Bedarf öffnen; Geräte über stabile ID
  speichern.
- Auslieferung von `SimConnect.dll` gemäß
  [ADR 0012](0012-veroeffentlichung-als-zip-und-companion-setup.md).
- Der Managed-Wrapper aus dem SDK ist unter modernem .NET nicht ladbar;
  Nachweis in der [SDK-Referenz](../msfs-sdk-reference.md#commbus-und-externe-begleit-app).
- Falls künftig Geheimnisse nötig werden, Windows `CredWrite`/`CredRead`
  verwenden. Die aktuelle App benötigt keine TTS-Zugangsdaten.

Electron wäre für diese kleine App schwerer; Rust/Tauri und WinUI erforderten
zusätzliche UI-/Windows-Buildkomplexität. Python passte nicht zum vorgesehenen
Cross-Build und Distributionsumfang.
