# Lizenzprüfung für Release 1.0.0

**Prüfstand: 2026-09-21, Version 0.13.3, Commit `61fb91d`.**
Die Bestandsaufnahme und Quellenprüfung sind durchgeführt. Eine Freigabe zur
öffentlichen Weitergabe ergibt sich daraus noch nicht: Lizenztexte fehlen,
einige Rechte sind nicht hinreichend belegt und die Projekt- sowie
Audioasset-Lizenz sind noch nicht beschlossen.

Der Benutzer erwartet bis 1.0.0 keine neuen Features. Dieser Bericht verwendet
deshalb 0.13.3 als Prüfgrundlage, ohne damit spätere Änderungen auszuschließen.
Änderungen an Abhängigkeiten, SDK-Kopien, Checklisten, Audio oder anderen Assets
erfordern vor 1.0.0 einen erneuten Abgleich der betroffenen Bestandteile.

## Umfang und Nachweise

Geprüft wurden der versionierte Dateibestand, alle drei NuGet-Lockfiles, das
npm-Lockfile, die lokal verfügbaren Paketlizenzen, die Original-NuGet-Pakete
der gelockten Versionen, Quellenlizenzen, die installierte SDK-EULA,
Checklistendaten und ihre dokumentierte Herkunft,
Audiometadaten und das tatsächlich gebaute Release 0.13.3.

Das [maschinenlesbare Inventar](license-audit-inventory.json) hält Versionen,
Prüfsummen, Quellen, Nachweistiefe und die Zuordnung zum Release fest:

- 156 versionierte npm-Paketeinträge, zusätzlich die lokale EFB-API-Verknüpfung.
  54 optionale Plattformpakete sind lokal nicht installiert; für sie ist nur
  die Lockfile-Deklaration erfasst. Das ist keine Prüfung ihrer Binärinhalte.
- 24 NuGet-Pakete; 17 liefern tatsächlich Dateien zum Windows-Release.
  `Avalonia.BuildServices` ist ein Buildwerkzeug; sechs NativeAssets-Pakete
  für Linux, macOS und WebAssembly werden nicht ausgeliefert.
- 42 Release-Dateien einschließlich `release.json`, sieben Checklisten und
  191 versionierte Opus-Aufnahmen mit Herkunftsmetadaten.
- Fünf Branding-Dateien und vier historische QA-Screenshots.

Paketdeklaration, mitgelieferter Lizenztext und Rechtsbewertung sind getrennt.
Insbesondere ist dieses Inventar keine vollständige Stückliste aller in
nativen DLLs statisch eingebundenen Komponenten. Archiv-SHA-256 und
NuGet-`contentHash` werden getrennt dokumentiert; eine bitidentische
Reproduktion der Herstellerpakete wurde nicht durchgeführt.

## R1 — Lizenztexte fehlen in der Distribution

**Befund: belegt; vor öffentlicher Weitergabe zu beheben.**

Der Companion enthält `THIRD-PARTY-NOTICES.md`, aber diese Datei ist nur die
Kopie von `docs/third-party-licenses.md`: eine Komponentenliste mit Links,
keine Sammlung der vollständigen Copyright-, Lizenz- und Haftungstexte.
Relative Repository-Verweise darin funktionieren im alleinstehenden Release
nicht. Das EFB-Paket enthält überhaupt keine gesonderte Lizenzdatei.

