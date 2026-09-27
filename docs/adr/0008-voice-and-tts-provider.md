# ADR 0008: Voice and TTS provider

Status: Accepted (2026-09-17).

## Decision and reason

ElevenLabs Brian with `eleven_multilingual_v2` is the main English voice:
male, natural, calm and brisk. The choice follows a listening comparison of
real checklist sentences. Sarah remains a possible female alternative,
without a second shipped voice or a voice selection in the app.

## Consequences

- Production announcements are generated during a confirmed paid
  subscription; earlier free-tier samples are not production assets.
- Voice ID, request parameters, generation date, plan evidence and checksum
  are kept with the [audio assets](../../assets/audio/README.md), not copied
  into the ADR. API access and render tools remain development concerns.
- The radio effect is applied locally according to
  [ADR 0010](0010-radio-effect-during-playback.md); no second synthesis for
  sound variants.
- The voice choice grants no license for the audio assets. Recipients' rights
  are in the [audio terms](../../assets/audio/LICENSE), their rationale and
  primary sources in the [rights notice](../../assets/audio/README.md#rights-notice).

Voice rankings, sample history and past plan prices are no basis for
maintenance. For a provider change, what counts is intelligible
pronunciation, a consistent sound and proven rights for the planned
distribution.
