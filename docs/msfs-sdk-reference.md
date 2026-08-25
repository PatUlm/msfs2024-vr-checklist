# MSFS-2024-SDK: bestätigte Fakten, Do's und Don'ts

Dieses Dokument ist die zentrale technische Referenz für das Verhalten des
MSFS-2024-SDK, der EFB-API und der Coherent-GT-Laufzeit in diesem Projekt. Es
bündelt Wissen, das zuvor über `AGENTS.md`, `README.md`,
`docs/design-decisions.md`, `docs/design-qa.md`, `docs/vr-test-preparation.md`,
`docs/release.md`, `CHANGELOG.md` und Quellcodekommentare verteilt war.

Geltungsbereich sind ausschließlich SDK-, Laufzeit- und Paketierungsfragen.
Produktentscheidungen stehen weiter in `design-decisions.md`, offene visuelle
Abweichungen in `design-qa.md`, der Release-Ablauf in `release.md`.

## Wie dieses Dokument zu lesen ist

Jede Aussage trägt eine Nachweisstufe:

| Marker | Bedeutung |
| --- | --- |
| **[RT]** | Im MSFS-Laufzeitsystem dieses Projekts reproduziert und bestätigt |
| **[DOC]** | Aus offizieller SDK-Dokumentation oder SDK-Sample übernommen, im Projekt eingesetzt und im Betrieb unauffällig |
| **[NEG]** | Nachweislich wirkungslos oder ungeeignet; nicht erneut versuchen ohne neuen Beleg |
| **[OPEN]** | Nicht abschließend geklärt; vor einer darauf aufbauenden Implementierung nachweisen |

Neue Erkenntnisse gehören in dieses Dokument, sobald sie belastbar sind. Reine
Vermutungen oder Community-Aussagen ohne Laufzeitnachweis werden nicht als
API-Vertrag aufgenommen.

## Verifizierte Umgebung

| Komponente | Version |
| --- | --- |
| Microsoft Flight Simulator 2024 SDK | `1.7.3` |
| EFB Template Sample | aus SDK 1.7.3 kopiert |
| `@efb/efb-api` | `1.0.3` (AsoboStudio) |
| `@microsoft/msfs-sdk` | `2.1.1` (lokales Tarball unter `vendor/`) |
| `@microsoft/msfs-types` | `^1.14.6` |
| TypeScript / esbuild | `~5.6.2` / `^0.21.3` |
| Node.js / npm / Task | `v24.19.0` / `11.17.0` / `v3.37.2` |

Alle nachfolgenden Aussagen gelten für genau diese Kombination. Nach einem
SDK-Update sind mindestens die **[NEG]**-Einträge erneut zu prüfen, bevor
darauf aufbauende Entscheidungen übernommen werden.

## Grundregeln

- **DO:** MSFS 2024, das EFB-SDK und Coherent GT als eigene Laufzeit behandeln.
  Verhalten wird aus SDK-Dokumentation, installiertem SDK, Samples und
  Laufzeitnachweisen abgeleitet.
- **DON'T:** Verhalten aus Browser-, React-, DOM- oder Betriebssystemkonventionen
  ableiten. Ein erfolgreicher Build beweist nichts über das Laufzeitverhalten.
- **DO:** Das installierte SDK und seine Samples strikt read-only behandeln.
  Bearbeitet werden ausschließlich die nach `msfs/PackageSources/` kopierten
  Quellen.
- **DO:** Bei unklarem Eventpfad zuerst eng begrenztes diagnostisches Logging
  ausliefern, den Übergang im Simulator reproduzieren und Events, Reihenfolge
  und Payloads dokumentieren. Erst danach Produktivlogik daran binden.
- **DON'T:** Wirkungslose Listener „für später“ im Code lassen. Sie erzeugen
  Wartungslast und den falschen Eindruck einer vorhandenen Funktion.

## Paket, Projekt und Build

### Was funktioniert

