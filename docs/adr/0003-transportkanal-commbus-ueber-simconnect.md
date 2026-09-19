# ADR 0003: Transportkanal über den CommBus mit SimConnect

- **Status:** Akzeptiert — Lifecycle-Nachweise am 2026-09-19 abgeschlossen
- **Datum:** 2026-08-26, Transportdurchstich bestätigt am 2026-08-29
- **Betrifft:** Phase 3
- **Technische Grundlage:**
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md#commbus-und-externe-begleit-app)

## Kontext

Die EFB-App soll Checklistenstatus und Abschlussereignisse mit einer lokalen
Windows-Begleit-App austauschen. Dafür wird ein bidirektionaler,
ereignisgesteuerter Kanal benötigt, der ohne Polling und ohne undokumentierte
Netzwerkverbindung auskommt.

## Entscheidung

Der Kanal ist der **CommBus über SimConnect**. Ein externer
SimConnect-Client und der JavaScript-Kontext der EFB-App tauschen darüber
benannte Events in beide Richtungen aus. Ein zusätzliches WASM-Modul oder Paket
ist nicht vorgesehen.

## Begründung

- Der Kanal ist seit SDK 1.6.4 dokumentiert und hat ein offizielles
  bidirektionales Sample.
- Er benötigt keine zusätzliche Netzwerkfläche und keine periodischen
  SimVar-Abfragen.
- Er passt zum event-first Ansatz des Projekts und hält die EFB-App ohne
  Begleit-App eigenständig.

## Konsequenzen

- Das versionierte Protokoll überträgt vollständige Zustandssnapshots beim
  ersten Kontakt und nach einem Reconnect, danach bei Zustandsänderungen.
  Sie enthalten EFB- und Protokollversion, Sitzungs- und Instanzkennung,
  Sequenznummer, Flugzeug, Checkliste mit Revision, aktive Gruppe, nächstes
  Item, Pflichtfortschritt, Abschlussstatus und IDs erledigter Gruppen.
  Sitzungskennung und Sequenznummer dienen zum Erkennen alter oder wiederholter
  Zustände; Gruppenabschlüsse werden aus dem Zustand abgeleitet, nicht aus
  separaten Impulsen, die bei der Ratenbegrenzung verloren gehen könnten.

- Die Implementierung muss Chunk-Reassembly, Ratenbegrenzung und das
  Pausenverhalten aus der
  [SDK-Referenz](../msfs-sdk-reference.md#commbus-und-externe-begleit-app)
  berücksichtigen.
- Die EFB-Seite braucht eine eigene Ambient-Deklaration für die nicht
  typisierte CommBus-API.
- Die Nutzlast bleibt bewusst klein: Der Zustandssnapshot ist eine
  Zusammenfassung ohne Item-Listen von etwa 1 KB, der State-Request umfasst
  wenige Bytes. Die maximale CommBus-Nutzlast ist nicht gemessen. Sobald das
  Protokoll große Nachrichten benötigt, ist dieser Nachweis vorher zu führen.
- Beide Richtungen sowie die geprüften Pause-, Appwechsel- und
  VR-Kontextwechselpfade sind im Custom-EFB-Kontext bestätigt; die
  Geltungsbereiche stehen in der [SDK-Referenz](../msfs-sdk-reference.md).

## Verworfene Alternativen

- **localhost-WebSocket oder `fetch`:** kein dokumentierter EFB-Vertrag und bei
  fehlerhaftem Socket-Lifecycle mit bestätigtem Coherent-GT-Absturzrisiko.
- **WASM-Brücke:** derselbe CommBus mit zusätzlichem Modul, Paket und Build;
  nur Rückfallebene, falls der direkte Weg scheitert.
- **Client Data Areas allein:** erreichen den EFB-JavaScript-Kontext nicht.
- **LVars, H-Events oder Key-Events:** benötigen Polling beziehungsweise
  erreichen die EFB aus einem externen Client nicht zuverlässig.
