# ADR 0002: Bestätigungseingabe über In-Sim-Key-Interception

- **Status:** Akzeptiert für Starrflügler; Auslöser für Hubschrauber offen
- **Datum:** 2026-08-26, Eventwahl korrigiert am 2026-08-27,
  Hubschraubergrenze bestätigt am 2026-08-28
- **Betrifft:** Phase 2
- **Technische Grundlage:**
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app)

## Kontext

Der Pilot soll den nächsten offenen Checklistenpunkt im VR-Cockpit mit einem
frei belegbaren Knopf bestätigen können. Die dafür gedachte EFB-Aktion
`VALIDATE` ist nicht frei belegbar. Ein benanntes Sim-Key-Event kann dagegen
direkt im JavaScript-Kontext der EFB-App empfangen werden.

## Entscheidung

Die EFB-App empfängt die Bestätigung selbst über ein abgefangenes
Sim-Key-Event. Phase 2 braucht dafür keine Windows-App, keinen Tastaturhook und
keine Windows-Eingabe-API.

Für Starrflügler wird derzeit `LEAD_POLE_ON` verwendet. Der Nutzer belegt die
als `LEAD POLE ON` angezeigte Action in den MSFS-Steuerungen mit seinem
gewünschten Gerät. Solange das Paket privat bleibt, ist der Eventname nicht in
der App konfigurierbar.

## Begründung

- Die Lösung liefert den gewünschten VR-Nutzen ohne zweiten Prozess und ohne
  neue Abhängigkeit.
- Die App erfährt nur, dass das gewählte Sim-Event ausgelöst wurde, nicht die
  physische Taste oder den HOTAS-Knopf.
- Die Gerätewahl bleibt vollständig in den MSFS-Steuerungen beim Nutzer.

## Konsequenzen

- Die Implementierung muss die in der
  [SDK-Referenz](../msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app)
  festgehaltenen Regeln zu Pass-through, Entprellung, Sichtbarkeit und
  Erneuerung nach Flugladefolgen einhalten.
- Der Mechanismus ist nicht als stabiler EFB-API-Vertrag zugesagt und muss bei
  einem relevanten Sim- oder SDK-Update erneut bewertet werden.
- `LEAD POLE ON` wird in den Steuerungen von MH-60 und H125 nicht angeboten.
  Für Hubschrauber muss deshalb entweder ein in beiden Kategorien belegbarer
  folgenloser Auslöser oder ein zweiter Auslöser gefunden werden. Der konkrete
  Nachweis steht ausschließlich in
  [`../open-tests.md`](../open-tests.md).
- Findet sich kein geeigneter Sim-Key-Auslöser, ist DirectInput in der späteren
  Begleit-App die Rückfallebene für Hubschrauber.

## Verworfene Alternativen

- **Low-Level-Keyboard-Hook:** wegen systemweiter Tastenerfassung und der damit
  unvereinbaren Datenschutzzusage ausgeschlossen.
- **VR-Controller-Buttons:** nicht zugänglich, solange MSFS die OpenXR-Session
  hält.
- **Key-Events aus einer externen App:** erreichen die JS-Interception nicht;
  siehe SDK-Referenz.
- **DirectInput für die gesamte Flotte:** technisch möglich, aber für Phase 2
  unnötig aufwendig; bleibt nur die Rückfallebene.