- **[DOC]** Paketdefinition als `AssetPackage` mit `ContentType MISC`, einer
  `ContentInfo`-Assetgruppe und einer `Copy`-Assetgruppe. Die App landet unter
  `.\html_ui\efb_ui\efb_apps\VRChecklist\`; nur der Inhalt von
  `PackageSources/VRChecklist/dist/` wird kopiert.
- **[DOC]** `VRChecklistProject.xml` mit `Version="2"`, `FolderName="Packages"`,
  `MetadataFolderName="PackagesMetadata"` und
  `TemporaryOutputDirectory="_PackageInt"`.
- **[RT]** Kommandozeilenbau ohne Project-Editor-GUI mit
  `<SDK>\Tools\bin\fspackagetool.exe <Projekt.xml> -rebuild -mirroring -nopause`.
  `-mirroring` entfernt veraltete Dateien aus einem früheren Build.
- **[RT]** `manifest.json` muss `export_type: "Community"` und eine dreiteilige
  `package_version` tragen. Dieser Wert ist die in My Library angezeigte
  Version.
- **[RT]** Jede ausgelieferte Datei muss in `layout.json` stehen. Die
  Release-Prüfung vergleicht Paketinhalt und `layout.json` gegeneinander.
- **[RT]** Pfade im Paket sind kleingeschrieben zu vergleichen; die
  Release-Verifikation prüft gegen
  `/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.js`, `…/vrchecklist.css`
  und `…/assets/app-icon.svg`.
- **[RT]** Wird dasselbe Paket parallel im DevMode gebaut und über ein
  Community-Paket installiert, hat die DevMode-Version im VFS Vorrang. Das
  installierte Community-Paket muss für Entwicklungsiterationen nicht
  deaktiviert werden.

### Bundling

- **[DOC]** `@microsoft/msfs-sdk` und `@workingtitlesim/garminsdk` werden nicht
  gebündelt, sondern über `@fal-works/esbuild-plugin-global-externals` auf die
  Laufzeit-Globals `msfssdk` beziehungsweise `garminsdk` (`type: "cjs"`)
  gemappt. **DON'T:** Diese Pakete in das Bundle ziehen.
- **[DOC]** JSX wird über `jsxFactory: FSComponent.buildComponent` und
  `jsxFragmentFactory: FSComponent.Fragment` erzeugt, nicht über React.
- **[DOC]** Build-Target ist `es2017` mit `keepNames: true`.
- **[DOC]** SCSS wird über `postcss-prefix-selector` mit dem Prefix
  `.efb-view.<AppVerzeichnisname>` isoliert. Ohne diesen Prefix wirken Regeln
  global im EFB.
- **[DOC]** Assets werden über das Define `BASE_URL` adressiert:
  `coui://html_ui/efb_ui/efb_apps/VRChecklist`. **DON'T:** Relative Pfade oder
  `http(s)://` verwenden.
- **[RT]** Release-Builds laufen mit `MINIFY=true`, `SOURCE_MAPS=false`,
  `TYPECHECKING=true`. Die Release-Prüfung schlägt fehl, wenn eine `.map`-Datei
  oder eine `sourceMappingURL` im Paket verbleibt.

### Iterationsablauf

```text
Source ändern → task deploy → Build All In Project → Ignore Cache + Reload → im EFB testen
```

- **[RT]** Für reine UI-Änderungen ist weder ein Neustart von MSFS 2024 noch ein
  neuer Flug nötig.
- **[RT]** Ein neuer Flug ist nur für Lifecycle- und Reset-Verhalten
  erforderlich.
- **[RT]** Ohne **Ignore Cache** im Coherent Debugger liefert `Reload` unter
  Umständen den alten Stand aus.

## App-Registrierung und EFB-Lifecycle

- **[DOC]** Registrierung über `Efb.use(<AppKlasse>)`; die App-Klasse erbt von
  `App` und liefert `name`, `icon`, `BootMode`, `SuspendMode`, `install()` und
  `render()`.
- **[DOC]** Verwendete Werte: `AppBootMode.COLD` und `AppSuspendMode.SLEEP`.
- **[DOC]** Eigene Styles werden in `install()` über
  ``Efb.loadCss(`${BASE_URL}/VRChecklist.css`)`` geladen.
- **[DOC]** `compatibleAircraftModels` liefert `undefined`; die App erscheint
  dadurch im EFB aller Flugzeuge.
- **[DOC]** Die View erbt von `AppView`. `onResume()`, `onPause()` und
  `onClose()` sind die verlässlichen Hooks: Listener registrieren in
  `onResume()`, Timer und DOM-Listener abbauen in `onPause()`, Listener
  vollständig abmelden in `onClose()`.
