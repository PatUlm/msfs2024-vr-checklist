# ADR 0002: Bestätigungseingabe über In-Sim-Key-Interception

- **Status:** Akzeptiert für Starrflügler, bestätigt in MSFS am 2026-08-27.
  **Für Hubschrauber gefallen** am 2026-08-28: `LEAD POLE ON` ist in den
  Steuerungen der MH-60 und der H125 nicht belegbar. Die Entscheidung selbst
  bleibt, der gewählte Auslöser trägt die Flotte nicht; siehe „Nachtrag".
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
  einen Key sparsam. Jeder `FltLoad` markiert die Registrierung als veraltet;
  erneuert wird sie erst nach `RTCEnd` beziehungsweise nach einem beobachteten
  Ende von `GameState.loading`. Ob der Sim den Intercept tatsächlich verwirft
  oder nur seine Zustellung verliert, bleibt mangels Unregister-Abfrage offen.
  Der Rundweg DA42 → H125 → MH-60 → DA42 ist mit dieser Erneuerung in
  `0.2.1-dev.20260828201431` bestätigt.
- Das Event wird auch bei geschlossener EFB zugestellt. Die auslösende Logik ist
  gegen den Sichtbarkeitszustand der `AppView` gegated.
- Der Nutzer muss die Belegung selbst in den MSFS-Steuerungen setzen. Das gehört
  in die Dokumentation und später in einen Hinweis in der App.
- Der Mechanismus ist **benannt, aber nicht als API-Vertrag zugesagt**. Bei
  jedem Sim-Update erneut zu prüfen.

## Nachtrag 2026-08-28: Der Auslöser trägt die Hubschrauber nicht

`LEAD POLE ON` erscheint in den MSFS-Steuerungen nicht, wenn eine MH-60 oder
eine H125 geladen ist. Es ist dort nicht belegbar, und damit ist auch nicht
prüfbar, ob der Sim das Event in einem Hubschrauber erzeugt. Das
Steuerungsmenü zeigt nur Actions der geladenen Flugzeugkategorie; eine
Schleppstange gehört nicht dazu.

Der Mechanismus der Key-Interception ist davon **nicht** betroffen — er ist für
Starrflügler runtime-bestätigt. Gefallen ist allein das Kriterium für die
Eventwahl: „real implementiert, aber vom eigenen Flugzeug nicht besessen"
genügt nicht. Das Event muss zusätzlich **in der Kategorie des geflogenen
Flugzeugs belegbar** sein — und diese beiden Forderungen stehen gegeneinander,
sobald eine Flotte Flächenflugzeuge und Hubschrauber umfasst.

Daraus folgt noch keine Kehrtwende. Offen und vor einer Entscheidung zu prüfen:

1. Gibt es ein Event, das in **beiden** Kategorien belegbar und in beiden
   folgenlos ist? Ein Kandidat aus dem Hubschrauber-Kontext, dessen System die
   Flächenflugzeuge nicht besitzen, wäre gleichwertig brauchbar.
2. Ist ein **zweiter Auslöser** je Kategorie der einfachere Weg? Die App fängt
   beide ab; belegt wird jeweils der, den das Steuerungsmenü anbietet. Kosten:
   der Nutzer belegt zwei Actions.

Bleiben beide Wege verschlossen, greift die in diesem ADR notierte
Rückfallebene DirectInput in einer Begleit-App — dann für Hubschrauber, nicht
für die ganze Flotte. Die offenen Punkte stehen in
[`../open-tests.md`](../open-tests.md).
