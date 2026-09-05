/*
 * The shared progress record. It is the single source of truth for checklist
 * progress inside one simulator session: every state change writes it, and
 * a recreated or resumed EFB context adopts the latest compatible record.
 *
 * The record is deliberately not time-limited. Its lifetime ends with an
 * explicit reset (`FltLoad`, GameState.loading, aircraft/checklist change) or
 * with a failed compatibility check, not with a timeout. The decision is
 * ADR 0009; this module holds the pure record logic, ProgressStore.ts the
 * DataStore access.
 */

export const PROGRESS_SCHEMA_VERSION = 5;

export interface StoredChecklistProgress {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
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
 * `E:SIMULATION TIME` does not advance while the simulator is paused, so two
 * reads of the same session may differ by the pause-free gap between them.
 * Only a record from ahead of the current time by more than this tolerance is
 * treated as written before a restart.
 */
export const SIMULATION_TIME_TOLERANCE_SECONDS = 5;

export interface ProgressCompatibilityContext {
  checklistId: string;
  checklistRevision: string;
  aircraftIdentityKey: string;
  isKnownItemKey: (itemKey: string) => boolean;
  /**
   * Read lazily: the simulator read only happens once the cheap checks pass,
   * and it may fail, in which case the check is skipped.
   */
  readSimulationTimeSeconds: () => number | undefined;
}

export interface ProgressRecordInput {
  sessionId: string;
  sequence: number;
  checklistId: string;
  checklistRevision: string;
  aircraftIdentityKey: string;
  simulationTimeSeconds: number | undefined;
  activeSectionIndex: number;
  completedItemKeys: string[];
}

/**
 * Builds the record to store. `savedAt` is strictly greater than the last
 * `savedAt` this context knows, so a rewrite within the same millisecond is
 * still recognisable as newer.
 */
export function createProgressRecord(
  input: ProgressRecordInput,
  now: number,
  lastPersistedAt: number
): StoredChecklistProgress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    sessionId: input.sessionId,
    sequence: input.sequence,
    checklistId: input.checklistId,
    checklistRevision: input.checklistRevision,
    aircraftIdentityKey: input.aircraftIdentityKey,
    simulationTimeSeconds: input.simulationTimeSeconds,
    activeSectionIndex: input.activeSectionIndex,
    completedItemKeys: input.completedItemKeys,
    savedAt: Math.max(now, lastPersistedAt + 1),
  };
}

/**
 * Returns the reason a stored candidate must not be adopted, or undefined
 * when it is compatible with the given context.
 */
export function findProgressIncompatibility(
  candidate: Partial<StoredChecklistProgress>,
  context: ProgressCompatibilityContext
): string | undefined {
  if (candidate.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    return `schema version ${String(candidate.schemaVersion)}`;
  }

  if (candidate.checklistId !== context.checklistId) {
    return `checklist ${String(candidate.checklistId)}`;
  }

  if (candidate.checklistRevision !== context.checklistRevision) {
    return `checklist revision ${String(candidate.checklistRevision)}`;
  }

  if (candidate.aircraftIdentityKey !== context.aircraftIdentityKey) {
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
      (itemKey) => typeof itemKey === "string" && context.isKnownItemKey(itemKey)
    )
  ) {
    return "a malformed payload";
  }

  const simulationTimeSeconds = context.readSimulationTimeSeconds();

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

export type ProgressReconciliation = "persist-own" | "already-in-sync" | "adopt";

/**
 * Decides how this context lines up with the shared record: no compatible
 * record means this context's state becomes the record; a record this context
 * already knows is skipped; anything newer is adopted.
 */
export function decideProgressReconciliation(
  storedProgress: StoredChecklistProgress | undefined,
  lastPersistedAt: number
): ProgressReconciliation {
  if (!storedProgress) {
    return "persist-own";
  }

  if (storedProgress.savedAt <= lastPersistedAt) {
    return "already-in-sync";
  }

  return "adopt";
}

export function clampSectionIndex(
  sectionIndex: number,
  sectionCount: number
): number {
  return Math.min(Math.max(0, sectionIndex), sectionCount - 1);
}
