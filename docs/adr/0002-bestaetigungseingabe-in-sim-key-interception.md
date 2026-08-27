# ADR 0002: Bestätigungseingabe über In-Sim-Key-Interception

- **Status:** Vorgeschlagen — der Laufzeitnachweis steht aus
- **Datum:** 2026-08-26
- **Betrifft:** Phase 2
- **Grundlage:** [`../phase-2-3-research.md`](../phase-2-3-research.md),
  Abschnitt 2; normative Fakten in
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md)

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

**Bevor irgendetwas gebaut wird, wird der In-Sim-Weg im Simulator
nachgewiesen.** Der Test läuft mit `AUTOCOORD_ON` und `passThrough = true`,
belegt in den MSFS-Steuerungen einmal mit einer Taste und einmal mit einem
HOTAS-Knopf, und zwingend auch mit **H125 und MH-60**, nicht nur mit einem
Starrflügler.

Trägt der Weg, ist er die Bestätigungseingabe für Phase 2. Fällt er, wird die
Entscheidung neu getroffen; die Rückfallebene wäre DirectInput auf einen
HOTAS-Knopf in einer Begleit-App.

## Begründung

- Der Test kostet einen Deploy-Zyklus und einen Flug und entscheidet die halbe
  Architektur von Phase 2: Trägt er, braucht das Abhaken **keine Windows-App,
  keinen Tastaturhook und keine Windows-Eingabe-API**.
- Er ist datenschutztechnisch allen Alternativen überlegen. Die App erfährt nur,
  dass *dieses eine benannte Event* ausgelöst wurde — nicht einmal, welche Taste
  oder welcher Knopf es war. Kein Hook, keine Angriffsfläche für
  AV-Heuristiken, kein Fokusproblem.
- Er ist fokusunabhängig vom Desktop. Der MSFS-2024-VR-Fokusverlust ist belegt
  und trifft jeden externen, fokusabhängigen Weg.
- Die Eingabewahl bleibt beim Nutzer: Er belegt das Event in den
  MSFS-Steuerungen mit beliebigem Gerät. Eine Joystick- oder HOTAS-Belegung
  löst den Intercept belegt ebenfalls aus.
- Es entsteht keine neue Abhängigkeit.

## Verworfene Alternativen

- **Direkt die externe App mit DirectInput bauen.** Belegter Weg nach dem
  OpenKneeboard-Muster (`DISCL_BACKGROUND | DISCL_NONEXCLUSIVE` plus
  `SetEventNotification`), fokusunabhängig und event-getrieben. Verworfen als
  *erster* Schritt, weil er mehr Code, Geräte-GUID- und Hot-Plug-Verwaltung
  bedeutet und genau in den Problembereich führt, in dem BeyondATCs
  Push-to-Talk in VR bis heute Fehlerberichte sammelt. Bleibt Rückfallebene.
- **Beide Wege parallel bauen.** Maximale Robustheit gegen den offenen
  Hubschrauber-Fehler, aber doppelter Aufwand und zwei Eingabepfade im
  Einstellungsfenster. Verworfen, solange der einfache Weg nicht widerlegt ist.
- **Low-Level-Keyboard-Hook.** Ausgeschlossen: Er sieht jeden Tastenanschlag des
  Systems und widerspricht damit der Datenschutzzusage; er wird bei Timeout
  stillschweigend entfernt; Microsoft empfiehlt selbst Raw Input stattdessen.
- **VR-Controller-Buttons.** Per OpenXR-Spezifikation verschlossen, solange MSFS
  die Session hält.
- **`SimConnect_TransmitClientEvent` aus einer externen App.** Asobo hat
  bestätigt, dass dieser Aufruf die JS-Interception umgeht. Für diesen Zweck
  ausgeschlossen.

## Konsequenzen

- Das Ereignis `AUTOCOORD_ON` wird mit `passThrough = true` abgefangen, also
  **nicht maskiert**. Grund: Es gibt keinen Unregister-Aufruf, ein gesetzter
  Intercept gilt bis zum Ende der View — eine nicht gesetzte Maske ist die
  einzige, die man nicht bereuen kann. Ein Konflikt mit anderen Paketen ist
  damit konstruktiv ausgeschlossen.
- `ATC_MENU_0` ist dauerhaft unbrauchbar, weil das ausgelieferte
  BeyondATC-Toolbar-Paket es maskiert. `ROTOR_BRAKE` ist für unsere
  Hubschrauber-Checklisten ausgeschlossen. Ein `CHECKLIST`-Event existiert,
  würde aber maskiert die Stock-Checkliste lahmlegen.
- Der Nutzer muss die Belegung selbst in den MSFS-Steuerungen setzen. Das gehört
  in die Dokumentation und später in einen Hinweis in der App.
- Der Mechanismus ist **benannt, aber nicht als API-Vertrag zugesagt**: Die
  Doku-Seite `JS_LISTENER_KEYEVENT` ist „Work In Progress" mit leeren
  Beschreibungsspalten. Er ist bei jedem Sim-Update erneut zu prüfen.

## Offene Nachweise

1. Feuert `keyIntercepted` überhaupt in einer **EFB-App**? Belegt ist es nur für
   ein `InGamePanel`.
2. **Hubschrauber.** Asobo hat 2022 bestätigt, dass `INTERCEPT_KEY_EVENT` in
   Hubschraubern nicht feuerte, ohne spätere Fix-Bestätigung und ohne
   MSFS-2024-Datenpunkt. Für H125 und MH-60 ist das der kritische Test.
3. Feuert es bei einer HOTAS-Belegung derselben Aktion? Im Forum belegt, in
   unserem Kontext nicht.
4. Verhalten nach dem VR-Wechsel, der den App-Kontext neu erzeugt — müssen
   Intercepts neu gesetzt werden?
5. Verhalten bei fokussiertem Textfeld in der EFB.