- **[RT]** Die EFB-App bleibt resident: Sie kann einen Flugwechsel überleben,
  ohne dass `onResume()` erneut feuert. Siehe „Flug-Lifecycle“.
- **[RT]** MSFS kann den EFB-App-Kontext bei einem Wechsel zwischen VR und
  Nicht-VR neu erzeugen. In-Memory-Zustand geht dabei verloren.

## Laufzeit-Globals und Typen

- **[DOC]** `SimVar`, `RegisterViewListener`, `ViewListener`, `GameState` und
  `Coherent` sind ambiente Globals aus `@microsoft/msfs-types` und werden
  **nicht** importiert.
- **[DOC]** Aus `@microsoft/msfs-sdk` werden unter anderem importiert:
  `FSComponent`, `Subject`, `Subscription`, `MappedSubscribable`,
  `NodeReference`, `SimVarValueType`, `GameStateProvider`, `DataStore`.
- **[DO]** Jeden SimVar- und `DataStore`-Zugriff in `try`/`catch` kapseln und
  im Fehlerfall auf einen definierten Ersatzwert zurückfallen. Fehlerhafte
  Zugriffe dürfen die App nicht anhalten.

## SimVars und Environment-Variablen

| Variable | Typ | Zweck | Nachweis |
| --- | --- | --- | --- |
| `ATC MODEL` | String (bis 128 Zeichen) | Flugzeugidentität, Match-Regeln | **[RT]** |
| `ATC TYPE` | String | Flugzeugidentität, Match-Regeln | **[RT]** |
| `TITLE` | String | Flugzeugidentität, Match-Regeln | **[RT]** |
| `E:IS IN VR` | Bool | Erkennung des Darstellungsmodus | **[RT]** |
| `E:SIMULATION TIME` | Sekunden | Ableitung der Simulatorsitzung | **[RT]** |

- **[RT]** Die drei Identitätswerte werden vor dem Vergleich normalisiert
  (trimmen, Großschreibung, alles außer `A-Z0-9` entfernen). Ohne Normalisierung
  scheitern Vergleiche an Lokalisierungs-Tokens und Sonderzeichen.
- **[RT]** Reale beobachtete Identitäten:
  - MH-60: `60 | $$:MH-60 | MH60 Tango`
  - G36: `TT:ATCCOM.AC_MODEL_BE36.0.text | TT:ATCCOM.ATC_NAME_BEECHCFRAFT.0.text | Beechcraft Bonanza`
- **[RT]** Bei gestreamten Asobo-Paketen (Beispiel H125) liegen die
  `aircraft.cfg`-Werte in geschützten `fsarchive`-Dateien und stehen nicht als
  Referenz zur Verfügung. Die Match-Regel stützt sich dann auf einen eindeutigen
  Teilstring des sichtbaren Titels.
- **[RT]** `E:SIMULATION TIME` liefert die aktive Dauer der Sitzung in Sekunden.
  `Date.now() - Dauer` ergibt einen stabilen Sitzungsstart, der einen
  MSFS-Neustart erkennbar macht (Toleranz im Projekt: 5 Sekunden).
- **[RT]** Die Auswahl greift bereits im Free-Flight-Konfigurationsbildschirm;
  ein dort vorgenommener Flugzeugwechsel zieht die Checkliste im geöffneten EFB
  nach.
- **DON'T:** String-SimVars pro Frame lesen. Im Projekt sind sie
  ereignisgesteuert plus langsamer Fallback angebunden.

## Flug-Lifecycle und Reset

### Der bestätigte Pfad

- **[DOC]/[RT]** Die globale JavaScript-Flow-API liefert die Flug-Lifecycle-Events
  über den Communication-API-Listener:

  ```ts
  const listener = RegisterViewListener("JS_LISTENER_COMM_BUS", () => { /* ready */ });
  listener.on("__FLOW_API__", handler);
  // in onClose():
  listener.off("__FLOW_API__", handler);
  listener.unregister();
  ```

- **[RT]** Die Payload ist ein JSON-String mit numerischer `event`-ID und
  optionalem `flt_path`. Nicht parsebare Payloads werden geloggt und verworfen.
