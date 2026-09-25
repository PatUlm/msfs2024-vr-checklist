# ADR 0002: Bestätigung über In-Sim-Key-Interception

Status: Akzeptiert (2026-08-26). Gilt für die Bestätigung per Taste/HOTAS.

## Entscheidung und Grund

Die EFB empfängt `PLASMA_OFF` direkt. Nutzer belegen `SET PLASMA OFF` in den
MSFS-Steuerungen; die App kennt nur das Event, keine physische Taste. Das
liefert den VR-Nutzen ohne Companion oder systemweiten Tastaturhook.

Die Action ist für G36, DA42, H125 und MH-60 als gemeinsamer Auslöser bestätigt;
OH-6A/H500C kamen hinzu. Eine eigene flottenweite Controls-Action aus einem
reinen EFB-Paket ist im geprüften SDK nicht belegt. Technische Grenzen und
ungeeignete Alternativen stehen ausschließlich in der
[SDK-Referenz](../msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app).

## Konsequenzen

- Pass-through, Entprellung, Sichtbarkeit und erneute Registrierung nach
  Flugladefolgen gemäß SDK-Referenz einhalten. Kein Eingabepolling.
- Kein Low-Level-Keyboard-Hook und keine globale Tastenerfassung.
- Der Eventname bleibt im privaten Stand fest. **Vor Weitergabe an Fremde ist
  eine konfigurierbare Eventwahl beschlossen**, weil das Event bei anderen
  Flugzeugen ein System bedienen kann. Umsetzungsarbeit steht im
  [Backlog](../../BACKLOG.md).
- Relevante SDK-/Simulatoränderungen können eine Neubewertung erfordern;
  Interception ist kein zugesagter stabiler EFB-API-Vertrag.
