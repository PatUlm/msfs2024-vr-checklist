# MSFS 2024 VR Checklist

Native, offlinefähige Checklist-App für das Electronic Flight Bag (EFB) von Microsoft Flight Simulator 2024. Entwicklungsumgebung und Beispielchecklisten sind vorbereitet; der native EFB-Prototyp aus Phase 1 ist noch nicht begonnen.

## Verifizierte Entwicklungsumgebung

- Microsoft Flight Simulator 2024 SDK: `1.7.3`
- SDK-Pfad: `C:\MSFS 2024 SDK`
- Offizielles EFB-Sample: `C:\MSFS 2024 SDK\Samples\DevmodeProjects\EFB`
- Node.js: `v24.19.0` (über NVM for Windows)
- npm: `11.17.0`
- MSFS Developer Mode: aktiviert

Das installierte SDK und insbesondere das offizielle EFB-Sample bleiben unverändert. Das Sample dient nur als Referenz. Sobald in Phase 1 das App-Gerüst angelegt wird, werden benötigte Template-Dateien zuerst in dieses Repository übernommen; alle folgenden Befehle werden ausschließlich in der Projektkopie ausgeführt.

## Checklistendaten

Lokale Originaldokumente liegen unter `checklists/source/` und werden unabhängig vom Dateiformat von Git ausgeschlossen. Versioniert werden ausschließlich die daraus abgeleiteten JSON-Datensätze unter `checklists/data/`:

- `diamond-da42.json`: 7 Abschnitte mit 52 Einträgen
- `sikorsky-mh-60.json`: 5 Abschnitte mit 30 Einträgen
- `checklist.schema.json`: gemeinsames JSON-Schema

`challenge` und `response` enthalten die kanonischen, direkt darstell- und vorlesbaren Texte. Varianten und Bedingungen werden getrennt in `alternatives` beziehungsweise `condition` erfasst. Die JSON-Daten sind bewusst von Aufbau und Format der lokalen Quelldokumente entkoppelt.

Für die spätere englische TTS-Ausgabe gilt `<challenge>: <response>` als Fallback. Schwierige Aussprachen, Bedingungen und Alternativen erhalten einen optionalen vollständig formulierten `speech`-Override.

Die beiden DA42-Anzeigen `L GLOWN ON` und `R GLOWN ON` bleiben bis zur Prüfung im Simulator erhalten. Sie sind mit `needsReview: true` und einer konkreten `reviewNote` markiert.

## Build-Ablauf

Die folgenden Schritte gelten erst, nachdem das EFB-Gerüst in einer späteren Phase im Repository angelegt wurde.

1. Abhängigkeiten der kopierten EFB-API installieren:

   ```powershell
   Set-Location '<Projektwurzel>\PackageSources\efb_api'
   npm install
   ```

2. Abhängigkeiten der kopierten App installieren:

   ```powershell
   Set-Location '<Projektwurzel>\PackageSources\<App-Verzeichnis>'
   npm install
   ```

3. Einen einmaligen App-Build erzeugen:

   ```powershell
   npm run build
   ```

   Die gebündelten JavaScript-, CSS- und Asset-Dateien werden unter `dist\` erzeugt. Der Build muss ohne TypeScript- oder esbuild-Fehler enden.

4. Während der Entwicklung kann stattdessen der Watch-Modus laufen:

   ```powershell
   npm run watch
   ```

   Der Watch-Modus aktualisiert `dist\` nach Quelltextänderungen. Danach muss das MSFS-Paket erneut gebaut werden, damit die aktuelle Ausgabe im Simulator verwendet wird.

Die vom SDK-Sample vorgegebenen Entwicklungswerte in `.env` sind `TYPECHECKING=true`, `SOURCE_MAPS=true` und `MINIFY=false`. Produktionswerte werden erst vor einem späteren Release festgelegt.

## Packaging in MSFS 2024

1. Zuerst den App-Build ausführen und prüfen, dass `dist\` vorhanden ist.
2. Microsoft Flight Simulator 2024 mit aktiviertem Developer Mode starten und noch vor dem Start eines Fluges über `File` → `Open project…` die XML-Projektdatei aus diesem Repository öffnen.
3. Falls nötig den Project Editor über `Tools` öffnen.
4. In der Paketdefinition prüfen, dass die `Copy`-Asset-Gruppe als Quelle das `dist\`-Verzeichnis und als Ziel `html_ui\efb_ui\efb_apps\<App-Name>\` verwendet.
5. Im Project Editor `Build All In Project` ausführen. Fehler über `Debug` → `The Console` beziehungsweise `Show Errors` untersuchen.
6. Der Package-Build wird im `Packages\`-Verzeichnis neben der Projektdatei abgelegt und für die aktuelle Simulator-Sitzung temporär eingebunden.

Für eine spätere manuelle Installation oder Weitergabe wird der vollständig erzeugte Paketordner unverändert in den für die jeweilige MSFS-Installation gültigen Community-Ordner kopiert. Marketplace-Export und Veröffentlichung sind nicht Bestandteil der ersten Projektphasen.

## Testablauf

Der erste Smoke-Test erfolgt nach einem erfolgreichen App- und Package-Build:

1. Einen Free-Flight mit einem EFB-fähigen Flugzeug starten; für das erste Sample empfiehlt die offizielle Dokumentation die DA62.
2. Auf dem EFB-Startbildschirm prüfen, dass die App mit korrektem Namen und Symbol erscheint und sich öffnen lässt.
3. Navigation, Schaltflächen, Checkboxen und Scrollverhalten mit Maus beziehungsweise Touch vollständig durchlaufen.
4. Im VR-Modus prüfen, dass Text und Bedienelemente aus normaler Sitzposition gut lesbar, zuverlässig anwählbar und ausreichend groß sind.
5. Mindestens einen vollständigen Checklistendurchlauf testen und sicherstellen, dass jeder Eintrag genau einmal kontrolliert umgeschaltet werden kann.
6. Einen zweiten Flugzeugtyp mit EFB prüfen, um die allgemeine Verfügbarkeit der App zu bestätigen.
7. Test ohne Netzwerkverbindung wiederholen; die Kern-Checkliste muss vollständig funktionieren.
8. Während des Tests die DevMode-Konsole auf JavaScript-, Paket- und Ressourcenfehler prüfen.

Nach Änderungen gilt immer dieselbe Reihenfolge:

```text
Quelltext ändern → App nach dist bauen → Paket im Project Editor bauen → im EFB testen
```

Ein Testlauf wird mit Datum, SDK-Version, Node-/npm-Version, verwendetem Flugzeug, 2D-/VR-Modus und Ergebnis dokumentiert. Die eigentlichen Abnahmetests beginnen erst mit dem Prototyp in Phase 1.

## Offizielle Referenzen

- [EFB Template Sample](https://docs.flightsimulator.com/msfs2024/retail/samples-tutorials/samples/efb/efb-template-sample/)
- [Electronic Flight Bag API](https://docs.flightsimulator.com/msfs2024/flighting/programming-apis/efb/electronic-flight-bag-api/)
- [Project Editor](https://docs.flightsimulator.com/msfs2024/flighting/devmode/editors/project-editor/the-project-editor/)
