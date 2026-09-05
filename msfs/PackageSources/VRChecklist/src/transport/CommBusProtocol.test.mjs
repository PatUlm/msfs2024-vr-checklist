import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const { createChecklistStateSnapshot, parseChecklistStateRequest } =
  await importBundledModule(new URL("./CommBusProtocol.ts", import.meta.url));

const sender = { efbVersion: "0.8.0", instanceId: "abc-1" };

function summary(overrides = {}) {
  return {
    sessionId: "session-1",
    sequence: 4,
    aircraft: {
      atcModel: "BE36",
      atcType: "Beechcraft",
      title: "Bonanza G36",
      displayName: "Bonanza G36",
    },
    checklist: { id: "g36", revision: "3", title: "Beechcraft Bonanza G36" },
    activeGroup: { id: "before-start", title: "Before Start", index: 1 },
    nextOpenItem: { id: "battery", challenge: "Battery", response: "ON" },
    completedRequiredItems: 2,
    totalRequiredItems: 10,
    ...overrides,
  };
}

test("a version-1 state request is accepted, anything else rejected", () => {
  const request = { protocolVersion: 1, type: "stateRequest", requestId: "q1" };
  assert.deepEqual(parseChecklistStateRequest(JSON.stringify(request)), request);

  for (const broken of [
    { ...request, protocolVersion: "1" },
    { ...request, protocolVersion: 2 },
    { ...request, type: "ping" },
    { ...request, requestId: "" },
    { ...request, requestId: 1 },
    {},
  ]) {
    assert.throws(() => parseChecklistStateRequest(JSON.stringify(broken)));
  }
  assert.throws(() => parseChecklistStateRequest("{"));
});

test("the snapshot wraps the summary with transport metadata", () => {
  const snapshot = createChecklistStateSnapshot(
    summary(),
    sender,
    "2026-09-05T10:00:02Z",
    "q1"
  );

  assert.deepEqual(snapshot, {
    protocolVersion: 1,
    type: "stateSnapshot",
    requestId: "q1",
    sentAt: "2026-09-05T10:00:02Z",
    efbVersion: "0.8.0",
    instanceId: "abc-1",
    ...summary(),
    isComplete: false,
  });
});

test("an unsolicited snapshot serialises without a requestId", () => {
  const json = JSON.stringify(
    createChecklistStateSnapshot(summary(), sender, "t", undefined)
  );
  assert.equal("requestId" in JSON.parse(json), false);
});

test("isComplete needs required items and all of them done", () => {
  const complete = (completedRequiredItems, totalRequiredItems) =>
    createChecklistStateSnapshot(
      summary({ completedRequiredItems, totalRequiredItems }),
      sender,
      "t",
      undefined
    ).isComplete;

  assert.equal(complete(10, 10), true);
  assert.equal(complete(9, 10), false);
  assert.equal(complete(0, 0), false);
});

test("a snapshot without a selected checklist keeps the null fields", () => {
  const snapshot = createChecklistStateSnapshot(
    summary({
      aircraft: { atcModel: "", atcType: "", title: "", displayName: null },
      checklist: null,
      activeGroup: null,
      nextOpenItem: null,
      completedRequiredItems: 0,
      totalRequiredItems: 0,
    }),
    sender,
    "t",
    undefined
  );
  assert.equal(snapshot.checklist, null);
  assert.equal(snapshot.activeGroup, null);
  assert.equal(snapshot.nextOpenItem, null);
  assert.equal(snapshot.aircraft.displayName, null);
  assert.equal(snapshot.isComplete, false);
});
