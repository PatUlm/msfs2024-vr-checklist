import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const {
  AIRCRAFT_REFRESH_INTERVAL_MS,
  FlowEventId,
  getFlowEventName,
  parseFlowEventPayload,
  planFlowEventReaction,
  planGameStateReaction,
  POST_LOAD_REFRESH_DELAY_MS,
} = await importBundledModule(new URL("./FlightLifecycle.ts", import.meta.url));

const nothing = {
  invalidateKeyInterception: false,
  resetFlight: false,
  aircraftRefreshDelayMs: undefined,
  ensureKeyInterception: false,
};

test("a Flow API payload needs a numeric event and keeps a string flt_path", () => {
  assert.deepEqual(parseFlowEventPayload('{"event":2,"flt_path":"C:/x.flt"}'), {
    event: 2,
    flt_path: "C:/x.flt",
  });
  assert.deepEqual(parseFlowEventPayload('{"event":14,"flt_path":7}'), {
    event: 14,
    flt_path: undefined,
  });
  assert.throws(() => parseFlowEventPayload('{"event":"2"}'));
  assert.throws(() => parseFlowEventPayload("not json"));
});

test("known events have names, unknown IDs are labelled", () => {
  assert.equal(getFlowEventName(FlowEventId.RTCEnd), "RTCEnd");
  assert.equal(getFlowEventName(99), "Unknown");
});

test("FltLoad is the flight transition and leaves the refresh schedule alone", () => {
  assert.deepEqual(planFlowEventReaction(FlowEventId.FltLoad), {
    ...nothing,
    invalidateKeyInterception: true,
    resetFlight: true,
  });
});

test("FlightEnd and BackToMainMenu only mark the interception stale", () => {
  for (const id of [FlowEventId.FlightEnd, FlowEventId.BackToMainMenu]) {
    assert.deepEqual(planFlowEventReaction(id), {
      ...nothing,
      invalidateKeyInterception: true,
    });
  }
});

test("FltLoaded and FlightStart re-read the aircraft shortly after", () => {
  for (const id of [FlowEventId.FltLoaded, FlowEventId.FlightStart]) {
    assert.deepEqual(planFlowEventReaction(id), {
      ...nothing,
      aircraftRefreshDelayMs: POST_LOAD_REFRESH_DELAY_MS,
    });
  }
});

test("RTCEnd is the only Flow event that renews the interception", () => {
  assert.deepEqual(planFlowEventReaction(FlowEventId.RTCEnd), {
    ...nothing,
    ensureKeyInterception: true,
  });

  for (const id of [
    FlowEventId.None,
    FlowEventId.TeleportStart,
    FlowEventId.TeleportDone,
    FlowEventId.BackOnTrackStart,
    FlowEventId.BackOnTrackDone,
    FlowEventId.SkipStart,
    FlowEventId.SkipDone,
    FlowEventId.RTCStart,
    FlowEventId.ReplayStart,
    FlowEventId.ReplayEnd,
    FlowEventId.PlaneCrash,
    99,
  ]) {
    assert.deepEqual(planFlowEventReaction(id), nothing, String(id));
  }
});

test("entering GameState.loading resets the flight and defers the aircraft read", () => {
  assert.deepEqual(
    planGameStateReaction({ isKnown: true, isLoading: true, wasLoading: false }),
    {
      invalidateKeyInterception: true,
      resetFlight: true,
      aircraftRefreshDelayMs: AIRCRAFT_REFRESH_INTERVAL_MS,
      ensureKeyInterception: false,
    }
  );
});

test("staying in loading does nothing", () => {
  assert.deepEqual(
    planGameStateReaction({ isKnown: true, isLoading: true, wasLoading: true }),
    nothing
  );
});

test("leaving loading re-reads the aircraft and renews the interception", () => {
  assert.deepEqual(
    planGameStateReaction({ isKnown: true, isLoading: false, wasLoading: true }),
    {
      ...nothing,
      aircraftRefreshDelayMs: POST_LOAD_REFRESH_DELAY_MS,
      ensureKeyInterception: true,
    }
  );
});

test("any other known state asks for an immediate aircraft read", () => {
  assert.deepEqual(
    planGameStateReaction({ isKnown: true, isLoading: false, wasLoading: false }),
    { ...nothing, aircraftRefreshDelayMs: 0 }
  );
});

test("an unknown state does nothing", () => {
  assert.deepEqual(
    planGameStateReaction({ isKnown: false, isLoading: false, wasLoading: false }),
    nothing
  );
  assert.deepEqual(
    planGameStateReaction({ isKnown: false, isLoading: false, wasLoading: true }),
    nothing
  );
});
