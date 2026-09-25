# Drittanbieter-Lizenzen

Dieses Dokument hält den Lizenzstand der direkten Abhängigkeiten und der in
die App einfließenden Drittkomponenten fest. Paketdeklarationen werden als
solche gekennzeichnet. Maßgeblich sind die Primärquellen
und die gelockten Versionen, nicht allein ein Paketmanager-Label.

Offene Nachweis- und Weitergabefragen stehen ausschließlich in der
[Lizenzprüfung](license-audit.md), die auch den Geltungsbereich des
[Inventars](license-audit-inventory.json) beschreibt. Diese Übersicht ist keine
Veröffentlichungsfreigabe und ersetzt keine mitzuliefernden Lizenzvolltexte.

Die [Projektlizenz](license-audit.md#r5--eigene-lizenz-und-abgrenzung-von-bildern)
ist von den Bedingungen der hier aufgeführten Drittkomponenten getrennt.

## Laufzeit- und SDK-Abhängigkeiten

| Komponente | Version | Lizenz | Primärnachweis |
| --- | --- | --- | --- |
| `@efb/efb-api` | 1.0.3 | MIT laut Paketdeklaration; Bewertung in R2 | kopiertes [`package.json`](../msfs/PackageSources/efb_api/package.json) aus MSFS SDK 1.7.3; [Prüfbefund R2](license-audit.md#r2--sdk-nachweise-und-mit-angaben-reichen-noch-nicht) |
| `@microsoft/msfs-sdk` | 2.1.1 | MIT laut Paketdeklaration; Bewertung in R2 | [Microsoft-Lizenz mit Zusatz](https://github.com/microsoft/msfs-avionics-mirror/blob/366be5056166c639a2189e09e5af7143174fd910/LICENSE); [Prüfbefund R2](license-audit.md#r2--sdk-nachweise-und-mit-angaben-reichen-noch-nicht) |
| `@microsoft/msfs-types` | 1.14.6 | MIT laut Paketdeklaration; Bewertung in R2 | [Microsoft MSFS Avionics Mirror](https://github.com/microsoft/msfs-avionics-mirror); [Prüfbefund R2](license-audit.md#r2--sdk-nachweise-und-mit-angaben-reichen-noch-nicht) |
| .NET Runtime | 10.0 | MIT | [dotnet/runtime](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT) |
| Avalonia UI Runtime-Familie (`Avalonia`, `Avalonia.HarfBuzz`, `Avalonia.Remote.Protocol`, `Avalonia.Skia`, `Avalonia.Themes.Fluent`, `Avalonia.Win32` einschließlich aller daraus ausgelieferten `Avalonia*.dll`) | 12.1.1 | MIT | [Avalonia license](https://github.com/AvaloniaUI/Avalonia/blob/e33eaed9c106846b200680751022385d9cc5dc6f/licence.md) |
| SkiaSharp einschließlich Win32-Native-Assets | 3.119.4 | MIT für Wrapper; zusätzliche native Drittbedingungen | `LICENSE.txt` und `THIRD-PARTY-NOTICES.txt` im [Win32-Originalpaket](https://api.nuget.org/v3-flatcontainer/skiasharp.nativeassets.win32/3.119.4/skiasharp.nativeassets.win32.3.119.4.nupkg); [Prüfbefund R1](license-audit.md#r1--lizenztexte-fehlen-in-der-distribution) |
| HarfBuzzSharp einschließlich Win32-Native-Assets | 8.3.1.3 | MIT für Wrapper; zusätzliche native Drittbedingungen, insbesondere HarfBuzz Old MIT | `LICENSE.txt` und `THIRD-PARTY-NOTICES.txt` im [Win32-Originalpaket](https://api.nuget.org/v3-flatcontainer/harfbuzzsharp.nativeassets.win32/8.3.1.3/harfbuzzsharp.nativeassets.win32.8.3.1.3.nupkg) |
| Avalonia ANGLE Windows Natives | 2.1.27548.20260419 | BSD-3-Clause; Bewertung eingebundener Drittkomponenten in R1 | `LICENSE` im [Originalpaket](https://api.nuget.org/v3-flatcontainer/avalonia.angle.windows.natives/2.1.27548.20260419/avalonia.angle.windows.natives.2.1.27548.20260419.nupkg); [Prüfbefund R1](license-audit.md#r1--lizenztexte-fehlen-in-der-distribution) |
| MicroCom Runtime | 0.11.6 | MIT | [MicroCom license](https://github.com/kekekeks/MicroCom/blob/76785efcafd91b5902fd19dd11145f6dd655b7b4/LICENSE) |
| `Concentus` | 2.2.2 | BSD-3-Clause (Opus-Lizenz) | [Concentus license](https://github.com/lostromb/concentus/blob/master/LICENSE) |
| `Concentus.Oggfile` | 1.0.7 | MIT; NVorbis-Herkunftshinweis erhalten | [Concentus.Oggfile](https://github.com/lostromb/concentus.oggfile/blob/27c3125205ddcd891822a398284b246636fafb94/LICENSE) |
| `NAudio.Core` | 3.1.0 | MIT | [NAudio license](https://github.com/naudio/NAudio/blob/0aaef29d04bec9567bdf2f669036fabecc33a2e2/LICENSE) |
| `NAudio.Wasapi` | 3.1.0 | MIT | [NAudio license](https://github.com/naudio/NAudio/blob/0aaef29d04bec9567bdf2f669036fabecc33a2e2/LICENSE) |
| `System.Numerics.Tensors` | 9.0.0 | MIT und mitgelieferte Drittanbieterhinweise | `LICENSE.TXT` und `THIRD-PARTY-NOTICES.TXT` im [Originalpaket](https://api.nuget.org/v3-flatcontainer/system.numerics.tensors/9.0.0/system.numerics.tensors.9.0.0.nupkg) |

`@microsoft/msfs-sdk` wird beim App-Build als Simulator-Global behandelt;
`@microsoft/msfs-types` liefert ausschließlich Typen. Die EFB-API wird aus der
bewusst versionierten SDK-Kopie unter `msfs/PackageSources/efb_api/dist/`
bezogen. Begleit-App und Phase-3-Transporttest sind frameworkabhängig und
liefern die .NET-Laufzeit nicht mit aus. Das NuGet-Lockfile der Begleit-App
fixiert auch die ausgelieferten nativen Grafik- und Textkomponenten. Die
Runtime-Familien in dieser Tabelle wurden gegen die Paketzuordnung in
`VRChecklist.Companion.deps.json` und die Dateien des Companion-Releases
`0.13.3` abgeglichen. Der .NET-Apphost der Companion-EXE wird trotz externer
Runtime mitgeliefert und ist beim Lizenzhinweisumfang zu berücksichtigen.
Projekteigene `VRChecklist.*`-Assemblies und Metadaten sind
keine Drittkomponenten; Debugsymbole werden nicht ausgeliefert.

## Direkte Build-Abhängigkeiten

Diese Werkzeuge werden nicht als eigene Laufzeitkomponenten der EFB-App
ausgeliefert.

| Komponente | Gelockte Version | Lizenz | Primärquelle |
| --- | --- | --- | --- |
| `@fal-works/esbuild-plugin-global-externals` | 2.1.2 | MIT | [Repository](https://github.com/fal-works/esbuild-plugin-global-externals) |
| `@jgoz/esbuild-plugin-typecheck` | 4.0.4 | MIT | [Repository](https://github.com/jgoz/esbuild-plugins) |
| `@types/node` | 18.19.130 | MIT | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `cross-env` | 7.0.3 | MIT | [Repository](https://github.com/kentcdodds/cross-env) |
| `dotenv` | 16.6.1 | BSD-2-Clause | [Repository](https://github.com/motdotla/dotenv) |
| `esbuild` | 0.28.2 | MIT | [Repository](https://github.com/evanw/esbuild) |
| `esbuild-copy-static-files` | 0.1.0 | MIT | [Repository](https://github.com/nickjj/esbuild-copy-static-files) |
| `esbuild-plugin-copy` | 2.1.1 | MIT | [Repository](https://github.com/LinbuduLab/esbuild-plugins) |
| `esbuild-sass-plugin` | 3.7.0 | MIT | [Repository](https://github.com/glromeo/esbuild-sass-plugin) |
| `postcss` | 8.5.26 | MIT | [Repository](https://github.com/postcss/postcss) |
| `postcss-prefix-selector` | 1.16.1 | MIT | [Repository](https://github.com/RadValentin/postcss-prefix-selector) |
| `postcss-url` | 10.1.4 | MIT | [Repository](https://github.com/postcss/postcss-url) |
| `prettier` | 2.8.8 | MIT | [Repository](https://github.com/prettier/prettier) |
| `typescript` | 5.6.3 | Apache-2.0 | [Repository](https://github.com/microsoft/TypeScript) |
| .NET SDK Build-Container | 10.0.302 | MIT | [Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/artifact/mar/dotnet/sdk/tag/10.0.302) und [dotnet/sdk](https://github.com/dotnet/sdk/blob/main/LICENSE.TXT) |

Zusätzliche transitive Build-Abhängigkeit des Companions:
`Avalonia.BuildServices` 11.3.2, MIT, geprüft am
[Lizenztext des Paketcommits](https://github.com/AvaloniaUI/Avalonia.BuildServices/blob/777f975b0a0cecf0311273711d56697212c558c0/LICENSE).
Alle npm-Lockfile-Einträge einschließlich optionaler Plattformpakete stehen im
[Inventar](license-audit-inventory.json); die dort erfasste Nachweistiefe
unterscheidet Paketdateien von bloßen Deklarationen. Beispielsweise deklariert
`@bufbuild/protobuf` 2.14.0 `Apache-2.0 AND BSD-3-Clause`, `tslib` 2.8.1 `0BSD`.
Die lokalen Sass-Embedded-Binaries enthalten zusätzlich einen eigenen
`dart-sass/src/LICENSE`-Sammeltext. Diese Werkzeuge werden nicht ausgeliefert.

Die Begleit-App nutzt von NAudio nur `NAudio.Wasapi` und dessen Abhängigkeit
`NAudio.Core`; das Meta-Paket `NAudio` mit WinMM-, MIDI- und ASIO-Teilen wird
nicht ausgeliefert. `Concentus` und `Concentus.Oggfile` dekodieren die
Opus-Ansagen aus [ADR 0007](adr/0007-ablage-der-gerenderten-audiodateien.md)
und bringen für .NET 10 keine weiteren Paketabhängigkeiten mit.

## Sprachasset und Renderwerkzeug

| Komponente | Version / Stand | Lizenz / Bedingungen | Primärquelle |
| --- | --- | --- | --- |
| ElevenLabs Brian, Abschluss- und Itemansagen | Modell und Erzeugungsdaten in den Asset-Metadaten | [Audio-Bedingungen und Primärquellen](license-audit.md#r3--audio-ist-bezahlt-erzeugt-aber-noch-nicht-weiterlizenziert) | [Audio-Herkunft](../assets/audio/README.md) |
| FFmpeg, nur lokales Renderwerkzeug | 7.0.2-static, mit libopus | GPL-3.0-or-later für den verwendeten Build; wird nicht ausgeliefert | [FFmpeg Legal](https://ffmpeg.org/legal.html), [Buildanbieter](https://johnvansickle.com/ffmpeg/) |
| FFmpeg, aktuelles lokales Renderwerkzeug unter Ubuntu | 6.1.1-3ubuntu5, mit libopus | GPL-2.0-or-later für den verwendeten Build; wird nicht ausgeliefert | [Ubuntu-Paket](https://packages.ubuntu.com/noble/ffmpeg), [FFmpeg Legal](https://ffmpeg.org/legal.html) |

Die Herkunft der Clean-Dateien ist im
[Abschlussmanifest](../assets/audio/completion/manifest.json) sowie in den
[Item-Zuordnungen](../assets/audio/items/manifest.json) und den dortigen
Dateimetadaten dokumentiert.
Der Live-Radiofilter nutzt das bereits aufgeführte NAudio.
