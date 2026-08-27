# ADR 0008: Stimme und TTS-Anbieter

- **Status:** **Offen** — wird beim Übergang zu Phase 3 entschieden
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3
- **Grundlage:** [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitte 3.1 bis 3.6

## Kontext

Welche Stimme die Checklisten spricht, ist bewusst noch nicht entschieden. Die
Recherche hat die Kandidaten und ihre Lizenzlage geklärt, aber die eigentliche
Frage ist eine Hörfrage, und die gehört an den Anfang von Phase 3, nicht an das
Ende der Recherche.

Zwei Erkenntnisse setzen den Rahmen.

**Der Qualitätsmaßstab ist bekannt und erreichbar.** Der Nutzer schätzt die
Sprachqualität von BeyondATC ausdrücklich. Die Untersuchung der Installation
zeigt: `onnxruntime.dll` plus `LocalVoice.dll` mit den Markern
`"phoneme_type": "espeak"` und `"phoneme_id_map"` — das ist das
Piper-Voice-Format eins zu eins, mit selbst trainierten Stimmen als
DLL-Ressource. Die Entwickler bestätigen öffentlich ein lokales, selbst
trainiertes Modell und „hundreds of hours" Trainingsdaten. **Das Ziel ist eine
gut trainierte Piper-VITS-Stimme in `high`-Qualität, nicht ein größeres
Modell** — der Hebel liegt bei der Stimme, nicht bei der Architektur. Die
BeyondATC-Stimmen selbst sind für uns per EULA ausgeschlossen.

**Es gibt keine belastbare Rangliste.** TTS Arena V2 mischt Cloud-APIs mit Open
Weights, bewertet nur Naturalness auf frei eingegebenem Text, und die kleinen
CPU-Modelle sind kaum vertreten — Kokoro etwa auf Platz 32, Piper überhaupt
nicht. Für „welches kleine Modell klingt am besten" hilft nur ein eigener
Hörvergleich mit den echten Checklistensätzen.

## Kandidaten

| Kandidat | Lizenz | Bemerkung |
| --- | --- | --- |
| **Kokoro-82M**, Stimme `af_heart` | Gewichte Apache-2.0 | ONNX q8 mit 92 MB; G2P über misaki (Apache-2.0) ohne espeak, also ohne GPL. Einziges kleines Modell mit belegbarem Blindtest-Standing. Weiblich — die männlichen Kokoro-Stimmen sind schwach. |
| **Piper `en_US-ljspeech-high`** | Datensatz public domain, „trained from scratch" | Genau die Modellklasse hinter BeyondATCs Qualität und die einzige englische Piper-Stimme mit belegt unbedenklicher Lizenz. Braucht espeak-ng — beim Vorab-Rendern folgenlos. |
| **Cloud-Anbieter** | je Anbieter zu prüfen | Durch [ADR 0006](0006-tts-vorab-synthese.md) überhaupt erst möglich: Das Rendern findet beim Entwickler statt, es wird kein Schlüssel ausgeliefert, es gibt keine Netzwerkabhängigkeit im Flug und keine Kosten pro Nutzer. Für 125 Ansagen ist der Preis trivial. |
| **WinRT `SpeechSynthesizer`** | proprietär, lizenzfrei nutzbar | Nullvariante und Fallback. Qualitativ unter Piper `high`, aber beste dokumentierte Aussprachekontrolle (SSML 1.1 mit `<phoneme alphabet="ipa">`). |

Ausgeschlossen sind unter anderem XTTS-v2 (CPML), F5-TTS-Gewichte (CC-BY-NC),
Fish-Speech in jeder Generation, OuteTTS, Higgs Audio, Supertonic (OpenRAIL-M
und Archivierung angekündigt) sowie alle Modelle, die praktisch eine dedizierte
GPU brauchen. Die Einzelbegründungen stehen in Abschnitt 3.6 des
Recherchedokuments.

## Was vor der Entscheidung zu klären ist

1. **Dürfen die erzeugten Audiodateien weitergegeben werden?** Genau das tun
   wir, wenn sie im Repository liegen und im MSFS-Paket mitgeliefert werden. Bei
   einigen Anbietern ist die Weitergabe synthetisierter Sprache als Teil eines
   eigenen Produkts eingeschränkt. Das ist an den Nutzungsbedingungen zu klären,
   nicht zu vermuten — und es ist die wichtigere Frage als die Qualität.
2. **Eine ChatGPT-Subscription enthält keine API-Nutzung.** Die OpenAI-API wird
   getrennt abgerechnet. Kein Hindernis, aber es ändert die Kostenrechnung.
3. **Der Hörvergleich selbst:** dieselben zehn echten Checklistensätze,
   einschließlich der schwierigen Fälle „APU", „Ng", „SAS 1 plus 2", gerendert
   mit jedem Kandidaten, im Klangprofil `Clean` und einmal als `Radio`.
4. **Männlich oder weiblich.** Für eine Cockpit-Anmutung ist das eine
   Produktentscheidung, keine technische; sie schränkt die Kandidaten aber
   deutlich ein.

## Vorläufige Neigung, ohne Bindung

Für den Fall, dass der Hörvergleich keinen klaren Sieger ergibt, ist Piper
`en_US-ljspeech-high` der konservative Weg — belegt lizenzsauber, und es ist die
nachweislich in genau diesem Anwendungsfall bewährte Modellklasse.

Ein eigenes Fine-Tuning ist realistisch, aber GPU-gebunden: laut
`piper1-gpl/docs/TRAINING.md` wurden die meisten Stimmen auf 24 bis 48 GB VRAM
trainiert, Nutzer berichten Erfolge ab 8 GB, und `en_US-bryce-medium` entstand
aus etwa 750 Aufnahmen. Wichtig dabei: Die GPL des Trainingscodes färbt **nicht**
auf eigene Gewichte ab — der **Basis-Checkpoint** färbt. Von
`en_US-lessac-medium` feingetunt bedeutet Blizzard-2013-Bedingungen und ist
damit ausgeschlossen.
