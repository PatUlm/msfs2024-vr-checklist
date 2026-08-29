# Architekturentscheidungen (ADR)

Hier stehen die getroffenen Entscheidungen mit ihren Alternativen und
Konsequenzen. Die Belege und die verworfenen Optionen im Detail stehen in
[`../phase-2-3-research.md`](../phase-2-3-research.md), die daraus abgeleiteten
normativen Aussagen in [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md).

Arbeitsteilung, damit nichts doppelt gepflegt wird:

- `msfs-sdk-reference.md` sagt **was gilt** — Fakten über SDK, Laufzeit und
  Paketierung, mit Nachweisstufe.
- `phase-2-3-research.md` sagt **warum wir das wissen** — Kandidaten, Belege,
  Lizenzlage und verworfene Wege.
- Die ADRs hier sagen **wie wir uns entschieden haben** — Kontext, Optionen,
  Entscheidung, Konsequenzen, Status.
- `open-tests.md` sagt **was noch nachzuweisen ist** — als einzige lebende
  Testliste.

Ein ADR mit Status `Vorgeschlagen` hängt noch an einem Laufzeitnachweis. Er
wechselt auf `Akzeptiert` oder `Verworfen`, sobald der Nachweis geführt ist;
eine spätere Kehrtwende bekommt ein neues ADR, das das alte ersetzt.

## Index

| Nr. | Entscheidung | Status | Betrifft |
| --- | --- | --- | --- |
| [0001](0001-lizenz-und-veroeffentlichungsstrategie.md) | Lizenz- und Veröffentlichungsstrategie: vorerst privat, Option offen | Akzeptiert | alle Phasen |
| [0002](0002-bestaetigungseingabe-in-sim-key-interception.md) | Bestätigungseingabe über In-Sim-Key-Interception | Akzeptiert für Starrflügler, Hubschrauber offen | Phase 2 |
| [0003](0003-transportkanal-commbus-ueber-simconnect.md) | Transportkanal über den CommBus mit SimConnect | Vorgeschlagen | Phase 3 |
| [0004](0004-stack-der-begleit-app.md) | Stack der Begleit-App: .NET 10 mit Avalonia | Akzeptiert, offene Umsetzung | Phase 3 |
| [0005](0005-phase-2-auf-die-efb-app-verkuerzen.md) | Phase 2 auf die EFB-App verkürzen | Akzeptiert | Phasenzuschnitt |
| [0006](0006-tts-vorab-synthese.md) | Sprachausgabe als Vorab-Synthese mit Cache | Akzeptiert | Phase 3 |
| [0007](0007-ablage-der-gerenderten-audiodateien.md) | Gerenderte Audiodateien liegen im Repository | Akzeptiert | Phase 3 |
| [0008](0008-stimme-und-tts-anbieter.md) | Stimme und TTS-Anbieter | **Offen** | Phase 3 |
| [0009](0009-fortschritt-als-geteilter-sitzungszustand.md) | Checklistenfortschritt als geteilter Sitzungszustand | Akzeptiert | Phase 1 |

0001 bis 0008 entstanden am 2026-08-26 aus dem Entscheidungsgespräch nach der
Recherche-Session. 0009 kam am 2026-08-27 aus dem Bugreport zum getrennten
Zustand in VR und Nicht-VR hinzu, ersetzt die Einmal-Übergabe aus 0.1.5 und ist
am selben Tag in MSFS nachgewiesen worden.

Noch ausstehende Laufzeitnachweise stehen ausschließlich in
[`../open-tests.md`](../open-tests.md). Die offene Produktentscheidung zu
Stimme und Anbieter bleibt in [ADR 0008](0008-stimme-und-tts-anbieter.md).
