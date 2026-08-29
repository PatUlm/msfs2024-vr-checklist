# Windows-Begleit-App

Dieser Verzeichnisbaum enthält die Windows-Seite von Phase 3. Die EFB-App und
das MSFS-Paket bleiben getrennt unter `../msfs/`; Checklistendaten und später
gemeinsam genutzte Audioassets liegen weiterhin auf Repository-Ebene.

## Struktur

```text
companion/
  src/
    VRChecklist.TransportProbe/   minimaler bidirektionaler CommBus-Nachweis
```

Nach dem Laufzeitnachweis können die Avalonia-App und eine gemeinsam genutzte
Transportbibliothek als weitere Projekte unter `src/` ergänzt werden. Tests
liegen dann parallel unter `tests/`. Der Diagnoseclient wird nicht voreilig zur
Produktoberfläche ausgebaut.

Build und Windows-Deployment werden aus dem Repository-Root mit
`task companion:deploy` gestartet. Das verwaltete Ziel ist standardmäßig
`/mnt/c/dev/msfs2024-vr-checklist-companion-staging`; Laufzeitanleitung und
Voraussetzungen stehen im Root-[README](../README.md).
