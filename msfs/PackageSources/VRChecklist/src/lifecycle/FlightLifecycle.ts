/*
 * Flight-lifecycle signals and the reactions they demand. Two sources feed
 * this: the Flow API events on the `JS_LISTENER_COMM_BUS` view listener and
 * `GameStateProvider`. The functions here are pure so the reaction planning
 * can be unit-tested; the view carries the reactions out.
 *
 * Runtime findings behind the plans live in
 * docs/msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app.
 */

export const FLOW_API_EVENT_NAME = "__FLOW_API__";

/*
 * onResume and GameState changes trigger immediate aircraft reads. This slow
 * interval only guards against a resident EFB missing both lifecycle signals.
 */
export const AIRCRAFT_REFRESH_INTERVAL_MS = 10000;

/** Delay after a load boundary before the aircraft identity is read again. */
export const POST_LOAD_REFRESH_DELAY_MS = 300;

export enum FlowEventId {
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

export const FLOW_EVENT_NAMES: Record<FlowEventId, string> = {
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

export interface FlowEventPayload {
  event: number;
  flt_path?: string;
}

/** Throws when the payload carries no numeric event ID. */
export function parseFlowEventPayload(data: string): FlowEventPayload {
  const candidate = JSON.parse(data) as Partial<FlowEventPayload>;

  if (typeof candidate.event !== "number") {
    throw new Error("Flow event payload has no numeric event ID.");
  }

  return {
    event: candidate.event,
    flt_path:
      typeof candidate.flt_path === "string" ? candidate.flt_path : undefined,
  };
}

export function getFlowEventName(flowEventId: FlowEventId): string {
  return FLOW_EVENT_NAMES[flowEventId] ?? "Unknown";
}

/*
 * What the view has to do for one lifecycle signal. `resetFlight` is the
 * transition into a new flight that clears all progress; it always comes with
 * a stale key interception.
 */
export interface LifecycleReaction {
  invalidateKeyInterception: boolean;
  resetFlight: boolean;
  /** Undefined leaves the running aircraft refresh schedule alone. */
  aircraftRefreshDelayMs: number | undefined;
  ensureKeyInterception: boolean;
}

const NO_REACTION: LifecycleReaction = {
  invalidateKeyInterception: false,
  resetFlight: false,
  aircraftRefreshDelayMs: undefined,
  ensureKeyInterception: false,
};

/*
 * A flight start contains several loads. The first attempted fix renewed the
 * intercept after the first `FltLoaded`; a later load invalidated it again.
 * Mark every load stale and renew only after the final observed
 * ready-to-cockpit boundary (`RTCEnd`).
 */
export function planFlowEventReaction(
  flowEventId: FlowEventId
): LifecycleReaction {
  switch (flowEventId) {
    case FlowEventId.FltLoad:
      return {
        ...NO_REACTION,
        invalidateKeyInterception: true,
        resetFlight: true,
      };
    case FlowEventId.FlightEnd:
    case FlowEventId.BackToMainMenu:
      return { ...NO_REACTION, invalidateKeyInterception: true };
    case FlowEventId.FltLoaded:
    case FlowEventId.FlightStart:
      return {
        ...NO_REACTION,
        aircraftRefreshDelayMs: POST_LOAD_REFRESH_DELAY_MS,
      };
    case FlowEventId.RTCEnd:
      return { ...NO_REACTION, ensureKeyInterception: true };
    default:
      return NO_REACTION;
  }
}

/*
 * `GameState` is an ambient enum of the simulator runtime, so the transition
 * is described by flags the view derives from it.
 */
export interface GameStateTransition {
  /** False while the provider has not delivered a state yet. */
  isKnown: boolean;
  isLoading: boolean;
  wasLoading: boolean;
}

/*
 * Entering `loading` is the flight transition; leaving it re-reads the
 * aircraft shortly after and renews the key interception. Every other known
 * state only asks for an immediate aircraft read.
 */
export function planGameStateReaction(
  transition: GameStateTransition
): LifecycleReaction {
  if (transition.isLoading) {
    if (transition.wasLoading) {
      return NO_REACTION;
    }

    return {
      invalidateKeyInterception: true,
      resetFlight: true,
      aircraftRefreshDelayMs: AIRCRAFT_REFRESH_INTERVAL_MS,
      ensureKeyInterception: false,
    };
  }

  if (!transition.isKnown) {
    return NO_REACTION;
  }

  return {
    ...NO_REACTION,
    aircraftRefreshDelayMs: transition.wasLoading
      ? POST_LOAD_REFRESH_DELAY_MS
      : 0,
    ensureKeyInterception: transition.wasLoading,
  };
}
