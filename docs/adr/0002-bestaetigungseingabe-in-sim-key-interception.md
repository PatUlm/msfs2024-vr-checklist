# ADR 0002: Bestätigungseingabe über In-Sim-Key-Interception

- **Status:** Akzeptiert
- **Datum:** 2026-08-26, Eventwahl korrigiert am 2026-08-27,
  Hubschraubergrenze bestätigt am 2026-08-28, SDK-Weg bewertet und
  Flottenauslöser festgelegt am 2026-08-29
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

Für alle vier Zielmuster wird `PLASMA_OFF` verwendet. Der Nutzer belegt die als
`SET PLASMA OFF` angezeigte Action in den MSFS-Steuerungen mit seinem
gewünschten Gerät. Solange das Paket privat bleibt, ist der Eventname nicht in
der App konfigurierbar.

## Ergebnis der SDK-Prüfung

Ein unterstützter Weg zu einer eigenen flottenweiten Controls-Action aus einem
reinen EFB-Paket bleibt unbelegt. SDK 1.7.3, EFB- und InputProfiles-Sample sowie
die aktuelle offizielle Dokumentation trennen EFB-Apps von Input-Profilen.
Profile ordnen vorhandene Actions konkreten Geräten zu; neue frei belegbare
Actions werden nur aus Model-Behavior-Input-Events eines Flugzeugpakets
beschrieben. Die aktuellen DevSupport-Beiträge bestätigen diesen Weg für
Drittanbieterflugzeuge, aber nicht für eine alleinstehende EFB-App. Die
technischen Grenzen stehen in der
[SDK-Referenz](../msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app).

Phase 2 stützt sich deshalb nicht auf das neue Input-Profile-System. Eine eng
formulierte DevSupport-Frage soll klären, ob der fehlende EFB-Weg nur
undokumentiert oder tatsächlich nicht vorgesehen ist; bis zu einer
belastbaren Antwort ändert sie diese Entscheidung nicht.

## Wahl des flottenweiten Auslösers

`PLASMA_OFF` ist der gemeinsame Sim-Key-Auslöser. Die installierte ActionDB
führt ihn als digitale Action im gemeinsamen Kontext `AIRCRAFT` ohne
einschränkendes TT-Tag. Der Simulator zeigt ihn als `SET PLASMA OFF` in den
Steuerungen von G36, DA42, H125 und MH-60 an und stellt ihn nach den jeweiligen
Flugladefolgen im EFB-JavaScript zu. Damit ist kein kategorieweiser Auslöser
mehr nötig; `WING_FOLD_OFF` wird nicht weiter untersucht.

Seine dokumentierte Wirkung ist auf einen Plasmaeffekt von Triebwerk 1
beschränkt, den keines der vier Zielmuster bereitstellt. Die Action wird wie der
vorherige Starrflügler-Auslöser ohne vollständigen Vorabtest jeder Mission und
jedes Sonderzustands mit `passThrough = true` eingesetzt. Eine künftig
beobachtete Wechselwirkung ist ein zu behebender Produktbug, kein Grund für
einen dauerhaften parallelen Diagnosepfad.

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
- `SET PLASMA OFF` ist für G36, DA42, H125 und MH-60 bestätigt. Für Flugzeuge
  außerhalb dieser bewusst begrenzten Flotte kann die Action fehlen oder ein
  reales System bedienen; eine spätere Veröffentlichung erfordert deshalb eine
  konfigurierbare Eventwahl.

## Verworfene Alternativen

- **Low-Level-Keyboard-Hook:** wegen systemweiter Tastenerfassung und der damit
  unvereinbaren Datenschutzzusage ausgeschlossen.
- **VR-Controller-Buttons:** nicht zugänglich, solange MSFS die OpenXR-Session
  hält.
- **Key-Events aus einer externen App:** erreichen die JS-Interception nicht;
  siehe SDK-Referenz.
- **`LEAD_POLE_ON`:** erreicht Starrflügler, wird in den Steuerungen von H125
  und MH-60 aber nicht angeboten und wurde deshalb ersetzt.
- **DirectInput für die gesamte Flotte:** technisch möglich, aber für Phase 2
  unnötig aufwendig; bleibt nur die Rückfallebene.
