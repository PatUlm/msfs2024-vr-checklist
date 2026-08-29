# ADR 0006: Sprachausgabe als Vorab-Synthese

- **Status:** Akzeptiert — wirksam in Phase 3
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3

## Kontext

Die Checklistentexte sind statisch. Echtzeit-TTS in der Begleit-App würde
zusätzliche CPU-Last, erst im Flug auffallende Aussprachefehler und ein
auszulieferndes Modell samt Phonemizer verursachen. Gerade der Phonemizer kann
außerdem Copyleft-Bedingungen in die Auslieferung bringen.

## Entscheidung

Alle Ansagen werden vorab als Entwicklerschritt gerendert. Ausgeliefert werden
nur die fertigen Audiodateien; die Begleit-App enthält weder TTS-Modell noch
Phonemizer und synthetisiert zur Laufzeit nichts.

## Begründung

- Während des Flugs entstehen keine TTS-Last und keine Netzwerkabhängigkeit.
- Jede Aussprache kann vor der Auslieferung mit den echten Checklistentexten
  geprüft und bei Bedarf über das `speech`-Feld korrigiert werden.
- Modell- und Phonemizerlizenzen betreffen das Entwicklungswerkzeug, nicht die
  ausgelieferte Begleit-App.
- Lokale Modelle und Cloud-Anbieter können nach Qualität und
  Weitergaberechten verglichen werden, ohne die Offline-Anforderung zu ändern.

## Konsequenzen

- Text-, Stimmen- oder Profiländerungen erfordern ein gezieltes Neu-Rendern.
  Dateinamen enthalten dafür einen Hash über Text, Stimme und Klangprofil.
- `Clean`, `Intercom` und `Radio` werden offline vorbereitet; ihre konkreten
  Filterparameter werden beim Hörvergleich in Phase 3 entschieden.
- Stimme und Anbieter bleiben Gegenstand von
  [ADR 0008](0008-stimme-und-tts-anbieter.md).
- Die Ablage der Audiodateien regelt
  [ADR 0007](0007-ablage-der-gerenderten-audiodateien.md).

## Verworfene Alternativen

- **Echtzeit-Synthese:** unnötige Laufzeit- und Lizenzlast für statische Texte.
- **Cache plus Echtzeit-Fallback:** vereint die Komplexität beider Wege und
  bringt Modell und Phonemizer zurück in die Auslieferung.
