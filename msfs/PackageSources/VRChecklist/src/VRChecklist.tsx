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
  DataStore,
  EventBus,
  FSComponent,
  GameStateProvider,
  KeyEventData,
  KeyEventManager,
  KeyEvents,
  MappedSubscribable,
  NodeReference,
  SimVarValueType,
  Subject,
  Subscription,
  VNode,
} from "@microsoft/msfs-sdk";
import airbusH125Data from "../../../../checklists/data/airbus-h125.json";
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
  kind: "action" | "verify" | "communication" | "optional";
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

interface FlowEventPayload {
  event: number;
  flt_path?: string;
}

interface TransportProbePing {
  protocolVersion: 1;
  type: "ping";
  requestId: string;
  sentAt: string;
}

interface ChecklistStateRequest {
  protocolVersion: 1;
  type: "stateRequest";
  requestId: string;
}

/*
 * The shared progress record. It is the single source of truth for checklist
 * progress inside one simulator session: every state change writes it, and
 * every app instance adopts a record it did not write itself. That covers a
 * recreated EFB app context as well as two app instances living side by side,
 * without either case needing its own mechanism.
 *
 * The record is deliberately not time-limited. Its lifetime ends with an
 * explicit reset (`FltLoad`, GameState.loading, checklist change) or with a
 * failed compatibility check, not with a timeout.
 */
interface StoredChecklistProgress {
  schemaVersion: 5;
  sessionId: string;
  sequence: number;
  checklistId: string;
  checklistRevision: string;
  aircraftIdentityKey: string;
  simulationTimeSeconds?: number;
  activeSectionIndex: number;
  completedItemKeys: string[];
  savedAt: number;
}

/*
 * The badge text of an item kind. The data keeps the semantic kind
 * `communication`, the flight deck says `ATC`.
 */
const ITEM_KIND_LABELS: Record<ChecklistItem["kind"], string> = {
  action: "Action",
  verify: "Verify",
  communication: "ATC",
  optional: "Optional",
};

const AIRCRAFT_REFRESH_INTERVAL_MS = 10000;
const CHECKLIST_PROGRESS_DATASTORE_KEY = "vr-checklist.progress.v5";
const OBSOLETE_DATASTORE_KEYS = [
  "vr-checklist.progress.v1",
  "vr-checklist.progress.v2",
  "vr-checklist.progress.v3",
  "vr-checklist.progress.v4",
  "vr-checklist.lifecycle-diagnostics.v1",
];
const SIMULATION_TIME_TOLERANCE_SECONDS = 5;
const FLOW_API_EVENT_NAME = "__FLOW_API__";
const COMM_BUS_SCRIPT_PATH = "/JS/Services/CommBus.js";
const TRANSPORT_PROBE_PING_EVENT = "VRChecklist.Transport.Ping.v1";
const TRANSPORT_PROBE_PONG_EVENT = "VRChecklist.Transport.Pong.v1";
const CHECKLIST_STATE_REQUEST_EVENT = "VRChecklist.State.Request.v1";
const CHECKLIST_STATE_SNAPSHOT_EVENT = "VRChecklist.State.Snapshot.v1";

/*
 * The sim key event that confirms the next open item of the section on screen.
 * The user binds it in the MSFS controls, so any device MSFS knows works,
 * including a HOTAS button; the app never learns which key or button was
 * pressed, only that this event fired.
 *
 * `PLASMA_OFF` is offered as SET PLASMA OFF and confirmed to reach this EFB
 * context in G36, DA42, H125 and MH-60. The choice, rejected alternatives and
 * runtime constraints live in
 * docs/adr/0002-bestaetigungseingabe-in-sim-key-interception.md and
 * docs/msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app.
 *
 * It is intercepted with pass-through, so the sim still receives it and
 * nothing is masked.
 */
const CONFIRM_KEY_EVENT = "PLASMA_OFF";

/*
 * Shortest gap between two presses that count as two confirmations. It exists
 * because a single press can deliver the event more than once: there is no
 * unregister call for an intercept, so every re-registration in the same
 * simulator session adds another delivery, and a reload or a VR switch that
 * recreates the app context registers again. Duplicates from that arrive
 * within the same frame, a deliberate double press never does.
 */
