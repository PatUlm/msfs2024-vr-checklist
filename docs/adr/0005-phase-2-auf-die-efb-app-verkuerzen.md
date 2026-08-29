# ADR 0005: Phase 2 auf die EFB-App verkürzen

- **Status:** Akzeptiert
- **Datum:** 2026-08-26
- **Betrifft:** Phasenzuschnitt in `ROADMAP.md`
- **Grundlage:** [ADR 0002](0002-bestaetigungseingabe-in-sim-key-interception.md)

## Kontext

Phase 2 war bisher definiert als „funktionierende Begleit-App mit Abhaken per
Tastendruck und Fortschrittsanzeige". Diese Definition entstand unter der
Annahme, dass eine externe Windows-App die *einzige* Möglichkeit ist, einen
Tastendruck in die EFB-App zu bekommen — weil die MSFS-EFB-Aktion `VALIDATE`
nachweislich nicht erreichbar ist.

Die Recherche hat diese Annahme widerlegt. Der In-Sim-Weg über
`INTERCEPT_KEY_EVENT` kann den Tastendruck direkt in der EFB-App empfangen,
ohne externen Prozess. Damit steht die Begründung für die Begleit-App in Phase 2
nicht mehr.

## Entscheidung

**Phase 2 ist die EFB-App allein:** Abhaken des ersten offenen Items per
Tastendruck oder HOTAS-Knopf, empfangen direkt im EFB-Kontext. Keine
Windows-App.

**Begleit-App, Rückkanal und Fortschrittsanzeige wandern nach Phase 3**, wo sie
gemeinsam mit der Sprachausgabe entstehen — die dieselbe App und dasselbe
Abschlussereignis braucht.

## Begründung

- Der Nutzen kommt sofort und mit dem kleinsten möglichen Eingriff: Abhaken per
  Tastendruck ist die eigentliche VR-Verbesserung, und sie braucht nach dem
  neuen Befund keinen zweiten Prozess.
- Begleit-App und Sprachausgabe gehören technisch zusammen. Sie in zwei Phasen
  zu trennen hieß, die App zweimal anzufassen: einmal für die Anzeige, einmal
  für Audio, Geräteauswahl und Einstellungen.
- Der Zuschnitt hält den Umfang jeder Phase klein genug, um sie in einem Zug
  abzuschließen.

## Verworfene Alternativen

- **Phase 2 wie bisher definiert lassen**, also EFB-App plus Begleit-App mit
  Anzeige. Das Argument dafür ist ernst zu nehmen: Der Rückkanal ist der größte
  technische Risikoposten des Projekts, und die Fortschrittsanzeige wäre der
  ehrlichste Test dafür, dass er wirklich funktioniert. Verworfen, weil damit
  eine vollständige Windows-App in Phase 2 entstehen müsste, deren einziger
  Zweck eine Anzeige ist, die niemand braucht, solange es keine Sprachausgabe
  gibt.
- **Phase 2 erweitern** um Tray, Statusanzeige, Gerätewahl und
  Einstellungsfenster, damit Phase 3 nur noch Audio ergänzt. Verworfen aus
  demselben Grund, verstärkt: noch mehr Vorleistung ohne Nutzen.

## Konsequenzen

- **Der Rückkanal bleibt in Phase 2 unbewiesen.** Das ist der bewusst
  eingegangene Preis. Die Entscheidung für den CommBus
  ([ADR 0003](0003-transportkanal-commbus-ueber-simconnect.md)) und für den
  Stack ([ADR 0004](0004-stack-der-begleit-app.md)) ist trotzdem jetzt
  getroffen, damit Phase 3 nicht bei Null anfängt — beide bleiben deshalb im
  Status „Vorgeschlagen" beziehungsweise mit offenen Punkten.
- Der Laufzeitnachweis des CommBus-Kanals kann bei Gelegenheit vorgezogen
  werden, ohne dass Phase 2 daran hängt.
- Roadmap und Produktdokumentation verwenden diesen Phasenzuschnitt.
- Der für den Zuschnitt nötige gemeinsame In-Sim-Auslöser ist für G36, DA42,
  H125 und MH-60 gefunden; siehe
  [ADR 0002](0002-bestaetigungseingabe-in-sim-key-interception.md).
