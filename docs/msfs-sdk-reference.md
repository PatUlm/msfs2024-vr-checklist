# MSFS-2024-SDK: bestätigte Fakten, Do's und Don'ts

Dieses Dokument ist die zentrale technische Referenz für das Verhalten des
MSFS-2024-SDK, der EFB-API und der Coherent-GT-Laufzeit in diesem Projekt. Es
bündelt Wissen, das zuvor über `AGENTS.md`, `README.md`,
`docs/design-decisions.md`, `docs/design-qa.md`, `docs/vr-test-preparation.md`,
`docs/release.md`, `CHANGELOG.md` und Quellcodekommentare verteilt war.

Geltungsbereich sind ausschließlich SDK-, Laufzeit- und Paketierungsfragen.
Produktentscheidungen stehen weiter in `design-decisions.md`, offene visuelle
Abweichungen in `design-qa.md`, der Release-Ablauf in `release.md`.

Hier steht **was gilt**. Warum wir es wissen, welche Alternativen es gab und was
gegen sie spricht, steht in [`phase-2-3-research.md`](phase-2-3-research.md);
die daraus getroffenen Entscheidungen stehen in den ADRs unter `adr/`.

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
- **[OPEN]** Ob dabei stets **genau eine** Instanz lebt, ist nicht belegt. Das
  gemeldete Verhalten in 0.1.6 passt auch dazu, dass die VR- und die
  Nicht-VR-Darstellung als **zwei parallele Instanzen** nebeneinander laufen.
  **DON'T:** Korrektheit an die Ein-Instanz-Annahme binden; siehe
  [ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md). Die
  Instanz-ID im Log (`App instance … created/resumed/paused/closed`) beantwortet
  die Frage beim nächsten Teststand.

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
| `E:SIMULATION TIME` | Sekunden | Erkennung eines MSFS-Neustarts | **[RT]** |

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
- **[RT]** `E:SIMULATION TIME` liefert die **aktive** Dauer der Sitzung in
  Sekunden. Der Wert steigt innerhalb einer Sitzung monoton und beginnt nach
  einem Neustart wieder bei null. Verwendet wird ausschließlich diese
  Monotonie: Ein gespeicherter Wert, der über dem aktuellen liegt, stammt aus
  einer früheren Sitzung (Toleranz im Projekt: 5 Sekunden).
- **DON'T:** Daraus über `Date.now() - Dauer` einen Sitzungsstart ableiten und
  auf Gleichheit prüfen. Der Zähler steht bei pausiertem Simulator still, der
  abgeleitete Startzeitpunkt wandert dadurch mit jeder Pause. Über eine kurze
  Frist fällt das nicht auf, über eine ganze Sitzung verwirft es gültigen
  Fortschritt.
- **[RT]** Mit 0.1.7 bestätigt: Eine Simulatorpause von über einer Minute lässt
  den Fortschritt unangetastet.
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
- **[DO]** Den Checklistenfortschritt als **geteilten Zustand der
  Simulatorsitzung** im `DataStore` führen, nicht als Zustand einer
  App-Instanz. Jede Zustandsänderung schreibt den Datensatz, jede Instanz
  gleicht sich mit ihm ab. Entscheidung und Begründung:
  [ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md).
- **[DO]** Beim Abgleich den eigenen letzten `savedAt` merken und nur einen
  Datensatz mit größerem `savedAt` übernehmen. Sonst überschreiben sich zwei
  gleichzeitig lebende Instanzen gegenseitig.
- **[DO]** Den maßgeblichen Zustand nicht an eine Annahme über den
  EFB-App-Lifecycle binden. **DON'T:** Eine befristete Einmal-Übergabe bauen,
  die voraussetzt, dass genau eine Instanz lebt — siehe den Bugreport zum
  getrennten VR-/Nicht-VR-Zustand in `design-qa.md`.
- **[RT]** Wirksame Absicherungen im Projekt, mit 0.1.7 einzeln in MSFS
  bestätigt:
  1. Flugzeugidentität, Checklisten-ID und Checklistenrevision müssen
     übereinstimmen.
  2. `FltLoad` und der Ladezustand `GameState.loading` löschen den Datensatz.
  3. Ein Checklistenwechsel löscht den Datensatz der verlassenen Checkliste.
  4. Ein MSFS-Neustart wird an der Monotonie von `E:SIMULATION TIME` erkannt.
- **DO:** Den Schlüssel versionieren (`…progress.v4`) und veraltete Schlüssel
  beim Start aktiv entfernen.
