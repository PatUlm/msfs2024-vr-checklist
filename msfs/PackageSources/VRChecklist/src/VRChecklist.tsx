import {
  App,
  AppBootMode,
  AppInstallProps,
  AppSuspendMode,
  AppView,
  AppViewProps,
  Efb,
  EfbSettingsManager,
  EfbSettingsType,
  RequiredProps,
  TVNode,
} from "@efb/efb-api";
import {
  EventBus,
  FSComponent,
  GameStateProvider,
  SimVarValueType,
  Subject,
  Subscription,
  UserSettingManager,
  VNode,
} from "@microsoft/msfs-sdk";
import {
  AircraftIdentity,
  createAircraftIdentityKey,
  describeAircraftIdentity,
  EMPTY_AIRCRAFT_IDENTITY,
  hasAircraftIdentity,
  selectChecklistForAircraft,
} from "./checklist/AircraftMatching";
import { checklists } from "./checklist/ChecklistCatalog";
import { ChecklistSection } from "./checklist/ChecklistModel";
import { ChecklistRuntimeState } from "./checklist/ChecklistRuntimeState";
import {
  ChecklistPanelActions,
  renderChecklistPanel,
  renderChecklistUnavailable,
} from "./Components/ChecklistPanel";
import { ConfirmationInput } from "./input/ConfirmationInput";
import {
  AIRCRAFT_REFRESH_INTERVAL_MS,
  FLOW_API_EVENT_NAME,
  FlowEventId,
  getFlowEventName,
  LifecycleReaction,
  parseFlowEventPayload,
  planFlowEventReaction,
  planGameStateReaction,
} from "./lifecycle/FlightLifecycle";
import {
  clampSectionIndex,
  createProgressRecord,
  decideProgressReconciliation,
  findProgressIncompatibility,
  StoredChecklistProgress,
} from "./progress/ProgressRecord";
import { ChecklistProgressStore } from "./progress/ProgressStore";
import { ScalingController } from "./ScalingController";
import { ChecklistCommBusTransport } from "./transport/ChecklistCommBusTransport";
import { ChecklistStateSummary } from "./transport/CommBusProtocol";

import "./VRChecklist.scss";

declare const BASE_URL: string;
declare const APP_VERSION: string;

const AIRCRAFT_IDENTITY_EMPTY_LABEL = "(leer)";
const SECTION_ADVANCE_DELAY_MS = 350;

let instanceCounter = 0;

function createInstanceId(): string {
  instanceCounter += 1;
  // The creation time keeps diagnostics distinguishable across recreated
  // JavaScript contexts, where the module-local counter starts again.
  return `${Date.now().toString(36)}-${instanceCounter}`;
}

function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/*
 * The app view wires the simulator lifecycle to the checklist state. The
 * pieces it coordinates live in their own modules: aircraft matching and the
 * per-checklist runtime state (checklist/), the shared progress record
 * (progress/), the lifecycle reaction plans (lifecycle/), the companion link
 * (transport/), the confirmation key (input/), scaling and the markup
 * (Components/). What stays here is the session state that ties them
 * together: the selected checklist, the aircraft identity, the progress
 * session and the timers.
 */