const CONFIRM_KEY_DEBOUNCE_MS = 60;

/*
 * Key events this JavaScript context has asked to intercept since the last
 * flight transition. A second app instance in the same context must not
 * register them again, for the same reason the debounce exists.
 *
 * Every `FltLoad` clears the guard because one flight start contains several
 * loads and a registration made after the first one did not survive the later
 * ones. The intercept is renewed only once the ready-to-cockpit sequence ends,
 * or when an observed `GameState.loading` ends. See
 * docs/msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app.
 */
const interceptedKeyEvents = new Set<string>();

enum FlowEventId {
  None = 0,
  FltLoad = 1,
  FltLoaded = 2,
  TeleportStart = 3,
  TeleportDone = 4,
  BackOnTrackStart = 5,
  BackOnTrackDone = 6,
  SkipStart = 7,
  SkipDone = 8,
  BackToMainMenu = 9,
  RTCStart = 10,
  RTCEnd = 11,
  ReplayStart = 12,
  ReplayEnd = 13,
  FlightStart = 14,
  FlightEnd = 15,
  PlaneCrash = 16,
}

const FLOW_EVENT_NAMES: Record<FlowEventId, string> = {
  [FlowEventId.None]: "None",
  [FlowEventId.FltLoad]: "FltLoad",
  [FlowEventId.FltLoaded]: "FltLoaded",
  [FlowEventId.TeleportStart]: "TeleportStart",
  [FlowEventId.TeleportDone]: "TeleportDone",
  [FlowEventId.BackOnTrackStart]: "BackOnTrackStart",
  [FlowEventId.BackOnTrackDone]: "BackOnTrackDone",
  [FlowEventId.SkipStart]: "SkipStart",
  [FlowEventId.SkipDone]: "SkipDone",
  [FlowEventId.BackToMainMenu]: "BackToMainMenu",
  [FlowEventId.RTCStart]: "RTCStart",
  [FlowEventId.RTCEnd]: "RTCEnd",
  [FlowEventId.ReplayStart]: "ReplayStart",
  [FlowEventId.ReplayEnd]: "ReplayEnd",
  [FlowEventId.FlightStart]: "FlightStart",
  [FlowEventId.FlightEnd]: "FlightEnd",
  [FlowEventId.PlaneCrash]: "PlaneCrash",
};

