# Drittanbieter-Lizenzen

Dieses Dokument hält den überprüften Lizenzstand der direkten Abhängigkeiten
und der in die App einfließenden Drittkomponenten fest. Maßgeblich sind die
verlinkten Primärquellen und die gelockten Versionen, nicht ein ungeprüftes
Paketmanager-Label. Transitive Build-Abhängigkeiten werden vor einer externen
Veröffentlichung zusätzlich aus dem Lockfile auditiert.

Das eigene Paket `@efb/vr-checklist` ist derzeit privat und nicht lizenziert.
Sein npm-Metadatum lautet deshalb `UNLICENSED`; dies ändert keine Lizenz einer
hier aufgeführten Drittkomponente.

## Laufzeit- und SDK-Abhängigkeiten

| Komponente | Version | Lizenz | Primärnachweis |
| --- | --- | --- | --- |
| `@efb/efb-api` | 1.0.3 | MIT | kopiertes [`package.json`](../msfs/PackageSources/efb_api/package.json) aus MSFS SDK 1.7.3 |
| `@microsoft/msfs-sdk` | 2.1.1 | MIT | vendortes Paket und [Microsoft MSFS Avionics Mirror](https://github.com/microsoft/msfs-avionics-mirror) |
| `@microsoft/msfs-types` | 1.14.6 | MIT | [Microsoft MSFS Avionics Mirror](https://github.com/microsoft/msfs-avionics-mirror) |
| .NET Runtime | 10.0 | MIT | [dotnet/runtime](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT) |
| Avalonia UI Runtime-Familie (`Avalonia`, `Avalonia.HarfBuzz`, `Avalonia.Remote.Protocol`, `Avalonia.Skia`, `Avalonia.Themes.Fluent`, `Avalonia.Win32` einschließlich aller daraus ausgelieferten `Avalonia*.dll`) | 12.1.1 | MIT | [Avalonia license](https://github.com/AvaloniaUI/Avalonia/blob/master/licence.md) |
| SkiaSharp einschließlich Win32-Native-Assets | 3.119.4 | MIT | [SkiaSharp license](https://github.com/mono/SkiaSharp/blob/main/LICENSE.md) |
| HarfBuzzSharp einschließlich Win32-Native-Assets | 8.3.1.3 | MIT | [SkiaSharp license](https://github.com/mono/SkiaSharp/blob/main/LICENSE.md) |
| Avalonia ANGLE Windows Natives | 2.1.27548.20260419 | BSD-3-Clause | [ANGLE license](https://github.com/google/angle/blob/main/LICENSE) |
| MicroCom Runtime | 0.11.6 | MIT | [MicroCom license](https://github.com/AvaloniaUI/MicroCom/blob/master/licence.md) |
| `Concentus` | 2.2.2 | BSD-3-Clause (Opus-Lizenz) | [Concentus license](https://github.com/lostromb/concentus/blob/master/LICENSE) |
| `Concentus.Oggfile` | 1.0.7 | MIT | [Concentus.Oggfile](https://github.com/lostromb/concentus.oggfile) |
| `NAudio.Core` | 3.1.0 | MIT | [NAudio license](https://github.com/naudio/NAudio/blob/master/license.txt) |
| `NAudio.Wasapi` | 3.1.0 | MIT | [NAudio license](https://github.com/naudio/NAudio/blob/master/license.txt) |

`@microsoft/msfs-sdk` wird beim App-Build als Simulator-Global behandelt;
`@microsoft/msfs-types` liefert ausschließlich Typen. Die EFB-API wird aus der
bewusst versionierten SDK-Kopie unter `msfs/PackageSources/efb_api/dist/`
bezogen. Begleit-App und Phase-3-Transporttest sind frameworkabhängig und
liefern die .NET-Laufzeit nicht mit aus. Das NuGet-Lockfile der Begleit-App
fixiert auch die ausgelieferten nativen Grafik- und Textkomponenten. Die
Runtime-Familien in dieser Tabelle wurden gegen die Paketzuordnung in
`VRChecklist.Companion.deps.json` und die Dateien des Companion-Releases
`0.4.1` abgeglichen. Projekteigene `VRChecklist.*`-Assemblies und Metadaten sind
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

Die Begleit-App nutzt von NAudio nur `NAudio.Wasapi` und dessen Abhängigkeit
`NAudio.Core`; das Meta-Paket `NAudio` mit WinMM-, MIDI- und ASIO-Teilen wird
nicht ausgeliefert. `Concentus` und `Concentus.Oggfile` dekodieren die
Opus-Ansagen aus [ADR 0007](adr/0007-ablage-der-gerenderten-audiodateien.md)
und bringen für .NET 10 keine weiteren Paketabhängigkeiten mit.

## Sprachasset und Renderwerkzeug

| Komponente | Version / Stand | Lizenz / Bedingungen | Primärquelle |
| --- | --- | --- | --- |
| ElevenLabs Brian, Abschluss- und Itemansagen | eleven_multilingual_v2; erzeugt 2026-09-18 im bestätigten Starter-Plan | Bezahlte TTS-Ausgabe, gesonderte Anbieterbedingungen; keine pauschale MIT-Freigabe | [EU Terms](https://elevenlabs.io/terms-of-use-eu), [API Terms](https://elevenlabs.io/elevenapi-terms), [Veröffentlichung von Ausgaben](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) |
| FFmpeg, nur lokales Renderwerkzeug | 7.0.2-static, mit libopus | GPL-3.0-or-later für den verwendeten Build; wird nicht ausgeliefert | [FFmpeg Legal](https://ffmpeg.org/legal.html), [Buildanbieter](https://johnvansickle.com/ffmpeg/) |

Die Herkunft der Clean-Dateien ist im
[Abschlussmanifest](../assets/audio/completion/manifest.json) sowie in den
[Item-Zuordnungen](../assets/audio/items/manifest.json) und den dortigen
Dateimetadaten dokumentiert.
Der Live-Radiofilter nutzt das bereits aufgeführte NAudio. Für die geplante
externe Veröffentlichung muss die konkrete Audioasset-Lizenz gemäß
[ADR 0008](adr/0008-stimme-und-tts-anbieter.md) separat festgelegt werden;
die früheren Free-Tier-Hörproben werden nicht ausgeliefert.
