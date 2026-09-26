# Offene Lizenzpunkte für die GitHub-Veröffentlichung

Prüfgrundlage: 2026-09-21, Version 0.13.3, Commit `61fb91d`. Dies ist eine
Arbeitsliste für die Veröffentlichung, keine allgemeine Rechtsabhandlung.
Nur konkrete Befunde, nötige Nachweise und nächste Schritte hier halten;
erledigte Arbeit nicht als Prüfchronik fortschreiben.

Zuerst R1/R2 bearbeiten, danach Projektlizenz und Audio-Bedingungen (R3/R5)
entscheiden. Die Bewertung der Checklisten und Quellenexzerpte steht unter
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
Die paketbezogenen Quellen stehen im Inventar und in der Komponentenübersicht.
Zu beachten sind insbesondere:

- Avalonia, MicroCom und NAudio: MIT-Texte samt jeweiligen Rechteinhabern.
- Concentus: BSD-3-Clause mit mehreren Rechteinhabern; Concentus.Oggfile:
  MIT einschließlich NVorbis-/Andrew-Ward-Hinweisen.
- SkiaSharp/HarfBuzzSharp: Wrapper-Lizenzen **und** native
  `THIRD-PARTY-NOTICES.txt`; Avalonia ANGLE: Paketlizenz und eingebundene Teile.
- System.Numerics.Tensors: `LICENSE.TXT` und `THIRD-PARTY-NOTICES.TXT`.
- .NET: externer Runtimebedarf, aber mitgelieferter EXE-Apphost.

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
Die öffentliche Git-Historie muss dieselbe Abgrenzung einhalten.
`SimConnect.dll` wird bereits nicht mitgeliefert.

## R3 — Audio ist bezahlt erzeugt, aber noch nicht weiterlizenziert

Die versionierten Brian-Aufnahmen haben Herkunftsmetadaten, Prüfsummen und
den vom Betreiber bestätigten bezahlten Starter-Tarif. Free-Tier-Hörproben
gehören nicht zum ausgelieferten Bestand. TTS-Modelle und FFmpeg ebenfalls nicht.
Das Inventar erfasst auch eine ältere, weiterhin eingebettete Itemaufnahme,
die das aktuelle Manifest nicht mehr referenziert.

Die bisherigen Quellen stützen die Veröffentlichung bezahlter Ausgaben unter
Anbieterbedingungen, aber keine uneingeschränkte MIT-/CC0-Freigabe:
[EEA Terms](https://elevenlabs.io/terms-of-use-eu),
[API Terms](https://elevenlabs.io/elevenapi-terms),
[Veröffentlichungshinweise](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform),
[Use Policy](https://elevenlabs.io/use-policy).

**Nächster Schritt:** Empfängerrechte für Nutzung, Bearbeitung und Weitergabe
festlegen, einschließlich Forks und daraus gebauter Distributionen. Bleibt
dieser Umfang aus den Bedingungen unklar, gezielt Anbieterfreigabe einholen
oder eine anders lizenzierte Audioquelle wählen. Eine Anfrage ist nicht
versendet; [Audio-README](../assets/audio/README.md) und
[ADR 0008](adr/0008-stimme-und-tts-anbieter.md) erteilen noch keine solche Lizenz.

## R5 — Eigene Lizenz und Abgrenzung von Bildern

Die Projektlizenz und der Copyrightinhaber sind noch festzulegen. Bisheriger
Vorschlag ist [MIT](https://opensource.org/license/mit) für eigenen Code und
entsprechend zugeordnete eigene Inhalte, mit klarer Abgrenzung fremder SDK-Teile
und Audioassets. `UNLICENSED` bleibt bis zur Entscheidung bestehen.

Die Branding-Dateien enthalten projektbezogene Vektorformen und daraus
erzeugte Rasterbilder, keine eingebetteten fremden Bilder oder Schriftdateien.
Die erledigten QA-Screenshots werden nicht mehr für die Dokumentation benötigt
und sind aus dem aktuellen Baum entfernt. Das bereinigt **nicht** die Historie;
ihre etwaige öffentliche Weitergabe bleibt bei deren Auswahl zu beachten.

**Nächster Schritt:** Lizenzumfang und Rechteinhaber festlegen, Lizenztext
hinzufügen und die Veröffentlichungsentscheidung als Nachfolger von
[ADR 0001](adr/0001-lizenz-und-veroeffentlichungsstrategie.md) festhalten.
Ein gemischt lizenzierter Bestand darf nicht pauschal als vollständig MIT
bezeichnet werden; siehe [Open Source Definition](https://opensource.org/osd).

Weitere Veröffentlichungsarbeit steht im [Backlog](../BACKLOG.md).
