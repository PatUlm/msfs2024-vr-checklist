import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const {
  clampSectionIndex,
  createProgressRecord,
  decideProgressReconciliation,
  findProgressIncompatibility,
  SIMULATION_TIME_TOLERANCE_SECONDS,
} = await importBundledModule(new URL("./ProgressRecord.ts", import.meta.url));

const knownItemKeys = new Set(["g36/before-start/battery", "g36/before-start/avionics"]);

function context(overrides = {}) {
  return {
    checklistId: "g36",
    checklistRevision: "3",
    aircraftIdentityKey: "BE36|BEECHCRAFT|BONANZAG36",
    isKnownItemKey: (itemKey) => knownItemKeys.has(itemKey),
    readSimulationTimeSeconds: () => 1200,
    ...overrides,
  };
}

function record(overrides = {}) {
  return {
    schemaVersion: 5,
    sessionId: "session-1",
    sequence: 7,
    checklistId: "g36",
    checklistRevision: "3",
    aircraftIdentityKey: "BE36|BEECHCRAFT|BONANZAG36",
    simulationTimeSeconds: 1000,
    activeSectionIndex: 1,
    completedItemKeys: ["g36/before-start/battery"],
    savedAt: 1700000000000,
    ...overrides,
  };
}

test("a record is written with schema version 5 and a strictly newer savedAt", () => {
  const input = {
    sessionId: "session-1",
    sequence: 3,
    checklistId: "g36",
    checklistRevision: "3",
    aircraftIdentityKey: "KEY",
    simulationTimeSeconds: 42,
    activeSectionIndex: 2,
    completedItemKeys: ["a"],
  };

  assert.deepEqual(createProgressRecord(input, 5000, 0), {
    schemaVersion: 5,
    ...input,
    savedAt: 5000,
  });
  // Same millisecond as the last write: savedAt still moves forward.
  assert.equal(createProgressRecord(input, 5000, 5000).savedAt, 5001);
  // A clock that went backwards never produces an older record.
  assert.equal(createProgressRecord(input, 4000, 5000).savedAt, 5001);
});

test("a compatible record passes", () => {
  assert.equal(findProgressIncompatibility(record(), context()), undefined);
  assert.equal(
    findProgressIncompatibility(record({ simulationTimeSeconds: undefined }), context()),
    undefined
  );
});

test("schema, checklist, revision and aircraft are checked in that order", () => {
  assert.equal(
    findProgressIncompatibility(record({ schemaVersion: 4 }), context()),
    "schema version 4"
  );
  assert.equal(
    findProgressIncompatibility(record({ checklistId: "da42" }), context()),
    "checklist da42"
  );
  assert.equal(
    findProgressIncompatibility(record({ checklistRevision: "2" }), context()),
    "checklist revision 2"
  );
  assert.equal(
    findProgressIncompatibility(record({ aircraftIdentityKey: "OTHER" }), context()),
    "aircraft OTHER"
  );
  assert.equal(findProgressIncompatibility({}, context()), "schema version undefined");
});

test("malformed payloads are rejected", () => {
  const malformed = [
    { sessionId: "" },
    { sessionId: undefined },
    { sequence: 0 },
    { sequence: 1.5 },
    { sequence: "7" },
    { savedAt: "now" },
    { activeSectionIndex: "1" },
    { completedItemKeys: "g36/before-start/battery" },
    { completedItemKeys: [42] },
    { completedItemKeys: ["g36/unknown/item"] },
  ];

  for (const overrides of malformed) {
    assert.equal(
      findProgressIncompatibility(record(overrides), context()),
      "a malformed payload",
      JSON.stringify(overrides)
    );
  }
});

test("the simulation time is read only after the cheap checks pass", () => {
  let reads = 0;
  const counting = context({
    readSimulationTimeSeconds: () => {
      reads += 1;
      return 1200;
    },
  });

  findProgressIncompatibility(record({ checklistId: "da42" }), counting);
  findProgressIncompatibility(record({ sequence: 0 }), counting);
  assert.equal(reads, 0);

  findProgressIncompatibility(record(), counting);
  assert.equal(reads, 1);
});

test("a record from ahead of the current simulation time belongs to an earlier session", () => {
  const now = 100;
  const withTime = (simulationTimeSeconds) =>
    findProgressIncompatibility(
      record({ simulationTimeSeconds }),
      context({ readSimulationTimeSeconds: () => now })
    );

  assert.equal(withTime(now + SIMULATION_TIME_TOLERANCE_SECONDS), undefined);
  assert.equal(
    withTime(now + SIMULATION_TIME_TOLERANCE_SECONDS + 1),
    "an earlier simulator session"
  );
  assert.equal(withTime(0), undefined);
});

test("an unreadable simulation time skips the restart check", () => {
  assert.equal(
    findProgressIncompatibility(
      record({ simulationTimeSeconds: 999999 }),
      context({ readSimulationTimeSeconds: () => undefined })
    ),
    undefined
  );
});

test("reconciliation persists, skips or adopts by savedAt", () => {
  assert.equal(decideProgressReconciliation(undefined, 0), "persist-own");
  assert.equal(decideProgressReconciliation(undefined, 500), "persist-own");
  assert.equal(
    decideProgressReconciliation(record({ savedAt: 500 }), 500),
    "already-in-sync"
  );
  assert.equal(
    decideProgressReconciliation(record({ savedAt: 400 }), 500),
    "already-in-sync"
  );
  assert.equal(decideProgressReconciliation(record({ savedAt: 501 }), 500), "adopt");
  assert.equal(decideProgressReconciliation(record({ savedAt: 1 }), 0), "adopt");
});

test("a stored section index is clamped to the checklist", () => {
  assert.equal(clampSectionIndex(-3, 4), 0);
  assert.equal(clampSectionIndex(2, 4), 2);
  assert.equal(clampSectionIndex(9, 4), 3);
});
