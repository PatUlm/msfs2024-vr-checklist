# Third-party licenses

This document records the license status of the direct dependencies and of
the third-party components that go into the app. Package declarations are
marked as such. The primary sources and the locked versions are authoritative,
not a package manager label alone.

Open questions about evidence and redistribution are kept only in the
[license audit](license-audit.md), which also describes the scope of the
[inventory](license-audit-inventory.json). The full license texts shipped in
both release artifacts are in [licenses/](../licenses/README.md).

The [project license](../LICENSE) is separate from the terms of the third-party components listed here.

## Runtime and SDK dependencies

| Component                                                                                                                                                                                             | Version             | License                                                                                  | Primary evidence                                                                                                                                                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@efb/efb-api`                                                                                                                                                                                        | 1.0.3               | MIT according to the package declaration; bundled in the EFB ZIP                         | `package.json` in the EFB sample of MSFS SDK 1.7.3, copied locally by `task install`; full text in [licenses/](../licenses/README.md)                                                                                                    |
| `@microsoft/msfs-sdk`                                                                                                                                                                                 | 2.1.1               | MIT with the addition "only for use in MSFS"; not shipped                                | [Microsoft license with addition](https://github.com/microsoft/msfs-avionics-mirror/blob/366be5056166c639a2189e09e5af7143174fd910/LICENSE); package from the SDK's EFB sample                                                            |
| `@microsoft/msfs-types`                                                                                                                                                                               | 1.14.6              | MIT according to the package declaration; types only, not shipped                        | [Microsoft MSFS Avionics Mirror](https://github.com/microsoft/msfs-avionics-mirror); npm package                                                                                                                                         |
| .NET Runtime (`Microsoft.NETCore.App.Runtime.win-x64`), self-contained in the companion setup                                                                                                         | 10.0.10             | MIT and bundled third-party notices                                                      | [LICENSE.TXT](https://github.com/dotnet/runtime/blob/main/LICENSE.TXT), [THIRD-PARTY-NOTICES.TXT](https://github.com/dotnet/runtime/blob/main/THIRD-PARTY-NOTICES.TXT); [full texts](../licenses/README.md)                              |
| `SimConnect.dll` (native, x64), in the companion setup                                                                                                                                                | MSFS 2024 SDK 1.7.3 | Microsoft SDK EULA; see the note below                                                   | [SDK EULA](https://docs.flightsimulator.com/msfs2024/html/1_Introduction/SDK_EULA.htm)                                                                                                                                                   |
| `Velopack` including `Update.exe` and the setup stub                                                                                                                                                  | 1.2.158             | MIT; the stubs link Rust crates, zstd (BSD) and the WebView2 loader                      | [Velopack license](https://github.com/velopack/velopack/blob/1.2.158/LICENSE); [full texts](../licenses/README.md)                                                                                                                       |
| Avalonia UI runtime family (`Avalonia`, `Avalonia.HarfBuzz`, `Avalonia.Remote.Protocol`, `Avalonia.Skia`, `Avalonia.Themes.Fluent`, `Avalonia.Win32` including all `Avalonia*.dll` shipped from them) | 12.1.1              | MIT                                                                                      | [Avalonia license](https://github.com/AvaloniaUI/Avalonia/blob/e33eaed9c106846b200680751022385d9cc5dc6f/licence.md)                                                                                                                      |
| SkiaSharp including Win32 native assets                                                                                                                                                               | 3.119.4             | MIT for the wrapper; additional native third-party terms                                 | `LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` in the [original Win32 package](https://api.nuget.org/v3-flatcontainer/skiasharp.nativeassets.win32/3.119.4/skiasharp.nativeassets.win32.3.119.4.nupkg); [full texts](../licenses/README.md) |
| HarfBuzzSharp including Win32 native assets                                                                                                                                                           | 8.3.1.3             | MIT for the wrapper; additional native third-party terms, in particular HarfBuzz Old MIT | `LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` in the [original Win32 package](https://api.nuget.org/v3-flatcontainer/harfbuzzsharp.nativeassets.win32/8.3.1.3/harfbuzzsharp.nativeassets.win32.8.3.1.3.nupkg)                              |
| Avalonia ANGLE Windows Natives                                                                                                                                                                        | 2.1.27548.20260419  | BSD-3-Clause                                                                             | `LICENSE` in the [original package](https://api.nuget.org/v3-flatcontainer/avalonia.angle.windows.natives/2.1.27548.20260419/avalonia.angle.windows.natives.2.1.27548.20260419.nupkg); [full texts](../licenses/README.md)               |
| MicroCom Runtime                                                                                                                                                                                      | 0.11.6              | MIT                                                                                      | [MicroCom license](https://github.com/kekekeks/MicroCom/blob/76785efcafd91b5902fd19dd11145f6dd655b7b4/LICENSE)                                                                                                                           |
| `Concentus`                                                                                                                                                                                           | 2.2.2               | BSD-3-Clause (Opus license)                                                              | [Concentus license](https://github.com/lostromb/concentus/blob/master/LICENSE)                                                                                                                                                           |
| `Concentus.Oggfile`                                                                                                                                                                                   | 1.0.7               | MIT; NVorbis attribution notice preserved                                                | [Concentus.Oggfile](https://github.com/lostromb/concentus.oggfile/blob/27c3125205ddcd891822a398284b246636fafb94/LICENSE)                                                                                                                 |
| `NAudio.Core`                                                                                                                                                                                         | 3.1.0               | MIT                                                                                      | [NAudio license](https://github.com/naudio/NAudio/blob/0aaef29d04bec9567bdf2f669036fabecc33a2e2/LICENSE)                                                                                                                                 |
| `NAudio.Wasapi`                                                                                                                                                                                       | 3.1.0               | MIT                                                                                      | [NAudio license](https://github.com/naudio/NAudio/blob/0aaef29d04bec9567bdf2f669036fabecc33a2e2/LICENSE)                                                                                                                                 |
| `System.Numerics.Tensors`                                                                                                                                                                             | 9.0.0               | MIT and bundled third-party notices                                                      | `LICENSE.TXT` and `THIRD-PARTY-NOTICES.TXT` in the [original package](https://api.nuget.org/v3-flatcontainer/system.numerics.tensors/9.0.0/system.numerics.tensors.9.0.0.nupkg)                                                          |

`@microsoft/msfs-sdk` is treated as a simulator global in the app build;
`@microsoft/msfs-types` supplies types only. The EFB API is bundled into the
EFB bundle; like the MSFS SDK package, `task install` copies it from the local
SDK, see [package sources](../msfs/PackageSources/README.md). The companion
setup ships the .NET runtime self-contained; development staging and the
transport test stay framework-dependent. The companion's NuGet lock file also
pins the shipped native graphics and text components. The runtime families in
this table were reconciled against the package mapping in
`VRChecklist.Companion.deps.json` and the files of the companion release
`0.13.3`. The project's own `VRChecklist.*` assemblies and metadata are not
third-party components; debug symbols are not shipped.

`SimConnect.dll` comes unchanged from the MSFS 2024 SDK. The SDK EULA does not
explicitly address its redistribution. The project ships it non-commercially
with a free add-on, which matches common practice for MSFS add-ons. Asobo and
Microsoft have not yet responded to related questions in the DevSupport forum,
although they explicitly provide the SDK for extending MSFS 2024.

## Direct build dependencies

These tools are not shipped as runtime components of the EFB app.

| Component                                                             | Locked version | License      | Primary source                                                                                                                                                            |
|-----------------------------------------------------------------------|----------------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@fal-works/esbuild-plugin-global-externals`                          | 2.1.2          | MIT          | [Repository](https://github.com/fal-works/esbuild-plugin-global-externals)                                                                                                |
| `@jgoz/esbuild-plugin-typecheck`                                      | 4.0.4          | MIT          | [Repository](https://github.com/jgoz/esbuild-plugins)                                                                                                                     |
| `@types/node`                                                         | 18.19.130      | MIT          | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)                                                                                                     |
| `cross-env`                                                           | 7.0.3          | MIT          | [Repository](https://github.com/kentcdodds/cross-env)                                                                                                                     |
| `dotenv`                                                              | 16.6.1         | BSD-2-Clause | [Repository](https://github.com/motdotla/dotenv)                                                                                                                          |
| `esbuild`                                                             | 0.28.2         | MIT          | [Repository](https://github.com/evanw/esbuild)                                                                                                                            |
| `esbuild-copy-static-files`                                           | 0.1.0          | MIT          | [Repository](https://github.com/nickjj/esbuild-copy-static-files)                                                                                                         |
| `esbuild-plugin-copy`                                                 | 2.1.1          | MIT          | [Repository](https://github.com/LinbuduLab/esbuild-plugins)                                                                                                               |
| `esbuild-sass-plugin`                                                 | 3.7.0          | MIT          | [Repository](https://github.com/glromeo/esbuild-sass-plugin)                                                                                                              |
| `postcss`                                                             | 8.5.26         | MIT          | [Repository](https://github.com/postcss/postcss)                                                                                                                          |
| `postcss-prefix-selector`                                             | 1.16.1         | MIT          | [Repository](https://github.com/RadValentin/postcss-prefix-selector)                                                                                                      |
| `postcss-url`                                                         | 10.1.4         | MIT          | [Repository](https://github.com/postcss/postcss-url)                                                                                                                      |
| `prettier`                                                            | 2.8.8          | MIT          | [Repository](https://github.com/prettier/prettier)                                                                                                                        |
| `typescript`                                                          | 5.6.3          | Apache-2.0   | [Repository](https://github.com/microsoft/TypeScript)                                                                                                                     |
| `vpk` (Velopack CLI), pinned in `companion/.config/dotnet-tools.json` | 1.2.158        | MIT          | [Velopack](https://github.com/velopack/velopack/blob/1.2.158/LICENSE)                                                                                                     |
| .NET SDK build container                                              | 10.0.302       | MIT          | [Microsoft Artifact Registry](https://mcr.microsoft.com/en-us/artifact/mar/dotnet/sdk/tag/10.0.302) and [dotnet/sdk](https://github.com/dotnet/sdk/blob/main/LICENSE.TXT) |

Additional transitive build dependency of the companion:
`Avalonia.BuildServices` 11.3.2, MIT, checked against the
[license text at the package commit](https://github.com/AvaloniaUI/Avalonia.BuildServices/blob/777f975b0a0cecf0311273711d56697212c558c0/LICENSE).
All npm lock file entries including optional platform packages are listed in
the [inventory](license-audit-inventory.json); the depth of evidence recorded
there distinguishes package files from mere declarations. For example,
`@bufbuild/protobuf` 2.14.0 declares `Apache-2.0 AND BSD-3-Clause`, `tslib`
2.8.1 declares `0BSD`. The local Sass Embedded binaries additionally contain
their own collective `dart-sass/src/LICENSE` text. These tools are not shipped.

From NAudio, the companion uses only `NAudio.Wasapi` and its dependency
`NAudio.Core`; the meta package `NAudio` with its WinMM, MIDI and ASIO parts is
not shipped. `Concentus` and `Concentus.Oggfile` decode the Opus announcements
from [ADR 0007](adr/0007-rendered-audio-in-the-repository.md) and bring no
further package dependencies for .NET 10.

## Speech assets and render tool

| Component                                           | Version / state                                 | License / terms                                                                                                                      | Primary source                                                                                            |
|-----------------------------------------------------|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| ElevenLabs Brian, fixed and item announcements      | Model and generation data in the asset metadata | [Audio terms](../assets/audio/LICENSE); rationale and primary sources under [rights notice](../assets/audio/README.md#rights-notice) | [Audio provenance](../assets/audio/README.md)                                                             |
| FFmpeg, local render tool only                      | 7.0.2-static, with libopus                      | GPL-3.0-or-later for the build used; not shipped                                                                                     | [FFmpeg Legal](https://ffmpeg.org/legal.html), [build provider](https://johnvansickle.com/ffmpeg/)        |
| FFmpeg, current local render tool on Ubuntu         | 6.1.1-3ubuntu5, with libopus                    | GPL-2.0-or-later for the build used; not shipped                                                                                     | [Ubuntu package](https://packages.ubuntu.com/noble/ffmpeg), [FFmpeg Legal](https://ffmpeg.org/legal.html) |

The provenance of the clean files is documented in the
[completion](../assets/audio/completion/manifest.json) and
[no-checklist](../assets/audio/no-checklist/manifest.json) manifests, the
[phase announcement](../assets/audio/phases/) metadata, the
[item mappings](../assets/audio/items/manifest.json) and the file metadata
there. The live radio filter uses NAudio, which is already listed.
