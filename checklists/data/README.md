# Strukturierte Checklistendaten

`checklist.schema.json` definiert das versionierbare Austauschformat der EFB-App. `challenge` und `response` enthalten die kanonischen, direkt darstell- und vorlesbaren Texte. Varianten und Bedingungen werden getrennt in `alternatives` beziehungsweise `condition` erfasst. Die strukturierten Daten sind bewusst von Aufbau und Format der ursprünglichen Quelldokumente entkoppelt.

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