Die geprüften MIT- und BSD-Texte verlangen die Beibehaltung beziehungsweise
Mitlieferung ihrer Hinweise; ein Link auf ein fremdes Repository ersetzt
das nicht. Konkrete Nachweise sind beispielsweise die
[Avalonia-Lizenz des Paketcommits](https://github.com/AvaloniaUI/Avalonia/blob/e33eaed9c106846b200680751022385d9cc5dc6f/licence.md)
und `LICENSE` in `Concentus` 2.2.2.

Bei der bisherigen Liste fehlten `System.Numerics.Tensors` 9.0.0 und die
Build-Abhängigkeit `Avalonia.BuildServices` 11.3.2. Die Übersicht ist mit
dieser Prüfung ergänzt. Weitere notwendige Nachweise:

| Bestandteil | Tatsächlicher Nachweis und Konsequenz |
| --- | --- |
| Avalonia, MicroCom, NAudio | MIT-Texte der in den NuGet-Metadaten genannten Commits übernehmen, einschließlich jeweiliger Rechteinhaber. |
| Concentus 2.2.2 | BSD-3-Clause-Text aus dem Paket; mehrere Rechteinhaber, nicht nur der Port-Autor. |
| Concentus.Oggfile 1.0.7 | MIT; der [Originaltext](https://github.com/lostromb/concentus.oggfile/blob/27c3125205ddcd891822a398284b246636fafb94/LICENSE) nennt die Ableitung von NVorbis und Andrew Ward sowie Logan Stromberg. |
| SkiaSharp 3.119.4 / HarfBuzzSharp 8.3.1.3 | MIT für die Wrapper; die Win32-Pakete enthalten zusätzlich `THIRD-PARTY-NOTICES.txt`. Nur „MIT“ beschreibt den nativen Inhalt nicht vollständig. |
| Avalonia ANGLE 2.1.27548.20260419 | BSD-3-Clause-Text im Paket. Zusätzlich den Umfang eingebundener Drittkomponenten am Paketquellstand abgrenzen. |
| System.Numerics.Tensors 9.0.0 | `LICENSE.TXT` und `THIRD-PARTY-NOTICES.TXT` im Originalpaket; im Release liegt tatsächlich `System.Numerics.Tensors.dll`. |
| .NET | Frameworkabhängige Auslieferung: keine vollständige .NET-Runtime im Release. Der generierte EXE-Apphost bleibt ein Microsoft-Bestandteil und ist beim Hinweisumfang mitzuberücksichtigen. |

Die gemeinsame SkiaSharp-/HarfBuzzSharp-Hinweisdatei enthält unter anderem
BSD-, Apache-, FreeType-, JPEG-, zlib- und auch MPL/GPL/LGPL-Texte. Sie ist
keine zuverlässige Aussage darüber, welche dieser Komponenten gerade im
Windows-Binary stecken. Der
[Windows-Build](https://github.com/mono/SkiaSharp/blob/f568ac94dd768ef9a2f593537cfde2dd0d348ef5/native/windows/build.cake)
und die
[Skia-Optionen](https://github.com/mono/skia/blob/7dbfc07dd33181f84e0958afb7ee805c6c769f0b/gn/skia.gni)
zeigen beispielsweise deaktiviertes ICU/HarfBuzz innerhalb von Skia,
standardmäßig kein FreeType unter Windows und aktiviertes Wuffs. HarfBuzz
wird separat ausgeliefert. Eine Textsuche nach „GPL“ beweist daher weder eine
GPL-Pflicht der App noch die Abwesenheit relevanter Pflichten.

**Abschlusskriterium:** Native Bestandteile samt anwendbaren Lizenzoptionen
und etwaigen Quellcodepflichten belastbar zuordnen; Originalhinweise vollständig
und offline lesbar in Repository und betroffenen Release-Artefakten mitführen.
Die Release-Prüfung muss fehlende Hinweise erkennen. Build und tatsächliches
Artefakt danach erneut prüfen. Die bloße Übernahme dieser Übersicht genügt
nicht.

## R2 — SDK-Nachweise und MIT-Angaben reichen noch nicht

**Befund: Lizenzwiderspruch beziehungsweise fehlender Volltext; vor einer
öffentlichen Repository-Freigabe zu klären.**

`@microsoft/msfs-sdk` 2.1.1 liegt als versioniertes `.tgz` im Repository.
Das Paket enthält `license: MIT`, aber keine Lizenzdatei. Die bisher als
Primärquelle angeführte
[Microsoft-Avionics-Lizenz](https://github.com/microsoft/msfs-avionics-mirror/blob/366be5056166c639a2189e09e5af7143174fd910/LICENSE)
enthält einen Zusatz, der Software und Ableitungen auf die Verwendung in
Microsoft Flight Simulator beschränkt. Diese Quelle belegt somit gerade
keine uneingeschränkte MIT-Lizenz.

Für `@microsoft/msfs-types` 1.14.6 fehlt ebenfalls ein Volltext im npm-Paket.
Die dort angegebene Quellrevision ließ sich nicht als Lizenznachweis abrufen.
Die Zuordnung der konkreten Paketversionen zu einer ausdrücklichen Lizenz
bleibt offen; die aktuelle Root-Lizenz wird nicht stillschweigend rückwirkend
zum nachgewiesenen Vertrag jeder alten Paketversion erklärt.

`@efb/efb-api` 1.0.3 und das installierte EFB-Template deklarieren ebenfalls
MIT in ihren Paketmetadaten. Die SDK-Kopie enthält jedoch keinen zugehörigen
vollständigen Lizenz-/Copyrighttext. Die EFB-API fließt in das ausgelieferte
JavaScript ein; der Avionics-SDK-Code wird dagegen als Simulator-Global
verwendet. Seine Repository-Kopie bleibt trotzdem eine Weitergabe, sobald
das Repository öffentlich wird.

Die lokale Datei `Licenses/MSFS SDK EULA.pdf` aus SDK 1.7.3 trägt selbst den
Stand 11/2019. Zusammen mit der aktuellen
[MSFS-2024-SDK-EULA](https://docs.flightsimulator.com/msfs2024/html/1_Introduction/SDK_EULA.htm)
ergibt sich: Open-Source-Bestandteile sind gesondert zu behandeln; Sample
Content und die allgemeine SDK-Weitergabe sind beschränkt (§§1(b), 1(f),
2(e)). Daraus folgt keine pauschale Freigabe sämtlicher kopierter Samples.
Umgekehrt belegt die EULA allein auch nicht, dass eine ausdrücklich separat
lizenzierte API nicht verteilt werden dürfte.

**Abschlusskriterium:** Versionsbezogenen Volltext und Copyrightzuordnung für
SDK, Typen, EFB-API und übernommene Template-Teile sichern oder die konkrete
Quell- und Binärweitergabe vom Anbieter bestätigen lassen. Alternativ
ungeklärte SDK-Kopien aus dem öffentlichen Quellumfang nehmen und lokal aus
einer legitimen SDK-Installation beziehen; das löst allein noch nicht die
Frage der gebündelten EFB-API. Die geplante öffentliche Historie muss die
gewählte Abgrenzung ebenfalls einhalten.

`SimConnect.dll` wird entsprechend ADR 0004 bereits nicht mitgeliefert.
Das wurde am Release-Dateibestand bestätigt; hier ist kein neuer
Weitergabeblocker entstanden.

## R3 — Audio ist bezahlt erzeugt, aber noch nicht weiterlizenziert

**Befund: Herkunft belegt; konkrete Empfängerrechte offen.**

Alle 190 Itemaufnahmen und die Abschlussansage haben `generationPlan: paid`,
einen dokumentierten Starter-Plan-Nachweis und passende SHA-256-Prüfsummen.
Die Aufnahmen entstanden zwischen 2026-09-18 und 2026-09-21. Der
Tarifnachweis ist die bestätigte Angabe des Betreibers, keine unabhängig
geprüfte Rechnung. Es wurden keine Free-Tier-Hörproben im versionierten
Audiobestand gefunden; Modelle und FFmpeg werden nicht ausgeliefert.
Das aktuelle Itemmanifest referenziert 189 Aufnahmen; die zusätzliche ältere
Itemaufnahme ist weiterhin versioniert und durch das Ressourcen-Wildcard im
Companion enthalten. Sie ist deshalb ebenfalls in dieser Rechteprüfung erfasst.

Die am Prüftag erneut gelesenen
[EEA-Bedingungen](https://elevenlabs.io/terms-of-use-eu),
[API-Bedingungen](https://elevenlabs.io/elevenapi-terms) und
[Veröffentlichungshinweise](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform)
stützen die Veröffentlichung und kommerzielle Verwendung bezahlter Ausgaben
unter den Anbieterbedingungen. Die
[Use Policy](https://elevenlabs.io/use-policy), insbesondere §9(j–n), enthält
jedoch weitergehende Nutzungsbeschränkungen, unter anderem für KI-Training
und bestimmte Weitergabekonstellationen. Eine unbeschränkte MIT- oder
CC0-Freigabe aller Audiodateien ist dadurch nicht belegt.

Die vorhandene Audio-README stellt die Ausnahme bereits klar, erteilt aber
noch keine ausformulierten Weitergabe- und Bearbeitungsrechte an Empfänger.
Für ein öffentliches Repository müssen auch Forks und daraus gebaute
Distributionen nachvollziehbar geregelt sein. Eine ausdrückliche
GitHub-Sonderfreigabe wurde nicht gefunden.

**Abschlusskriterium:** Separate Audio-Bedingungen mit zulässigem Nutzungs-,
Bearbeitungs- und Weitergabeumfang festlegen; die Anbieterbeschränkungen
nicht durch großzügigere Versprechen aufheben. Falls dieser Umfang für
öffentliche Forks nicht belastbar abgeleitet werden kann, eine ausdrückliche
Anbieterfreigabe einholen oder eine anders lizenzierte Audioquelle wählen.
Eine solche Anfrage wurde nicht versendet. Die Prüfung der gesprochenen
Checklistentexte ist unter R4 dokumentiert.

## R4 — Checklisten und Quellenexzerpte getrennt bewerten

**Abgeschlossen für den geprüften Bestand.** Die
[Inhalts- und Herkunftsprüfung](checklist-license-review.md) ist auf den
konkreten Veröffentlichungsumfang begrenzt. Technische Einzelangaben,
Ingame-Herkunft oder die Länge einer Liste begründen keine pauschale Pflicht
zu Herstelleranfragen. Die zuvor daraus abgeleiteten vier Anfragen entfallen.
Ein konkreter schöpferischer Fremdtext, der eine allgemeine Freigabepflicht
für die App-Checklisten begründet, wurde nicht identifiziert.

Quellen und eigene Bearbeitung bleiben dokumentiert. Der umfangreiche
H125-Verfahrensauszug wurde auf knappe Fakten mit Seitenbelegen reduziert.
Die Checklistendaten wurden nicht geändert. Der Befund erteilt keine Lizenz
für Originalhandbücher oder fremde Assets und hebt keine anwendbaren
Vertragsbedingungen auf. Software-, SDK- und Audiolizenzen sind eigenständige
Punkte; ein Herkunftshinweis ersetzt diese nicht.

## R5 — Eigene Lizenz und Abgrenzung von Bildern

**Befund: Projektlizenz noch nicht gewählt.**

Empfehlung für den eigenen Code: die unveränderte
[MIT-Lizenz](https://opensource.org/license/mit), ergänzt um eine eindeutige
Abgrenzung fremder SDK-Teile, Audioassets und ungeklärter Quellen. Auch eigene
Dokumentation, Branding und selbst verfasste Checklistendaten können nach
bestätigter Rechtezuordnung ausdrücklich erfasst werden. Der Rechteinhaber
für den Copyrightvermerk ist dabei festzulegen. Das ist eine Empfehlung,
noch keine Lizenzerteilung; `UNLICENSED` bleibt bis zur Entscheidung korrekt.

Die Branding-SVGs bestehen aus projektbezogenen Vektorformen; ICO/JPEG sind
daraus erzeugte Darstellungen. Es sind keine Schriftdateien oder externen
Bilddateien darin eingebettet. Die Schriftreferenz `Arial, sans-serif` ist
keine mitgelieferte Schriftsoftware. Die Git-Historie dokumentiert die
Branding-Arbeiten im Projekt, ersetzt aber keine Urheberschaftserklärung.

Die vier QA-Bilder wurden visuell geprüft. Zwei zeigen Ausschnitte der
eigenen Checklistenoberfläche. `content-manager-thumbnail-version-finding.png`
und `efb-icon-fill-finding.png` zeigen zusätzlich Simulator-Oberfläche und
fremde Add-on-Grafiken beziehungsweise Namen. Sie sind nicht pauschal als
eigene MIT-Grafiken auszuweisen. Für die bevorstehende Dokumentationsbereinigung
ist das Entfernen dieser erledigten historischen Bildbefunde eine mögliche
Lösung; eine Weiterveröffentlichung braucht eine passende Rechtegrundlage.

Ein Repository mit verwendungsbeschränktem SDK-Material und gesondert
beschränktem Audio sollte nicht als vollständig MIT-lizenziert bezeichnet
werden. Die [Open Source Definition](https://opensource.org/osd), insbesondere
Nr. 6, schließt Beschränkungen nach Einsatzgebiet für Open-Source-Lizenzen aus.
Eigenen Open-Source-Code und fremde, gesondert lizenzierte Bestandteile klar
zu benennen bleibt möglich.

## Ergebnis und Fortsetzung

Die technische Bestandsaufnahme liefert keinen Grund, die bisherigen
Bibliotheksfamilien pauschal auszutauschen. Sie liefert aber auch keine
Freigabe, das bestehende Repository und Release unverändert zu veröffentlichen.
Die konkreten Abschlusskriterien stehen ausschließlich bei R1 bis R5 oben.

Die Checklistenprüfung R4 ist abgeschlossen. Nächster Arbeitsschritt sind die
vollständigen Distributionshinweise (R1) und die konkreten SDK-Nachweise (R2).
Projektlizenz und Audio-Bedingungen bleiben unter R3/R5 festzulegen; die
Veröffentlichungsentscheidung ersetzt ADR 0001 durch ein neues ADR.

Der vollständige Geheimnis-/Privatdaten- und Historiencheck sowie der finale
Abgleich mit den 1.0.0-Artefakten bleiben der nachfolgenden
GitHub-Veröffentlichungsvorbereitung vorbehalten. Es wurden keine Anbieter
kontaktiert, Dateien veröffentlicht, Produktbestandteile entfernt oder neue
Nutzungsrechte im Namen des Benutzers erteilt.

## Verifikation dieses Prüfstands

`task check` war nach den Dokumentationsänderungen erfolgreich: Daten- und
Audiovalidierung, EFB-Build und Tests, Companion-Build ohne Warnungen/Fehler,
52 Companion-Selbsttests sowie neun Release-Tests. Zusätzlich wurden die
Inventar-Eingangsprüfsummen, lokalen Dokumentverweise und `git diff --check`
geprüft. Diese technischen Prüfungen ersetzen keine der offenen Rechteklärungen.
Für diese reine Dokumentationsänderung wurde kein Deployment ausgeführt.
