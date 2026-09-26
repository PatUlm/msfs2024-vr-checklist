# ADR 0013: Projektlizenz

Status: Akzeptiert (2026-09-26). Ersetzt aus
[ADR 0001](0001-lizenz-und-veroeffentlichungsstrategie.md) die Festlegung,
dass der eigene Code `UNLICENSED` bleibt.

## Problem

Für die Open-Source-Veröffentlichung brauchen eigener Code und eigene Inhalte
eine Lizenz und einen Rechteinhaber. Der Bestand enthält zugleich fremde Teile
mit eigenen Bedingungen.

## Entscheidung

- Eigener Code und eigene Inhalte (Checklistendaten, Dokumentation, Branding)
  stehen gemeinsam unter der [MIT-Lizenz](../../LICENSE).
- Rechteinhaber im Copyright-Hinweis ist das Pseudonym `PatUlm`, passend zur
  anonymisierten Veröffentlichung.

## Konsequenzen

- Ausgenommen sind aus dem MSFS-SDK übernommene Teile und Drittkomponenten,
  deren Bedingungen [license-audit.md](../license-audit.md) klärt, sowie die
  Audioaufnahmen unter eigenen [Audiobedingungen](../../assets/audio/LICENSE).
  Die README grenzt sie ab; der Bestand wird nie pauschal als vollständig MIT
  bezeichnet.
- GPL scheidet aus, weil EFB-App und Companion auf proprietären Teilen
  (MSFS-SDK, `SimConnect.dll`) aufbauen. Apache-2.0 und MPL-2.0 brächten
  Forks zusätzliche Pflichten ohne nennenswerten Nutzen für das Add-on.
- MIT erlaubt auch geschlossene und kommerzielle Weiterverwendung; nur
  Copyright- und Lizenzhinweis müssen erhalten bleiben.
- Die Auswahlregeln für Abhängigkeiten aus ADR 0001 gelten weiter.
