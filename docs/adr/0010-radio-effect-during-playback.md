# ADR 0010: Radio effect during playback

Status: Accepted (2026-09-18); supersedes the pre-rendered sound variants from
ADR 0006/0007. Pre-rendered TTS, Opus and storage in the repository remain.

## Decision and reason

One clean file is shipped per announcement. `Radio effect` switches local
signal processing during playback; intercom is dropped. This way, filter
changes need neither new TTS calls nor duplicate assets.

## Consequences

- Radio is on by default, and the selection is saved. Off plays the clean
  recording unchanged, with a short transition when switching.
- Filter work happens only during active audio streams, before the
  mono/stereo conversion. No timers, EFB frame work or permanently open
  streams.
- The filter uses the existing NAudio; parameters are in the code. No
  additional radio clicks or noise.
- New announcements start with their own filter state. Local tests check the
  frequency response, streaming, switching and clipping. Audio quality applies
  regardless of the device; no separate headset or in-ear acceptance.

Pre-rendered file pairs would needlessly duplicate the live processing;
real-time TTS and cloud access remain excluded according to ADR 0006.
