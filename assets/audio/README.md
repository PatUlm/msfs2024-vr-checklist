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

## Render prerequisites

Rendering new or changed speech requires FFmpeg with the `libopus` encoder
and `loudnorm` filter, plus an active paid ElevenLabs subscription. On Ubuntu
in WSL, install FFmpeg once through the system package manager:

```sh
sudo apt-get update
sudo apt-get install --no-install-recommends ffmpeg
```

Use `ffmpeg` from `PATH`; no temporary Python environment or separate Docker
container is needed. Set `VR_CHECKLIST_FFMPEG` in the ignored root `.env` only
when using a different, persistent executable path. Set `ELEVENLABS_API_KEY`
there as well. Render tasks do not install tools automatically.

## Regeneration

For changed checklist text, first review the offline plan:

```sh
task audio:plan
```

It writes a deduplicated inventory and review list to `tmp/checklist-audio/`.
`speech` overrides the `<challenge>: <response>` fallback. Pronunciation hints
are review aids, not proof of errors; corrections belong in the canonical data.
The first item of each group is rendered as `<group title> Checklist. <item>`
in one recording, giving it a natural sentence pause. Uppercase title acronyms
are spelled out and `&` is spoken as `and`. Renaming a group or changing its
first item therefore also requires updating the affected recordings.

With the prerequisites installed and the paid subscription confirmed,
explicitly run the needed task:

```sh
task audio:render-completion -- --paid-plan-confirmed
task audio:render-items -- --paid-plan-confirmed
```

These operations consume credits. Existing matching paid assets are reused
with checksum verification. Never reuse free-tier auditions as production
assets. `task validate:audio` checks complete item mappings and provenance.

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
Their distribution terms, assessment and provider sources are maintained
under [R3](../../docs/license-audit.md#r3--audio-ist-bezahlt-erzeugt-aber-noch-nicht-weiterlizenziert);
the voice decision is [ADR 0008](../../docs/adr/0008-stimme-und-tts-anbieter.md).
