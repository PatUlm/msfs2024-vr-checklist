# ADR 0009: Checklistenfortschritt als geteilter Sitzungszustand

- **Status:** Akzeptiert
- **Datum:** 2026-08-27
- **Betrifft:** Fortschrittspersistenz in der EFB-App
- **Ersetzt:** die befristete Einmal-Übergabe aus Release 0.1.5
- **Technische Grundlage:**
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md#efb-app-lifecycle-und-geteilter-zustand)

## Kontext

Bis Release 0.1.6 lag der maßgebliche Fortschritt im Arbeitsspeicher einer
App-Instanz. Ein kurzlebiger `DataStore`-Snapshot sollte ihn lediglich bei
einem VR-Wechsel an einen neu erzeugten Kontext übergeben. In der Praxis
zeigten VR und Nicht-VR zeitweise unterschiedliche Zustände. Die Konstruktion
hing damit an einer unbelegten Annahme über Anzahl und Lebensdauer der
EFB-App-Instanzen.

## Entscheidung

Der `DataStore`-Datensatz ist der maßgebliche Checklistenfortschritt innerhalb
einer Simulatorsitzung. Der Speicherzustand einer App-Instanz ist nur eine
Ansicht darauf.

- Jede Nutzeränderung schreibt den vollständigen Datensatz.
- Jede Instanz gleicht sich nach möglichen verpassten Änderungen ab.
- Neuere Datensätze gewinnen anhand von `savedAt`.
- Der Datensatz hat kein Timeout und ist nicht an einen VR-Modus gebunden.
- Flugzeugidentität, Checklisten-ID und Revision verhindern eine Übernahme in
  einen fachlich anderen Kontext.

Die Lebensdauer endet durch einen expliziten Reset bei neuem Flug,
Flugzeug-/Checklistenwechsel oder erkanntem Simulatorneustart. Ein Wechsel
zwischen VR und Nicht-VR löst ausdrücklich keinen Reset aus.

## Begründung

- Korrektheit hängt nicht mehr davon ab, ob MSFS eine residente Instanz, einen
  neuen Kontext oder mehrere parallele Instanzen verwendet.
- Explizite fachliche Reset-Bedingungen sind stabiler als eine Frist, die einen
  vermuteten Lifecycle nachbildet.
- Der ohnehin notwendige langsame Fallback kann den kleinen Datensatz
  abgleichen; zusätzliche Arbeit pro Frame entsteht nicht.

## Konsequenzen

- Der Schlüssel ist versioniert; veraltete Schlüssel werden beim Start
  entfernt.
- `FltLoad` und ein beobachtetes `GameState.loading` löschen den Datensatz.
- Die Monotonie von `E:SIMULATION TIME` dient als zusätzliche
  Neustarterkennung; ihre Einschränkung bei pausierter Simulation steht in der
  SDK-Referenz.
- Das Verhalten wurde in MSFS für VR-Wechsel, neuen Flug, Flugzeugwechsel und
  Simulatorpause bestätigt.

## Verworfene Alternativen

- **Längere Übergabefrist:** verschiebt das Problem und hilft nicht bei
  parallelen Instanzen.
- **Übergabe nur in `onPause()` oder `onClose()`:** setzt Lifecycle-Hooks
  voraus, die bei einem Darstellungswechsel nicht garantiert sind.
- **Instanzlokaler Zustand mit Sonderfällen:** hält die fehlerhafte
  Lifecycle-Annahme als Architekturgrundlage fest.
