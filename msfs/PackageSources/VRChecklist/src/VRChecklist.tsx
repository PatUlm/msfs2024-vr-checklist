import {
  App,
  AppBootMode,
  AppInstallProps,
  AppSuspendMode,
  AppView,
  AppViewProps,
  Button,
  Efb,
  RequiredProps,
  TVNode,
} from "@efb/efb-api";
import {
  FSComponent,
  GameStateProvider,
  MappedSubscribable,
  NodeReference,
  SimVarValueType,
  Subject,
  Subscription,
  VNode,
} from "@microsoft/msfs-sdk";
import beechcraftBonanzaG36Data from "../../../../checklists/data/beechcraft-bonanza-g36.json";
import diamondDa42Data from "../../../../checklists/data/diamond-da42.json";
import sikorskyMh60Data from "../../../../checklists/data/sikorsky-mh-60.json";

import "./VRChecklist.scss";

declare const BASE_URL: string;
declare const APP_VERSION: string;

interface ChecklistAlternative {
  when: string;
  response: string;
}

interface ChecklistItem {
  id: string;
  challenge: string;
  response: string;
  kind: "action" | "verify" | "communication";
  condition?: string;
  alternatives?: ChecklistAlternative[];
  notes?: string[];
  needsReview?: boolean;
  reviewNote?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface AircraftMatchCriterion {
  equals?: string;
  contains?: string;
}

interface AircraftMatchRule {
  atcModel?: AircraftMatchCriterion;
  atcType?: AircraftMatchCriterion;
  title?: AircraftMatchCriterion;
}

interface Checklist {
  id: string;
  title: string;
  aircraft: {
    manufacturer: string;
    model: string;
    msfsMatches: AircraftMatchRule[];
  };
  revision: string;
  sections: ChecklistSection[];
}

interface AircraftIdentity {
  atcModel: string;
  atcType: string;
  title: string;
}

const AIRCRAFT_REFRESH_INTERVAL_MS = 10000;

const checklists = [
  beechcraftBonanzaG36Data as Checklist,
  diamondDa42Data as Checklist,
  sikorskyMh60Data as Checklist,
];

function normalizeMsfsIdentityValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function normalizeAircraftIdentity(
  identity: AircraftIdentity
): AircraftIdentity {
  return {
    atcModel: normalizeMsfsIdentityValue(identity.atcModel),
    atcType: normalizeMsfsIdentityValue(identity.atcType),
    title: normalizeMsfsIdentityValue(identity.title),
  };
}

function matchesAircraftCriterion(
  value: string,
  criterion: AircraftMatchCriterion
): boolean {
  if (criterion.equals !== undefined) {
    return value === normalizeMsfsIdentityValue(criterion.equals);
  }

  if (criterion.contains !== undefined) {
    return value.includes(normalizeMsfsIdentityValue(criterion.contains));
  }

  return false;
}

function matchesAircraftRule(
  identity: AircraftIdentity,
  rule: AircraftMatchRule
): boolean {
  const fields: (keyof AircraftIdentity)[] = ["atcModel", "atcType", "title"];
  let matchedFieldCount = 0;

  for (const field of fields) {
    const criterion = rule[field];

    if (criterion !== undefined) {
      matchedFieldCount += 1;

      if (!matchesAircraftCriterion(identity[field], criterion)) {
        return false;
      }
    }
  }

  return matchedFieldCount > 0;
}

function matchesAircraft(
  checklist: Checklist,
  identity: AircraftIdentity
): boolean {
  return checklist.aircraft.msfsMatches.some((rule) =>
    matchesAircraftRule(identity, rule)
  );
}

class ChecklistRuntimeState {
  public readonly sectionItemsRefs: NodeReference<HTMLDivElement>[];
  public readonly itemStates = new Map<string, Subject<boolean>>();
  public readonly activeSectionIndex = Subject.create(0);
  public readonly completedCount = Subject.create(0);
  public readonly totalItemCount: number;
  public readonly progressText: MappedSubscribable<string>;
  public readonly progressWidth: MappedSubscribable<string>;

