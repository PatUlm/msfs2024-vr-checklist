/*
 * The CommBus message contract between the EFB app and the Windows companion
 * (ADR 0003). Parsing and message construction are pure so the contract can
 * be unit-tested; ChecklistCommBusTransport.ts owns the listener.
 *
 * The state request doubles as the transport probe: the response carries the
 * request ID, the EFB version and the instance ID, so a console client can
 * prove the bidirectional channel without a dedicated ping.
 */

export const CHECKLIST_STATE_REQUEST_EVENT = "VRChecklist.State.Request.v1";
export const CHECKLIST_STATE_SNAPSHOT_EVENT = "VRChecklist.State.Snapshot.v1";

export interface ChecklistStateRequest {
  protocolVersion: 1;
  type: "stateRequest";
  requestId: string;
}

/*
 * The checklist state as the companion sees it, without transport metadata.
 * The view assembles it from the selected runtime at publish time.
 */
export interface ChecklistStateSummary {
  sessionId: string;
  sequence: number;
  aircraft: {
    atcModel: string;
    atcType: string;
    title: string;
    displayName: string | null;
  };
  checklist: {
    id: string;
    revision: string;
    title: string;
  } | null;
  activeGroup: {
    id: string;
    title: string;
    index: number;
    phase: string;
  } | null;
  nextOpenItem: {
    id: string;
    challenge: string;
    response: string;
  } | null;
  completedRequiredItems: number;
  totalRequiredItems: number;
  /*
   * IDs of every group whose items are all ticked, optional ones included,
   * in checklist order. The companion announces a group only when its ID
   * newly appears here; the transient nextOpenItem would be coalesced by the
   * rate limiter during the automatic advance.
   */
  completedGroupIds: string[];
  /*
   * Every phase block whose last group is complete, in checklist order and
   * keyed by its first group. A newly listed phase replaces the group
   * announcement with a phase one.
   */
  completedPhases: {
    firstGroupId: string;
    phase: string;
    skipped: boolean;
  }[];
}

export interface ChecklistStateSnapshot extends ChecklistStateSummary {
  protocolVersion: 1;
  type: "stateSnapshot";
  requestId: string | undefined;
  sentAt: string;
  efbVersion: string;
  instanceId: string;
  isComplete: boolean;
}

export interface TransportSenderIdentity {
  efbVersion: string;
  instanceId: string;
}

/** Throws when the payload is not a version-1 state request. */
export function parseChecklistStateRequest(
  data: string
): ChecklistStateRequest {
  const candidate = JSON.parse(data) as Partial<ChecklistStateRequest>;

  if (
    candidate.protocolVersion !== 1 ||
    candidate.type !== "stateRequest" ||
    typeof candidate.requestId !== "string" ||
    candidate.requestId.length === 0
  ) {
    throw new Error("Unexpected checklist state request payload.");
  }

  return candidate as ChecklistStateRequest;
}

export function createChecklistStateSnapshot(
  summary: ChecklistStateSummary,
  sender: TransportSenderIdentity,
  sentAt: string,
  requestId: string | undefined
): ChecklistStateSnapshot {
  return {
    protocolVersion: 1,
    type: "stateSnapshot",
    requestId,
    sessionId: summary.sessionId,
    sequence: summary.sequence,
    sentAt,
    efbVersion: sender.efbVersion,
    instanceId: sender.instanceId,
    aircraft: summary.aircraft,
    checklist: summary.checklist,
    activeGroup: summary.activeGroup,
    nextOpenItem: summary.nextOpenItem,
    completedRequiredItems: summary.completedRequiredItems,
    totalRequiredItems: summary.totalRequiredItems,
    completedGroupIds: summary.completedGroupIds,
    completedPhases: summary.completedPhases,
    isComplete:
      summary.totalRequiredItems > 0 &&
      summary.completedRequiredItems === summary.totalRequiredItems,
  };
}
