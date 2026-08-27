# Architekturentscheidungen (ADR)

Hier stehen die getroffenen Entscheidungen mit ihren Alternativen und
Konsequenzen. Die Belege und die verworfenen Optionen im Detail stehen in
[`../phase-2-3-research.md`](../phase-2-3-research.md), die daraus abgeleiteten
normativen Aussagen in [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md).

Arbeitsteilung, damit nichts doppelt gepflegt wird:

- `msfs-sdk-reference.md` sagt **was gilt** — Fakten über SDK, Laufzeit und
  Paketierung, mit Nachweisstufe.
- `phase-2-3-research.md` sagt **warum wir das wissen** — Kandidaten, Belege,
  Lizenzlage, offene Nachweise.
- Die ADRs hier sagen **wie wir uns entschieden haben** — Kontext, Optionen,
  Entscheidung, Konsequenzen, Status.

Ein ADR mit Status `Vorgeschlagen` hängt noch an einem Laufzeitnachweis. Er
wechselt auf `Akzeptiert` oder `Verworfen`, sobald der Nachweis geführt ist;
eine spätere Kehrtwende bekommt ein neues ADR, das das alte ersetzt.

## Index

| Nr. | Entscheidung | Status | Betrifft |
| --- | --- | --- | --- |
| [0001](0001-lizenz-und-veroeffentlichungsstrategie.md) | Lizenz- und Veröffentlichungsstrategie: vorerst privat, Option offen | Akzeptiert | alle Phasen |
| [0002](0002-bestaetigungseingabe-in-sim-key-interception.md) | Bestätigungseingabe über In-Sim-Key-Interception | Vorgeschlagen | Phase 2 |
| [0003](0003-transportkanal-commbus-ueber-simconnect.md) | Transportkanal über den CommBus mit SimConnect | Vorgeschlagen | Phase 3 |
| [0004](0004-stack-der-begleit-app.md) | Stack der Begleit-App: .NET 10 mit Avalonia | Akzeptiert, offene Punkte | Phase 3 |
| [0005](0005-phase-2-auf-die-efb-app-verkuerzen.md) | Phase 2 auf die EFB-App verkürzen | Akzeptiert | Phasenzuschnitt |
| [0006](0006-tts-vorab-synthese.md) | Sprachausgabe als Vorab-Synthese mit Cache | Akzeptiert | Phase 3 |
| [0007](0007-ablage-der-gerenderten-audiodateien.md) | Gerenderte Audiodateien liegen im Repository | Akzeptiert | Phase 3 |
| [0008](0008-stimme-und-tts-anbieter.md) | Stimme und TTS-Anbieter | **Offen** | Phase 3 |

Alle acht entstanden am 2026-08-26 aus dem Entscheidungsgespräch nach der
Recherche-Session.

## Was als Nächstes den Status ändert

- **0002** hängt an einem Laufzeittest in MSFS: Feuert `keyIntercepted` in einer
  EFB-App, und feuert es in H125 und MH-60? Fällt der Test, fällt **0005** mit
  ihm und Phase 2 wird neu geschnitten.
- **0003** hängt an zwei kleinen Nachweisen im Simulator, die unabhängig von
  Phase 2 vorgezogen werden können.
- **0008** wird beim Übergang zu Phase 3 entschieden, nach einem Hörvergleich
  mit den echten Checklistensätzen und der Klärung, ob die
  Nutzungsbedingungen des jeweiligen Anbieters die Weitergabe der erzeugten
  Audiodateien erlauben.

Die offenen Laufzeitnachweise stehen gesammelt in
[`../phase-2-3-research.md`](../phase-2-3-research.md), Abschnitt 11.
