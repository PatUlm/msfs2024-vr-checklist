# ADR 0012: Veröffentlichung als ZIP und Companion-Setup

Status: Akzeptiert (2026-09-26). Ersetzt die Konsequenz „`SimConnect.dll`
wird nicht mitgeliefert“ aus [ADR 0004](0004-stack-der-begleit-app.md).

## Problem

Spieler sollen das Add-on ohne Entwicklungsumgebung und ohne MSFS-SDK
installieren können. Der bisherige Weg setzte ein lokales SDK für Build und
`SimConnect.dll` voraus.

## Entscheidung

- Die EFB-App erscheint als ZIP mit dem Paketordner als einziger oberster
  Ebene. Spieler entpacken ihn selbst in ihren Community-Ordner.
- Der Companion erscheint als per-user Velopack-Setup ohne Adminrechte, mit
  self-contained .NET 10 und mitgelieferter nativer `SimConnect.dll` aus dem
  MSFS-2024-SDK. Das Paket wird im .NET-SDK-Container unter Linux gebaut.
- Das Setup bleibt vorerst unsigniert.
- Updates des Companions werden nie still installiert. Eine spätere
  Update-Prüfung lädt und installiert erst nach Bestätigung und weist darauf
  hin, auch das EFB-ZIP zu aktualisieren.

## Konsequenzen

- SmartScreen warnt bei jeder neuen Version; die Installationsanleitung
  beschreibt den Weg über „Weitere Informationen“.
- Installation unter `%LOCALAPPDATA%\VRChecklist.Companion`; Einstellungen
  unter `%LOCALAPPDATA%\VRChecklist` bleiben bei Deinstallation erhalten.
  Die packId darf deshalb nicht `VRChecklist` lauten.
- `VelopackApp` muss als Erstes in `Main` laufen, sonst bricht `vpk pack` ab.
  Automatisches Anwenden beim Start ist deaktiviert.
- Checklistenrevisionen koppeln EFB und Companion; beide Artefakte erscheinen
  immer mit derselben Version.
- Die Bewertung der DLL-Weitergabe steht in
  [third-party-licenses.md](../third-party-licenses.md); kostenlose
  OSS-Signaturprogramme mit reinen OSI-Anforderungen scheiden damit aus.
- MSI und MSIX wurden verworfen: MSI bringt kein Update und braucht unter
  Linux Wine, MSIX verlangt eine vertrauenswürdige Signatur.