  public constructor(public readonly checklist: Checklist) {
    this.sectionItemsRefs = checklist.sections.map(() =>
      FSComponent.createRef<HTMLDivElement>()
    );
    this.totalItemCount = checklist.sections.reduce(
      (total, section) => total + section.items.length,
      0
    );
    this.progressText = this.completedCount.map(
      (completed) => `${completed} / ${this.totalItemCount}`
    );
    this.progressWidth = this.completedCount.map(
      (completed) => `${Math.round((completed / this.totalItemCount) * 100)}%`
    );

    for (const section of checklist.sections) {
      for (const item of section.items) {
        this.itemStates.set(
          this.getItemKey(section.id, item.id),
          Subject.create(false)
        );
      }
    }
  }

  public getItemKey(sectionId: string, itemId: string): string {
    return `${this.checklist.id}/${sectionId}/${itemId}`;
  }

  public getItemState(sectionId: string, itemId: string): Subject<boolean> {
    const itemKey = this.getItemKey(sectionId, itemId);
    const itemState = this.itemStates.get(itemKey);

    if (!itemState) {
      throw new Error(`Missing state for checklist item ${itemKey}`);
    }

    return itemState;
  }

  public updateCompletedCount(): void {
    this.completedCount.set(
      Array.from(this.itemStates.values()).filter((state) => state.get()).length
    );
  }

  public reset(): void {
    for (const itemState of this.itemStates.values()) {
      itemState.set(false);
    }

    this.completedCount.set(0);
    this.activeSectionIndex.set(0);
  }
}

class VRChecklistView extends AppView<RequiredProps<AppViewProps, "bus">> {
  private readonly runtimes = checklists.map(
    (checklist) => new ChecklistRuntimeState(checklist)
  );
  private readonly runtimesByChecklistId = new Map(
    this.runtimes.map((runtime) => [runtime.checklist.id, runtime])
  );
  private readonly selectedChecklistId = Subject.create<string | null>(null);
  private readonly aircraftIdentityText = Subject.create(
    "(leer) | (leer) | (leer)"
  );
  private readonly gameStateSubscription: Subscription;

  /*
   * External VALIDATE input is intentionally disabled for SDK 1.7.3.
   * Runtime tests showed that a visible custom EFB AppView receives none of:
   * - DOM keydown for Enter/Return,
   * - InputStackListener actions KEY_EFB_VALID or KEY_MENU_WM_VALIDATE,
   * - AppView.routeGamepadInteractionEvent(GamepadEvents.BUTTON_A), including
   *   when VALIDATE is tested with a physical gamepad.
   *
   * Do not restore an inactive listener or poll for input. Reintroduce this
   * feature only after MSFS exposes a documented, runtime-verified custom-app
   * input route, or after the project defines its own explicit external event.
   */

  private previousGameState: GameState | undefined;
  private currentAircraftIdentityKey = "";
  private aircraftRefreshTimer: number | undefined;
  private isViewActive = false;

  public constructor(props: RequiredProps<AppViewProps, "bus">) {
    super(props);

    this.gameStateSubscription = GameStateProvider.get().sub(
      (gameState) => this.handleGameStateChanged(gameState),
      true
    );
  }

  private getSelectedRuntime(): ChecklistRuntimeState | undefined {
    const checklistId = this.selectedChecklistId.get();
    return checklistId
      ? this.runtimesByChecklistId.get(checklistId)
      : undefined;
  }

  private readSimVarString(name: string): string {
    try {
      const value = SimVar.GetSimVarValue(name, SimVarValueType.String);
      return typeof value === "string" ? value.trim() : "";
    } catch (error) {
      console.error(`[VR Checklist] Unable to read ${name}`, error);
      return "";
    }
  }

  private readCurrentAircraftIdentity(): AircraftIdentity {
    return {
      atcModel: this.readSimVarString("ATC MODEL"),
      atcType: this.readSimVarString("ATC TYPE"),
      title: this.readSimVarString("TITLE"),
    };
  }

  private updateAircraftDiagnostics(identity: AircraftIdentity): void {
    this.aircraftIdentityText.set(
      [identity.atcModel, identity.atcType, identity.title]
        .map((value) => value || "(leer)")
        .join(" | ")
    );
  }

