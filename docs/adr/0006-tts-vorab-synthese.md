# ADR 0006: Sprachausgabe als Vorab-Synthese

Status: Akzeptiert (2026-08-26); Klangvarianten durch
[ADR 0010](0010-radioeffekt-bei-der-wiedergabe.md) ersetzt.

## Entscheidung und Grund

Statische Checklistentexte werden als Entwicklerschritt vorab vertont.
Ausgeliefert werden nur Audiodateien, keine TTS-Modelle oder Phonemizer.
So bleiben Flugbetrieb und Aussprache unabhängig von Netzwerk und
Syntheseleistung; Fehler lassen sich vor der Auslieferung hören und korrigieren.

## Konsequenzen

Text- oder Stimmenänderungen erfordern gezieltes Neu-Rendern. Aussprache steht
im `speech`-Feld, Herkunft und Renderrezept in den Asset-Metadaten. Kein
Echtzeit-Fallback, der Modell und Phonemizer wieder in die App bringt.

[ADR 0007](0007-ablage-der-gerenderten-audiodateien.md) regelt die Ablage,
[ADR 0008](0008-stimme-und-tts-anbieter.md) die Stimme. Pro Ansage wird nur
Clean gerendert; Radio wird gemäß ADR 0010 live angewendet.
