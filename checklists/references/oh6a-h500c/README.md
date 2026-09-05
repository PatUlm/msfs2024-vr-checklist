# OH-6A / H500C references

Dieser Ordner dokumentiert die eng begrenzte Herkunft der kompakten
OH-6A-/H500C-Checklistendaten. Die Ableitung dient ausschließlich der
Simulator-App und ersetzt kein für einen realen Hubschrauber freigegebenes
Flughandbuch.

## Primärquelle des Add-ons

- Dokument: *OH6A - H500C - Flight Manual*
- Herausgeber: Taog's Hangar
- Produktseite:
  <https://www.taogshangar.com/oh6a-cayuse-msfs242>
- Handbuch:
  <https://msfs.dev-pset.com/assets/docs/OH6A-H500C-MANUAL.pdf>
- Abgerufen: 2026-08-31
- Installiertes Marketplace-Paket: `taog-oh6a-cayuse`, Version `1.1.9`
- Verwendete PDF-Seiten: 27 bis 33, insbesondere `Preflight Internal Cockpit
  Checks`, `Engine Start`, `Engine Run-up`, `Before Takeoff` und `Shutdown`

Die App-Checkliste reduziert die ausführliche Expert-Checkliste des Add-ons auf
einen vom Benutzer festgelegten gemeinsamen Start-, Takeoff- und Shutdown-Kern
für OH-6A und H500C. Die Beleuchtung fasst den Handbucheintrag `Lights (Cabin,
Panel, Instruments) – AS REQUIRED` kompakt zusammen. Weder die interne
Cockpitprüfung noch der Motorstart und Run-up des Handbuchs nennen eine Fuel
Pump; deshalb enthält auch die kompakte Checkliste keinen solchen Schritt.
Variantenspezifische Systemtests und der H500C-Deceleration-Test sind bewusst
nicht enthalten.

## Identitätszuordnung

Das installierte Paket führt die Varianten als `OH6A` und `500C`; das
Produktmanifest nennt `OH6A Hughes`. Die `TITLE`-Regeln verwenden daher die
normalisierten Merkmale `OH6A` und `H500C`. Beide Regeln sind am 2026-09-05
im Simulator bestätigt; die H500C meldet `ATC MODEL` `H500C`, `ATC TYPE`
`Hughes` und `TITLE` `H500C`. Die Bestätigungseingabe `SET PLASMA OFF`
funktioniert in beiden Varianten.