  private refreshSelectedChecklist(): void {
    if (!this.isViewActive) {
      return;
    }

    // onResume and GameState changes trigger immediate reads. This slow timer
    // only guards against a resident EFB missing both lifecycle signals.
    this.scheduleAircraftRefresh(AIRCRAFT_REFRESH_INTERVAL_MS);

    const identity = this.readCurrentAircraftIdentity();
    this.updateAircraftDiagnostics(identity);

    const normalizedIdentity = normalizeAircraftIdentity(identity);
    const aircraftIdentityKey = [
      normalizedIdentity.atcModel,
      normalizedIdentity.atcType,
      normalizedIdentity.title,
    ].join("|");
    const matchingChecklists = checklists.filter((candidate) =>
      matchesAircraft(candidate, normalizedIdentity)
    );
    const checklist =
      matchingChecklists.length === 1 ? matchingChecklists[0] : undefined;
    const checklistId = checklist?.id ?? null;
    const previousChecklistId = this.selectedChecklistId.get();
    const identityChanged =
      aircraftIdentityKey !== this.currentAircraftIdentityKey;
    const checklistChanged = checklistId !== previousChecklistId;

    if (!identityChanged && !checklistChanged) {
      return;
    }

    if (checklistChanged) {
      this.resetAllChecklists();
    }

    this.currentAircraftIdentityKey = aircraftIdentityKey;
    this.selectedChecklistId.set(checklistId);

    if (checklist) {
      const runtime = this.runtimesByChecklistId.get(checklist.id);

      if (runtime && checklistChanged) {
        this.showSection(runtime, 0);
      }

      console.info(
        `[VR Checklist] Aircraft identity matched ${checklist.id}: ` +
          `${identity.atcModel} | ${identity.atcType} | ${identity.title}`
      );
    } else if (matchingChecklists.length > 1) {
      console.error(
        `[VR Checklist] Ambiguous aircraft identity matched ` +
          `${matchingChecklists
            .map((candidate) => candidate.id)
            .join(", ")}: ` +
          `${identity.atcModel} | ${identity.atcType} | ${identity.title}`
      );
    } else if (aircraftIdentityKey.replace(/\|/g, "").length > 0) {
      console.warn(
        `[VR Checklist] No checklist for aircraft identity: ` +
          `${identity.atcModel} | ${identity.atcType} | ${identity.title}`
      );
    }
  }

  private scheduleAircraftRefresh(delay = 0): void {
    this.cancelAircraftRefresh();

    if (!this.isViewActive) {
      return;
    }

    this.aircraftRefreshTimer = window.setTimeout(() => {
      this.aircraftRefreshTimer = undefined;
      this.refreshSelectedChecklist();
    }, delay);
  }

  private cancelAircraftRefresh(): void {
    if (this.aircraftRefreshTimer !== undefined) {
      window.clearTimeout(this.aircraftRefreshTimer);
      this.aircraftRefreshTimer = undefined;
    }
  }

  private handleGameStateChanged(gameState: GameState | undefined): void {
    const previousGameState = this.previousGameState;
    this.previousGameState = gameState;

    if (
      gameState === GameState.loading &&
      previousGameState !== undefined &&
      previousGameState !== GameState.loading
    ) {
      this.cancelAircraftRefresh();
      this.resetAllChecklists();
      this.currentAircraftIdentityKey = "";
      this.selectedChecklistId.set(null);
      this.updateAircraftDiagnostics({ atcModel: "", atcType: "", title: "" });
      this.scheduleAircraftRefresh(AIRCRAFT_REFRESH_INTERVAL_MS);
      return;
    }

    if (gameState !== undefined && gameState !== GameState.loading) {
      this.scheduleAircraftRefresh(
        previousGameState === GameState.loading ? 300 : 0
      );
    }
  }

  private resetAllChecklists(): void {
    for (const runtime of this.runtimes) {
      runtime.reset();

      for (const sectionItemsRef of runtime.sectionItemsRefs) {
        const sectionItems = sectionItemsRef.getOrDefault();

        if (sectionItems) {
          sectionItems.scrollTop = 0;
        }
      }
    }
  }

  private isSectionComplete(
    runtime: ChecklistRuntimeState,
    section: ChecklistSection
  ): boolean {
    return section.items.every((item) =>
      runtime.getItemState(section.id, item.id).get()
    );
  }

  private showSection(
    runtime: ChecklistRuntimeState,
    sectionIndex: number
  ): void {
    if (sectionIndex < 0 || sectionIndex >= runtime.checklist.sections.length) {
      return;
    }

    runtime.activeSectionIndex.set(sectionIndex);
    const sectionItems = runtime.sectionItemsRefs[sectionIndex].getOrDefault();

    if (sectionItems) {
      sectionItems.scrollTop = 0;
    }
  }

