# ADR 0004: Stack der Begleit-App — .NET 10 mit Avalonia

- **Status:** Akzeptiert, mit zwei offenen Punkten
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3 (nach [ADR 0005](0005-phase-2-auf-die-efb-app-verkuerzen.md))
- **Grundlage:** [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitt 9

## Kontext

Die Begleit-App soll als SimConnect-Client mit MSFS reden, eine ruhige lesbare
Item- und Fortschrittsanzeige plus Tray und Einstellungsfenster bieten und
später Sprachausgabe auf ein *wählbares* Windows-Audiogerät abspielen. Harte
Randbedingungen: alles Open Source, **keine Visual-Studio-Lizenz vorhanden**,
Entwicklung im WSL2-Repository, kleine Artefakte, keine GPU-Last neben MSFS.

Zwei Kriterien haben sich durch die anderen Entscheidungen abgeschwächt: Zur
Laufzeit ist **keine ONNX-Inferenz** nötig, weil vorab gerendert wird
([ADR 0006](0006-tts-vorab-synthese.md)), und eine **Global-Input-Bibliothek**
entfällt voraussichtlich ganz
([ADR 0002](0002-bestaetigungseingabe-in-sim-key-interception.md)). Dafür ist
das Kriterium **SimConnect-Bindung mit CommBus** zum wichtigsten geworden
([ADR 0003](0003-transportkanal-commbus-ueber-simconnect.md)).

## Entscheidung

**.NET 10 LTS mit Avalonia.** Im Detail:

- SimConnect per **eigenem P/Invoke** gegen die native `SimConnect.dll`, nicht
  über den Managed-Wrapper.
- **NAudio** für Geräteauswahl und Wiedergabe, WASAPI im Shared Mode.
- **`CredWrite`/`CredRead`** für Geheimnisse.
- **Kein NativeAOT.**

## Begründung

- Durchgehend MIT lizenziert.
- Build allein mit der `dotnet` CLI, ohne jede C++-Toolchain, und
  `dotnet publish -r win-x64` läuft aus WSL2.
- Artefakt rund 24 bis 42 MiB, Retained-Mode-UI, **kein GPU-Prozess**.
- Avalonia bringt `TrayIcon` mit und führt Windows als „Full support".
- NAudio liefert über `MMDeviceEnumerator` und die Persistierung per
  `MMDevice.ID` die präziseste gerätegenaue Audioausgabe im Feld — das ist für
  „Ansage auf das VR-Headset, während MSFS spielt" der entscheidende Punkt.
- Die native `SimConnect.dll` exportiert 117 undekorierte
  `extern "C"`-Funktionen, einschließlich aller drei CommBus-Funktionen.
  P/Invoke ist damit trivial.

## Verworfene Alternativen

- **Node und TypeScript mit Electron.** Hätte die einzige Schwachstelle des
  .NET-Wegs vermieden: `node-simconnect` 4.2.0 implementiert Client Data Areas
  **und** CommBus in reinem TypeScript, über die Named Pipe, ohne
  `SimConnect.dll`, ohne Compiler und ohne EULA-Frage — und es wäre ein Stack für
  EFB-App und Begleit-App. Verworfen wegen 330 bis 400 MB Artefakt, rund 211 MiB
  Speicher über sechs Prozesse, einem GPU-Prozess, der auch bei
  `disableHardwareAcceleration()` bestehen bleibt, unverifiziertem Gerätetreffer
  über `setSinkId` und LGPL-3.0 im Kern. Bleibt die naheliegende Ausweichoption,
  falls die SimConnect-Anbindung in .NET Probleme macht.
- **Rust.** Sauber lizenziert und klein, aber `simconnect-sdk` 0.2.3 deckt laut
  eigener `FEATURES.md` Client Data Areas gar nicht ab und kennt kein CommBus —
  der beschlossene Transportweg wäre Eigenentwicklung. Dazu: Slint kostet im
  freien Weg GPL-3.0 für die ganze Anwendung, `egui`/`eframe` bringt
  GPU-Rendering mit, und der `-msvc`-Pfad führt in die Lizenzgrauzone der
  Build-Tools.
- **Python.** Scheitert am Kernkriterium: **kein Freezer cross-kompiliert von
  WSL2 nach Windows**, ein Windows-Build-Schritt wäre zwingend. Beide
  SimConnect-Bindings sind unmaintained, eines davon AGPL-3.0. Dazu 250 bis
  300 MB entpackt und LGPL-Pflichten über PySide6.
- **WinUI 3.** `Microsoft.WindowsAppSDK` steht **nicht** unter MIT, sondern unter
  einem proprietären Microsoft-EULA, obwohl das Repository MIT ist. Der
  CLI-Weg ruht auf einem Alpha-Template.
- **Tauri v2.** Prerequisites verlangen ausdrücklich „Microsoft C++ Build
  Tools". Build-Blocker.
- **`Microsoft.FlightSimulator.SimConnect.dll`.** Unter .NET 8, 9 und 10 nicht
  ladbar. PE-Analyse: COR20-Flags `0x10` (`ILONLY=false`,
  `NATIVE_ENTRYPOINT=true`), Section `.nep`, Target `.NETFramework 4.6.1` — eine
  Mixed-Mode-C++/CLI-Assembly. Der Ausweg .NET Framework 4.8 bricht
  Single-File-Publish.
- **NativeAOT.** Prerequisite ist wörtlich „Visual Studio 2022 or later,
  including the Desktop development with C++ workload"; Cross-OS-Publishing ist
  nicht unterstützt. Ohne NativeAOT braucht der .NET-Weg nirgends einen
  C++-Compiler — deshalb bleibt es weg.
- **`PasswordVault`** für Geheimnisse: für Full-Trust-Desktop-Apps als defekt
  beschrieben (`0x80070490`) und auf 20 Credentials begrenzt.
- **Dear PyGui**, **PyQt6**, **flet**: GPU-Nutzung, GPL-oder-Kauf beziehungsweise
  Windows-Build mit C++-Workload.

## Konsequenzen

- **Die `SimConnect.dll` wird nicht in ein eigenes Auslieferungspaket gelegt.**
  Der MSFS-SDK-EULA verbietet in §2(e) „share, publish, distribute, or lend the
  Software (except for any distributable code…)", ohne „distributable code" zu
  definieren; „SimConnect" kommt im EULA nicht vor. Gegenläufig liefert das SDK
  eine `SimConnect.msi` mit. Wortlautsicher ist nur, die DLL nicht selbst zu
  verteilen — der Nutzer installiert sie über die mitgelieferte MSI, oder wir
  weichen auf `node-simconnect` aus.
- Randnotiz: §1(g) desselben EULA verbietet die Nutzung des SDK für „AI or
  machine learning". Die Sprachausgabe berührt das SDK nicht, der Satz ist aber
  notiert.
- Audioausgabe im **Shared Mode mit Default-Periode**, kein Exclusive Mode und
  **kein `IAudioClient3`-Low-Latency-Pfad** — der würde alle Apps am selben
  Endpoint auf die kleine Periode ziehen und damit MSFS mitziehen. Gerät über
  `IMMDevice::GetId()` persistieren, nie über den FriendlyName. Stream lazy
  öffnen und nach kurzer Idle-Zeit schließen, damit VR-Start und
  Headset-Abstecken überlebt werden.
- Ein `dotnet` SDK ist in dieser WSL2-Umgebung noch nicht installiert.

## Offene Punkte

1. Ob `SimConnect.NET` 0.2.2 (MIT, Beta) die drei CommBus-Funktionen abdeckt.
   Falls nicht, eigenes P/Invoke — die Exports sind belegt vorhanden.
2. Die Artefaktgröße von 24 bis 42 MiB ist aus verifizierten Einzelkomponenten
   gerechnet, nicht gemessen; ein Publish hat noch nicht stattgefunden.
3. WASAPI Shared Mode gegen das VR-Gerät bei laufender MSFS-Session: HRESULT
   protokollieren. Dass MSFS 2024 den Exclusive Mode belegt, ist **nicht**
   belegt, aber auch nicht ausgeschlossen.
