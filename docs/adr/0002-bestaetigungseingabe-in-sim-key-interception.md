# ADR 0002: Bestätigungseingabe über In-Sim-Key-Interception

- **Status:** Akzeptiert — in MSFS bestätigt am 2026-08-27 für Starrflügler.
  Der Hubschraubertest steht aus und kann die Entscheidung kippen.
- **Datum:** 2026-08-26, Eventwahl korrigiert am 2026-08-27
- **Betrifft:** Phase 2
- **Grundlage:** Fakten in
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md), Abschnitt „Eingaben";
  Herleitung in [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitt 2; offene Tests in [`../open-tests.md`](../open-tests.md)

## Kontext

Der Pilot soll den nächsten offenen Checklistenpunkt mit einem einzigen Druck
bestätigen, im VR-Cockpit, ohne Blick auf den Desktop. Der ursprünglich
vorgesehene Weg über die MSFS-EFB-Aktion `VALIDATE` ist unter SDK 1.7.3
nachweislich nicht erreichbar; vier getestete Pfade sind als `[NEG]`
dokumentiert.

Die Recherche hat die Ursache dieser Fehlschläge gefunden und einen bisher nicht
geprüften Weg aufgedeckt. Die Ursache: Alle `KEY_EFB_*`-Actions tragen in
`Tools/Setup_InputProfiles/action.actiondb` das Tag `norebind_kbmpad` und sind
für Tastatur, Maus und Pad überhaupt nicht belegbar — der
`InputStackListener` konnte für `KEY_EFB_VALID` also nie feuern.

Der neue Weg wurde im ausgelieferten MSFS-2024-Paket des kommerziellen Addons
BeyondATC gefunden: Ein JS-Kontext kann ein benanntes Sim-Key-Event abfangen und
direkt in JavaScript empfangen, über `RegisterViewListener('JS_LISTENER_KEYEVENT')`,
`Coherent.call('INTERCEPT_KEY_EVENT', key, flag)` und das Event `keyIntercepted`.
Die API liegt bereits als `KeyEventManager` im vendorten
`@microsoft/msfs-sdk` 2.1.1.

## Entscheidung

Die Bestätigung wird **in der EFB-App selbst** empfangen, über ein abgefangenes
Sim-Key-Event. Damit braucht Phase 2 keine Windows-App, keinen Tastaturhook und
keine Windows-Eingabe-API.

Der Auslöser ist **`LEAD_POLE_ON`**, die Schleppstange des
Segelflugzeugschlepps. Die ursprünglich empfohlene Wahl `AUTOCOORD_ON` ist
widerlegt: Ein Event ohne Wirkung wird gar nicht erzeugt. Brauchbar ist nur ein
real implementiertes Event, dessen System das geflogene Flugzeug nicht besitzt —
dann ist es zugleich zuverlässig und folgenlos und braucht keine Maskierung.

Die Wahl ist **nicht konfigurierbar**, solange das Paket privat bleibt. Sie wird
es, sobald es an Fremde geht: Ein für unsere Flotte folgenloses Event kann in
einer anderen ein reales System bedienen.

## Begründung

- Der Nutzen kommt mit dem kleinsten möglichen Eingriff, ohne zweiten Prozess.
- Datenschutz: Die App erfährt nur, dass *dieses eine* Event ausgelöst wurde —
  nicht, welche Taste oder welcher Knopf es war. Kein Hook, kein Fokusproblem.
- Fokusunabhängig vom Desktop. Der MSFS-2024-VR-Fokusverlust trifft jeden
  externen, fokusabhängigen Weg, diesen nicht.
- Die Eingabewahl bleibt beim Nutzer: Er belegt das Event in den
  MSFS-Steuerungen mit beliebigem Gerät, HOTAS eingeschlossen.
- Keine neue Abhängigkeit; die API liegt im bereits vendorten SDK.

## Verworfene Alternativen

- **DirectInput auf einen HOTAS-Knopf in einer Begleit-App.** Belegter Weg nach
  dem OpenKneeboard-Muster, fokusunabhängig. Verworfen als *erster* Schritt
  wegen Geräte-GUID- und Hot-Plug-Verwaltung. **Bleibt die Rückfallebene**,
  falls der Hubschraubertest fällt.
- **Low-Level-Keyboard-Hook.** Sieht jeden Tastenanschlag des Systems und
  widerspricht der Datenschutzzusage. Ausgeschlossen.
- **VR-Controller-Buttons.** Per OpenXR-Spezifikation verschlossen, solange MSFS
  die Session hält.
- **`SimConnect_TransmitClientEvent` aus einer externen App.** Umgeht die
  JS-Interception laut Asobo. Für diesen Zweck ausgeschlossen.

## Konsequenzen

- Abgefangen wird mit `passThrough = true`, also **nie maskiert**. Es gibt
  keinen Unregister-Aufruf; eine nicht gesetzte Maske ist die einzige, die man
  nicht bereut.
- Ein Druck kann mehrfach zustellen. Die App entprellt mit 60 ms und registriert
  einen Key je JS-Kontext nur einmal.
- Das Event wird auch bei geschlossener EFB zugestellt. Die auslösende Logik ist
  gegen den Sichtbarkeitszustand der `AppView` gegated.
- Der Nutzer muss die Belegung selbst in den MSFS-Steuerungen setzen. Das gehört
  in die Dokumentation und später in einen Hinweis in der App.
- Der Mechanismus ist **benannt, aber nicht als API-Vertrag zugesagt**. Bei
  jedem Sim-Update erneut zu prüfen.