const checklists = [
  airbusH125Data as Checklist,
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

let instanceCounter = 0;

function createInstanceId(): string {
  instanceCounter += 1;
  // Two app instances can live in separate JS contexts, where a plain counter
  // would hand out the same number twice. The creation time separates them.
  return `${Date.now().toString(36)}-${instanceCounter}`;
}

function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
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

  /*
   * Only these items drive the progress count. An `optional` item may be
   * ticked and is stored like any other; it stays out of the count but still
   * holds back automatic section advance until the pilot handles it.
   */
  public readonly requiredItemKeys = new Set<string>();
  public readonly activeSectionIndex = Subject.create(0);
  public readonly completedCount = Subject.create(0);
  public readonly totalItemCount: number;
  public readonly progressText: MappedSubscribable<string>;
  public readonly progressWidth: MappedSubscribable<string>;

  public constructor(public readonly checklist: Checklist) {
    this.sectionItemsRefs = checklist.sections.map(() =>
      FSComponent.createRef<HTMLDivElement>()
    );

    for (const section of checklist.sections) {
      for (const item of section.items) {
        const itemKey = this.getItemKey(section.id, item.id);
        this.itemStates.set(itemKey, Subject.create(false));

        if (item.kind !== "optional") {
          this.requiredItemKeys.add(itemKey);
        }
      }
    }

    this.totalItemCount = this.requiredItemKeys.size;
    this.progressText = this.completedCount.map(
      (completed) => `${completed} / ${this.totalItemCount}`
    );
    this.progressWidth = this.completedCount.map(
      (completed) =>
        `${Math.round((completed / Math.max(1, this.totalItemCount)) * 100)}%`
    );
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
    let completed = 0;

    for (const itemKey of this.requiredItemKeys) {
      if (this.itemStates.get(itemKey)?.get() === true) {
        completed += 1;
      }
    }

    this.completedCount.set(completed);
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
  private readonly isVrMode = Subject.create(false);
  private readonly gameStateSubscription: Subscription;
  private readonly flowApiListener: ViewListener.ViewListener;
  private commBusListener: CommBusListener | undefined;

  /*
   * The MSFS EFB action VALIDATE stays out of this app. Under SDK 1.7.3 a
   * visible custom EFB AppView received none of: DOM keydown for Enter/Return,
   * the InputStackListener actions KEY_EFB_VALID or KEY_MENU_WM_VALIDATE, or
   * AppView.routeGamepadInteractionEvent(BUTTON_A) with a physical gamepad.
   * The cause is documented: every KEY_EFB_* action carries the actiondb tag
   * norebind_kbmpad and cannot be bound to keyboard, mouse or pad at all.
   *
   * Do not restore any of those listeners and do not poll for input. The
   * confirmation input runs over an intercepted sim key event instead, see
   * CONFIRM_KEY_EVENT.
   */
  private readonly eventBus: EventBus;
  private keyEventManager: KeyEventManager | undefined;
  private keyEventSubscription: Subscription | undefined;
  private lastConfirmAt = 0;

  private previousGameState: GameState | undefined;
  private currentAircraftIdentityKey = "";
  private currentAircraftIdentity: AircraftIdentity = {
    atcModel: "",
    atcType: "",
    title: "",
  };
  private currentSessionId = createSessionId();
  private stateSequence = 0;
  private currentVrMode: boolean | undefined;
  private aircraftRefreshTimer: number | undefined;
  private isViewActive = false;
  private isViewClosed = false;

  /*
   * Identifies this app instance in the log. MSFS may recreate the EFB app
   * context, and it is not established that only one instance is alive at a
   * time, so the lifecycle log has to stay attributable per instance.
   */
  private readonly instanceId = createInstanceId();

  /*
   * `savedAt` of the last record this instance wrote. A stored record with a
   * newer timestamp was written by someone else and is adopted; our own record
   * is skipped. This is what keeps two instances from overwriting each other.
   */
  private lastPersistedAt = 0;
  private readonly handleViewportResize = (): void => this.refreshVrMode();
  private readonly handleFlowEvent = (data: string): void => {
    this.processFlowEvent(data);
  };
  private readonly handleTransportProbePing = (data: string): void => {
    this.processTransportProbePing(data);
  };
  private readonly handleChecklistStateRequest = (data: string): void => {
    this.processChecklistStateRequest(data);
  };

  public constructor(props: RequiredProps<AppViewProps, "bus">) {
    super(props);

    console.info(
      `[VR Checklist] App instance ${this.instanceId} created, ` +
        `version ${APP_VERSION}.`
    );
    this.eventBus = props.bus;
    this.clearObsoleteStoredData();
    this.gameStateSubscription = GameStateProvider.get().sub(
      (gameState) => this.handleGameStateChanged(gameState),
      true
    );
    this.flowApiListener = RegisterViewListener(
      "JS_LISTENER_COMM_BUS",
      () => console.info("[VR Checklist] Flow API listener registered.")
    );
    this.flowApiListener.on(FLOW_API_EVENT_NAME, this.handleFlowEvent);
    this.loadCommBusTransport();
    this.setupConfirmationInput();
  }

  /*
   * Phase 3 starts with the narrowest possible CommBus proof. The external
   * console client sends one named ping and the EFB answers on a second named
   * event. No checklist state depends on this diagnostic path; an unavailable
   * listener therefore cannot affect the normal EFB workflow.
   */
  private loadCommBusTransport(): void {
    try {
      Include.addScript(COMM_BUS_SCRIPT_PATH, () =>
        this.setupCommBusTransport()
      );
    } catch (error) {
      console.error("[VR Checklist] Unable to load CommBus.js", error);
    }
  }

  private setupCommBusTransport(): void {
    if (this.isViewClosed || this.commBusListener !== undefined) {
      return;
    }

    try {
      if (typeof RegisterCommBusListener !== "function") {
        throw new Error("RegisterCommBusListener is not available.");
      }

      this.commBusListener = RegisterCommBusListener(() => {
        console.info("[VR Checklist] Transport probe listener registered.");
      });
      this.commBusListener.on(
        TRANSPORT_PROBE_PING_EVENT,
        this.handleTransportProbePing
      );
      this.commBusListener.on(
        CHECKLIST_STATE_REQUEST_EVENT,
        this.handleChecklistStateRequest
      );
      this.publishChecklistState();
    } catch (error) {
      console.error(
        "[VR Checklist] Transport probe listener unavailable",
        error
      );
    }
  }

  private processChecklistStateRequest(data: string): void {
    let request: ChecklistStateRequest;

    try {
      const candidate = JSON.parse(data) as Partial<ChecklistStateRequest>;

      if (
        candidate.protocolVersion !== 1 ||
        candidate.type !== "stateRequest" ||
        typeof candidate.requestId !== "string" ||
        candidate.requestId.length === 0
      ) {
        throw new Error("Unexpected checklist state request payload.");
      }

      request = candidate as ChecklistStateRequest;
    } catch (error) {
      console.error("[VR Checklist] Invalid checklist state request", data, error);
      return;
    }

    this.publishChecklistState(request.requestId);
  }

  private publishChecklistState(requestId?: string): void {
    const listener = this.commBusListener;

    if (!listener) {
      return;
    }

    if (this.stateSequence === 0) {
      this.stateSequence = 1;
    }

    const runtime = this.getSelectedRuntime();
    const section = runtime?.checklist.sections[runtime.activeSectionIndex.get()];
    const nextOpenItem = section?.items.find(
      (item) => !runtime?.getItemState(section.id, item.id).get()
    );
    const completedRequiredItems = runtime?.completedCount.get() ?? 0;
    const totalRequiredItems = runtime?.totalItemCount ?? 0;

    try {
      listener.callSimConnect(
        CHECKLIST_STATE_SNAPSHOT_EVENT,
        JSON.stringify({
          protocolVersion: 1,
          type: "stateSnapshot",
          requestId,
          sessionId: this.currentSessionId,
          sequence: this.stateSequence,
          sentAt: new Date().toISOString(),
          efbVersion: APP_VERSION,
          instanceId: this.instanceId,
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
          completedRequiredItems,
          totalRequiredItems,
          isComplete:
            totalRequiredItems > 0 &&
            completedRequiredItems === totalRequiredItems,
        })
      );
    } catch (error) {
      console.error("[VR Checklist] Unable to publish checklist state", error);
    }
  }

  private processTransportProbePing(data: string): void {
    let ping: TransportProbePing;

    try {
      const candidate = JSON.parse(data) as Partial<TransportProbePing>;

      if (
        candidate.protocolVersion !== 1 ||
        candidate.type !== "ping" ||
        typeof candidate.requestId !== "string" ||
        candidate.requestId.length === 0 ||
        typeof candidate.sentAt !== "string"
      ) {
        throw new Error("Unexpected transport probe payload.");
      }

      ping = candidate as TransportProbePing;
    } catch (error) {
      console.error("[VR Checklist] Invalid transport probe ping", data, error);
      return;
    }

    try {
      this.commBusListener?.callSimConnect(
        TRANSPORT_PROBE_PONG_EVENT,
        JSON.stringify({
          protocolVersion: 1,
          type: "pong",
          requestId: ping.requestId,
          pingSentAt: ping.sentAt,
          receivedAt: new Date().toISOString(),
          efbVersion: APP_VERSION,
          instanceId: this.instanceId,
        })
      );
      console.info(
        `[VR Checklist] Transport probe answered for ${ping.requestId}.`
      );
    } catch (error) {
      console.error("[VR Checklist] Unable to answer transport probe", error);
    }
  }

  /*
   * Subscribes to the intercepted key events and asks for the first
   * interception. The bus subscription is made once per app instance; the
   * interception itself is renewed per flight, see `ensureKeyInterception`.
   */
  private setupConfirmationInput(): void {
    KeyEventManager.getManager(this.eventBus)
      .then((manager) => {
        this.keyEventManager = manager;
        this.keyEventSubscription = this.eventBus
          .getSubscriber<KeyEvents>()
          .on("key_intercept")
          .handle((data: KeyEventData) => this.handleKeyIntercept(data));
        this.ensureKeyInterception("app start");
      })
      .catch((error) =>
        console.error(
          `[VR Checklist] Key event manager unavailable: ${error}`
        )
      );
  }

  /*
   * Asks the sim to intercept the confirmation key event unless this
   * JavaScript context already did so for the current flight. There is no
   * unregister call, so a repeated registration only adds another delivery of
   * the same press, which the debounce absorbs. Missing a registration the sim
   * has dropped loses the input entirely, which is the worse of the two.
   */
  private ensureKeyInterception(reason: string): void {
    const manager = this.keyEventManager;

    if (!manager || interceptedKeyEvents.has(CONFIRM_KEY_EVENT)) {
      return;
    }

    manager.interceptKey(CONFIRM_KEY_EVENT, true);
    interceptedKeyEvents.add(CONFIRM_KEY_EVENT);
    console.info(
      `[VR Checklist] Key event interception active for ` +
        `${CONFIRM_KEY_EVENT} (${reason}).`
    );
  }

  private invalidateKeyInterception(reason: string): void {
    if (interceptedKeyEvents.delete(CONFIRM_KEY_EVENT)) {
      console.info(
        `[VR Checklist] Key event interception marked stale for ` +
          `${CONFIRM_KEY_EVENT} (${reason}).`
      );
    }
  }

  private handleKeyIntercept(data: KeyEventData): void {
    if (data.key !== CONFIRM_KEY_EVENT) {
      return;
    }

    if (!this.isViewActive) {
      console.info(
        `[VR Checklist] Key event ${data.key} ignored: the app view is not ` +
          `active.`
      );
      return;
    }

    const now = Date.now();

    if (now - this.lastConfirmAt < CONFIRM_KEY_DEBOUNCE_MS) {
      console.info(
        `[VR Checklist] Key event ${data.key} ignored as a duplicate ` +
          `delivery ${now - this.lastConfirmAt} ms after the last one.`
      );
      return;
    }

    this.lastConfirmAt = now;
    this.confirmNextOpenItem();
  }

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

    const openItem = section.items.find(
      (item) => !runtime.getItemState(section.id, item.id).get()
    );

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

  private refreshVrMode(): void {
    if (!this.isViewActive) {
      return;
    }

    try {
      // IS IN VR is an official read-only E: environment variable. A viewport
      // resize is the event-first trigger; the existing slow aircraft refresh
      // also covers a resident EFB that receives no useful resize event.
      const isInVr = Boolean(
        SimVar.GetSimVarValue("E:IS IN VR", SimVarValueType.Bool)
      );

      if (isInVr === this.currentVrMode) {
        return;
      }

      this.currentVrMode = isInVr;
      this.isVrMode.set(isInVr);
      console.info(
        `[VR Checklist] Display mode detected on instance ` +
          `${this.instanceId}: ${isInVr ? "VR" : "non-VR"}`
      );

      // A display-mode change is the moment another instance's progress may
      // have become the current one. Reconcile immediately instead of waiting
      // for the slow aircraft fallback.
      this.reconcileSelectedChecklistProgress();
    } catch (error) {
      console.error("[VR Checklist] Unable to read E:IS IN VR", error);
    }
  }

  private updateAircraftDiagnostics(identity: AircraftIdentity): void {
    this.aircraftIdentityText.set(
      [identity.atcModel, identity.atcType, identity.title]
        .map((value) => value || "(leer)")
        .join(" | ")
    );
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

  private clearObsoleteStoredData(): void {
    try {
      for (const key of OBSOLETE_DATASTORE_KEYS) {
        DataStore.remove(key);
      }
    } catch (error) {
      console.error("[VR Checklist] Unable to clear obsolete stored data", error);
    }
  }

  private clearStoredChecklistProgress(): void {
    this.lastPersistedAt = 0;

    try {
      DataStore.remove(CHECKLIST_PROGRESS_DATASTORE_KEY);
    } catch (error) {
      console.error("[VR Checklist] Unable to clear stored progress", error);
    }
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

    const savedAt = Math.max(Date.now(), this.lastPersistedAt + 1);
    this.stateSequence += 1;
    const progress: StoredChecklistProgress = {
      schemaVersion: 5,
      sessionId: this.currentSessionId,
      sequence: this.stateSequence,
      checklistId: runtime.checklist.id,
      checklistRevision: runtime.checklist.revision,
      aircraftIdentityKey: this.currentAircraftIdentityKey,
      simulationTimeSeconds: this.readSimulationTimeSeconds(),
      activeSectionIndex: runtime.activeSectionIndex.get(),
      completedItemKeys: Array.from(runtime.itemStates.entries())
        .filter(([, state]) => state.get())
        .map(([itemKey]) => itemKey),
      savedAt,
    };

    try {
      DataStore.set(CHECKLIST_PROGRESS_DATASTORE_KEY, JSON.stringify(progress));
      this.lastPersistedAt = savedAt;
    } catch (error) {
      console.error("[VR Checklist] Unable to store progress", error);
    }

    // Companion state is observational and must never block the EFB workflow,
    // even if the shared DataStore is temporarily unavailable.
    this.publishChecklistState();
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

    if (!storedProgress) {
      // Either nothing is stored yet, or the record belongs to another
      // session, aircraft or checklist. Both mean the state of this instance
      // is the one that counts, so it becomes the new record.
      this.persistSelectedChecklistProgress();
      return;
    }

    if (storedProgress.savedAt <= this.lastPersistedAt) {
      // Our own record; this instance is already in sync with it.
      return;
    }

    this.applyStoredChecklistProgress(runtime, storedProgress);
    this.lastPersistedAt = storedProgress.savedAt;
  }

  private readStoredChecklistProgress(
    runtime: ChecklistRuntimeState
  ): StoredChecklistProgress | undefined {
    let candidate: Partial<StoredChecklistProgress>;

    try {
      const storedProgress = DataStore.get<string>(
        CHECKLIST_PROGRESS_DATASTORE_KEY
      );

      if (typeof storedProgress !== "string") {
        return undefined;
      }

      candidate = JSON.parse(
        storedProgress
      ) as Partial<StoredChecklistProgress>;
    } catch (error) {
      console.error("[VR Checklist] Unable to read stored progress", error);
      return undefined;
    }

    const incompatibility = this.findProgressIncompatibility(
      runtime,
      candidate
    );

    if (incompatibility !== undefined) {
      console.info(
        `[VR Checklist] Instance ${this.instanceId} discards the stored ` +
          `progress: ${incompatibility}.`
      );
      return undefined;
    }

    return candidate as StoredChecklistProgress;
  }

  private findProgressIncompatibility(
    runtime: ChecklistRuntimeState,
    candidate: Partial<StoredChecklistProgress>
  ): string | undefined {
    if (candidate.schemaVersion !== 5) {
      return `schema version ${String(candidate.schemaVersion)}`;
    }

    if (candidate.checklistId !== runtime.checklist.id) {
      return `checklist ${String(candidate.checklistId)}`;
    }

    if (candidate.checklistRevision !== runtime.checklist.revision) {
      return `checklist revision ${String(candidate.checklistRevision)}`;
    }

    if (candidate.aircraftIdentityKey !== this.currentAircraftIdentityKey) {
      return `aircraft ${String(candidate.aircraftIdentityKey)}`;
    }

    if (
      typeof candidate.sessionId !== "string" ||
      candidate.sessionId.length === 0 ||
      typeof candidate.sequence !== "number" ||
      !Number.isSafeInteger(candidate.sequence) ||
      candidate.sequence < 1 ||
      typeof candidate.savedAt !== "number" ||
      typeof candidate.activeSectionIndex !== "number" ||
      !Array.isArray(candidate.completedItemKeys) ||
      !candidate.completedItemKeys.every(
        (itemKey) =>
          typeof itemKey === "string" && runtime.itemStates.has(itemKey)
      )
    ) {
      return "a malformed payload";
    }

    const simulationTimeSeconds = this.readSimulationTimeSeconds();

    if (
      simulationTimeSeconds !== undefined &&
      typeof candidate.simulationTimeSeconds === "number" &&
      simulationTimeSeconds + SIMULATION_TIME_TOLERANCE_SECONDS <
        candidate.simulationTimeSeconds
    ) {
      // Simulation time only moves forward inside a session. A smaller value
      // means the record was written before a restart.
      return "an earlier simulator session";
    }

    return undefined;
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
      Math.min(
        Math.max(0, progress.activeSectionIndex),
        runtime.checklist.sections.length - 1
      )
    );
    console.info(
      `[VR Checklist] Instance ${this.instanceId} adopted ` +
        `${completedItemKeys.size} completed items from the shared progress ` +
        `record.`
    );
    this.publishChecklistState();
  }

  private refreshSelectedChecklist(): void {
    if (!this.isViewActive) {
      return;
    }

    // onResume and GameState changes trigger immediate reads. This slow timer
    // only guards against a resident EFB missing both lifecycle signals.
    this.scheduleAircraftRefresh(AIRCRAFT_REFRESH_INTERVAL_MS);
    this.refreshVrMode();

    const identity = this.readCurrentAircraftIdentity();
    this.currentAircraftIdentity = identity;
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

    if (identityChanged || checklistChanged) {
      if (checklistChanged) {
        this.resetAllChecklists();

        // Leaving a checklist ends its progress. Arriving at one must not
        // clear the record: a freshly created app context reaches this branch
        // as well, and its record is exactly what has to be adopted below.
        if (previousChecklistId !== null) {
          this.clearStoredChecklistProgress();
        }
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

    // Runs on every pass, not only when the selection changed: this is the
    // path that picks up progress written by another app instance.
    this.reconcileSelectedChecklistProgress();

    if ((identityChanged || checklistChanged) && !checklist) {
      this.stateSequence += 1;
      this.publishChecklistState();
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
      previousGameState !== GameState.loading
    ) {
      this.invalidateKeyInterception("GameState.loading");
      this.resetForFlightTransition("GameState.loading");
      this.scheduleAircraftRefresh(AIRCRAFT_REFRESH_INTERVAL_MS);
      return;
    }

    if (gameState !== undefined && gameState !== GameState.loading) {
      this.scheduleAircraftRefresh(
        previousGameState === GameState.loading ? 300 : 0
      );

      if (previousGameState === GameState.loading) {
        this.ensureKeyInterception("GameState ready");
      }
    }
  }

  private processFlowEvent(data: string): void {
    let payload: FlowEventPayload;

    try {
      const candidate = JSON.parse(data) as Partial<FlowEventPayload>;

      if (typeof candidate.event !== "number") {
        throw new Error("Flow event payload has no numeric event ID.");
      }

      payload = {
        event: candidate.event,
        flt_path:
          typeof candidate.flt_path === "string"
            ? candidate.flt_path
            : undefined,
      };
    } catch (error) {
      console.error("[VR Checklist] Invalid Flow API event", data, error);
      return;
    }

    const flowEventId = payload.event as FlowEventId;
    const flowEventName = FLOW_EVENT_NAMES[flowEventId] ?? "Unknown";

    console.info(
      `[VR Checklist] Flow event ${flowEventName} (${flowEventId})` +
        (payload.flt_path ? ` for ${payload.flt_path}` : "")
    );

    /*
     * A flight start contains several loads. The first attempted fix renewed
     * the intercept after the first `FltLoaded`; a later load invalidated it
     * again. Mark every load stale and renew only after the final observed
     * ready-to-cockpit boundary.
     */
    if (
      flowEventId === FlowEventId.FlightEnd ||
      flowEventId === FlowEventId.BackToMainMenu ||
      flowEventId === FlowEventId.FltLoad
    ) {
      this.invalidateKeyInterception(`FlowApi.${flowEventName}`);
    }

    if (flowEventId === FlowEventId.FltLoad) {
      this.resetForFlightTransition(`FlowApi.${flowEventName}`);
      return;
    }

    if (
      flowEventId === FlowEventId.FltLoaded ||
      flowEventId === FlowEventId.FlightStart
    ) {
      this.scheduleAircraftRefresh(300);
    }

    if (flowEventId === FlowEventId.RTCEnd) {
      this.ensureKeyInterception(`FlowApi.${flowEventName}`);
    }
  }

  private resetForFlightTransition(source: string): void {
    this.cancelAircraftRefresh();
    this.resetAllChecklists();
    this.clearStoredChecklistProgress();
    this.currentAircraftIdentityKey = "";
    this.currentAircraftIdentity = { atcModel: "", atcType: "", title: "" };
    this.currentSessionId = createSessionId();
    this.stateSequence = 1;
    this.selectedChecklistId.set(null);
    this.updateAircraftDiagnostics({ atcModel: "", atcType: "", title: "" });
    console.info(
      `[VR Checklist] Flight transition detected by ${source}; progress reset.`
    );
    this.publishChecklistState();
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

  /*
   * The automatic advance waits for every item of the section, `optional` ones
   * included. Skipping an optional item is a deliberate call, and the app must
   * not take the section off screen before the pilot has made it. Only the
   * progress count ignores optional items; this handover does not.
   */
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

  /*
   * A section change made in this app instance. `showSection` itself stays
   * free of side effects so that adopting a stored record does not write one
   * back — two instances would otherwise keep answering each other.
   */
  private changeSection(
    runtime: ChecklistRuntimeState,
    sectionIndex: number
  ): void {
    if (sectionIndex < 0 || sectionIndex >= runtime.checklist.sections.length) {
      return;
    }

    this.showSection(runtime, sectionIndex);
    this.persistSelectedChecklistProgress();
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
    this.persistSelectedChecklistProgress();

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
          this.changeSection(runtime, sectionIndex + 1);
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
          callback={(): void => this.changeSection(runtime, sectionIndex - 1)}
          aria-label={
            previousSection
              ? `Previous: ${previousSection.title}`
              : "No previous section"
          }
        >
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
          callback={(): void => this.changeSection(runtime, sectionIndex + 1)}
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
                  {ITEM_KIND_LABELS[item.kind]}
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

    console.info(`[VR Checklist] Instance ${this.instanceId} resumed.`);
    this.isViewActive = true;
    window.addEventListener("resize", this.handleViewportResize);
    // Reconciles through refreshSelectedChecklist: whatever happened while
    // this instance was not visible is picked up here.
    this.scheduleAircraftRefresh();
  }

  public onPause(): void {
    console.info(`[VR Checklist] Instance ${this.instanceId} paused.`);
    this.isViewActive = false;
    window.removeEventListener("resize", this.handleViewportResize);
    this.cancelAircraftRefresh();
    super.onPause();
  }

  public onClose(): void {
    console.info(`[VR Checklist] Instance ${this.instanceId} closed.`);
    this.isViewActive = false;
    this.isViewClosed = true;
    window.removeEventListener("resize", this.handleViewportResize);
    this.cancelAircraftRefresh();

    this.gameStateSubscription.destroy();
    // The intercepts themselves stay set: the sim has no unregister call.
    // Only this view's subscription is released.
    this.keyEventSubscription?.destroy();
    this.commBusListener?.off(
      TRANSPORT_PROBE_PING_EVENT,
      this.handleTransportProbePing
    );
    this.commBusListener?.off(
      CHECKLIST_STATE_REQUEST_EVENT,
      this.handleChecklistStateRequest
    );
    this.commBusListener?.unregister();
    this.flowApiListener.off(FLOW_API_EVENT_NAME, this.handleFlowEvent);
    this.flowApiListener.unregister();
    super.onClose();
  }

  public render(): VNode {
    return (
      <div
        class={{
          "vr-checklist-app": true,
          "vr-checklist-app--vr": this.isVrMode,
        }}
      >
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
