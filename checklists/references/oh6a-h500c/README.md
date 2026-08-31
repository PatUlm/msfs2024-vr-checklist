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
einen gemeinsamen Start-, Takeoff- und Shutdown-Kern für OH-6A und H500C. Die
unterschiedlichen stabilisierten Leerlaufbereiche bleiben als Variantenwert
erhalten: 61–65 % N1 für H500C/250-C20 und 62–67 % N1 für OH-6A/250-C18.
Variantenspezifische Systemtests und der H500C-Deceleration-Test sind in dieser
ersten kompakten Fassung bewusst nicht enthalten.

## Identitätszuordnung

Das installierte Paket führt die Varianten als `OH6A` und `500C`; das
Produktmanifest nennt `OH6A Hughes`. Die vorläufigen `TITLE`-Regeln verwenden
daher die normalisierten Merkmale `OH6A` und `H500C`. Die tatsächlichen Werte
von `ATC MODEL`, `ATC TYPE` und `TITLE` müssen für beide Varianten noch im
Simulator bestätigt werden; diese Aufgabe steht in `docs/open-tests.md`.
