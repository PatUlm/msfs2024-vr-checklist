# ADR 0010: Radioeffekt bei der Wiedergabe

Status: Akzeptiert (2026-09-18); ersetzt die vorgerenderten Klangvarianten aus
ADR 0006/0007. Vorab-TTS, Opus und Repository-Ablage bleiben bestehen.

## Entscheidung und Grund

Pro Ansage wird eine Clean-Datei ausgeliefert. `Radio effect` schaltet die
lokale Signalverarbeitung während der Wiedergabe um; Intercom entfällt.
So brauchen Filteränderungen weder neue TTS-Aufrufe noch doppelte Assets.

## Konsequenzen

- Radio ist standardmäßig an, die Auswahl wird gespeichert. Aus gibt die
  Clean-Aufnahme unverändert wieder, mit kurzem Übergang beim Umschalten.
- Filterarbeit nur während aktiver Audiostreams, vor der Mono-/Stereo-Umsetzung.
  Keine Timer, EFB-Frame-Arbeit oder dauerhaft offenen Streams.
- Der Filter verwendet vorhandenes NAudio; Parameter stehen im Code. Keine
  zusätzlichen Funkklicks oder Rauschgeräusche.
- Neue Ansagen starten mit eigenem Filterzustand. Lokale Tests prüfen
  Frequenzgang, Streaming, Umschaltung und Übersteuerung. Audioqualität gilt
  unabhängig vom Gerät; keine gesonderte Headset- oder In-Ear-Abnahme.

Vorgerenderte Dateipaare würden die Live-Verarbeitung unnötig duplizieren;
Echtzeit-TTS und Cloudzugriff bleiben gemäß ADR 0006 ausgeschlossen.
