# ADR 0009: Checklistenfortschritt als geteilter Sitzungszustand

- **Status:** Akzeptiert
- **Datum:** 2026-08-27
- **Laufzeitnachweis:** am 2026-08-27 in MSFS geführt, siehe „Konsequenzen"
- **Betrifft:** Phase 1, Fortschrittspersistenz in `VRChecklist.tsx`
- **Ersetzt:** die Einmal-Übergabe aus Release 0.1.5, dokumentiert in
  [`../design-decisions.md`](../design-decisions.md) und
  [`../msfs-sdk-reference.md`](../msfs-sdk-reference.md)
- **Grundlage:** Bugreport „VR und Nicht-VR halten getrennten
  Checklistenzustand" gegen Release 0.1.6

## Kontext

Bis einschließlich 0.1.6 lag der Fortschritt **im Arbeitsspeicher der
App-Instanz**. Der `DataStore` diente ausschließlich als kurzlebige
Einmal-Übergabe für genau einen Fall: MSFS zerstört beim Wechsel zwischen VR und
Nicht-VR den EFB-App-Kontext, und der neu erzeugte Kontext soll den Fortschritt
übernehmen. Der Snapshot trug Quell- und Zielmodus, galt 15 Sekunden und wurde
nach dem Wiederherstellen sofort gelöscht.

Diese Konstruktion entstand in 0.1.5, **bevor** die verlässlichen
Flug-Lifecycle-Ereignisse gefunden waren. Die 15 Sekunden waren keine
Eigenschaft des Darstellungswechsels, sondern eine Notbremse: Sie sollten
verhindern, dass ein neuer Free Flight mit demselben Flugzeug abgehakte Items
erbt, wenn MSFS den Ladeübergang verschluckt. Release 0.1.6 hat den Reset dann
direkt an das Flow-API-Ereignis `FltLoad` gebunden und das in MSFS bestätigt.
Damit war der eigentliche Zweck der Frist erfüllt, die Frist selbst blieb aber
stehen.

Der gegen 0.1.6 gemeldete Bug zeigt die Grenze der Annahme: VR und Nicht-VR
verhalten sich, als hätte jeder Modus seinen eigenen Zustand. Wechselt man
zurück, erscheint der frühere Zustand des anderen Modus. Das passt nicht zu
„genau eine Instanz lebt", sondern zu **zwei parallel lebenden App-Instanzen**
mit je eigenem Speicher — mindestens aber zu einem Übergang, der die
15-Sekunden-Frist nicht einhält.

Beide Erklärungen haben dieselbe Ursache: Der maßgebliche Zustand liegt in einer
Instanz, und die Übergabe zwischen Instanzen ist ein eng gefasster Sonderfall,
der genau eine Annahme über den MSFS-Lifecycle voraussetzt.

## Entscheidung

**Der `DataStore`-Datensatz ist der maßgebliche Zustand des
Checklistenfortschritts innerhalb einer Simulatorsitzung. Der
Speicherzustand einer App-Instanz ist nur noch eine Ansicht darauf.**

Konkret:

- **Jede Zustandsänderung schreibt.** Abhaken eines Items und jeder
  Abschnittswechsel schreiben den vollständigen Datensatz.
- **Jede Instanz gleicht ab**, wenn sie eine Änderung verpasst haben kann: beim
  `onResume()`, bei einem erkannten Wechsel von `IS IN VR`, bei den beobachteten
  Flug-Lifecycle-Ereignissen und beim bestehenden langsamen
  Flugzeug-Fallback. Kein neuer Timer, keine Arbeit pro Frame.
- **Wer gewinnt, entscheidet der Zeitstempel.** Eine Instanz merkt sich den
  `savedAt` ihres letzten eigenen Schreibvorgangs. Ein Datensatz mit größerem
  `savedAt` stammt von jemand anderem und wird übernommen; der eigene wird
  übersprungen. Damit können sich zwei Instanzen nicht gegenseitig überschreiben.
- **Keine Frist und keine Einmal-Verwendung mehr.** Der Datensatz endet durch
  einen ausdrücklichen Reset oder durch eine fehlgeschlagene Kompatibilitäts­prüfung,
  nicht durch Zeitablauf.
- **Kein Darstellungsmodus im Datensatz.** `sourceVrMode` und `targetVrMode`
  entfallen. Der Wechsel ist nur noch ein Anlass zum Abgleich, kein Bestandteil
  des Zustands.

Die Lebensdauer des Fortschritts hängt damit ausschließlich an fachlichen
Bedingungen:

| Ereignis | Mechanismus |
| --- | --- |
| Neuer Flug | `FltLoad` und `GameState.loading` löschen den Datensatz |
| Flugzeugwechsel | Flugzeugidentität, Checklisten-ID und -Revision im Datensatz |
| MSFS-Neustart | Monotonie von `E:SIMULATION TIME` |
| Wechsel VR ↔ Nicht-VR | **kein** Reset; ausdrücklich erwünschtes Weiterleben |

## Begründung