- **[RT]** Der Fortschritt hat kein Timeout. Er endet ausschließlich an den vier
  Bedingungen oben, nicht durch Zeitablauf.

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
- **[RT]** Mit 0.1.7 ist der Rundweg VR → Nicht-VR → VR mit abgehakten Items in
  **beiden** Modi bestätigt: Der Fortschritt ist danach in beiden Modi
  vollständig. Bis 0.1.6 verhielten sich die Modi wie zwei getrennte Zustände;
  die Ursache und der Umbau stehen in
  [ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md).

## Eingaben

Der Pilot bestätigt das nächste offene Item über ein **abgefangenes
Sim-Key-Event**. Die Entscheidung steht in
[ADR 0002](adr/0002-bestaetigungseingabe-in-sim-key-interception.md), die
Herleitung in [`phase-2-3-research.md`](phase-2-3-research.md), Abschnitt 2.

**Der Mechanismus.** `RegisterViewListener('JS_LISTENER_KEYEVENT')`,
`Coherent.call('INTERCEPT_KEY_EVENT', key, passThrough ? 0 : 1)`, Event
`keyIntercepted`. Im SDK vorhanden als `KeyEventManager` in
`@microsoft/msfs-sdk` 2.1.1, Bus-Topic `key_intercept`.

- **[RT]** Der Mechanismus funktioniert in einer sichtbaren Custom-EFB-App,
  über Tastatur und über HOTAS. Registrierung im Konstruktor der `AppView`
  genügt, `AppBootMode.COLD` steht nicht entgegen. Payload eines Drucks:
  `value0 = value1 = value2 = 0`, kein Down/Up-Flag.
- **[FORUM]** **Es gibt keinen Unregister-Aufruf.** Ein gesetzter Intercept
  gilt bis zum Ende der View. **DO:** Nur mit `passThrough = true` abfangen,
  also nie maskieren — eine nicht gesetzte Maske ist die einzige, die man nicht
  bereut.
- **[RT]** **Ein Druck kann mehrfach zustellen.** Jede erneute Registrierung
  desselben Keys in derselben Sitzung fügt eine Zustellung hinzu, und jedes
  `Ignore Cache + Reload` sowie jeder VR-Wechsel registriert erneut. Duplikate
  liegen 0 bis 3 ms auseinander. **DO:** Entprellen und einen Key je JS-Kontext
  nur einmal registrieren.
- **[RT]** Das Event wird **auch bei geschlossener EFB** zugestellt. **DO:** Die
  auslösende Logik gegen den Sichtbarkeitszustand der `AppView` gaten.

**Die Wahl des Events** ist der eigentlich schwierige Teil.

- **[NEG]** **Ein Event ohne Wirkung wird nicht erzeugt.** `AUTOCOORD_ON`, von
  der Doku als „Not used in the simulation" geführt, lieferte konfliktfrei
  belegt auf Taste und HOTAS-Knopf nichts. **DON'T:** Ein Event wählen, weil die
  Doku es als folgenlos führt.
- **[RT]** **DO:** Ein **real implementiertes** Event wählen, dessen System das
  geflogene Flugzeug nicht besitzt. Bestätigt ankommend: `SPRAY_ON`,
  `GRAPPLE_HOOK_ON`, `LEAD_POLE_ON`, `SKYDIVE_DOORLIGHTS_JUMP`. Gewählt ist
  `LEAD_POLE_ON`.
- **[SDK]** **DON'T:** `SPRAY_*` verwenden — die H125 bindet es selbst
  (`Bind_Key_Events`, `EVENT_ID SPRAY`, `Interior_Behavior.xml:674`). **DON'T:**
  `GRAPPLE_HOOK_*` verwenden, solange der Lastenhaken der MH-60 ungeprüft ist.
  Die MH-60-Rettungswinde hängt an eigenen `HOIST_*`-Events.
- **DO:** Vor der Wahl das Model Behavior der eigenen Flugzeuge gegen den
  Eventnamen prüfen. Ein `Bind_Key_Events`-Eintrag heißt, das Flugzeug nutzt es.
- **[SDK]** Ein leeres `TT_Tag` in `Tools/Setup_InputProfiles/action.actiondb`
  heißt „in den Steuerungsoptionen frei belegbar". Der Key-Event-Name ist der
  Action-Name ohne `KEY_`-Präfix.
