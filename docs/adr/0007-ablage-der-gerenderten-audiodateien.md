# ADR 0007: Gerenderte Audiodateien liegen im Repository

- **Status:** Akzeptiert — wirksam in Phase 3
- **Datum:** 2026-08-26
- **Betrifft:** Phase 3 und die Repository-Regeln
- **Grundlage:** [ADR 0006](0006-tts-vorab-synthese.md)

## Kontext

Aus [ADR 0006](0006-tts-vorab-synthese.md) folgt, dass es gerenderte
Audiodateien gibt — etwa 140 Ansagen, rund 1,2 MB als Opus pro Klangprofil,
etwa 3,6 MB für alle drei Profile. Die Frage ist, wo sie liegen.

Das berührt eine bestehende Repository-Regel: `node_modules/`, `dist/`,
`Packages/`, `PackagesMetadata/` und `_PackageInt/` sind generiert und werden
nicht versioniert. Gerenderte Audiodateien sind formal auch generiert.

## Entscheidung

Die gerenderten Audiodateien liegen **im Repository unter `assets/`**. Das ist
eine bewusste, ausdrücklich zu dokumentierende Ausnahme von der Regel für
generierte Dateien.

## Begründung

- **Jeder Klon ist sofort vollständig.** Niemand braucht Modell, Phonemizer oder
  einen Cloud-Zugang, um das Projekt zu bauen oder zu deployen.
- **Die Auslieferung enthält garantiert keine Copyleft-Komponente**, weil das
  Renderwerkzeug nie Teil der Auslieferung wird. Das ist der eigentliche Zweck
  der Vorab-Synthese.
- Die Größenordnung ist unkritisch: einige Megabyte, einmalig, danach nur noch
  Änderungen einzelner Dateien.
- Die Dateien sind eher **Asset als Build-Ausgabe**. `dist/` und `Packages/`
  entstehen bei jedem Build neu und sind aus dem Quellstand jederzeit
  reproduzierbar; die Audiodateien sind es nur mit zusätzlichen Werkzeugen und
  gegebenenfalls einem Cloud-Konto. Damit gehören sie näher zu
  `assets/branding/` als zu `dist/`.

## Verworfene Alternativen

- **Nur das Renderwerkzeug im Repository, Audio als Release-Artefakt.** Hält das
  Repository frei von Binärdateien und bleibt streng bei der bestehenden Regel.
  Verworfen, weil dann jeder, der neu rendert, Modell und Phonemizer lokal
  braucht und die Auslieferung an einem zusätzlichen Schritt hängt.
- **Beim ersten Start der Begleit-App rendern.** Kein Binärballast, und der
  Nutzer könnte die Stimme selbst wechseln. Verworfen, weil genau das Modell und
  Phonemizer zurück in die Auslieferung holt — und damit die Copyleft-Frage, die
  [ADR 0006](0006-tts-vorab-synthese.md) gerade löst.

## Konsequenzen

- Die Ausnahme wird in `AGENTS.md` bei der Regel zu generierten Dateien
  ausdrücklich benannt, damit sie nicht als Versehen gelesen wird.
- Dateinamen tragen einen Hash über `speech`-Text, Stimme und Klangprofil, damit
  eine Textänderung die betroffene Datei sichtbar invalidiert und der Diff
  erkennbar bleibt.
- Das Renderwerkzeug wird als `task`-Ziel geführt und schreibt ausschließlich
  nach `assets/`. Es läuft nicht als Teil von `task build` oder `task deploy`.
- Sollte der Umfang später deutlich wachsen — etwa viele Flugzeuge, mehrere
  Stimmen, mehrere Sprachen —, ist diese Entscheidung neu zu bewerten.
