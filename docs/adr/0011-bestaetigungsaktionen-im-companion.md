# ADR 0011: Bestätigungsaktionen im Companion schalten

Status: Akzeptiert (2026-09-25). Ersetzt [ADR 0002](0002-bestaetigungseingabe-in-sim-key-interception.md).

## Problem

Die Suche nach einem tatsächlich verfügbaren, flottenübergreifenden Event war
aufwendig. Eine freie Eventwahl würde diese Suche auf Nutzer verlagern. Bei
Konflikten soll die Bestätigung abschaltbar sein, ohne eine EFB-Settings-Seite
einzuführen. Einstellungen müssen auch ohne laufenden Simulator möglich sein.

## Entscheidung

Die Companion-Settings enthalten eine Auswahlliste erprobter
Bestätigungsaktionen mit gemeinsamer Aktivierung. Zunächst ist nur `PLASMA_OFF` enthalten, angezeigt als
`SET PLASMA OFF` und standardmäßig an. Beide Apps beziehen den Katalog aus
derselben versionierten Quelldatei; weitere Aktionen brauchen einen Nachweis.

Der Companion speichert den gewünschten Zustand lokal und überträgt ihn beim
EFB-Kontakt sowie nach Änderungen über CommBus. Die EFB speichert den
übernommenen Zustand dauerhaft, getrennt vom Flugfortschritt. Die Settings
melden ausstehende Übertragung und Fehler; nach bestätigter Übernahme entfällt
der Statustext.

## Konsequenzen

- Einstellungen sind offline bearbeitbar. Beim Kontakt gilt der im Companion
  gespeicherte Wunsch; ohne Companion gilt der letzte in der EFB gespeicherte Wert.
- Flugwechsel, VR-Kontextwechsel und Simulatorneustart setzen diese Werte nicht
  zurück. Der Companion ist zum Konfigurieren, nicht zum Bestätigen erforderlich.
- Aus deaktiviert die Checklistenreaktion, nicht das Simulator-Event. Pass-through,
  Sichtbarkeitsprüfung, Entprellung und Lifecycle-Registrierung bleiben gemäß
  [SDK-Referenz](../msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app).
- Keine freie Eventeingabe, globale Tastaturerfassung oder zusätzliche EFB-Seite.