  private toggleItem(
    runtime: ChecklistRuntimeState,
    section: ChecklistSection,
    sectionIndex: number,
    itemState: Subject<boolean>
  ): void {
    const checked = !itemState.get();
    itemState.set(checked);
    runtime.updateCompletedCount();

    if (
      checked &&
      sectionIndex < runtime.checklist.sections.length - 1 &&
      this.isSectionComplete(runtime, section)
    ) {
      window.setTimeout(() => {
        if (
          this.selectedChecklistId.get() === runtime.checklist.id &&
          runtime.activeSectionIndex.get() === sectionIndex &&
          this.isSectionComplete(runtime, section)
        ) {
          this.showSection(runtime, sectionIndex + 1);
        }
      }, 350);
    }
  }

  private renderNavigation(
    runtime: ChecklistRuntimeState,
    sectionIndex: number
  ): VNode {
    const previousSection = runtime.checklist.sections[sectionIndex - 1];
    const nextSection = runtime.checklist.sections[sectionIndex + 1];

    return (
      <nav class="section-navigation" aria-label="Checklist sections">
        <Button
          class={{
            "section-navigation__button": true,
            "section-navigation__button--previous": true,
            "section-navigation__button--disabled":
              previousSection === undefined,
          }}
          disabled={previousSection === undefined}
          callback={(): void => this.showSection(runtime, sectionIndex - 1)}
          aria-label={
            previousSection
              ? `Previous: ${previousSection.title}`
              : "No previous section"
          }
        >
          <span class="section-navigation__arrow" aria-hidden="true">
            ←
          </span>
          <span class="section-navigation__text">
            {previousSection ? (
              <span class="section-navigation__number">
                {String(sectionIndex).padStart(2, "0")}
              </span>
            ) : null}
            <span class="section-navigation__name">
              {previousSection?.title ?? "Start"}
            </span>
          </span>
        </Button>

        <Button
          class={{
            "section-navigation__button": true,
            "section-navigation__button--next": true,
            "section-navigation__button--disabled": nextSection === undefined,
          }}
          disabled={nextSection === undefined}
          callback={(): void => this.showSection(runtime, sectionIndex + 1)}
          aria-label={
            nextSection ? `Next: ${nextSection.title}` : "No next section"
          }
        >
          <span class="section-navigation__text">
            {nextSection ? (
              <span class="section-navigation__number">
                {String(sectionIndex + 2).padStart(2, "0")}
              </span>
            ) : null}
            <span class="section-navigation__name">
              {nextSection?.title ?? "Complete"}
            </span>
          </span>
          <span class="section-navigation__arrow" aria-hidden="true">
            →
          </span>
        </Button>
      </nav>
    );
  }

  private renderItem(
    runtime: ChecklistRuntimeState,
    section: ChecklistSection,
    sectionIndex: number,
    item: ChecklistItem
  ): TVNode<HTMLButtonElement> {
    const itemState = runtime.getItemState(section.id, item.id);
    const hasDetails =
      item.kind !== "action" ||
      item.condition !== undefined ||
      item.alternatives !== undefined ||
      item.notes !== undefined;

    return (
      <Button
        class={{
          "checklist-item": true,
          [`checklist-item--${item.kind}`]: true,
          "checklist-item--complete": itemState,
          "checklist-item--review": item.needsReview === true,
        }}
        selected={itemState}
        callback={(): void =>
          this.toggleItem(runtime, section, sectionIndex, itemState)
        }
        aria-label={`${item.challenge}: ${item.response}`}
        aria-pressed={itemState}
      >
        <span class="checklist-item__body">
          <span class="checklist-item__main">
            <span class="checklist-item__challenge">{item.challenge}</span>
            <span class="checklist-item__leader" aria-hidden="true" />
            <span class="checklist-item__response">{item.response}</span>
          </span>

          {hasDetails && (
            <span class="checklist-item__details">
              {item.kind !== "action" && (
                <span
                  class={`checklist-item__kind checklist-item__kind--${item.kind}`}
                >
                  {item.kind}
                </span>
              )}

              {item.condition && (
                <span class="checklist-item__detail">
                  <span class="checklist-item__detail-label">Condition:</span>
                  {item.condition}
                </span>
              )}

              {item.alternatives?.map((alternative) => (
                <span class="checklist-item__detail checklist-item__detail--alternative">
                  <span class="checklist-item__detail-label">
                    Alternative · {alternative.when}:
                  </span>
                  {alternative.response}
                </span>
              ))}

              {item.notes?.map((note) => (
                <span class="checklist-item__detail">
                  <span class="checklist-item__detail-label">Note:</span>
                  {note}
                </span>
              ))}
            </span>
          )}

          {item.needsReview && item.reviewNote && (
            <span class="checklist-item__review-note">
              <span class="checklist-item__review-label">Review required</span>
              {item.reviewNote}
            </span>
          )}
        </span>

        <span class="checklist-item__checkbox" aria-hidden="true">
          <span class="checklist-item__checkmark" />
        </span>
      </Button>
    );
  }

