# ADR 0008: Stimme und TTS-Anbieter

- **Status:** Brian gewählt; Radio live gemäß ADR 0010; externe Asset-Lizenz noch offen
- **Datum:** 2026-08-26, Stimmenwahl und Lizenzprüfung am 2026-09-17
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

## Ergebnis des Hörvergleichs

Der Nutzer wählt am 2026-09-17 **ElevenLabs Brian** (H) als klaren Favoriten
für die Hauptstimme. Gewünscht ist eine männliche, natürliche, ruhige und
sachliche Stimme mit zügiger Aussprache. **ElevenLabs Sarah** (E) bleibt als
weibliche Alternative dokumentiert; daraus folgt noch keine zweite
ausgelieferte Stimme oder Stimmenauswahl in der App.

| Rolle | Stimme | Voice-ID | Vergleich |
| --- | --- | --- | --- |
| Hauptstimme | Brian — Deep, Resonant and Comforting | `nPczCjzI2devNBz1zQrb` | H |
| Weibliche Alternative | Sarah — Mature, Reassuring, Confident | `EXAVITQu4vr4xnSDxMaL` | E |

Beide sind amerikanisch-englische, von der API als `premade` geführte Stimmen.
Der Vergleich verwendete `eleven_multilingual_v2`, `stability: 0.75`,
`similarity_boost: 0.75`, `style: 0.0`, `use_speaker_boost: true`, `speed: 1.0`
und `seed: 9172026`. Ein Seed garantiert keine bitgenaue Reproduktion.
Jede der sieben Ansagen wurde einzeln erzeugt; die Klangprofile wurden aus
derselben Aufnahme abgeleitet und auf ungefähr −20 LUFS angeglichen.

Verglichen wurden kurze Abschlussansagen, buchstabierte Kürzel (APU, SAS,
Ng), Komponentennummern, Drehzahlen und eine längere bedingte Ansage aus den
kanonischen Checklistendaten. E und F (Eric) gefielen zunächst wegen ihrer
Natürlichkeit und zügigen Aussprache; F passte dem Nutzer aber nicht zum
Kontext. Im folgenden Vergleich mit Daniel (G), Brian (H) und Bill (I) gewann
H klar. Die lokalen Piper-/Kokoro-Kandidaten wurden nicht bevorzugt. Die
bisherige unverbindliche Piper-Neigung ist damit durch den Hörvergleich
aufgelöst, keine frühere akzeptierte Anbieterentscheidung wird ersetzt.

Die Hörproben entstanden im Free Tier und bleiben temporäre private
Vergleichsdateien. Sie sind keine zur Veröffentlichung freigegebenen Assets.
Am 2026-09-18 bestätigt der Nutzer den Radio-Klang als sehr gut, Intercom
überzeugt ihn nicht. Er wählt Clean mit einem zur Wiedergabe zuschaltbaren
Radioeffekt. [ADR 0010](0010-radioeffekt-bei-der-wiedergabe.md) ersetzt dafür
die ursprüngliche Planung vorgerenderter Profile. Intercom entfällt.

## Empfehlung für GitHub-Veröffentlichung und Tarif

**Die produktiven Brian-Ansagen in einem bezahlten Tarif neu erzeugen.**
Für den aktuellen Umfang ist Starter der empfohlene Einstieg: laut Preisliste
am 2026-09-17 monatlich 6 USD vor Steuern, 30.000 Credits und kommerzielle
Nutzung. Der gemessene Bestand umfasst rund 5.700 Textzeichen pro Stimme;
Der Radioeffekt entsteht lokal bei der Wiedergabe ohne erneute TTS-Anfragen.
Diese Empfehlung ist keine Beauftragung eines Kaufs.

Der Nutzer bestätigt am 2026-09-18 den Abschluss des Starter-Abos. Künftige
produktive Ansagen werden während dieses bezahlten Abos neu gerendert; die
vorher erzeugten Free-Tier-Hörproben werden nicht als Produktionsdateien
übernommen. Der Tarifwechsel allein verändert deren Lizenzstatus nicht.
Die erste produktive Brian-Datei für `Checklist completed` wurde am selben Tag
neu erzeugt. Das [Audio-Manifest](../../assets/audio/completion/manifest.json)
hält Herkunft und Renderrezept fest; der [Audio-Hinweis](../../assets/audio/README.md)
grenzt diese Assets von einer möglichen MIT-Lizenz des Codes ab.

Die Primärquellen unterscheiden:

- **Free:** nichtkommerzielle Veröffentlichung mit vorgeschriebenem
  Herkunftshinweis ist erlaubt. GitHub ist also nicht grundsätzlich verboten,
  die Dateien sind aber nicht frei unter MIT verwendbar. Ein späteres Upgrade
  lizenziert zuvor erzeugte Dateien nicht rückwirkend kommerziell.
- **Paid:** während des bezahlten Abos erzeugte TTS-Dateien dürfen unter den
  geltenden Bedingungen veröffentlicht und kommerziell genutzt werden; diese
  Nutzungsmöglichkeit bleibt nach Aboende bestehen. Die EEA-Bedingungen §4(a)
  erlauben die Nutzung heruntergeladener Outputs außerhalb des Dienstes;
  §4(c)(ii) belässt die Rechte daran grundsätzlich beim Nutzer.
- **Öffentliches Repository:** Daraus folgt unsere Einschätzung, dass die
  bezahlten TTS-Ansagen als Dateien dieses Projekts auf GitHub veröffentlicht
  werden können, sofern ihre eigenen Nutzungshinweise die ElevenLabs-Bedingungen
  berücksichtigen. Eine ausdrückliche GitHub-Sonderfreigabe steht dort nicht.
- **Keine pauschale MIT-Freigabe:** Die Prohibited Use Policy beschränkt auch
  Outputs, insbesondere KI-Training (§9(k/l)); §9(n) untersagt in den dort
  beschriebenen Weitergabekonstellationen großzügigere Endnutzerbedingungen.
  Ein bezahltes Abo beseitigt diese Einschränkungen nicht. Eine mögliche
  MIT-Lizenz des eigenen Codes muss diese Audioassets deshalb ausdrücklich
  ausnehmen. Die konkrete Asset-Lizenz bleibt vor Veröffentlichung festzulegen.

Das Verbot eigenständiger Sound-Sammlungen in §9(c) betrifft ausdrücklich das
Produkt **Sound Effects**, nicht pauschal unsere Text-to-Speech-Dateien.
Veröffentlicht werden fertige Ansagen, keine Stimmenmodelle oder API-Zugänge.
Soll das gesamte Repository einschließlich Audio uneingeschränkt unter MIT
stehen, reicht weder Free noch ein Standard-Bezahltarif als Nachweis; dafür
ist eine abweichende ausdrückliche Freigabe oder eine andere Audioquelle nötig.

Primärquellen, geprüft am 2026-09-17:

- [Veröffentlichung, Free/Paid und fortbestehende Nutzungsrechte](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform)
- [EEA Terms of Service, Stand 2026-03-31, §§1(c), 4(a/c)](https://elevenlabs.io/terms-of-use-eu)
- [Prohibited Use Policy, Stand 2026-08-17, §9](https://elevenlabs.io/use-policy)
- [ElevenAPI Terms, Stand 2026-08-24](https://elevenlabs.io/elevenapi-terms)
- [Tarife](https://elevenlabs.io/pricing)
