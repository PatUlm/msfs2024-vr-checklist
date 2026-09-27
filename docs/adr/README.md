# Architecture decisions

ADRs record only decisions whose reasons still help with a later change:
problem, chosen approach, essential consequence. Usually 15–35 lines are
enough. No research diaries, test logs, code transcripts or completed phase
plans. Technical MSFS facts are in the [SDK reference](../msfs-sdk-reference.md),
pending tests in [open-tests.md](../open-tests.md).

A substantive reversal gets a new ADR that references the superseded one.
Editorial shortening needs no new ADR. Completed pure process planning may be
dropped; IDs are never reassigned or renumbered.

Validity and superseding decisions are stated only in the respective ADR.
Implementation progress is tracked in the [backlog](../../BACKLOG.md).

| ADR                                                      | Decision                                               |
|----------------------------------------------------------|--------------------------------------------------------|
| [0001](0001-licensing-and-publication-strategy.md)       | License choice and redistribution                      |
| [0002](0002-confirmation-via-in-sim-key-interception.md) | Confirmation directly in the EFB                       |
| [0003](0003-commbus-over-simconnect.md)                  | CommBus over SimConnect                                |
| [0004](0004-companion-app-stack.md)                      | .NET 10 and Avalonia                                   |
| [0006](0006-pre-rendered-speech.md)                      | Pre-rendered speech                                    |
| [0007](0007-rendered-audio-in-the-repository.md)         | Opus files in the repository                           |
| [0008](0008-voice-and-tts-provider.md)                   | ElevenLabs Brian                                       |
| [0009](0009-progress-across-efb-context-changes.md)      | Progress across context changes                        |
| [0010](0010-radio-effect-during-playback.md)             | Live radio effect                                      |
| [0011](0011-confirmation-actions-in-the-companion.md)    | Confirmation actions switched offline in the companion |
| [0012](0012-distribution-as-zip-and-companion-setup.md)  | EFB ZIP and companion setup                            |
| [0013](0013-project-license.md)                          | MIT project license                                    |
