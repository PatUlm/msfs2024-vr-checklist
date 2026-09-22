# ADR 0003: CommBus über SimConnect

Status: Akzeptiert (2026-08-26).

## Entscheidung und Grund

EFB und Companion tauschen benannte CommBus-Events über SimConnect aus.
Der bidirektionale SDK-Kanal braucht weder zusätzliche WASM-Brücke noch
Localhost-Netzwerkverbindung und passt zur ereignisgesteuerten App.

## Konsequenzen

- Vollständigen versionierten Zustand beim ersten Kontakt, nach Reconnect und
  bei Änderungen übertragen. Gruppenabschlüsse werden aus dem Zustand
  abgeleitet, damit Ratenbegrenzung keine einzelnen Abschlussimpulse verliert.
- Sitzungs-/Instanzkennung und Sequenznummer unterscheiden alte und wiederholte
  Zustände. Der konkrete Datenvertrag steht im Code, nicht zusätzlich im ADR.
- Kleine Zusammenfassung ohne Checklistentexte oder Itemlisten. Die maximale
  CommBus-Nutzlast ist nicht gemessen; große Nachrichten benötigen vorher
  einen Nachweis.
- Chunk-Reassembly, Ratenbegrenzung, Script-Ladereihenfolge und Pausenverhalten
  gemäß [SDK-Referenz](../msfs-sdk-reference.md#commbus-und-externe-begleit-app).
- Die EFB bleibt ohne Companion vollständig bedienbar.

WebSockets haben keinen zugesagten EFB-Vertrag; Client Data Areas erreichen
JavaScript nicht direkt, LVars benötigen Polling. Eine zusätzliche WASM-Brücke
würde denselben Kanal mit mehr Build- und Paketaufwand erschließen.
