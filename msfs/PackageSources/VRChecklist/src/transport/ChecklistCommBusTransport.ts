import { SnapshotRateLimiter } from "../SnapshotRateLimiter";
import {
  CHECKLIST_STATE_REQUEST_EVENT,
  CHECKLIST_STATE_SNAPSHOT_EVENT,
  ChecklistStateSummary,
  createChecklistStateSnapshot,
  createTransportProbePong,
  parseChecklistStateRequest,
  parseTransportProbePing,
  TRANSPORT_PROBE_PING_EVENT,
  TRANSPORT_PROBE_PONG_EVENT,
  TransportSenderIdentity,
} from "./CommBusProtocol";

const COMM_BUS_SCRIPT_PATH = "/JS/Services/CommBus.js";
const CHECKLIST_STATE_MIN_PUBLISH_INTERVAL_MS = 250;

export interface ChecklistCommBusTransportOptions {
  sender: TransportSenderIdentity;
  /** Called at publish time only, so every snapshot carries the newest state. */
  readState: () => ChecklistStateSummary;
}

/*
 * The CommBus side of the companion link (ADR 0003). The external client
 * sends a named ping or state request and the EFB answers on a second named
 * event; state changes are published rate-limited. No checklist state depends
 * on this path; an unavailable listener therefore cannot affect the normal
 * EFB workflow.
 */
export class ChecklistCommBusTransport {
  private readonly sender: TransportSenderIdentity;
  private readonly readState: () => ChecklistStateSummary;
  private readonly rateLimiter = new SnapshotRateLimiter({
    intervalMs: CHECKLIST_STATE_MIN_PUBLISH_INTERVAL_MS,
    publish: () => this.publishState(),
  });
  private listener: CommBusListener | undefined;
  private isDisposed = false;
  private readonly handleTransportProbePing = (data: string): void => {
    this.processTransportProbePing(data);
  };
  private readonly handleChecklistStateRequest = (data: string): void => {
    this.processChecklistStateRequest(data);
  };

  public constructor(options: ChecklistCommBusTransportOptions) {
    this.sender = options.sender;
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
    this.listener?.off(TRANSPORT_PROBE_PING_EVENT, this.handleTransportProbePing);
    this.listener?.off(
      CHECKLIST_STATE_REQUEST_EVENT,
      this.handleChecklistStateRequest
    );
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
        console.info("[VR Checklist] Transport probe listener registered.");
      });
      this.listener.on(TRANSPORT_PROBE_PING_EVENT, this.handleTransportProbePing);
      this.listener.on(
        CHECKLIST_STATE_REQUEST_EVENT,
        this.handleChecklistStateRequest
      );
      this.requestStatePublish();
    } catch (error) {
      console.error(
        "[VR Checklist] Transport probe listener unavailable",
        error
      );
    }
  }

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

    if (!listener) {
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

  private processTransportProbePing(data: string): void {
    let pong: string;
    let requestId: string;

    try {
      const ping = parseTransportProbePing(data);
      requestId = ping.requestId;
      pong = JSON.stringify(
        createTransportProbePong(ping, this.sender, new Date().toISOString())
      );
    } catch (error) {
      console.error("[VR Checklist] Invalid transport probe ping", data, error);
      return;
    }

    try {
      this.listener?.callSimConnect(TRANSPORT_PROBE_PONG_EVENT, pong);
      console.info(`[VR Checklist] Transport probe answered for ${requestId}.`);
    } catch (error) {
      console.error("[VR Checklist] Unable to answer transport probe", error);
    }
  }
}
