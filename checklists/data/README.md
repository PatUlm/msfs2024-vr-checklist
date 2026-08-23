# Strukturierte Checklistendaten

`checklist.schema.json` definiert das versionierbare Austauschformat der EFB-App. `challenge` und `response` enthalten die kanonischen, direkt darstell- und vorlesbaren Texte. Varianten und Bedingungen werden getrennt in `alternatives` beziehungsweise `condition` erfasst und nicht in `response` wiederholt. Ergänzende Anzeigeinformationen, die weder Antwort noch Bedingung sind, stehen in `notes`. Die strukturierten Daten sind bewusst von Aufbau und Format der ursprünglichen Quelldokumente entkoppelt.

Verbindliche Schreibweisen und die inhaltliche Abgrenzung von Challenge und
Response stehen im [`style-guide.md`](style-guide.md). Er ist bei jeder
inhaltlichen Änderung zusammen mit diesem Dokument zu beachten.

Textfelder bleiben einzeilig; die spätere Oberfläche übernimmt das visuelle Wrapping. Dadurch enthalten die Daten keine aus Tabellenlayouts übernommenen Zeilenumbrüche.

Die JSON-Dateien in diesem Verzeichnis sind die einzige Quelle für Checklist-Inhalte. Anwendungscode darf keine separate oder duplizierte Checklist-Liste enthalten.

`aircraft.msfsMatches` enthält explizite Regeln für die String-SimVars
`ATC MODEL`, `ATC TYPE` und `TITLE`. Mehrere Regeln werden als Alternativen
behandelt; alle Felder innerhalb einer Regel müssen gemeinsam passen. Jedes Feld
verwendet bewusst entweder `equals` oder `contains`. Vor dem Vergleich
normalisiert die App Groß-/Kleinschreibung, Leerzeichen und Satzzeichen.
`contains` muss mindestens vier normalisierte Zeichen enthalten. Neue Regeln
werden erst nach Beobachtung im MSFS ergänzt. Mehrdeutige Treffer laden aus
Sicherheitsgründen keine Checkliste. Bei einer fehlenden Zuordnung zeigt der
Leerzustand alle drei Werte in einer `Model:`-Zeile an.

Beispiel für eine kombinierte Regel:

```json
{
  "atcType": { "contains": "MH-60" },
  "title": { "contains": "MH60" }
}
```

Die erste TTS-Sprache ist Englisch. Für einfache Einträge bildet die App den gesprochenen Text aus `<challenge>: <response>`. Das optionale Feld `speech` überschreibt diesen Fallback mit einem vollständig formulierten Satz, wenn Bedingungen, Alternativen, Abkürzungen oder Aussprache sonst nicht zuverlässig wiedergegeben würden.

Unklare Inhalte werden mit `needsReview: true` markiert. `reviewNote` beschreibt konkret, was noch geprüft werden muss, damit die App diesen Hinweis später sichtbar in der Checklistenansicht darstellen kann.

## IDs und Reihenfolge

Checklist-, Abschnitts- und Eintrags-IDs sind stabile semantische Slugs in `lower-kebab-case`. Eine Eintrags-ID muss innerhalb ihres Abschnitts eindeutig sein. Vollständige Referenzen werden hierarchisch zusammengesetzt, zum Beispiel `sikorsky-mh-60/engine-start/engine-1-start`.

IDs werden nach ihrer erstmaligen Vergabe nicht automatisch aus dem Anzeigetext neu erzeugt. Textänderungen und neu eingefügte Einträge verändern daher keine bestehenden Referenzen.

Die Reihenfolge wird ausschließlich durch die JSON-Arrays festgelegt: `sections[]` bestimmt die Abschnittsreihenfolge, `items[]` die Eintragsreihenfolge. Ein separates `order`-Feld ist nicht vorgesehen.

Die strukturellen Invarianten lassen sich ohne zusätzliche Abhängigkeiten prüfen:

```powershell
node scripts/validate-checklists.mjs
```

Quelldokumente unter `checklists/source/` dienen ausschließlich als lokale Referenz und werden nicht von Git versioniert. Die JSON-Dateien in diesem Verzeichnis sind die prüfbaren, versionierbaren Daten für die Anwendung.
