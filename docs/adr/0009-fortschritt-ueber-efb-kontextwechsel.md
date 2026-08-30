# ADR 0009: Checklistenfortschritt über EFB-Kontextwechsel

- **Status:** Akzeptiert
- **Datum:** 2026-08-30
- **Betrifft:** Fortschrittspersistenz in der EFB-App
- **Ersetzt:** die befristete Einmal-Übergabe aus Release 0.1.5
- **Technische Grundlage:**
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md#efb-app-lifecycle-und-geteilter-zustand)

## Kontext

MSFS kann den JavaScript-Kontext der EFB-App beim Wechsel zwischen VR und
Nicht-VR neu erzeugen. Reiner In-Memory-Zustand reicht deshalb nicht aus, um
den Fortschritt über einen Darstellungswechsel zu erhalten. Der SDK-`DataStore`
überlebt diesen Kontextwechsel und einen zeitnahen Simulatorneustart.

Eine frühere Ausgestaltung leitete daraus zusätzlich eine harte
Multi-Writer-Anforderung für mehrere gleichzeitig aktive App-Instanzen ab.
Eine solche Parallelität ist in MSFS nicht nachgewiesen; Anzahl und Lifecycle
der Kontexte bleiben ein offener Laufzeitnachweis. Die Produktanforderung
benötigt diese Annahme nicht.

## Entscheidung

Der `DataStore` übergibt den Checklistenfortschritt zwischen resident
gehaltenen oder nacheinander aktiven EFB-Kontexten derselben Simulatorsitzung.

- Jede Nutzeränderung und jeder Abschnittswechsel schreibt den vollständigen
  Datensatz.
- Ein neu erzeugter oder wieder aktivierter Kontext übernimmt den letzten
  kompatiblen Datensatz.
- Der Datensatz hat kein Timeout und ist nicht an einen VR-Modus gebunden.
- Flugzeugidentität, Checklisten-ID und Revision verhindern eine Übernahme in
  einen fachlich anderen Kontext.
- `savedAt` dient zur Erkennung eines seit dem letzten Abgleich erneuerten
  Datensatzes. Es ist kein verteilter Konfliktlösungsmechanismus.

Gleichzeitige schreibende EFB-Instanzen sind kein Produktvertrag. Eine
Multi-Writer-Konfliktauflösung wird erst eingeführt, wenn ein Laufzeitnachweis
zeigt, dass MSFS sie für einen realen Bedienablauf benötigt.

Die Lebensdauer des Fortschritts endet durch einen expliziten Reset bei neuem
Flug, Flugzeug-/Checklistenwechsel oder erkanntem Simulatorneustart. Ein
Wechsel zwischen VR und Nicht-VR löst keinen Reset aus.

## Begründung

- Die Entscheidung deckt das bestätigte Verhalten ab: Ein Kontext kann
  resident bleiben oder bei einem Darstellungswechsel neu entstehen.
- Sie vermeidet Synchronisationslogik für eine unbelegte Laufzeiteigenschaft.
- Explizite fachliche Reset-Bedingungen sind stabiler als eine Frist, die einen
  vermuteten Lifecycle nachbildet.
- Der langsame, bei inaktiver App gestoppte Abgleich erzeugt keine Arbeit pro
  Frame.

## Konsequenzen

- Der versionierte Schlüssel und die vorhandenen Kompatibilitätsprüfungen
  bleiben bestehen.
- `FltLoad` und ein beobachtetes `GameState.loading` löschen den Datensatz.
- Die Monotonie von `E:SIMULATION TIME` bleibt die zusätzliche
  Neustarterkennung; eine Pause hält den Wert nur an und ist kein Reset.
- Der offene Lifecycle-Test darf Parallelität beobachten, schreibt sie aber
  nicht vor. Erst ein bestätigter praktischer Konflikt ändert die Architektur.
- Das in MSFS bestätigte Verhalten für VR-Wechsel, neuen Flug,
  Flugzeugwechsel und Simulatorpause bleibt unverändert.

## Verworfene Alternativen

- **Vorsorgliche Multi-Writer-Synchronisation:** erhöht Komplexität und
  Fehlerfläche ohne nachgewiesenen Produktbedarf.
- **Übergabe nur in `onPause()` oder `onClose()`:** setzt Lifecycle-Hooks
  voraus, die bei einem Darstellungswechsel nicht garantiert sind.
- **Befristete Übergabe:** bildet einen vermuteten Lifecycle mit einem Timeout
  nach und kann einen legitimen späteren Kontextwechsel verpassen.
- **Reiner In-Memory-Zustand:** verliert Fortschritt bei einer Neuerzeugung des
  EFB-Kontexts.
