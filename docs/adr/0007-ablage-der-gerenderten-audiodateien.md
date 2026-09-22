# ADR 0007: Gerenderte Audiodateien im Repository

Status: Akzeptiert (2026-08-26), Opus ergänzt am 2026-09-12;
Klangvarianten durch [ADR 0010](0010-radioeffekt-bei-der-wiedergabe.md) ersetzt.

## Entscheidung und Grund

Die Ansagen liegen unter `assets/audio/` als versionierte Mono-Opus-Dateien
im Ogg-Container, 48 kHz und etwa 32 kbit/s. So enthält ein Clone die nötigen
Assets, ohne TTS-Modell, Phonemizer oder Cloudkonto zum Bauen zu verlangen.
Die wenigen Megabyte rechtfertigen diese Ausnahme von der Regel, generierte
Dateien nicht zu versionieren.

## Konsequenzen

- Concentus und Concentus.Oggfile dekodieren ohne zusätzliche native DLLs;
  die ausgelieferten Clips lassen sich auch in Tests ohne Windows prüfen.
- Dateihashes berücksichtigen gesprochenen Text, Stimme und Clean-Renderrezept.
  Filterparameter gehören zum Wiedergabecode, nicht zum Synthesehash.
- Render-Tasks laufen ausdrücklich und getrennt von Build/Deploy. Anleitung
  und Herkunft: [Audio-README](../../assets/audio/README.md).
- Bei deutlich wachsendem Bestand durch viele Stimmen oder Sprachen die
  Ablage neu bewerten.

WAV wäre unnötig groß; ein Systemdecoder wie Media Foundation würde die
Verfügbarkeit auf Windows-N-Editionen einschränken. Audio erst beim Nutzer
zu erzeugen widerspräche [ADR 0006](0006-tts-vorab-synthese.md).
