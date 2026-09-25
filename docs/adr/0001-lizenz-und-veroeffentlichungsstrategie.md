# ADR 0001: Lizenz- und Veröffentlichungsstrategie

Status: Akzeptiert (2026-08-26); gilt bis zur ausdrücklichen
Veröffentlichungs- und Lizenzentscheidung.

## Entscheidung und Grund

Bis zur Rechteklärung bleibt das Projekt privat und der eigene Code
`UNLICENSED`. Abhängigkeiten sollen eine spätere Veröffentlichung ermöglichen:
permissive Bausteine bevorzugen, Copyleft im Auslieferungsumfang vermeiden,
aber nicht um jeden Preis. Reine Entwicklungswerkzeuge werden getrennt
bewertet. Paketmanager-Labels ersetzen keine Prüfung der Primärquelle.

## Konsequenzen

- Nachweise stehen in [third-party-licenses.md](../third-party-licenses.md),
  konkrete offene Veröffentlichungsfragen in [license-audit.md](../license-audit.md).
- TTS-Modelle und Phonemizer werden gemäß [ADR 0006](0006-tts-vorab-synthese.md)
  nicht ausgeliefert. Audio benötigt trotzdem eigene Weitergaberechte.
- Bisher ausgeschlossen: `sherpa-onnx` in der Auslieferung wegen des
  GPL-Phonemizers, Lessac-basierte Piper-Stimmen wegen beschränkter
  TTS-/Derivatrechte, `msfs-simconnect-api-wrapper` wegen nichtkommerzieller
  Bedingungen und DECtalk ohne gesonderte Lizenz. Die damaligen Quellen stehen
  in Git; eine erneute Auswahl erfordert eine neue konkrete Rechteprüfung.
- Die öffentliche Lizenzentscheidung ersetzt dieses ADR; sie muss eigenen
  Code, fremde SDK-Teile und Audio eindeutig abgrenzen.
