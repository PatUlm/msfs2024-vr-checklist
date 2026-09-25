import { EfbSettings } from "../settings/EfbSettings";
import {
  EFB_SETTINGS_REQUEST_EVENT, EFB_SETTINGS_RESPONSE_EVENT, processEfbSettingsRequest,
} from "./EfbSettingsProtocol";
import { SnapshotRateLimiter } from "../SnapshotRateLimiter";
import {
  CHECKLIST_STATE_REQUEST_EVENT,
  CHECKLIST_STATE_SNAPSHOT_EVENT,
  ChecklistStateSummary,
  createChecklistStateSnapshot,
  parseChecklistStateRequest,
  TransportSenderIdentity,
} from "./CommBusProtocol";

const COMM_BUS_SCRIPT_PATH = "/JS/Services/CommBus.js";
const CHECKLIST_STATE_MIN_PUBLISH_INTERVAL_MS = 250;

export interface ChecklistCommBusTransportOptions {
  settings: EfbSettings;
  sender: TransportSenderIdentity;
  /** False until aircraft selection and stored progress have been reconciled. */
  isStateReady: () => boolean;
  /** Called at publish time only, so every snapshot carries the newest state. */
  readState: () => ChecklistStateSummary;
}

/*
 * The CommBus side of the companion link (ADR 0003). The external client
 * sends a named state request and the EFB answers on a second named event;
 * state changes are published rate-limited. No checklist state depends on
 * this path; an unavailable listener therefore cannot affect the normal EFB
 * workflow.
 */
export class ChecklistCommBusTransport {
  private readonly settings: EfbSettings;
  private readonly sender: TransportSenderIdentity;
  private readonly isStateReady: () => boolean;
  private readonly readState: () => ChecklistStateSummary;
  private readonly rateLimiter = new SnapshotRateLimiter({
    intervalMs: CHECKLIST_STATE_MIN_PUBLISH_INTERVAL_MS,
    publish: () => this.publishState(),
  });
  private listener: CommBusListener | undefined;
  private isDisposed = false;
  private readonly handleChecklistStateRequest = (data: string): void => {
    this.processChecklistStateRequest(data);
  };

  public constructor(options: ChecklistCommBusTransportOptions) {
    this.settings = options.settings;
    this.sender = options.sender;
    this.isStateReady = options.isStateReady;
    this.readState = options.readState;
  }

  /*
   * CommBus.js is not part of the EFB bundle; the sim loads it on request and
   * calls back once `RegisterCommBusListener` exists.
   */
  public load(): void {
    try {
      Include.addScript(COMM_BUS_SCRIPT_PATH, () => this.registerListener());
    } catch (error) {
      console.error("[VR Checklist] Unable to load CommBus.js", error);
    }
  }

  /** Rate-limited; a no-op until the listener is registered. */
  public requestStatePublish(): void {
    if (!this.listener) {
      return;
    }

    this.rateLimiter.requestPublish();
  }

  public dispose(): void {
    this.isDisposed = true;
    this.rateLimiter.dispose();
    this.listener?.off(
      CHECKLIST_STATE_REQUEST_EVENT,
      this.handleChecklistStateRequest
    );
    this.listener?.off(EFB_SETTINGS_REQUEST_EVENT, this.handleSettingsRequest);
    this.listener?.unregister();
  }

  private registerListener(): void {
    if (this.isDisposed || this.listener !== undefined) {
      return;
    }

    try {
      if (typeof RegisterCommBusListener !== "function") {
        throw new Error("RegisterCommBusListener is not available.");
      }

      this.listener = RegisterCommBusListener(() => {
        console.info("[VR Checklist] CommBus listener registered.");
      });
      this.listener.on(
        CHECKLIST_STATE_REQUEST_EVENT,
        this.handleChecklistStateRequest
      );
      this.listener.on(EFB_SETTINGS_REQUEST_EVENT, this.handleSettingsRequest);
      this.requestStatePublish();
    } catch (error) {
      console.error("[VR Checklist] CommBus listener unavailable", error);
    }
  }

  private readonly handleSettingsRequest = (data: string): void => {
    try {
      const response = processEfbSettingsRequest(data, this.sender.instanceId, this.settings);
      if (response !== undefined) {
        this.listener?.callSimConnect(EFB_SETTINGS_RESPONSE_EVENT, response);
      }
    } catch (error) {
      console.error("[VR Checklist] Invalid EFB settings request", error);
    }
  };

  private processChecklistStateRequest(data: string): void {
    let requestId: string;

    try {
      requestId = parseChecklistStateRequest(data).requestId;
    } catch (error) {
      console.error("[VR Checklist] Invalid checklist state request", data, error);
      return;
    }

    this.rateLimiter.publishImmediately(() => this.publishState(requestId));
  }

  private publishState(requestId?: string): void {
    const listener = this.listener;

    if (!listener || !this.isStateReady()) {
      return;
    }

    try {
      const snapshot = createChecklistStateSnapshot(
        this.readState(),
        this.sender,
        new Date().toISOString(),
        requestId
      );
      listener.callSimConnect(
        CHECKLIST_STATE_SNAPSHOT_EVENT,
        JSON.stringify(snapshot)
      );
    } catch (error) {
      console.error("[VR Checklist] Unable to publish checklist state", error);
    }
  }
}
