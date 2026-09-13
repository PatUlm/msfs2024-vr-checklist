# Cessna 152 reference

Quelle: Cessna Aircraft Company, *Model 152 Pilot's Operating Handbook*,
Normal Procedures, Seitenstand 18. April 1980; bereitgestellt als
[1981-C152-POH.pdf](https://aceshighaviation.com/wp-content/uploads/2020/10/1981-C152-POH.pdf)
von Aces High Aviation. Abgerufen am 7. September 2026.

Lokale Originalkopie: `checklists/source/Cessna 152 POH 1981.pdf`.
Die verwendeten Fakten sind maschinenlesbar in
`checklists/source/Cessna 152 POH 1981.facts.json` erfasst und wurden direkt
an den gescannten Originalseiten geprüft.

Die App schreibt die Einheit wie die bestehenden Checklisten als `kt`.
Alle C152-Geschwindigkeiten beziehen sich auf IAS (im POH: KIAS); der
Entwurf nennt dies bei der ersten Geschwindigkeitsangabe. `Vr` kennzeichnet
das Anheben der Nase, `Vy` die beste Steigrate und `Vapp` den gewählten
Endanflugwert. Die 85-kt-Klappengrenze wird als `Vfe` bezeichnet
(POH 2-4, PDF-Seite 11: oberes Ende des weißen Bogens). Der normale
75-kt-Steigflug hat hier kein eigenes V-Kürzel.

## Ableitung für die Simulator-App

| Thema | POH-Seite (PDF-Seite) | Grundlage und kompakte Auswahl |
| --- | --- | --- |
| Startklappen | 4-8 (27) | Erlaubt 0–10°; für den normalen Start gewählt: 0°. |
| Rotation | 4-8 (27) | Nase bei 50 KIAS anheben. |
| Steigflug | 4-3 (24), 4-8 (27) | Normal 70–80 KIAS: gewählt 75 KIAS, Klappen eingefahren. Vy separat als Hinweis: 67 KIAS auf Meereshöhe, 61 KIAS auf 10.000 ft. |
| Gemisch | 4-8/4-9 (27) | Im Steigflug oberhalb 3.000 ft für maximale RPM abmagern; vor der Landung voll reich. |
| Anflugklappen | 4-9 (27) | Nach Bedarf unter 85 KIAS; 10° ist eine gewählte Zwischenstufe, keine feste POH-Vorgabe. |
| Landeklappen und Geschwindigkeit | 4-3 (24), 4-9 (27) | Normaler Endanflug mit 30° und 55–65 KIAS: gewählt 60 KIAS. Kein Aufsetzgeschwindigkeits-Sollwert. |

Bewusst unvollständige Merkhilfe für die angefragten Werte, keine vollständige
Normal- oder Kurzplatzcheckliste. Klappen- und Geschwindigkeitsauswahl beziehen
sich auf einen normalen Anflug ohne besondere Windbedingungen.

## Identitätszuordnung

Am 7. September 2026 lieferte der Companion-Kopierbutton die folgenden
unveränderten MSFS-Werte; der Benutzer bestätigte den kopierten Text:

```text
ATC MODEL: TT:ATCCOM.AC_MODEL C152.0.text
ATC TYPE: TT:ATCCOM.ATC_NAME CESSNA.0.text
TITLE: Cessna C152 Aerial Advertising
```

Die Regel verwendet daraus `AC_MODEL C152` und hängt damit weder vom
umgebenden Lokalisierungs-Token noch von der Titelvariante ab. Zusätzliche
`ATC TYPE`- oder `TITLE`-Regeln werden nicht benötigt.
