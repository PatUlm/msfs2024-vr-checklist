# ADR 0004: .NET 10 with Avalonia

Status: Accepted (2026-08-26). The SimConnect consequence is superseded by
[ADR 0012](0012-distribution-as-zip-and-companion-setup.md).

## Decision and reason

The Windows companion app uses .NET 10, Avalonia and custom P/Invoke against
the native `SimConnect.dll`. NAudio handles audio through WASAPI shared mode.
The stack can be built from WSL2 via the CLI and keeps the small companion app
independent of a Visual Studio IDE.

## Consequences

- No NativeAOT, no exclusive audio mode and no system-wide low-latency path.
  Open audio streams only when needed; store devices by their stable ID.
- `SimConnect.dll` is shipped according to
  [ADR 0012](0012-distribution-as-zip-and-companion-setup.md).
- The managed wrapper from the SDK cannot be loaded under modern .NET;
  evidence in the
  [SDK reference](../msfs-sdk-reference.md#commbus-and-external-companion-app).
- Should secrets become necessary in the future, use Windows
  `CredWrite`/`CredRead`. The current app needs no TTS credentials.

Electron would be heavier for this small app; Rust/Tauri and WinUI would add
UI and Windows build complexity. Python did not fit the intended cross-build
and distribution scope.
