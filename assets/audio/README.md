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