- **[RT]** Event-IDs (SDK 1.7.3):

  | ID | Name | ID | Name |
  | ---: | --- | ---: | --- |
  | 0 | `None` | 9 | `BackToMainMenu` |
  | 1 | `FltLoad` | 10 | `RTCStart` |
  | 2 | `FltLoaded` | 11 | `RTCEnd` |
  | 3 | `TeleportStart` | 12 | `ReplayStart` |
  | 4 | `TeleportDone` | 13 | `ReplayEnd` |
  | 5 | `BackOnTrackStart` | 14 | `FlightStart` |
  | 6 | `BackOnTrackDone` | 15 | `FlightEnd` |
  | 7 | `SkipStart` | 16 | `PlaneCrash` |
  | 8 | `SkipDone` | | |

- **[RT]** Beobachtete Sequenz beim Wechsel von einem Free Flight in den nächsten
  mit demselben Flugzeug, während `GameStateProvider` durchgehend `ingame`
  meldet und die Flugzeugidentität unverändert bleibt:

  ```text
  FlightEnd
  FltLoad / FltLoaded   apron.flt
  FltLoad / FltLoaded   CustomFlight.FLT
  TeleportStart / TeleportDone
  FlightStart, danach ein weiterer apron.flt-Load und RTCStart / RTCEnd
  ```

- **DO:** Den Reset an `FltLoad` binden und **idempotent** halten. Innerhalb
  einer Ladesequenz treten mehrere `FltLoad` auf; das ist normal.
- **[RT]** Gegenversuch bestanden: ESC → Settings → Save → Resume sendet kein
  `FltLoad` und behält den Fortschritt.

### Was nicht funktioniert

- **[NEG]** `GameModeManager.isInMenu` ist als Reset-Signal ungeeignet. Der
  Wechsel `false → true → false` tritt beim Verlassen eines Fluges **und** beim
  Öffnen des Config-Menüs identisch auf; beide Fälle sind nicht unterscheidbar.
- **[NEG]** `GameStateProvider` allein reicht nicht. Bei einem Flugwechsel
  innerhalb derselben Sitzung kann der Game-State durchgehend `ingame` bleiben,
  sodass kein `GameState.loading` beobachtet wird.
- **[NEG]** Eine eigene WASM-Brücke ist für diese Events nicht erforderlich; der
  Flow-API-Kanal genügt.
- **DON'T:** Den Reset auf `FlightEnd` vorziehen. Das ist eine bewusste
  Produktentscheidung: Der Fortschritt bleibt bis zum Laden des nächsten Fluges
  lesbar (siehe `design-decisions.md`).

### Zusätzlicher Fallback

- **[RT]** `GameState.loading` löst weiterhin einen Reset aus, wenn es
  beobachtet wird.
- **[RT]** Solange die View aktiv ist, prüft ein Timer alle zehn Sekunden die
  Flugzeugidentität. Er ist ausschließlich Absicherung der **Flugzeugauswahl**,
  nicht Erkennung eines neuen Fluges, und wird bei pausierter App gestoppt.
- **DON'T:** Diese Absicherung durch eine reine Lifecycle-Lösung ersetzen. Die
  residente EFB-App kann einen Free-Flight-Wechsel überleben, ohne ein
  zuverlässiges View- oder Game-State-Ereignis zu erhalten.

## Persistenz mit `DataStore`

- **[RT]** Der SDK-`DataStore` überlebt eine Neuerstellung des EFB-App-Kontexts,
  wie sie beim Wechsel zwischen VR und Nicht-VR auftritt.
- **[RT]** Er überlebt außerdem einen zeitnahen vollständigen Neustart des
  Simulators. **DON'T:** `DataStore` als flüchtigen Sitzungsspeicher behandeln.
- **[RT]** Wirksame Absicherungen im Projekt:
  1. Der Snapshot entsteht ausschließlich bei einem tatsächlich erkannten
     Wechsel von `E:IS IN VR`.
  2. Er ist eine Einmal-Übergabe mit maximal 15 Sekunden Gültigkeit und wird
     nach dem Wiederherstellen sofort gelöscht.
  3. Simulatorsitzung (`E:SIMULATION TIME`), Flugzeugidentität, Checklisten-ID
     und Checklistenrevision müssen übereinstimmen.
  4. Der gespeicherte Ziel-Darstellungsmodus muss dem aktuellen entsprechen.
