# ADR 0007: Rendered audio files in the repository

Status: Accepted (2026-08-26), Opus added on 2026-09-12; sound variants
superseded by [ADR 0010](0010-radio-effect-during-playback.md).

## Decision and reason

The announcements are stored under `assets/audio/` as versioned mono Opus
files in an Ogg container, 48 kHz and about 32 kbit/s. A clone thus contains
the necessary assets without requiring a TTS model, phonemizer or cloud
account to build. The few megabytes justify this exception to the rule of not
versioning generated files.

## Consequences

- Concentus and Concentus.Oggfile decode without additional native DLLs; the
  shipped clips can also be checked in tests without Windows.
- File hashes cover the spoken text, voice and clean render recipe. Filter
  parameters belong to the playback code, not to the synthesis hash.
- Render tasks run explicitly and separately from build/deploy. Instructions
  and provenance: [audio README](../../assets/audio/README.md).
- Reassess the storage if the set grows significantly through many voices or
  languages.

WAV would be unnecessarily large; a system decoder such as Media Foundation
would limit availability on Windows N editions. Generating audio only on the
user's machine would contradict [ADR 0006](0006-pre-rendered-speech.md).
