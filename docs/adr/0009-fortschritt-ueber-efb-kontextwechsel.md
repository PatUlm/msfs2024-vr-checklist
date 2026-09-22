# ADR 0009: Fortschritt über EFB-Kontextwechsel

Status: Akzeptiert (2026-08-30); ersetzt die befristete Einmal-Übergabe.

## Entscheidung und Grund

Der SDK-`DataStore` übergibt Fortschritt zwischen residenten oder nacheinander
aktiven EFB-Kontexten derselben Simulatorsitzung. Reiner In-Memory-Zustand
reicht für einen VR-Wechsel nicht; ein Timeout bildet den Lifecycle nicht
zuverlässig ab. Technische Grundlage:
[SDK-Referenz](../msfs-sdk-reference.md#efb-app-lifecycle-und-geteilter-zustand).

## Konsequenzen

- Jede Nutzeränderung und jeder Gruppenwechsel schreibt den vollständigen
  Datensatz; neue oder reaktivierte Kontexte übernehmen den kompatiblen Stand.
- Flugzeugidentität, Checklisten-ID und Revision müssen passen. `savedAt`
  erkennt einen aktualisierten Stand, ist keine verteilte Konfliktauflösung.
- `FltLoad`, beobachtetes Laden, Flugzeug-/Checklistenwechsel und erkannter
  Simulatorneustart setzen zurück. VR-Wechsel und Pause nicht.
- Neustarterkennung über Monotonie der Simulationszeit, keine Ablaufzeit des
  Datensatzes. Langsamer Abgleich stoppt bei inaktiver App.
- Keine vorsorgliche Multi-Writer-Synchronisation: Gleichzeitige schreibende
  Instanzen sind kein nachgewiesener Produktbedarf. Erst ein konkreter
  Laufzeitkonflikt rechtfertigt diese Erweiterung.

Übergabe allein beim Schließen/Pausieren setzt nicht garantierte Hooks voraus;
periodisches Verwerfen nach einer Frist kann legitime Kontextwechsel verpassen.