- **DO:** Den Schlüssel versionieren (`…progress.v3`) und veraltete Schlüssel
  beim Start aktiv entfernen.
- **[RT]** Der residente In-Memory-Zustand der App hat kein Timeout. Ein
  abgelaufener `DataStore`-Snapshot beendet den Fortschritt also **nicht**;
  dafür ist ausschließlich der `FltLoad`-Reset zuständig.

## Darstellungsmodus VR

- **[RT]** `E:IS IN VR` ist die verlässliche Quelle für den Darstellungsmodus.
- **[RT]** Ein `resize`-Event auf `window` ist der ereignisgesteuerte Auslöser
  für die Neuauswertung; der langsame Flugzeug-Fallback deckt den Fall ab, dass
  eine residente App kein brauchbares Resize-Event erhält.
- **[RT]** MSFS vergrößert die gesamte EFB-Darstellung in VR. **DON'T:** Das mit
  einem globalen CSS-Transform gegenskalieren – Layoutbreiten und
  Interaktionsziele werden dadurch instabil. Stattdessen ein eigenes
  Dichteprofil verwenden.
- **[RT]** Ein VR-Wechsel ist kein neuer Flug und sendet kein `FltLoad`; er darf
  den Fortschritt nicht zurücksetzen.

## Eingaben: nachgewiesen nicht verfügbar

Ziel war, mit der MSFS-EFB-Aktion `VALIDATE` das erste offene Item zu
bestätigen. Unter SDK 1.7.3 erreichte in einer sichtbaren Custom-EFB-App
**kein** getesteter Pfad einen Callback:

- **[NEG]** DOM-`keydown` für Enter, Return und Numpad Enter.
- **[NEG]** EFB-`InputStackListener` für `KEY_EFB_VALID` auf `released`.
- **[NEG]** `KEY_EFB_VALID` und `KEY_MENU_WM_VALIDATE` auf `pressed` nach
  gemeldeter Stack-Bereitschaft. Die Registrierung war erfolgreich, der Callback
  blieb aus.
- **[NEG]** `AppView.routeGamepadInteractionEvent(GamepadEvents.BUTTON_A)`,
  geprüft mit ENT und mit einem physischen Gamepad.

Nebenbefund: **[RT]** Die Warnung zu bereits aktivierten Gamepad-Inputs stammt
aus `atlasapp.js` und nicht aus dieser App.

- **DON'T:** L- oder B-Events ohne nachgewiesene Zuordnung als Ersatz raten.
- **DON'T:** Auf Eingaben pollen.
- **[OPEN]** Eine Wiederaufnahme setzt einen dokumentierten und im
  Custom-App-Kontext bestätigten Eingabepfad oder ein bewusst definiertes
  eigenes externes Event voraus.

## Coherent GT: Rendering und CSS

- **[RT]** Ein erfolgreicher Build sagt nichts über die Darstellung aus. Jede
  visuelle Änderung wird im EFB geprüft, Screenshot-Vergleiche in
  Originalauflösung.
- **DO:** Konservatives CSS – Flexbox, explizite Größen, Margins.
- **DON'T:** Moderne Sizing-Funktionen, `gap` und echtes `position: sticky` ohne
  vorherigen Laufzeitnachweis einsetzen.
- **[RT]** Der sticky wirkende Bereich ist eine feste Flex-Struktur: App-Header
  und Abschnittsnavigation liegen außerhalb des einzigen scrollenden
  Item-Containers. **DON'T:** Das wieder auf CSS Sticky umstellen.
- **[RT]** Coherent reserviert etwa 10 Pixel für die vertikale Scrollbar und
  rendert die Itemkante einige Pixel weiter innen. Im Projekt wird die Scrollbar
  dauerhaft reserviert (`overflow-y: scroll`) und der reservierte Bereich über
  `margin-right: -15px` in das rechte Außenpadding verschoben, damit sich die
  sichtbare Breite bei wechselndem Overflow nicht ändert.