- **[RT]** Der Input-Context entscheidet mit: `AIRCRAFT` und `PLANE` sind im
  Cockpit aktiv, `ATC` nur bei offenem ATC-Menü, `DEVMODE` nur im Devmode.
  **DON'T:** Mit einem kontextgebundenen Event testen — sein Schweigen beweist
  nichts.

**Nicht verfügbar.** Die MSFS-EFB-Aktion `VALIDATE` ist unerreichbar:

- **[NEG]** DOM-`keydown`, EFB-`InputStackListener` auf `KEY_EFB_VALID` und
  `KEY_MENU_WM_VALIDATE`, `AppView.routeGamepadInteractionEvent(BUTTON_A)` —
  keiner erreichte einen Callback. **[SDK]** Ursache: Alle 22
  `KEY_EFB_*`-Actions tragen das Tag `norebind_kbmpad` und sind für Tastatur,
  Maus und Pad nicht belegbar.
- **[SDK]** Was das Steuerungsmenü als `VALIDATE` anzeigt, ist
  `KEY_DEVMODE_VALIDATE` aus dem Devmode-Kontext — nicht die EFB-Aktion.
- **[NEG]** **`SimConnect_TransmitClientEvent` umgeht die JS-Interception**
  (Asobo, 2024-02-27). Eine externe App erreicht die EFB-App **nicht** über
  Key-Events. Dasselbe gilt für `trigger_key_event` und
  `execute_calculator_code`.
- **DON'T:** Auf Eingaben pollen. **DON'T:** L- oder B-Events ohne nachgewiesene
  Zuordnung als Ersatz raten.

**Belegungen des Nutzers auslesen.** Der Anzeigename im Steuerungsmenü lässt
sich aus dem SDK nicht auflösen; das locPak fehlt dort.

- **[RT]** Die Belegungen einer Steam-Installation liegen als XML unter
  `Steam/userdata/<SteamID>/2537590/remote/inputprofile_*`, ein Profil je Gerät,
  geschrieben beim Beenden von MSFS. MSFS kombiniert **mehrere Profile je
  Gerät** — für eine Konfliktprüfung sind alle zu vereinigen.
- **DO:** Einen Anzeigenamen auflösen, indem man ihn auf eine eindeutige
  Kombination legt, MSFS beendet und gegen einen vorher gezogenen Stand diffed.
- **DO:** Vor jedem Eingabetest prüfen, dass die Eingabe **belegt** und **nicht
  doppelt belegt** ist. Eine unbelegte Aktion erscheint als selbstschließendes
  `<Action …/>`; ein Regex über `<Action>…</Action>` liest sonst die Belegung
  der folgenden Aktion.

Der offiziell für EFB gedachte `InputStackListener` (`JS_LISTENER_INPUT_STACK`,
`addInputAction`) bleibt daneben nutzbar, aber nur für die fest verdrahteten
`KEY_EFB_*`-Gamepad-Actions. Die ältere `InputsListener`-Variante ist
`@deprecated`.

## Kommunikationskanal zu einer externen Anwendung

Der Transportweg zwischen einem prozessexternen SimConnect-Client und dem
JavaScript-Kontext der EFB-App ist **dokumentiert vorhanden** und braucht kein
WASM-Modul. Kandidatenvergleich, Risiken und die noch offenen Nachweise stehen
in [`phase-2-3-research.md`](phase-2-3-research.md), Abschnitt 1.

