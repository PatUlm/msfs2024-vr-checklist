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

`@microsoft/msfs-sdk` wird beim App-Build als Simulator-Global behandelt;
`@microsoft/msfs-types` liefert ausschließlich Typen. Die EFB-API wird aus der
bewusst versionierten SDK-Kopie unter `msfs/PackageSources/efb_api/dist/`
bezogen.

## Direkte Build-Abhängigkeiten

Diese Werkzeuge werden nicht als eigene Laufzeitkomponenten der EFB-App
ausgeliefert.

| Komponente | Gelockte Version | Lizenz | Primärquelle |
| --- | --- | --- | --- |
| `@fal-works/esbuild-plugin-global-externals` | 2.1.2 | MIT | [Repository](https://github.com/fal-works/esbuild-plugin-global-externals) |
| `@jgoz/esbuild-plugin-typecheck` | 3.1.3 | MIT | [Repository](https://github.com/jgoz/esbuild-plugins) |
| `@types/node` | 18.19.67 | MIT | [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `cross-env` | 7.0.3 | MIT | [Repository](https://github.com/kentcdodds/cross-env) |
| `dotenv` | 16.4.6 | BSD-2-Clause | [Repository](https://github.com/motdotla/dotenv) |
| `esbuild` | 0.21.5 | MIT | [Repository](https://github.com/evanw/esbuild) |
| `esbuild-copy-static-files` | 0.1.0 | MIT | [Repository](https://github.com/nickjj/esbuild-copy-static-files) |
| `esbuild-plugin-copy` | 2.1.1 | MIT | [Repository](https://github.com/LinbuduLab/esbuild-plugins) |
| `esbuild-sass-plugin` | 3.3.1 | MIT | [Repository](https://github.com/glromeo/esbuild-sass-plugin) |
| `postcss` | 8.4.49 | MIT | [Repository](https://github.com/postcss/postcss) |
| `postcss-prefix-selector` | 1.16.1 | MIT | [Repository](https://github.com/RadValentin/postcss-prefix-selector) |
| `postcss-url` | 10.1.3 | MIT | [Repository](https://github.com/postcss/postcss-url) |
| `prettier` | 2.8.8 | MIT | [Repository](https://github.com/prettier/prettier) |
| `typescript` | 5.6.3 | Apache-2.0 | [Repository](https://github.com/microsoft/TypeScript) |

Geplante Phase-3-Komponenten sind noch keine Projektabhängigkeiten. Ihre
Auswahl- und Rechteprüfung bleibt Gegenstand von
[ADR 0001](adr/0001-lizenz-und-veroeffentlichungsstrategie.md) und
[ADR 0008](adr/0008-stimme-und-tts-anbieter.md); nach ihrer Aufnahme werden sie
hier ergänzt.
