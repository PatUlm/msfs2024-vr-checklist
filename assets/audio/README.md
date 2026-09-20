# Pre-rendered speech

`completion/` contains the clean English "Checklist completed" announcement
in ElevenLabs **Brian**, voice ID `nPczCjzI2devNBz1zQrb`, generated with
`eleven_multilingual_v2` during the developer's paid Starter subscription on
2026-09-18. The manifest records the request settings, generation time,
request ID, paid-plan confirmation and file checksum. The free-tier audition
files were not reused.

The single mono Ogg Opus file is embedded in the companion and decoded at
48 kHz. The optional radio effect is applied during playback; there are no
separate radio or intercom recordings. Sarah remains a documented alternative
in ADR 0008, not a second bundled voice.

## Regeneration

Install FFmpeg with libopus support, set `ELEVENLABS_API_KEY` in the ignored
root `.env`, and optionally set `VR_CHECKLIST_FFMPEG` to its executable path.
With an active paid subscription, run from the repository root:

```sh
task audio:render-completion -- --paid-plan-confirmed
```

This is an explicit credit-consuming developer operation. A matching existing
paid asset is reused without an API call. Build, check, deploy and the shipped
app do not call ElevenLabs or require FFmpeg. The production voice is currently
used for group completion and Settings → Test sound; individual checklist-item
speech is a later increment.

## Rights notice

These generated audio assets are **not covered by an MIT license** of any
surrounding code. ElevenLabs permits publication and commercial use of output
generated during a paid subscription, subject to its terms. Its output-use
restrictions, including restrictions on AI training, remain applicable.
No unrestricted relicensing of these files is asserted here. The project's
external distribution license remains to be finalized before publication.

- [Publication and commercial use](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform)
- [EEA Terms of Service](https://elevenlabs.io/terms-of-use-eu)
- [Prohibited Use Policy](https://elevenlabs.io/use-policy)
- [Project decision](../../docs/adr/0008-stimme-und-tts-anbieter.md)

## Preparing checklist speech

`task audio:plan` reads the canonical checklist JSON and writes a complete
JSON inventory plus a Markdown review list to `tmp/checklist-audio/`.
Identical texts are planned once, retaining every item reference. A `speech`
override takes precedence over the `<challenge>: <response>` fallback.

The plan reports character volume and flags abbreviations, compact notation,
and existing `needsReview` markers. These hints do not prove pronunciation
errors. Corrections belong in the checklist data, not in the generated plan.
Character volume is not a binding credit quote. The task works entirely
offline and generates no audio; the existing completion clip is excluded.

The eight A400M `EFIS and FMS Setup` entries (stable ID `fsm-init`) are
deferred by user decision. They remain in the canonical checklist, with their
existing review markers, but are listed separately in `excludedItems` and have
no planned speech-asset mapping. The plan's character totals count only included
utterances. Revisit this exclusion after the contents have been confirmed.

Generate the included item clips with
`task audio:render-items -- --paid-plan-confirmed`. This uses the completion
clip's Brian/model/render settings and writes clean Opus assets, per-clip
provenance, and an item-to-file manifest under `items/`. It is an explicit
developer operation and is never invoked by check, build, or deployment.
The companion embeds these assets and reads them when Read checklist items
is enabled; the eight deferred A400M entries remain silent.

Existing paid assets are reused after checksum verification. Source responses
are checkpointed under the ignored `tmp/checklist-audio/render-cache/` before
encoding, allowing local encoding failures to resume without another TTS
request. A `.pending` marker without a saved response stops retries: inspect
the provider history first, because an interrupted request might already have
consumed credits. No automatic retry, top-up, or subscription change occurs.

### Accepted SAS pronunciation

After comparing the alternatives, the user chose to retain
`S A S one and two: On.` with Brian and `eleven_multilingual_v2`.
The initial S was imperfect in the audition, but this version was preferred
over hyphens, spelled-out letter names, commas, and phonetic control with
Flash v2 and Eleven v3. This is an accepted pronunciation compromise, not an
outstanding correction before rendering. No further SAS-specific spelling
or model change is planned; the visible label remains `SAS [1+2]`.
