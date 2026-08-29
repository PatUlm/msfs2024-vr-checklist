# ADR 0008: Stimme und TTS-Anbieter

- **Status:** Offen — vor der Erzeugung der produktiven Sprachassets zu entscheiden
- **Datum:** 2026-08-26, Entscheidungszeitpunkt präzisiert am 2026-08-29
- **Betrifft:** Phase 3

## Kontext

Die Qualitätswahl ist eine Hör- und Rechtefrage, keine reine Modellrangliste.
Für die kurzen Cockpitansagen zählen verständliche Aussprache, konsistente
Stimme und die ausdrückliche Erlaubnis, erzeugte Audiodateien als Teil des
Produkts weiterzugeben. Durch die Vorab-Synthese aus
[ADR 0006](0006-tts-vorab-synthese.md) sind Laufzeitgröße und
Inferenzgeschwindigkeit keine Auswahlkriterien.

Die Entscheidung ist kein Startkriterium für Phase 3. Transport,
Zustandsanzeige und der einmalige Abschlussimpuls werden zuerst mit einer
selbst erstellten Dummy-Audiodatei nachgewiesen. Stimme und Anbieter müssen erst
feststehen, bevor die produktiven Ansagen gerendert werden.

## Entscheidungskriterien

Vor der Entscheidung müssen:

1. die Weitergaberechte für die erzeugten Audiodateien geprüft sein;
2. dieselben repräsentativen Checklistensätze mit allen Kandidaten gerendert
   und blind verglichen werden;
3. schwierige Begriffe wie `APU`, `Ng` und `SAS 1 plus 2` verständlich sein;
4. die Profile `Clean` und `Radio` im Vergleich gehört werden;
5. Geschlecht und Cockpit-Anmutung als Produktentscheidung festgelegt werden.

## Shortlist

- **Piper `en_US-ljspeech-high`:** konservativer lokaler Kandidat mit
  unkritischer Datensatzlizenz; benötigt den Phonemizer nur beim Rendern.
- **Kokoro-82M `af_heart`:** kleiner offen lizenzierter Kandidat ohne
  ausgelieferten Phonemizer.
- **Cloud-Anbieter:** zulässig, wenn Weitergabe der erzeugten Dateien erlaubt
  ist; Zugangsdaten und Netzwerkzugriff bleiben reine Entwicklungsbelange.
- **WinRT `SpeechSynthesizer`:** einfache lokale Vergleichsbasis und Fallback.

Modelle mit unklaren Weitergaberechten, nichtkommerziellen Bedingungen oder
praktischem Bedarf an einer dedizierten GPU sind ausgeschlossen.

## Vorläufige Neigung

Wenn der Hörvergleich keinen klaren Sieger ergibt, ist Piper
`en_US-ljspeech-high` der konservative Standard. Diese Neigung ist keine
Entscheidung und wird vor der Umsetzung der produktiven Audioausbaustufe nicht
weiter dokumentarisch verfeinert.
