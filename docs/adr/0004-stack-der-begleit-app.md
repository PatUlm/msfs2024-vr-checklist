# ADR 0004: Stack der Begleit-App — .NET 10 mit Avalonia

- **Status:** Akzeptiert — Status-App umgesetzt, Audio offen
- **Datum:** 2026-08-26, Status-App bestätigt am 2026-08-29
- **Betrifft:** Phase 3
- **Technische Grundlage:**
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md#commbus-und-externe-begleit-app)

## Kontext

Die Begleit-App benötigt eine ruhige Windows-Oberfläche mit Tray,
SimConnect/CommBus, gerätegenauer Audioausgabe und Einstellungen. Sie soll aus
dem WSL2-Repository ohne Visual-Studio-IDE gebaut werden können und neben MSFS
keine unnötige GPU- oder CPU-Last erzeugen.

## Entscheidung

- **.NET 10 LTS mit Avalonia** für Anwendung und Oberfläche.
- Eigenes **P/Invoke gegen die native `SimConnect.dll`**, nicht der
  Managed-Wrapper aus dem SDK.
- **NAudio** mit WASAPI Shared Mode für Geräteauswahl und Wiedergabe.
- **`CredWrite`/`CredRead`** für gegebenenfalls benötigte Geheimnisse.
- Kein NativeAOT.

## Begründung

- Der Stack ist offen lizenziert, CLI-basiert und benötigt zur Laufzeit keinen
  GPU-Prozess.
- Avalonia deckt Fenster und Tray ab; NAudio erlaubt die Auswahl eines
  konkreten Windows-Audiogeräts für das VR-Headset.
- P/Invoke bindet genau die benötigten SimConnect- und CommBus-Funktionen an,
  ohne vom inkompatiblen Managed-Wrapper abhängig zu sein.

## Konsequenzen

- `SimConnect.dll` wird wegen der unklaren Weitergaberegel im SDK-EULA nicht in
  ein eigenes Paket aufgenommen. Der Nutzer verwendet die mit MSFS gelieferte
  Installation; Details stehen in der SDK-Referenz.
- Audio läuft im Shared Mode mit Standardperiode. Exclusive Mode und ein
  systemweit wirksamer Low-Latency-Pfad sind ausgeschlossen.
- Das Ausgabegerät wird über seine stabile Geräte-ID, nicht über den sichtbaren
  Namen gespeichert. Audiostreams werden nur bei Bedarf geöffnet.
- CommBus und WASAPI müssen vor der produktiven Umsetzung anhand der Punkte in
  [`../open-tests.md`](../open-tests.md) in MSFS bestätigt werden.

## Verworfene Alternativen

- **Electron/TypeScript:** vermeidet die native SimConnect-DLL, ist aber für
  diese kleine Begleit-App deutlich schwerer und ressourcenintensiver.
- **Rust:** klein und offen, aber ohne fertige CommBus-Abdeckung im bewerteten
  Stack und mit zusätzlicher UI-/Toolchain-Komplexität.
- **Python:** kein geeigneter Cross-Build von WSL2 nach Windows und ungünstige
  Paketgröße.
- **WinUI 3, Tauri und NativeAOT:** benötigen proprietäre oder zusätzliche
  Windows-/C++-Buildvoraussetzungen, die den Projektbedingungen widersprechen.
