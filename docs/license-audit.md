# Offene Lizenzpunkte für die GitHub-Veröffentlichung

Prüfgrundlage: 2026-09-21, Version 0.13.3, Commit `61fb91d`. Dies ist eine
Arbeitsliste für die Veröffentlichung, keine allgemeine Rechtsabhandlung.
Nur konkrete Befunde, nötige Nachweise und nächste Schritte hier halten;
erledigte Arbeit nicht als Prüfchronik fortschreiben.

Die Bearbeitungsreihenfolge steht im [Backlog](../BACKLOG.md). Mit ⚠
markierte Befunde können Dateien auch aus der Git-Historie entfernen; das
geschieht gebündelt beim ersten GitHub-Push. Die Bewertung der Checklisten
und Quellenexzerpte steht unter
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

Die Sammelhinweise nativer Pakete belegen für sich nicht, welche Komponenten
im Windows-Binary enthalten sind. Relevante Lizenzoptionen und etwaige
Quellcodepflichten am Paketquellstand zuordnen; eine Suche nach „GPL“ reicht
nicht. Konkrete Buildquellen:
[SkiaSharp Windows-Build](https://github.com/mono/SkiaSharp/blob/f568ac94dd768ef9a2f593537cfde2dd0d348ef5/native/windows/build.cake),
[Skia-Optionen](https://github.com/mono/skia/blob/7dbfc07dd33181f84e0958afb7ee805c6c769f0b/gn/skia.gni).

## R2 — SDK-Nachweise und MIT-Angaben reichen noch nicht

`@microsoft/msfs-sdk` 2.1.1 deklariert MIT ohne mitgelieferten Volltext.
Die bisher verlinkte
[Microsoft-Lizenz](https://github.com/microsoft/msfs-avionics-mirror/blob/366be5056166c639a2189e09e5af7143174fd910/LICENSE)
hat eine MSFS-Nutzungsbeschränkung. Auch für `@microsoft/msfs-types` 1.14.6,
`@efb/efb-api` 1.0.3 und übernommene Template-Teile fehlen versionsbezogene
Volltexte/Attributionen. Die
[SDK-EULA](https://docs.flightsimulator.com/msfs2024/html/1_Introduction/SDK_EULA.htm)
gibt nicht pauschal alle Samples oder SDK-Kopien frei.

**Nächster Schritt:** Konkrete Lizenztexte und Copyrightzuordnung sichern
oder die vorgesehene Weitergabe bestätigen lassen. Ungeklärte SDK-Kopien
könnten stattdessen lokal aus einer SDK-Installation bezogen werden; für die
gebündelte EFB-API bleibt die Distributionsfrage dann separat zu lösen.
⚠ Die öffentliche Git-Historie muss dieselbe Abgrenzung einhalten.
`SimConnect.dll` liefert das Companion-Setup gemäß
[ADR 0012](adr/0012-veroeffentlichung-als-zip-und-companion-setup.md) mit;
Hinweis in der [Komponentenübersicht](third-party-licenses.md).

Weitere Veröffentlichungsarbeit steht im [Backlog](../BACKLOG.md).
