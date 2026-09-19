# Architekturentscheidungen (ADR)

Hier stehen getroffene Entscheidungen mit ihrem notwendigen Kontext, den
entscheidungsrelevanten Alternativen und den Konsequenzen. Technische
MSFS-Lessons werden nicht wiederholt, sondern aus
[`../msfs-sdk-reference.md`](../msfs-sdk-reference.md) verlinkt.

Arbeitsteilung, damit nichts doppelt gepflegt wird:

- `msfs-sdk-reference.md` enthält bestätigte technische Lessons learned.
- Die ADRs hier enthalten Entscheidungen und ihre Konsequenzen, aber keine
  zweite technische Referenz.
- `open-tests.md` sagt **was noch nachzuweisen ist** — als einzige lebende
  Testliste.

Ein ADR mit Status `Vorgeschlagen` oder `Offen` benennt den noch ausstehenden
Nachweis beziehungsweise die noch zu treffende Produktentscheidung. Eine
spätere Kehrtwende bekommt ein neues ADR, das das alte ersetzt.

## Index

| Nr. | Entscheidung | Status | Betrifft |
| --- | --- | --- | --- |
| [0001](0001-lizenz-und-veroeffentlichungsstrategie.md) | Lizenz- und Veröffentlichungsstrategie: vorerst privat, Option offen | Akzeptiert | alle Phasen |
| [0002](0002-bestaetigungseingabe-in-sim-key-interception.md) | Bestätigungseingabe über In-Sim-Key-Interception | Akzeptiert | Phase 2 |
| [0003](0003-transportkanal-commbus-ueber-simconnect.md) | Transportkanal über den CommBus mit SimConnect | Akzeptiert | Phase 3 |
| [0004](0004-stack-der-begleit-app.md) | Stack der Begleit-App: .NET 10 mit Avalonia | Akzeptiert | Phase 3 |
| [0005](0005-phase-2-auf-die-efb-app-verkuerzen.md) | Phase 2 auf die EFB-App verkürzen | Akzeptiert | Phasenzuschnitt |
| [0006](0006-tts-vorab-synthese.md) | Sprachausgabe als Vorab-Synthese | Akzeptiert | Phase 3 |
| [0007](0007-ablage-der-gerenderten-audiodateien.md) | Gerenderte Audiodateien liegen im Repository | Akzeptiert | Phase 3 |
| [0008](0008-stimme-und-tts-anbieter.md) | Stimme und TTS-Anbieter | Brian gewählt; Sarah als Alternative; externe Asset-Lizenz offen | Phase 3 |
| [0009](0009-fortschritt-ueber-efb-kontextwechsel.md) | Checklistenfortschritt über EFB-Kontextwechsel ohne unbelegte Multi-Writer-Annahme | Akzeptiert | Phase 1 |
| [0010](0010-radioeffekt-bei-der-wiedergabe.md) | Radioeffekt bei der Wiedergabe, eine Clean-Datei pro Ansage | Akzeptiert | Phase 3 |

Noch ausstehende Laufzeitnachweise stehen ausschließlich in
[`../open-tests.md`](../open-tests.md). Stimmenwahl und die noch offenen
Lizenzfragen stehen in [ADR 0008](0008-stimme-und-tts-anbieter.md); die
Live-Verarbeitung regelt [ADR 0010](0010-radioeffekt-bei-der-wiedergabe.md).
