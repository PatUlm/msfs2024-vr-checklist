# Architekturentscheidungen

ADRs halten nur Entscheidungen fest, deren Grund bei einer späteren Änderung
noch hilft: Problem, gewählter Weg, wesentliche Konsequenz. In der Regel
reichen 15–35 Zeilen. Keine Recherchetagebücher, Testchroniken, Codeabschriften
oder abgeschlossenen Phasenpläne. Technische MSFS-Fakten stehen in der
[SDK-Referenz](../msfs-sdk-reference.md), ausstehende Tests in
[open-tests.md](../open-tests.md).

Eine inhaltliche Kehrtwende erhält ein neues ADR mit Verweis auf das ersetzte.
Redaktionelle Kürzungen brauchen kein neues ADR. Erledigte reine
Ablaufplanung kann entfallen; IDs werden nicht neu vergeben oder umnummeriert.

| ADR | Entscheidung | Status |
| --- | --- | --- |
| [0001](0001-lizenz-und-veroeffentlichungsstrategie.md) | Lizenzwahl und Weitergabe | Bis zur Veröffentlichungsentscheidung gültig |
| [0002](0002-bestaetigungseingabe-in-sim-key-interception.md) | Bestätigung direkt in der EFB | Akzeptiert; öffentliche Eventwahl offen |
| [0003](0003-transportkanal-commbus-ueber-simconnect.md) | CommBus über SimConnect | Akzeptiert |
| [0004](0004-stack-der-begleit-app.md) | .NET 10 und Avalonia | Akzeptiert |
| [0006](0006-tts-vorab-synthese.md) | Vorab-Synthese | Akzeptiert; Klangvarianten durch 0010 ersetzt |
| [0007](0007-ablage-der-gerenderten-audiodateien.md) | Opus-Dateien im Repository | Akzeptiert; Klangvarianten durch 0010 ersetzt |
| [0008](0008-stimme-und-tts-anbieter.md) | ElevenLabs Brian | Stimme gewählt; Asset-Lizenz offen |
| [0009](0009-fortschritt-ueber-efb-kontextwechsel.md) | Fortschritt über Kontextwechsel | Akzeptiert |
| [0010](0010-radioeffekt-bei-der-wiedergabe.md) | Radioeffekt live | Akzeptiert |
