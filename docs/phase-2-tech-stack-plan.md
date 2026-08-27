# Tech-Stack- und TTS-Evaluationsplan (abgeschlossen)

**Status: erledigt und ersetzt am 2026-08-26.**

Dieses Dokument war der verbindliche Research-first-Auftrag, bevor Code für die
Begleit-App entstehen durfte. Der Auftrag ist ausgeführt; sein Inhalt lebt jetzt
in drei Dokumenten weiter:

- **Ergebnis der Recherche**, mit allen Kandidaten, Belegen, Lizenzlagen und
  offenen Nachweisen: [`phase-2-3-research.md`](phase-2-3-research.md)
- **Getroffene Entscheidungen**, jeweils mit den verworfenen Alternativen und
  ihrer Begründung: [`adr/`](adr/)
- **Dauerhaft gültige SDK-Fakten**, mit Nachweisstufen:
  [`msfs-sdk-reference.md`](msfs-sdk-reference.md)

Zwei Ergebnisse haben den Zuschnitt der Phasen verändert und machen die
ursprüngliche Fragestellung dieses Plans gegenstandslos:

1. Der Transportweg zwischen einem externen SimConnect-Client und dem
   JavaScript-Kontext der EFB-App ist **dokumentiert vorhanden** und braucht
   kein WASM-Modul. Die zentrale offene Frage dieses Plans ist damit
   beantwortet.
2. Der Tastendruck kann die EFB-App **direkt** erreichen, ohne externen Prozess.
   Damit braucht Phase 2 keine Begleit-App mehr; sie ist auf die EFB-App
   verkürzt, und Begleit-App, Rückkanal und Sprachausgabe bilden gemeinsam
   Phase 3. Siehe
   [ADR 0005](adr/0005-phase-2-auf-die-efb-app-verkuerzen.md) und
   [`../ROADMAP.md`](../ROADMAP.md).

Die verbindlichen Produktanforderungen aus diesem Plan — Offline-Fähigkeit,
Optionalität von Rückkanal und Sprachausgabe, keine Geheimnisse im EFB-Paket,
Datenschutz bei der Eingabeerkennung, lesbare Anzeige statt Logausgabe — stehen
jetzt in `../ROADMAP.md` bei den Phasen, zu denen sie gehören.

Der Proof-of-Concept-Plan ist durch die Liste der offenen Laufzeitnachweise in
[`phase-2-3-research.md`](phase-2-3-research.md), Abschnitt 11, ersetzt.

Neue Recherche- oder Entscheidungsaufträge werden nicht mehr hier gepflegt.
