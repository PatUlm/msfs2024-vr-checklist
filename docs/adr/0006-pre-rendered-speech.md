# ADR 0006: Pre-rendered speech output

Status: Accepted (2026-08-26); sound variants superseded by
[ADR 0010](0010-radio-effect-during-playback.md).

## Decision and reason

Static checklist texts are voiced in advance as a developer step. Only audio
files are shipped, no TTS models or phonemizers. This keeps flight operation
and pronunciation independent of the network and of synthesis performance;
errors can be heard and corrected before shipping.

## Consequences

Text or voice changes require targeted re-rendering. Pronunciation is in the
`speech` field, provenance and render recipe in the asset metadata. No
real-time fallback that would bring the model and phonemizer back into the
app.

[ADR 0007](0007-rendered-audio-in-the-repository.md) governs storage,
[ADR 0008](0008-voice-and-tts-provider.md) the voice. Only the clean version
of each announcement is rendered; the radio effect is applied live according
to ADR 0010.