- **[SDK]** SimConnect hat die CommBus-Funktionen:
  `SimConnect_CallCommBusEvent`, `SimConnect_SubscribeToCommBusEvent`,
  `SimConnect_UnsubscribeFromCommBusEvent` in
  `SimConnect SDK/include/SimConnect.h:1130-1132`;
  `SIMCONNECT_COMM_BUS_BROADCAST_TO_JS = 1<<0` bei `:438-445`;
  `SIMCONNECT_RECV_COMM_BUS` bei `:997-1001`. Eingeführt mit SDK 1.6.4
  („Added possibility to use CommBus with Simconnect"), in 1.7.3 enthalten.
- **[SAMPLE]** Vollständiger bidirektionaler Client:
  `Samples/VisualStudio/SimConnectSamples/CommBus/CommBus.cpp`, JS-Gegenstück im
  `WasmAircraft`-Sample.
- **[DOC]** Der Eventname muss auf der SimConnect-Seite **nicht** vorab
  registriert werden. Nachrichten in Richtung Client kommen **gechunkt** über
  `dwEntryNumber`/`dwOutOf`; die Reassembly ist Pflicht.
- **[RT]** Der CommBus ist **nicht paket- oder view-lokal**: Unsere EFB-App
  empfängt über `RegisterViewListener("JS_LISTENER_COMM_BUS")` Flow-API-Events
  unter `__FLOW_API__`, die aus dem Sim-Kern und damit von außerhalb unseres
  Pakets stammen (`VRChecklist.tsx:337-341`).
- **[OSS]** `node-simconnect` 4.2.0 (LGPL-3.0-or-later) implementiert die
  CommBus-Pakete in reinem TypeScript über die Named Pipe, ohne `SimConnect.dll`
  und ohne Compiler. Die Aufrufe sind auf `Protocol.SunRise` gegated, also
  MSFS 2024 exklusiv.
- **[DOC]** Es gibt **keine** Typisierung: „CommBus" kommt in
  `@microsoft/msfs-sdk` 2.1.1 und 2.3.3, in `@microsoft/msfs-types` 1.14.6 und
  in `@efb/efb-api` 1.0.3 nicht vor. Anbindung per eigener Ambient-Deklaration.
- **[DOC]** Known Issue: Bei **pausierter Simulation** laufen WASM und
  SimConnect weiter, **JavaScript nicht**. Events an JS werden gequeued und erst
  beim Fortsetzen verarbeitet; bei Stau ist ein Freeze möglich. **DO:** Der
  Rückkanal sendet nur bei Zustandsänderung und mit Ratenbegrenzung.
- **[DOC]** SDK 1.7.3 enthält den Fix für „rare random deadlocks when using the
  CommBus API" — die API hatte Deadlock-Fehler.
- **[NEG]** Client Data Areas allein erreichen den EFB-Kontext **nicht**; es gibt
  keine JS-API dafür. Nur zusammen mit einem WASM-Modul nutzbar.
- **[NEG]** LVars als Kanal erfordern auf der SimConnect-Seite periodische
  Requests, also Polling; durch die Projektregeln ausgeschlossen. Ein externer
  Client kann auch keinen H-Event direkt senden.

Zur **Client-Seite** dieses Kanals:

- **[SDK]** Die native `SimConnect.dll` exportiert 117 undekorierte
  `extern "C"`-Funktionen, einschließlich aller sechs Client-Data-Funktionen und
  der drei CommBus-Funktionen. P/Invoke oder FFI ist damit unproblematisch; der
  Managed-Wrapper wird nicht gebraucht.
- **[NEG]** `Microsoft.FlightSimulator.SimConnect.dll` ist unter .NET 8, 9 und
  10 **nicht ladbar**. PE-Analyse der SDK-1.7.3-Datei: COR20-Flags `0x10`
  (`ILONLY=false`, `NATIVE_ENTRYPOINT=true`), Section `.nep`, Imports
  `mscoree.dll` und `VCRUNTIME140.dll`, Target `.NETFramework 4.6.1`. Es ist
  eine Mixed-Mode-C++/CLI-Assembly; NativeAOT schließt C++/CLI ausdrücklich aus.
- **[DOC]** Der **MSFS-SDK-EULA** („MS Flight Simulator SDK EULA (11/2019)",
  im installierten SDK) verbietet in §2(e) „share, publish, distribute, or lend
  the Software (except for any distributable code, subject to the terms above)".
  „Distributable code" wird nicht definiert, „SimConnect" kommt im EULA nicht
  vor. Gegenläufig liefert das SDK `SimConnect SDK/installer/SimConnect.msi`
  mit. **DON'T:** Die `SimConnect.dll` ohne geklärte Rechtslage in ein eigenes
  Auslieferungspaket legen. **DO:** Entweder den Nutzer die mitgelieferte
  `SimConnect.msi` installieren lassen oder eine Bindung verwenden, die die DLL
  nicht braucht.
- **[DOC]** Randnotiz: §1(g) desselben EULA verbietet die Nutzung des SDK für
  „AI or machine learning".

Zum **localhost-Weg** (`WebSocket` oder `fetch` aus dem Coherent-GT-JS):

- **[SHIP]** Er funktioniert empirisch, auch im EFB-Kontext — das ausgelieferte
  Paket `mamudesign-efb-animatelifts` ruft `fetch("http://localhost:8080/")`
  direkt aus einer EFB-App auf; BeyondATC und FlyByWire nutzen WebSockets aus
  In-Sim-JS.
- **[DOC]** Er ist **nirgends dokumentiert**: „WebSocket" kommt im gesamten SDK
  1.7.3 und in der SDK-Doku nicht vor, ebenso keine CSP-, CORS- oder
  Whitelist-Angabe. Die einzige dokumentierte Netzwerk-API (WASM) ist
  ausdrücklich auf HTTPS beschränkt und kann localhost gerade nicht.
- **[FORUM]** Asobo hat zwei Coherent-GT-Fehler bestätigt: „Websockets not being
  cleaned up" (Fix in SU10) und **„Multiple WebSocket creation in JS causes
  CTD"** — Absturz in `CoherentUIGT.dll` ab etwa 60 bis 100 Sockets. **Ein
  leckender Reconnect-Loop kann den Simulator zum Absturz bringen.**
- Die Projektregel „keine undokumentierte localhost-Verbindung aus der
  EFB-WebView, kein lokaler Webserver im EFB-Kontext" bleibt bis zu einer
  ausdrücklichen Gegenentscheidung in Kraft.

## Werkzeugkette: WASM ohne Visual Studio

Nur relevant, falls je ein eigenes WASM-Modul gebraucht wird.

- **[SDK]** Der Compiler liegt im SDK: `WASM/llvm/bin/{clang-cl.exe,
  wasm-ld.exe, llvm-ar.exe}` plus `WASM/wasi-sysroot/` und
  `WASM/WasmVersions/MSFS_WasmVersions.a`. `clang-cl.exe` meldet
  `clang version 15.0.1` aus Asobos öffentlichem LLVM-Fork.
- **[RT]** Ein SDK-Sample wurde aus WSL2 ohne Visual Studio, ohne MSVC und ohne
  MSBuild zu einer `.wasm` kompiliert und gelinkt. `-fms-extensions` ist
  zwingend, sonst scheitert `MSFS_WindowsTypes.h:67` an `__int64`. Die Flags
  stehen in [`phase-2-3-research.md`](phase-2-3-research.md), Abschnitt 8.
- **[OPEN]** Ob ein so gebautes Modul im Simulator **lädt**, ist ungeprüft; die
  Referenz-`.wasm` des Samples ist deutlich größer.
- **[DOC]** `fspackagetool.exe` und der Project Editor **kompilieren kein
  WASM**; sie kopieren nur das fertige Modul und bauen `layout.json`.
- **[SHIP]** Ein Standalone-WASM-Paket ist zulässig und real:
  `Packages/Community/mobiflight-event-module/` besteht nur aus
  `manifest.json`, `layout.json` und `modules/*.wasm`.

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

- **[OPEN]** Wie viele EFB-App-Instanzen ein Darstellungswechsel erzeugt, ist
  weiterhin nicht gemessen. Der Punkt ist für die Fortschrittslogik ohne Belang,
  seit sie nicht mehr an der Ein-Instanz-Annahme hängt
  ([ADR 0009](adr/0009-fortschritt-als-geteilter-sitzungszustand.md)); die
  Zeilen `App instance … created/resumed/paused/closed` im Log beantworten ihn
  bei Gelegenheit ohne neuen Build. **DON'T:** Ihn vor der Messung als geklärt
  behandeln.
- **[OPEN]** Der bidirektionale Kanal zwischen EFB-App und einer lokalen
  Begleit-App ist als Phase 3 geplant, aber weder implementiert noch
  verifiziert. Der **Transportweg ist inzwischen dokumentiert belegt** und
  braucht kein WASM-Modul; die Fakten stehen oben unter
  „Kommunikationskanal zu einer externen Anwendung", die Kandidatenbewertung in
  `phase-2-3-research.md`. Offen bleiben vier Nachweise: ob ein selbst benannter
  CommBus-Event von SimConnect in der EFB-App ankommt, wie die EFB-App
  zurücksendet, die maximale Nutzlast, und die Lebensdauer der Registrierung bei
  `AppBootMode.COLD` mit `AppSuspendMode.SLEEP` — vor dem ersten Öffnen der App
  existiert derzeit **kein** Empfänger.
- **[OPEN]** Die Bestätigung des ersten offenen Items soll durch ein bewusst
  eigenes Ereignis ausgelöst werden, nicht durch die nicht erreichbare
  EFB-Aktion `VALIDATE`. Als erster Kandidat wird der In-Sim-Weg über
  `INTERCEPT_KEY_EVENT` geprüft (siehe oben); erst wenn der fällt, kommt eine
  systemweite Erkennung in der Begleit-App in Betracht, dann vorzugsweise
  DirectInput auf einen HOTAS-Knopf mit `DISCL_BACKGROUND` statt eines
  Tastaturhooks.
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