- Die Korrektheit hängt nicht mehr davon ab, **ob** MSFS den App-Kontext beim
  Darstellungswechsel neu erzeugt. Kontext-Neuerzeugung, zwei parallele
  Instanzen und eine durchgehend residente Instanz führen zum selben Ergebnis,
  weil alle drei denselben Datensatz lesen und schreiben.
- Der Reset ist an die Ereignisse gebunden, die tatsächlich einen neuen Flug
  bedeuten, statt an eine Frist, die einen Lifecycle nachbildet. Genau das war
  der eigentliche Zweck der Frist, und er ist seit 0.1.6 direkt belegt.
- Die Prüfungen werden dadurch aussagekräftiger: Sie beschreiben, **wozu** der
  Fortschritt gehört (Sitzung, Flugzeug, Checkliste, Revision), statt **wie
  lange** er gelten darf.

## Verworfene Alternativen

- **Die Frist verlängern.** Verworfen: Eine größere Zahl verschiebt das
  Problem nur. Bei zwei parallelen Instanzen hilft keine Frist, weil dort nie
  ein Snapshot geschrieben und gelesen wird, sondern zwei Speicher nebeneinander
  existieren.
- **Die Übergabe zusätzlich an `onPause()`/`onClose()` hängen.** Verworfen: Es
  ist nicht belegt, dass eine Instanz beim Darstellungswechsel überhaupt einen
  dieser Hooks bekommt. Damit bliebe die Korrektheit an einer unbelegten
  Lifecycle-Annahme hängen — dem Fehler, der zu diesem Bug geführt hat.
- **Erst diagnostizieren, dann entscheiden**, wie ursprünglich vorgesehen.
  Teilweise übernommen statt verworfen: Die
  Entscheidung braucht die Diagnose nicht mehr, weil sie unter allen drei
  Hypothesen trägt. Das eng begrenzte Logging wird trotzdem eingebaut, damit
  der Verifikationslauf die offenen Fragen mitbeantwortet.
- **Die abgeleitete Sitzungsstartzeit `Date.now() - E:SIMULATION TIME`
  beibehalten.** Verworfen: `E:SIMULATION TIME` zählt die *aktive* Zeit und
  steht bei pausiertem Simulator still. Über 15 Sekunden fiel das nicht auf,
  über eine ganze Sitzung würde jede Pause den abgeleiteten Startzeitpunkt
  verschieben und gültigen Fortschritt verwerfen. Verwendet wird nur noch die
  Monotonie des Rohwerts.

## Konsequenzen

- **Der Schlüssel wird auf `vr-checklist.progress.v4` gezogen**; `…v3` kommt zu
  den beim Start entfernten veralteten Schlüsseln.
- **Der `DataStore` wird häufiger geschrieben** — einmal pro Abhaken und pro
  Abschnittswechsel statt einmal pro Darstellungswechsel. Das ist an die
  Nutzerinteraktion gebunden, nicht an Frames oder einen Timer.
- **Der langsame Flugzeug-Fallback liest zusätzlich den Datensatz**, also alle
  zehn Sekunden ein `DataStore.get` samt kleinem `JSON.parse`, solange die App
  sichtbar ist. Er bleibt der Sicherungsweg für den Fall, dass eine Instanz
  weder `onResume()` noch ein `resize` erhält.
- **Die Erkennung eines MSFS-Neustarts wird schwächer, aber ehrlicher.** Sie
  greift nicht mehr, wenn eine neue Sitzung bereits über den gespeicherten
  Wert von `E:SIMULATION TIME` hinausgelaufen ist, bevor die App abgleicht. In
  diesem Fall trägt der `FltLoad`-Reset, der vor jedem Flug feuert. Das
  verbleibende Fenster — nach einem Neustart im Menü, vor dem ersten Flug —
  entspricht dem in `design-decisions.md` bereits ausdrücklich akzeptierten
  Verhalten, dass der Fortschritt bis zum Beginn des nächsten Fluges lesbar
  bleibt.
- **Der Laufzeitnachweis ist geführt.** Am 2026-08-27 wurden mit
  `0.1.6-dev.20260827171941` alle vier Fälle in MSFS bestätigt: der Rundweg
  VR → Nicht-VR → VR mit abgehakten Items in beiden Modi, der Reset bei einem
  neuen Flug, der Reset beim Flugzeugwechsel und das Überleben einer
  Simulatorpause von über einer Minute. Der letzte Fall belegt zugleich, dass
  der Verzicht auf den abgeleiteten Sitzungsstart richtig war.
- **Offen bleibt allein die Zählfrage**, wie viele EFB-App-Instanzen ein
  Darstellungswechsel erzeugt. Sie ist für die Korrektheit ohne Belang — genau
  das ist der Zweck dieser Entscheidung — und wird beantwortet, sobald jemand
  die Zeilen `App instance … created/resumed/paused/closed` aus einem Lauf
  mitliest. Der ausstehende Nachweis steht in
  [`../open-tests.md`](../open-tests.md).
- **Die Diagnosezeilen bleiben im Code.** Sie fallen nur bei
  Zustandsübergängen an, nicht periodisch und nicht pro Frame, und sind der
  einzige Weg, die Zählfrage später ohne neuen Build zu beantworten.
