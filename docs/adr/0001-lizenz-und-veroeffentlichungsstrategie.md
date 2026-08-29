# ADR 0001: Lizenz- und Veröffentlichungsstrategie

- **Status:** Akzeptiert
- **Datum:** 2026-08-26
- **Betrifft:** Phase 2, Phase 3 und jede künftige Abhängigkeitswahl

## Kontext

Das Repository ist privat und hat keine `LICENSE`-Datei. Solange nichts
verteilt wird, sind Copyleft-Fragen theoretisch. Sie werden real, sobald das
MSFS-Paket samt Begleit-App weitergegeben wird, etwa über flightsim.to.

Die Recherche hat gezeigt, dass diese Frage nicht am Ende steht, sondern am
Anfang: Sie entscheidet über die Auswahl der TTS-Modelle, der Stimmen und
einiger Bibliotheken. Mehrere naheliegende Bausteine sind nicht das, was ihr
Etikett verspricht — [`sherpa-onnx`](https://github.com/k2-fsa/sherpa-onnx/blob/master/CMakeLists.txt)
deklariert Apache-2.0, bindet für TTS aber
[`espeak-ng`](https://github.com/espeak-ng/espeak-ng/blob/master/COPYING) unter
GPL-3.0 ein; [`rhasspy/piper-voices`](https://huggingface.co/rhasspy/piper-voices)
trägt den Tag `license: mit`, während einzelne Stimmen eigene Datensatzlizenzen
haben; `msfs-simconnect-api-wrapper` deklariert auf npm CC0 und erlaubt in
seiner
[`LICENSE.md`](https://github.com/Pomax/msfs-simconnect-api-wrapper/blob/master/LICENSE.md)
nur nicht-kommerzielle Nutzung.

Eine Entscheidung war also nötig, bevor irgendeine Abhängigkeit gewählt wird.

## Entscheidung

Das Projekt bleibt **vorerst privat, die Option auf eine Veröffentlichung bleibt
offen**. Daraus folgt als Auswahlregel:

1. Permissiv lizenzierte Bausteine werden bevorzugt, wo sie nichts Wesentliches
   kosten.
2. Copyleft im **Auslieferungsumfang** wird vermieden — aber nicht um jeden
   Preis, wenn eine Copyleft-Komponente die klar bessere Lösung ist.
3. Copyleft-Werkzeuge in der **Entwicklung** sind unbedenklich, solange sie
   nicht ausgeliefert werden.
4. Die Lizenz jeder Abhängigkeit wird an der Quelle geprüft und dokumentiert,
   nicht aus dem Paketmanager-Feld übernommen.

Der aktuelle Nachweis für direkte Abhängigkeiten und ausgelieferte
Drittkomponenten steht in
[`../third-party-licenses.md`](../third-party-licenses.md).

## Begründung

Eine frühe Festlegung auf „Veröffentlichung" würde die Stimmenauswahl auf zwei
Kandidaten verengen und `sherpa-onnx` als bequemsten .NET-Weg ausschließen,
ohne dass eine Veröffentlichung überhaupt beschlossen ist. Eine Festlegung auf
„bleibt privat" würde umgekehrt Abhängigkeiten einladen, die eine spätere
Veröffentlichung teuer machen.

Die in [ADR 0006](0006-tts-vorab-synthese.md) beschlossene Vorab-Synthese hält
die Tür ohnehin offen: Wenn weder Modell noch Phonemizer ausgeliefert werden,
entfällt die schwierigste Copyleft-Frage von selbst. Damit kostet die offene
Haltung praktisch nichts.

## Verworfene Alternativen

- **Veröffentlichung als festes Ziel.** Hätte bedeutet: keine GPL-Komponente im
  Paket, keine NC-Stimmen. Praktisch bleiben dann nur Piper
  `en_US-ljspeech-high` (Datensatz public domain) oder Kokoro (Apache-2.0), und
  `sherpa-onnx` fällt aus. Verworfen, weil die Einschränkung einer Entscheidung
  vorgreift, die noch nicht getroffen ist.
- **Rein privat, ohne Veröffentlichungsabsicht.** Hätte Copyleft und
  NC-Lizenzen gegenstandslos gemacht und jede Piper-Stimme erlaubt. Verworfen,
  weil eine spätere Veröffentlichung dann einen Rückbau erzwingen würde.

## Konsequenzen

- `sherpa-onnx` ist als **Auslieferungsbestandteil ausgeschlossen**, als
  Entwicklerwerkzeug beim Vorab-Rendern erlaubt.
- Von `en_US-lessac-medium` abgeleitete Piper-Stimmen sind ausgeschlossen; die
  im
  [Modellnachweis](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD)
  verlinkte Blizzard-2013-Lizenz verbietet ausdrücklich
  Sprachsynthese-Produkte und die Weitergabe von Derivaten. Das betrifft auch
  nominell CC-BY-Stimmen, die von Lessac feingetunt wurden.
- `msfs-simconnect-api-wrapper` ist ausgeschlossen.
- Eine `LICENSE`-Datei wird noch nicht angelegt. Die Lizenzen der verwendeten
  Dritt-Komponenten werden aber ab jetzt mitgeführt, damit eine Veröffentlichung
  keine Nachrecherche auslöst.
- Solange keine Projektlizenz beschlossen ist, trägt das eigene npm-Paket
  `license: UNLICENSED` und `private: true`. Die Lizenzangaben der kopierten
  Microsoft-/Asobo-Komponenten bleiben davon unberührt.
- DECtalk ist unabhängig von dieser Entscheidung ausgeschlossen: Der
  veröffentlichte
  [`LICENCE`-Text](https://github.com/dectalk/dectalk/blob/develop/LICENCE)
  enthält **keine Lizenzerteilung**, sondern verlangt eine gesonderte gültige
  Lizenz des Rechteinhabers.
