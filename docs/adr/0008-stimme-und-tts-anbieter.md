# ADR 0008: Stimme und TTS-Anbieter

Status: Brian gewählt (2026-09-17); öffentliche Audio-Lizenz offen.

## Entscheidung und Grund

ElevenLabs Brian mit `eleven_multilingual_v2` ist die englische Hauptstimme:
männlich, natürlich, ruhig und zügig. Die Wahl folgt dem Hörvergleich echter
Checklistensätze. Sarah bleibt eine mögliche weibliche Alternative, ohne
zweite ausgelieferte Stimme oder Stimmenwahl in der App.

## Konsequenzen

- Produktive Ansagen werden während eines bestätigten bezahlten Abos erzeugt;
  frühere Free-Tier-Hörproben sind keine Produktionsassets.
- Voice-ID, Requestparameter, Erzeugungsdatum, Tarifnachweis und Prüfsumme
  stehen bei den [Audioassets](../../assets/audio/README.md), nicht zusätzlich
  als Kopie im ADR. API-Zugang und Renderwerkzeuge bleiben Entwicklungsbelange.
- Radio wird lokal gemäß [ADR 0010](0010-radioeffekt-bei-der-wiedergabe.md)
  zugeschaltet; keine zweite Synthese für Klangvarianten.
- Eine pauschale MIT-Freigabe der Audioassets ist nicht beschlossen.
  Empfängerrechte für Nutzung, Bearbeitung und Weitergabe bleiben vor dem
  öffentlichen Release festzulegen. Der konkrete Prüfstand samt Primärquellen
  steht ausschließlich unter [R3](../license-audit.md#r3--audio-ist-bezahlt-erzeugt-aber-noch-nicht-weiterlizenziert).

Stimmenranglisten, Hörprobenchronik und damalige Tarifpreise sind keine
Wartungsgrundlage. Bei einem Anbieterwechsel zählen verständliche Aussprache,
konsistenter Klang und nachgewiesene Rechte für die geplante Distribution.
