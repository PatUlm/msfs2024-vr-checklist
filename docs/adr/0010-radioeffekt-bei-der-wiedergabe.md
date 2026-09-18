# ADR 0010: Radioeffekt bei der Wiedergabe

- **Status:** Akzeptiert — Nutzerentscheidung vom 2026-09-18
- **Betrifft:** Phase 3, Audioausgabe der Begleit-App
- **Ersetzt teilweise:** ADR 0006 und ADR 0007 hinsichtlich vorgerenderter
  Klangvarianten; Vorab-TTS, Opus und Ablage im Repository bleiben bestehen

## Kontext

Im Hörvergleich gefällt dem Nutzer Radio sehr gut, Intercom nicht. Gewünscht
ist ausdrücklich ein Radio-Ein/Aus-Schalter, der den Effekt on-the-fly bei der
Ausgabe anwendet. Eine zweite TTS-Anfrage wäre auch bei vorgerenderten
Filtervarianten nicht nötig, wohl aber eine zweite ausgelieferte Audiodatei.

## Entscheidung

- Pro Ansage wird genau eine Clean-Datei vorab synthetisiert und als Opus
  ausgeliefert. ElevenLabs bleibt ein reines Entwicklungswerkzeug.
- `Radio effect` in Settings schaltet die lokale Signalverarbeitung im
  Companion ein oder aus. Aus bedeutet Clean; Intercom entfällt.
- Radio ist zunächst eingeschaltet, auch bei bestehenden Einstellungen ohne
  diesen Eintrag. Die Auswahl wird gemeinsam mit dem Ausgabegerät gespeichert.
- Der Schalter bleibt während `Test sound` bedienbar und wirkt beim nächsten
  angeforderten Audiopuffer auf die laufende Ansage. Ein 10-ms-Übergang mischt
  zwischen Clean und Radio. Bereits an Windows übergebene Samples sind nicht
  rückwirkend veränderbar.
- Filterarbeit entsteht ausschließlich beim Lesen eines aktiven Audiostreams
  im Companion, vor der Mono-zu-Stereo-Umsetzung. Keine Timer, keine Arbeit im
  EFB-Frame und kein dauerhaft offener Audiostream werden dafür eingeführt.
- Der Filter nutzt die vorhandene NAudio-Abhängigkeit: Hochpass 300 Hz,
  Tiefpass 3 kHz, Kompression 3:1 mit 5-ms-Attack/80-ms-Release, weiche
  Sättigung und abschließender Tiefpass 3,3 kHz. Kein Rauschen oder Funkklick.
  Das orientiert sich am bevorzugten Hörprofil, ist wegen Streaming-Kompression
  und fester Pegelkompensation aber nicht bitgleich zur FFmpeg-Hörprobe mit
  nachträglicher Lautheitsnormalisierung.

## Konsequenzen

- Klangänderungen brauchen keinen erneuten ElevenLabs-Aufruf und keine
  duplizierten Assets. Der Dateihash identifiziert die Clean-Synthese und ihre
  Kodierung; Live-Filterparameter gehören zum Anwendungscode.
- Neue Ansagen starten mit eigenem Filterzustand. Clean umgeht den Filter
  unverändert; das Abschalten blendet kurz zum unveränderten Signal zurück.
- Der erste kleine Umsetzungsschritt betrifft die Gruppenabschlussansage und
  `Test sound`. Die itemweise Sprachausgabe bleibt ein eigenes Inkrement.
- Die echten Filterausgaben werden lokal auf Frequenzgang, Puffergrenzen,
  Streaming-Konsistenz, Umschaltung und Übersteuerung geprüft. Die
  Audioqualität gilt unabhängig vom Ausgabegerät; separate Headset- oder
  In-Ear-Abnahmen sind nicht erforderlich.

## Verworfene Alternativen

- Vorgerenderte Clean-/Radio-Dateipaare: entgegen der gewünschten
  Live-Umschaltung und unnötiger zusätzlicher Assetbestand.
- Echtzeit-TTS oder Cloudzugriff aus der Companion-App: für den lokalen
  Radioeffekt nicht erforderlich und weiterhin ausgeschlossen.
