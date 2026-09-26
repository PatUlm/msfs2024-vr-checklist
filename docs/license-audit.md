# Offene Lizenzpunkte für die GitHub-Veröffentlichung

Prüfgrundlage: 2026-09-21, Version 0.13.3, Commit `61fb91d`. Dies ist eine
Arbeitsliste für die Veröffentlichung, keine allgemeine Rechtsabhandlung.
Nur konkrete Befunde, nötige Nachweise und nächste Schritte hier halten;
erledigte Arbeit nicht als Prüfchronik fortschreiben.

Die Bearbeitungsreihenfolge steht im [Backlog](../BACKLOG.md). Die Bewertung
der Checklisten und Quellenexzerpte steht unter
[Herkunft und Prüfung](checklist-license-review.md).

Die redaktionelle Kürzung ändert die bisherigen Bewertungen nicht. Das
[Inventar](license-audit-inventory.json) bewahrt die versionsbezogenen Quellen
und Prüfsummen für die noch offenen Punkte. Es ist eine Momentaufnahme,
keine aktuelle Dateiliste und keine vollständige Stückliste statisch
gebundener nativer Komponenten. Betroffene Nachweise bei Änderungen an
Abhängigkeiten, SDK oder Assets aktualisieren; keine neue Vollprüfung allein
wegen eines Dokumentations- oder Versionswechsels.

## R1 — Lizenztexte fehlen in der Distribution

Der Companion liefert bislang nur die [Komponentenübersicht](third-party-licenses.md)
als `THIRD-PARTY-NOTICES.md`, keine vollständigen Copyright-/Lizenztexte.
Repository-relative Links funktionieren im alleinstehenden Release nicht;
das EFB-Paket hat keine gesonderte Lizenzdatei.

**Nächster Schritt:** Originalhinweise offline lesbar in Repository und
betroffenen Release-Artefakten mitführen und ihre Mitlieferung prüfen.
Die eigene [LICENSE](../LICENSE) gehört ebenso in beide Artefakte, die
[Audiobedingungen](../assets/audio/LICENSE) ins Companion-Setup.
Die paketbezogenen Quellen stehen im Inventar und in der Komponentenübersicht.
Zu beachten sind insbesondere:

- Avalonia, MicroCom und NAudio: MIT-Texte samt jeweiligen Rechteinhabern.
- Concentus: BSD-3-Clause mit mehreren Rechteinhabern; Concentus.Oggfile:
  MIT einschließlich NVorbis-/Andrew-Ward-Hinweisen.
- SkiaSharp/HarfBuzzSharp: Wrapper-Lizenzen **und** native
  `THIRD-PARTY-NOTICES.txt`; Avalonia ANGLE: Paketlizenz und eingebundene Teile.
- System.Numerics.Tensors: `LICENSE.TXT` und `THIRD-PARTY-NOTICES.TXT`.
- .NET-Runtime 10.0.10, self-contained im Companion-Setup: `LICENSE.TXT` und
  `THIRD-PARTY-NOTICES.TXT` des Runtime-Packs.
- Velopack: MIT-Text; die Rust-Stubs `Update.exe` und Setup binden weitere
  Crates statisch ein, deren Hinweispflicht noch zuzuordnen ist.
- `@efb/efb-api` 1.0.3, im EFB-ZIP gebündelt: nur MIT-Deklaration von Asobo
  Studio ohne Lizenztext oder Copyright-Zeile; MIT-Text mit dieser
  Herkunftsangabe ins EFB-ZIP aufnehmen.

Die Sammelhinweise nativer Pakete belegen für sich nicht, welche Komponenten
im Windows-Binary enthalten sind. Relevante Lizenzoptionen und etwaige
Quellcodepflichten am Paketquellstand zuordnen; eine Suche nach „GPL“ reicht
nicht. Konkrete Buildquellen:
[SkiaSharp Windows-Build](https://github.com/mono/SkiaSharp/blob/f568ac94dd768ef9a2f593537cfde2dd0d348ef5/native/windows/build.cake),
[Skia-Optionen](https://github.com/mono/skia/blob/7dbfc07dd33181f84e0958afb7ee805c6c769f0b/gn/skia.gni).

Weitere Veröffentlichungsarbeit steht im [Backlog](../BACKLOG.md).