class VRChecklistView
  extends AppView<RequiredProps<AppViewProps, "bus">>
  implements ChecklistPanelActions
{
  private readonly runtimes = checklists.map(
    (checklist) => new ChecklistRuntimeState(checklist)
  );
  private readonly runtimesByChecklistId = new Map(
    this.runtimes.map((runtime) => [runtime.checklist.id, runtime])
  );
  private readonly selectedChecklistId = Subject.create<string | null>(null);
  private readonly aircraftIdentityText = Subject.create(
    describeAircraftIdentity(
      EMPTY_AIRCRAFT_IDENTITY,
      AIRCRAFT_IDENTITY_EMPTY_LABEL
    )
  );
  private readonly appRootRef = FSComponent.createRef<HTMLDivElement>();

  /*
   * Identifies this app context in the log so lifecycle diagnostics remain
   * attributable when MSFS recreates it.
   */
  private readonly instanceId = createInstanceId();
  private readonly eventBus: EventBus;
  private readonly scaling: ScalingController;
  private readonly progressStore = new ChecklistProgressStore();
  private readonly transport: ChecklistCommBusTransport;
  private readonly confirmationInput: ConfirmationInput;
  private readonly modeSettingSubscription: Subscription | undefined;
  private readonly gameStateSubscription: Subscription;
  private readonly flowApiListener: ViewListener.ViewListener;

  private previousGameState: GameState | undefined;
  private currentAircraftIdentityKey = "";
  private currentAircraftIdentity: AircraftIdentity = EMPTY_AIRCRAFT_IDENTITY;
  private currentSessionId = createSessionId();
  private stateSequence = 0;
  private currentVrMode: boolean | undefined;
  private aircraftRefreshTimer: number | undefined;
  private isViewActive = false;

  /*
   * `savedAt` of the last record this context wrote or adopted. A newer stored
   * record is adopted; an already known record is skipped.
   */
  private lastPersistedAt = 0;

  private readonly handleViewportResize = (): void => {
    this.refreshVrMode();
    this.scaling.scheduleSettle();
  };
  private readonly handleFlowEvent = (data: string): void => {
    this.processFlowEvent(data);
  };

  public constructor(props: RequiredProps<AppViewProps, "bus">) {
    super(props);

    console.info(
      `[VR Checklist] App instance ${this.instanceId} created, ` +
        `version ${APP_VERSION}.`
    );
    this.eventBus = props.bus;
    this.scaling = new ScalingController({
      rootRef: this.appRootRef,
      instanceId: this.instanceId,
      isViewActive: () => this.isViewActive,
      onSettleStep: () => this.refreshVrMode(),
    });
    this.transport = new ChecklistCommBusTransport({
      sender: { efbVersion: APP_VERSION, instanceId: this.instanceId },
      readState: () => this.readChecklistStateSummary(),
    });
    this.confirmationInput = new ConfirmationInput({
      bus: this.eventBus,
      isViewActive: () => this.isViewActive,
      onConfirm: () => this.confirmNextOpenItem(),
    });

    this.progressStore.clearObsolete();
    this.gameStateSubscription = GameStateProvider.get().sub(
      (gameState) => this.handleGameStateChanged(gameState),
      true
    );
    this.flowApiListener = RegisterViewListener(
      "JS_LISTENER_COMM_BUS",
      () => console.info("[VR Checklist] Flow API listener registered.")
    );
    this.flowApiListener.on(FLOW_API_EVENT_NAME, this.handleFlowEvent);
    this.transport.load();
    this.confirmationInput.start();
    this.modeSettingSubscription = this.subscribeToEfbModeSetting();
  }

  /*
   * The stored 2D/3D preference is no mounted/detached state signal (see the
   * DON'T in docs/msfs-sdk-reference.md). It changed alongside the shell's
   * container change in the log, so it only serves as one more trigger to
   * re-measure the layout box.
   */
  private subscribeToEfbModeSetting(): Subscription | undefined {
    try {
      const settings = this
        .efbSettingsManager as unknown as UserSettingManager<EfbSettingsType>;
      return settings.getSetting("mode").sub(() => {
        if (this.isViewActive) {
          this.scaling.scheduleSettle();
        }
      });
    } catch (error) {
      console.warn(
        "[VR Checklist] EFB mode setting unavailable as scaling trigger",
        error
      );
      return undefined;
    }
  }

  // --- Companion state -----------------------------------------------------

  private readChecklistStateSummary(): ChecklistStateSummary {
    if (this.stateSequence === 0) {
      this.stateSequence = 1;
    }

    const runtime = this.getSelectedRuntime();
    const section = runtime?.getActiveSection();
    const nextOpenItem =
      runtime && section ? runtime.findNextOpenItem(section) : undefined;

    return {
      sessionId: this.currentSessionId,
      sequence: this.stateSequence,
      aircraft: {
        atcModel: this.currentAircraftIdentity.atcModel,
        atcType: this.currentAircraftIdentity.atcType,
        title: this.currentAircraftIdentity.title,
        displayName: runtime?.checklist.aircraft.model ?? null,
      },
      checklist: runtime
        ? {
            id: runtime.checklist.id,
            revision: runtime.checklist.revision,
            title: runtime.checklist.title,
          }
        : null,
      activeGroup: section
        ? {
            id: section.id,
            title: section.title,
            index: runtime?.activeSectionIndex.get() ?? 0,
          }
        : null,
      nextOpenItem: nextOpenItem
        ? {
            id: nextOpenItem.id,
            challenge: nextOpenItem.challenge,
            response: nextOpenItem.response,
          }
        : null,
      completedRequiredItems: runtime?.completedCount.get() ?? 0,
      totalRequiredItems: runtime?.totalItemCount ?? 0,
      completedGroupIds: runtime?.getCompletedSectionIds() ?? [],
    };
  }

  // --- Confirmation input --------------------------------------------------

  /*
   * Checks off the next open item of the section currently on screen. A
   * complete section is deliberately left alone: the press stays without
   * effect instead of reaching into a section the pilot is not looking at.
   */
  private confirmNextOpenItem(): void {
    const runtime = this.getSelectedRuntime();

    if (!runtime) {
      console.info(
        `[VR Checklist] Confirmation without effect: no checklist selected.`
      );
      return;
    }

    const sectionIndex = runtime.activeSectionIndex.get();
    const section = runtime.checklist.sections[sectionIndex];

    if (!section) {
      console.info(
        `[VR Checklist] Confirmation without effect: no section on screen.`
      );
      return;
    }

    const openItem = runtime.findNextOpenItem(section);

    if (!openItem) {
      console.info(
        `[VR Checklist] Confirmation without effect: section ` +
          `${section.title} is complete.`
      );
      return;
    }

    console.info(
      `[VR Checklist] Confirmed ${section.title} / ${openItem.challenge}.`
    );
    this.toggleItem(
      runtime,
      section,
      sectionIndex,
      runtime.getItemState(section.id, openItem.id)
    );
  }

  private getSelectedRuntime(): ChecklistRuntimeState | undefined {
    const checklistId = this.selectedChecklistId.get();
    return checklistId
      ? this.runtimesByChecklistId.get(checklistId)
      : undefined;
  }

  // --- Simulator reads -----------------------------------------------------

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

  /*
   * `E:SIMULATION TIME` counts the active simulation seconds. It does not
   * advance while the simulator is paused, so it must not be converted into a
   * wall-clock session start and compared for equality: a pause would shift
   * that derived start and discard valid progress. Only its monotonicity is
   * used — the value never decreases inside a session, and a restart puts it
   * back to zero.
   */
  private readSimulationTimeSeconds(): number | undefined {
    try {
      const simulationTimeSeconds = Number(
        SimVar.GetSimVarValue("E:SIMULATION TIME", SimVarValueType.Seconds)
      );

      if (
        !Number.isFinite(simulationTimeSeconds) ||
        simulationTimeSeconds < 0
      ) {
        throw new Error(`Invalid simulation time: ${simulationTimeSeconds}`);
      }

      return simulationTimeSeconds;
    } catch (error) {
      console.error(
        "[VR Checklist] Unable to read the current simulation time",
        error
      );
      return undefined;
    }
  }

  private refreshVrMode(): void {
    if (!this.isViewActive) {
      return;
    }

    let isInVr = this.currentVrMode ?? false;

    try {
      // IS IN VR is an official read-only E: environment variable. A viewport
      // resize is the event-first trigger; the existing slow aircraft refresh
      // also covers a resident EFB that receives no useful resize event.
      isInVr = Boolean(
        SimVar.GetSimVarValue("E:IS IN VR", SimVarValueType.Bool)
      );

      if (isInVr !== this.currentVrMode) {
        this.currentVrMode = isInVr;
        console.info(
          `[VR Checklist] Display mode detected on instance ` +
            `${this.instanceId}: ${isInVr ? "VR" : "non-VR"}`
        );

        // A display-mode change may activate a recreated or previously
        // resident context. Reconcile immediately instead of waiting for the
        // slow aircraft fallback.
        this.reconcileSelectedChecklistProgress();
      }
    } catch (error) {
      console.error("[VR Checklist] Unable to read E:IS IN VR", error);
    }

    this.scaling.apply(isInVr);
  }

  private updateAircraftDiagnostics(identity: AircraftIdentity): void {
    this.aircraftIdentityText.set(
      describeAircraftIdentity(identity, AIRCRAFT_IDENTITY_EMPTY_LABEL)
    );
  }

  // --- Shared progress record (ADR 0009) -----------------------------------

  private clearStoredChecklistProgress(): void {
    this.lastPersistedAt = 0;
    this.progressStore.clear();
  }

  /*
   * Writes the current progress of the selected checklist. Every state change
   * calls this, so the stored record is never older than the in-memory state
   * of this instance.
   */
  private persistSelectedChecklistProgress(): void {
    const runtime = this.getSelectedRuntime();

    if (!runtime || this.currentAircraftIdentityKey.length === 0) {
      return;
    }

    this.stateSequence += 1;
    const progress = createProgressRecord(
      {
        sessionId: this.currentSessionId,
        sequence: this.stateSequence,
        checklistId: runtime.checklist.id,
        checklistRevision: runtime.checklist.revision,
        aircraftIdentityKey: this.currentAircraftIdentityKey,
        simulationTimeSeconds: this.readSimulationTimeSeconds(),
        activeSectionIndex: runtime.activeSectionIndex.get(),
        completedItemKeys: runtime.getCompletedItemKeys(),
      },
      Date.now(),
      this.lastPersistedAt
    );

    if (this.progressStore.write(progress)) {
      this.lastPersistedAt = progress.savedAt;
    }

    // Companion state is observational and must never block the EFB workflow,
    // even if the shared DataStore is temporarily unavailable.
    this.transport.requestStatePublish();
  }

  /*
   * Brings this instance in line with the shared record. It runs whenever the
   * app may have missed a change made elsewhere: on resume, on a display-mode
   * change, on observed flight-lifecycle events, and on the slow aircraft
   * fallback. It never runs per frame.
   */
  private reconcileSelectedChecklistProgress(): void {
    const runtime = this.getSelectedRuntime();

    if (!runtime || this.currentAircraftIdentityKey.length === 0) {
      return;
    }

    const storedProgress = this.readStoredChecklistProgress(runtime);
    const decision = decideProgressReconciliation(
      storedProgress,
      this.lastPersistedAt
    );

    if (decision === "persist-own") {
      // Either nothing is stored yet, or the record belongs to another
      // session, aircraft or checklist. Both mean the state of this instance
      // is the one that counts, so it becomes the new record.
      this.persistSelectedChecklistProgress();
      return;
    }

    if (decision === "already-in-sync" || !storedProgress) {
      // Our own record; this instance is already in sync with it.
      return;
    }

    this.applyStoredChecklistProgress(runtime, storedProgress);
    this.lastPersistedAt = storedProgress.savedAt;
  }

  private readStoredChecklistProgress(
    runtime: ChecklistRuntimeState
  ): StoredChecklistProgress | undefined {
    const candidate = this.progressStore.read();

    if (!candidate) {
      return undefined;
    }

    const incompatibility = findProgressIncompatibility(candidate, {
      checklistId: runtime.checklist.id,
      checklistRevision: runtime.checklist.revision,
      aircraftIdentityKey: this.currentAircraftIdentityKey,
      isKnownItemKey: (itemKey) => runtime.itemStates.has(itemKey),
      readSimulationTimeSeconds: () => this.readSimulationTimeSeconds(),
    });

    if (incompatibility !== undefined) {
      console.info(
        `[VR Checklist] Instance ${this.instanceId} discards the stored ` +
          `progress: ${incompatibility}.`
      );
      return undefined;
    }

    return candidate as StoredChecklistProgress;
  }

  private applyStoredChecklistProgress(
    runtime: ChecklistRuntimeState,
    progress: StoredChecklistProgress
  ): void {
    this.currentSessionId = progress.sessionId;
    this.stateSequence = Math.max(this.stateSequence, progress.sequence);
    const completedItemKeys = new Set(progress.completedItemKeys);

    for (const [itemKey, itemState] of runtime.itemStates) {
      itemState.set(completedItemKeys.has(itemKey));
    }

    runtime.updateCompletedCount();
    this.showSection(
      runtime,
      clampSectionIndex(
        progress.activeSectionIndex,
        runtime.checklist.sections.length
      )
    );
    console.info(
      `[VR Checklist] Instance ${this.instanceId} adopted ` +
        `${completedItemKeys.size} completed items from the shared progress ` +
        `record.`
    );
    this.transport.requestStatePublish();
  }

  // --- Aircraft selection --------------------------------------------------

  private refreshSelectedChecklist(): void {
    if (!this.isViewActive) {
      return;
    }

    this.scheduleAircraftRefresh(AIRCRAFT_REFRESH_INTERVAL_MS);
    this.refreshVrMode();

    const identity = this.readCurrentAircraftIdentity();
    this.currentAircraftIdentity = identity;
    this.updateAircraftDiagnostics(identity);

    const aircraftIdentityKey = createAircraftIdentityKey(identity);
    const { checklist, matchingChecklists } = selectChecklistForAircraft(
      checklists,
      identity
    );
    const checklistId = checklist?.id ?? null;
    const previousChecklistId = this.selectedChecklistId.get();
    const identityChanged =
      aircraftIdentityKey !== this.currentAircraftIdentityKey;
    const checklistChanged = checklistId !== previousChecklistId;

    if (identityChanged || checklistChanged) {
      this.resetAllChecklists();

      // Leaving an aircraft identity or checklist ends its progress. Arriving
      // at one must not clear the record: a freshly created app context reaches
      // this branch with no previous checklist as well, and its record is
      // exactly what has to be adopted below.
      if (previousChecklistId !== null) {
        this.clearStoredChecklistProgress();
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
            describeAircraftIdentity(identity)
        );
      } else if (matchingChecklists.length > 1) {
        console.error(
          `[VR Checklist] Ambiguous aircraft identity matched ` +
            `${matchingChecklists
              .map((candidate) => candidate.id)
              .join(", ")}: ` +
            describeAircraftIdentity(identity)
        );
      } else if (hasAircraftIdentity(identity)) {
        console.warn(
          `[VR Checklist] No checklist for aircraft identity: ` +
            describeAircraftIdentity(identity)
        );
      }
    }

    // Runs on every pass, not only when the selection changed: this is the
    // path that picks up progress preserved by an earlier active context.
    this.reconcileSelectedChecklistProgress();

    if ((identityChanged || checklistChanged) && !checklist) {
      this.stateSequence += 1;
      this.transport.requestStatePublish();
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

  // --- Flight lifecycle ----------------------------------------------------

  private handleGameStateChanged(gameState: GameState | undefined): void {
    const previousGameState = this.previousGameState;
    this.previousGameState = gameState;

    this.applyLifecycleReaction(
      planGameStateReaction({
        isKnown: gameState !== undefined,
        isLoading: gameState === GameState.loading,
        wasLoading: previousGameState === GameState.loading,
      }),
      "GameState.loading",
      "GameState ready"
    );
  }

  private processFlowEvent(data: string): void {
    let flowEventId: FlowEventId;
    let flightPath: string | undefined;

    try {
      const payload = parseFlowEventPayload(data);
      flowEventId = payload.event as FlowEventId;
      flightPath = payload.flt_path;
    } catch (error) {
      console.error("[VR Checklist] Invalid Flow API event", data, error);
      return;
    }

    const flowEventName = getFlowEventName(flowEventId);
    console.info(
      `[VR Checklist] Flow event ${flowEventName} (${flowEventId})` +
        (flightPath ? ` for ${flightPath}` : "")
    );

    const source = `FlowApi.${flowEventName}`;
    this.applyLifecycleReaction(
      planFlowEventReaction(flowEventId),
      source,
      source
    );
  }

  /*
   * Carries out a planned reaction in the fixed order invalidate → reset →
   * aircraft refresh → renew interception. The reset cancels a pending
   * refresh, so a refresh in the same plan is scheduled afterwards.
   */
  private applyLifecycleReaction(
    reaction: LifecycleReaction,
    resetSource: string,
    interceptionReason: string
  ): void {
    if (reaction.invalidateKeyInterception) {
      this.confirmationInput.invalidateInterception(resetSource);
    }

    if (reaction.resetFlight) {
      this.resetForFlightTransition(resetSource);
    }

    if (reaction.aircraftRefreshDelayMs !== undefined) {
      this.scheduleAircraftRefresh(reaction.aircraftRefreshDelayMs);
    }

    if (reaction.ensureKeyInterception) {
      this.confirmationInput.ensureInterception(interceptionReason);
    }
  }

  private resetForFlightTransition(source: string): void {
    this.cancelAircraftRefresh();
    this.resetAllChecklists();
    this.clearStoredChecklistProgress();
    this.currentAircraftIdentityKey = "";
    this.currentAircraftIdentity = EMPTY_AIRCRAFT_IDENTITY;
    this.currentSessionId = createSessionId();
    this.stateSequence = 1;
    this.selectedChecklistId.set(null);
    this.updateAircraftDiagnostics(EMPTY_AIRCRAFT_IDENTITY);
    console.info(
      `[VR Checklist] Flight transition detected by ${source}; progress reset.`
    );
    this.transport.requestStatePublish();
  }

  private resetAllChecklists(): void {
    for (const runtime of this.runtimes) {
      runtime.reset();
    }
  }

  // --- Checklist interaction -----------------------------------------------

  private showSection(
    runtime: ChecklistRuntimeState,
    sectionIndex: number
  ): void {
    if (sectionIndex < 0 || sectionIndex >= runtime.checklist.sections.length) {
      return;
    }

    runtime.activeSectionIndex.set(sectionIndex);
    runtime.scrollSectionItemsToTop(sectionIndex);
  }

  /*
   * A section change made in this app instance. `showSection` itself stays
   * free of side effects so that adopting a stored record does not write it
   * back unnecessarily.
   */
  public changeSection(
    runtime: ChecklistRuntimeState,
    sectionIndex: number
  ): void {
    if (sectionIndex < 0 || sectionIndex >= runtime.checklist.sections.length) {
      return;
    }

    this.showSection(runtime, sectionIndex);
    this.persistSelectedChecklistProgress();
  }

  public toggleItem(
    runtime: ChecklistRuntimeState,
    section: ChecklistSection,
    sectionIndex: number,
    itemState: Subject<boolean>
  ): void {
    const checked = !itemState.get();
    itemState.set(checked);
    runtime.updateCompletedCount();
    this.persistSelectedChecklistProgress();

    if (
      checked &&
      sectionIndex < runtime.checklist.sections.length - 1 &&
      runtime.isSectionComplete(section)
    ) {
      window.setTimeout(() => {
        if (
          this.selectedChecklistId.get() === runtime.checklist.id &&
          runtime.activeSectionIndex.get() === sectionIndex &&
          runtime.isSectionComplete(section)
        ) {
          this.changeSection(runtime, sectionIndex + 1);
        }
      }, SECTION_ADVANCE_DELAY_MS);
    }
  }

  // --- AppView lifecycle ---------------------------------------------------

  public onResume(): void {
    super.onResume();

    console.info(`[VR Checklist] Instance ${this.instanceId} resumed.`);
    this.isViewActive = true;
    window.addEventListener("resize", this.handleViewportResize);
    // Reconciles through refreshSelectedChecklist: whatever happened while
    // this instance was not visible is picked up here.
    this.scheduleAircraftRefresh();
    // The layout box is still 0x0 at resume; the settle sequence measures it.
    this.scaling.scheduleSettle();
  }

  public onPause(): void {
    console.info(`[VR Checklist] Instance ${this.instanceId} paused.`);
    this.isViewActive = false;
    window.removeEventListener("resize", this.handleViewportResize);
    this.cancelAircraftRefresh();
    this.scaling.cancelSettle();
    super.onPause();
  }

  public onClose(): void {
    console.info(`[VR Checklist] Instance ${this.instanceId} closed.`);
    this.isViewActive = false;
    window.removeEventListener("resize", this.handleViewportResize);
    this.cancelAircraftRefresh();
    this.scaling.cancelSettle();
    this.modeSettingSubscription?.destroy();
    this.gameStateSubscription.destroy();
    this.confirmationInput.dispose();
    this.transport.dispose();
    this.flowApiListener.off(FLOW_API_EVENT_NAME, this.handleFlowEvent);
    this.flowApiListener.unregister();
    super.onClose();
  }

  public render(): VNode {
    return (
      <div
        ref={this.appRootRef}
        class={{
          "vr-checklist-app": true,
          "vr-checklist-app--vr": this.scaling.isVrProfile,
        }}
        style={{ "font-size": this.scaling.rootFontSize }}
      >
        {this.runtimes.map((runtime) =>
          renderChecklistPanel(runtime, this.selectedChecklistId, this)
        )}

        {renderChecklistUnavailable(
          this.selectedChecklistId,
          this.aircraftIdentityText
        )}

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
    return (
      <VRChecklistView
        bus={this.bus}
        efbSettingsManager={this.readEfbSettingsManager()}
      />
    );
  }

  // The shell injects the manager into the App only; the AppView getter
  // resolves it solely from this prop. The App getter throws when nothing was
  // injected, and diagnostics must not take the app down over that.
  private readEfbSettingsManager(): EfbSettingsManager | undefined {
    try {
      return this.efbSettingsManager;
    } catch (error) {
      console.warn("[VR Checklist] EFB settings manager unavailable", error);
      return undefined;
    }
  }
}

Efb.use(VRChecklist);