  private renderChecklist(runtime: ChecklistRuntimeState): VNode {
    const { checklist } = runtime;

    return (
      <div
        class={{
          "checklist-instance": true,
          "checklist-instance--active": this.selectedChecklistId.map(
            (checklistId) => checklistId === checklist.id
          ),
        }}
      >
        <header class="checklist-header">
          <div class="checklist-header__identity">
            <h1>{checklist.aircraft.model}</h1>
            <span class="checklist-header__manufacturer">
              {checklist.aircraft.manufacturer}
            </span>
          </div>

          <div
            class="checklist-header__progress"
            aria-label="Checklist progress"
          >
            <span class="checklist-header__progress-label">
              {runtime.progressText}
            </span>
            <span class="checklist-header__progress-track">
              <span
                class="checklist-header__progress-value"
                style={{ width: runtime.progressWidth }}
              />
            </span>
          </div>
        </header>

        <main class="checklist-content">
          {checklist.sections.map((section, sectionIndex) => (
            <section
              class={{
                "checklist-section": true,
                "checklist-section--active": runtime.activeSectionIndex.map(
                  (activeIndex) => activeIndex === sectionIndex
                ),
              }}
              id={`${checklist.id}-${section.id}`}
            >
              <div class="checklist-section__sticky">
                <header class="checklist-section__header">
                  <h2>
                    <span class="checklist-section__number">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    <span>{section.title}</span>
                  </h2>
                </header>

                {this.renderNavigation(runtime, sectionIndex)}
              </div>

              <div
                ref={runtime.sectionItemsRefs[sectionIndex]}
                class="checklist-section__items"
              >
                {section.items.map((item) =>
                  this.renderItem(runtime, section, sectionIndex, item)
                )}
              </div>
            </section>
          ))}
        </main>
      </div>
    );
  }

  public onResume(): void {
    super.onResume();

    this.isViewActive = true;
    this.scheduleAircraftRefresh();
  }

  public onPause(): void {
    this.isViewActive = false;
    this.cancelAircraftRefresh();
    super.onPause();
  }

  public onClose(): void {
    this.isViewActive = false;
    this.cancelAircraftRefresh();

    this.gameStateSubscription.destroy();
    super.onClose();
  }

  public render(): VNode {
    return (
      <div class="vr-checklist-app">
        {this.runtimes.map((runtime) => this.renderChecklist(runtime))}

        <div
          class={{
            "checklist-unavailable": true,
            "checklist-unavailable--active": this.selectedChecklistId.map(
              (checklistId) => checklistId === null
            ),
          }}
          role="status"
        >
          <div class="checklist-unavailable__message">
            Keine Checkliste vorhanden
          </div>

          <div class="checklist-unavailable__diagnostics">
            <span class="checklist-unavailable__diagnostic-label">Model:</span>
            <span>{this.aircraftIdentityText}</span>
          </div>
        </div>

        <div class="checklist-version" aria-label={`Version ${APP_VERSION}`}>
          {APP_VERSION}
        </div>
      </div>
    );
  }
}

class VRChecklist extends App {
  public get name(): string {
    return "VR Checklist";
  }

  public get icon(): string {
    return `${BASE_URL}/Assets/app-icon.svg`;
  }

  public BootMode = AppBootMode.COLD;
  public SuspendMode = AppSuspendMode.SLEEP;

  public async install(_props: AppInstallProps): Promise<void> {
    Efb.loadCss(`${BASE_URL}/VRChecklist.css`);
    return Promise.resolve();
  }

  public get compatibleAircraftModels(): string[] | undefined {
    return undefined;
  }

  public render(): TVNode<VRChecklistView> {
    return <VRChecklistView bus={this.bus} />;
  }
}

Efb.use(VRChecklist);
