# Pre-rendered speech

Maintain regeneration instructions and asset provenance here, not audition
history or copies of manifest settings. `completion/` and `items/` contain
clean English ElevenLabs **Brian** announcements using
`eleven_multilingual_v2`, generated during a confirmed paid subscription.
Manifests and per-file metadata record voice/model settings, generation time,
request ID, paid-plan confirmation and checksums.

The companion embeds mono Ogg Opus files, decodes at 48 kHz and optionally
applies the radio effect during playback. It uses no TTS model, API key or
network access. Build, check and deploy need neither ElevenLabs nor FFmpeg.

## Regeneration

For changed checklist text, first review the offline plan:

```sh
task audio:plan
```

It writes a deduplicated inventory and review list to `tmp/checklist-audio/`.
`speech` overrides the `<challenge>: <response>` fallback. Pronunciation hints
are review aids, not proof of errors; corrections belong in the canonical data.
The eight A400M `EFIS and FMS Setup` entries (ID `fsm-init`) are excluded and
silent until their contents are confirmed.

To render, install FFmpeg with libopus support, set `ELEVENLABS_API_KEY` in the
ignored root `.env`, and optionally set `VR_CHECKLIST_FFMPEG` to its executable.
With an active paid subscription, explicitly run the needed task:

```sh
task audio:render-completion -- --paid-plan-confirmed
task audio:render-items -- --paid-plan-confirmed
```

These operations consume credits. Existing matching paid assets are reused
with checksum verification. Never reuse free-tier auditions as production
assets. `task validate:audio` checks item mappings, provenance and exclusions.

Source responses are checkpointed under
`tmp/checklist-audio/render-cache/` before encoding. A `.pending` marker
without a saved response stops retries: inspect provider history first, since
an interrupted request may already have consumed credits. There is no
automatic retry, top-up or subscription change.

The accepted SAS pronunciation is `S A S one and two: On.` with Brian and the
current model; the visible label remains `SAS [1+2]`. Do not reopen this accepted
compromise solely because the initial S sounds imperfect.

## Rights notice

These audio assets are **not covered by an MIT license** of surrounding code.
Their external distribution terms, including rights for forks and derived
builds, remain to be finalized before publication. No unrestricted relicensing
is asserted here. The dated assessment and provider sources are maintained
under [R3](../../docs/license-audit.md#r3--audio-ist-bezahlt-erzeugt-aber-noch-nicht-weiterlizenziert);
the voice decision is [ADR 0008](../../docs/adr/0008-stimme-und-tts-anbieter.md).
