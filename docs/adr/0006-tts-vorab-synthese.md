# ADR 0006: Sprachausgabe als Vorab-Synthese mit Cache

- **Status:** Akzeptiert — wirksam in Phase 3
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3
- **Grundlage:** [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitte 3.2 bis 3.6

## Kontext

Die Checklisten sollen vorgelesen werden. Die naheliegende Bauform ist
Echtzeit-Synthese in der Begleit-App: Text rein, Audio raus. Das bringt aber
drei Kosten mit — CPU-Last neben MSFS, Aussprachefehler, die erst im Flug
auffallen, und ein ausgeliefertes Modell samt Phonemizer.

Der letzte Punkt ist der schwerste. Die Recherche hat gezeigt, dass **espeak-ng
(GPL-3.0-or-later, ohne Linking Exception) durch fast das ganze Feld zieht**:
`piper1-gpl` bettet es ein und ist deshalb selbst GPL-3.0, Kokoros
OOV-Fallback nutzt einen GPL-Phonemizer, und `sherpa-onnx` deklariert
Apache-2.0, hat `SHERPA_ONNX_ENABLE_TTS` aber per Default an und zieht
espeak-ng per FetchContent hinein — ein TTS-fähiges Binary, auch das
NuGet-Paket, enthält damit GPL-3.0-Code, ohne dass das Projekt diese Konsequenz
dokumentiert.

Gleichzeitig ist die Datenlage im Repository günstig: **125 `challenge`-Einträge
über vier Flugzeuge, alle Texte statisch** (`challenge`, `response`,
`alternatives`, optionaler `speech`-Override), keine dynamischen Werte.

## Entscheidung

Die Ansagen werden **vorab gerendert und als Cache abgelegt**, nicht zur
Laufzeit synthetisiert. Das Rendern ist ein Entwicklerschritt; ausgeliefert
werden nur Audiodateien.

Rund 140 Ansagen à etwa 2 Sekunden sind etwa 5 Minuten Audio — als Opus mit
32 kbit/s etwa 1,2 MB pro Klangprofil.

## Begründung

- **Die Modellwahl wird von der Laufzeitperformance entkoppelt.** Beim Rendern
  darf das Modell einen RTF von 5 haben; MSFS läuft dann nicht.
- **Null CPU-Last und null Latenz zur Flugzeit** — genau die Projektregel gegen
  unnötige Arbeit pro Frame.
- **Die Aussprache ist einmalig verifizierbar.** Jede Ansage kann abgehört und
  per `speech`-Override oder IPA korrigiert werden, statt auf ein Laufzeit-G2P
  zu hoffen. Für „APU", „Ng" und „SAS 1 plus 2" ist das der entscheidende
  Punkt, und es ist genau das, was BeyondATC mit einem vorgeschalteten Lexikon
  löst.
- **Weder Modell noch Phonemizer werden ausgeliefert.** Damit verschwindet die
  gesamte Copyleft-Frage aus der Begleit-App und
  [ADR 0001](0001-lizenz-und-veroeffentlichungsstrategie.md) bleibt praktisch
  kostenlos.
- Als Nebenwirkung wird die Anbieterfrage offener: Weil das Rendern beim
  Entwickler stattfindet, verletzt auch ein Cloud-Anbieter die
  Offline-Anforderung der App nicht. Siehe
  [ADR 0008](0008-stimme-und-tts-anbieter.md).

## Verworfene Alternativen

- **Echtzeit-Synthese.** Flexibel für spätere dynamische Texte, etwa Werte aus
  dem Sim. Verworfen wegen der drei Kosten oben; der ausschlaggebende Punkt ist
  das ausgelieferte Modell mit seiner Lizenzlast.
- **Mischform aus Cache und Echtzeitpfad für unbekannte Texte.** Robust, aber
  sie trägt beide Kostenseiten — insbesondere holt sie das Modell zurück in die
  Auslieferung und macht damit den Hauptvorteil zunichte.

## Konsequenzen

- Ein Stimmwechsel bedeutet **Neu-Rendern**. Das ist bei 140 Ansagen
  unproblematisch, gehört aber als Werkzeug automatisiert.
- Textänderungen brauchen **Cache-Invalidierung**. Der Dateiname wird aus einem
  Hash über den `speech`-Text, die Stimme und das Klangprofil gebildet; damit
  löst sich das von selbst.
- Das Rendern wird ein `task`-Ziel. Es darf GPL-Werkzeuge verwenden, weil sie
  nicht ausgeliefert werden — `sherpa-onnx` oder `piper1-gpl` sind hier also
  erlaubt.
- Die Funk- und Intercom-Profile werden ebenfalls vorab gerechnet: drei
  Varianten pro Ansage kosten etwa 3,6 MB. Die Filterkette kann damit offline
  laufen, statt zur Flugzeit.
- Als garantierter Fallback ohne jede Abhängigkeit bleibt die WinRT-Sprachausgabe
  (`Windows.Media.SpeechSynthesis`) verfügbar — qualitativ unter Piper `high`,
  aber mit der besten dokumentierten Aussprachekontrolle im Feld, weil SSML 1.1
  mit `<phoneme alphabet="ipa">` unterstützt ist. Sie stellt sicher, dass eine
  fehlende Cache-Datei den Checklistenablauf nie blockiert.

## Folgeentscheidungen

- Stimme und Anbieter: [ADR 0008](0008-stimme-und-tts-anbieter.md), noch offen.
- Ablage der Dateien: [ADR 0007](0007-ablage-der-gerenderten-audiodateien.md).
- Die konkreten Filterparameter für Funk und Intercom stehen in
  [`../phase-2-3-research.md`](../phase-2-3-research.md), Abschnitt 4; sie werden
  beim Bau der Kette in Phase 3 entschieden.