- **[RT]** Die globalen EFB-Styles für `Button`/`.abstract-button` überschreiben
  lokale Hover-, Focus-, Selected- und Active-Regeln und können eine weiße
  Umrandung ergänzen. Geerbte Transitions verzögern die Hover-Rückmeldung
  spürbar; im Projekt sind sie gezielt mit `transition: none !important`
  abgeschaltet. **DO:** Alle Zustände mit der echten EFB-Komponente prüfen.
- **[RT]** Für bedeutungstragende Symbole nicht auf Unicode-Fontabdeckung
  vertrauen. Das X der Checkbox wird mit den Pseudoelementen `::before`/`::after`
  gezeichnet.
- **[RT]** Coherent GT respektiert eine vererbte SVG-Füllung nicht zuverlässig.
  Ein konturbasierter Pfad wurde ausgefüllt dargestellt, obwohl das Root-SVG
  eine transparente Füllung deklarierte. **DO:** `fill="none"` auf **jedem**
  konturbasierten Pfad ausdrücklich deklarieren.

## Branding und My Library

- **[DOC]/[RT]** Community-My-Library-Bilder verwenden seit SDK 1.5.3 exakt
  360 × 240 Pixel. Ein abweichendes Format (geprüft: 412 × 170) wird
  beschnitten.
- **[RT]** Titel, Hersteller und Version stellt MSFS aus den Paketmetadaten dar.
  **DON'T:** Einen Versionswert in das Thumbnail einbetten – er läuft
  zwangsläufig gegen `package_version` auseinander.
- **[RT]** Das EFB-App-Icon ist im 26 × 27-Pixel-Raster zu prüfen, und zwar in
  der EFB-App-Liste in den Zuständen normal, Hover und ausgewählt sowie
  zusätzlich in VR.

## Performance

- **DO:** Event-first arbeiten. Keine Logik pro Render-Frame.
- **DO:** Periodische Arbeit nur als begründeten, langsamen Fallback zulassen und
  bei nicht sichtbarer App vollständig stoppen.
- **[RT]** Im Projekt existiert genau ein solcher Timer (zehn Sekunden,
  Flugzeugauswahl) sowie ein kurzlebiger Timeout für die Snapshot-Übergabe.
- MSFS-Framerate ist ein eigenständiges Qualitätskriterium; ein bequemeres
  Verhalten darf nicht unbemerkt zu ihren Lasten gehen.

## Offene Punkte

- **[OPEN]** Der Rundweg Nicht-VR → VR → Nicht-VR wurde nach der Umstellung auf
  die Flow-API nicht erneut geprüft. Er war in der Phase-1-Abnahme erfolgreich,
  und ein Display-Mode-Wechsel erzeugt kein `FltLoad`, sodass die Einmal-Übergabe
  im `DataStore` unberührt bleiben sollte. Eine Abweichung wird als neuer
  Bugreport behandelt.
- **[OPEN]** Der Rückkanal der Communication API zu einer lokalen Begleit-App
  über SimConnect ist geplant, aber noch nicht implementiert oder verifiziert.
  Grundlage bleibt der dokumentierte Kanal `JS_LISTENER_COMM_BUS`; eine direkte,
  undokumentierte Verbindung der EFB-WebView zu `localhost` ist ausgeschlossen.
  Siehe `phase-2-tech-stack-plan.md`.
- **[OPEN]** Ein Eingabepfad für `VALIDATE` in Custom-Apps existiert unter
  SDK 1.7.3 nicht; siehe oben.

## Quellen

- [EFB Template Sample](https://docs.flightsimulator.com/msfs2024/retail/samples-tutorials/samples/efb/efb-template-sample/)
- [Electronic Flight Bag API](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/efb/electronic-flight-bag-api/)
- [JavaScript Flow API](https://docs.flightsimulator.com/msfs2024/html/6_Programming_APIs/JavaScript/Flow_API/Flow_API.htm)
- [Simulation Variables](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/simvars/simulation-variables/)
- [Key Events](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/key-events/key-events-index/)
- [Project Editor](https://docs.flightsimulator.com/msfs2024/flighting/devmode/editors/project-editor/the-project-editor/)
- [SDK Release Notes (360 × 240 My-Library-Bilder)](https://docs.flightsimulator.com/msfs2024/retail/introduction/sdk-release-notes/)
- Installiertes SDK 1.7.3 einschließlich `FlowAircraft`-Sample (read-only)
