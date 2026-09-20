import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const { ChecklistCommBusTransport } = await importBundledModule(
  new URL("./ChecklistCommBusTransport.ts", import.meta.url)
);

test("a replacement EFB context publishes only after restoring progress", (t) => {
  const sent = [];
  const handlers = new Map();
  const timers = new Map();
  let timerId = 0;
  const originals = [
    globalThis.Include,
    globalThis.RegisterCommBusListener,
    globalThis.window,
  ];
  globalThis.Include = { addScript: (_path, callback) => callback() };
  globalThis.RegisterCommBusListener = () => ({
    on: (name, handler) => handlers.set(name, handler),
    off: (name) => handlers.delete(name),
    unregister() {},
    callSimConnect: (_name, data) => sent.push(JSON.parse(data)),
  });
  globalThis.window = {
    setTimeout: (callback) => {
      timers.set(++timerId, callback);
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  t.after(() => {
    [
      globalThis.Include,
      globalThis.RegisterCommBusListener,
      globalThis.window,
    ] = originals;
  });
  const flush = () => {
    const callbacks = [...timers.values()];
    timers.clear();
    callbacks.forEach((callback) => callback());
  };
  let ready = false;
  let state = {
    sessionId: "provisional",
    sequence: 1,
    aircraft: { atcModel: "", atcType: "", title: "", displayName: null },
    checklist: null,
    activeGroup: null,
    nextOpenItem: null,
    completedRequiredItems: 0,
    totalRequiredItems: 0,
    completedGroupIds: [],
  };
  const transport = new ChecklistCommBusTransport({
    sender: { efbVersion: "test", instanceId: "vr-context" },
    isStateReady: () => ready,
    readState: () => state,
  });
  t.after(() => transport.dispose());
  transport.load();
  const request = () =>
    handlers.get("VRChecklist.State.Request.v1")(
      JSON.stringify({
        protocolVersion: 1,
        type: "stateRequest",
        requestId: "request",
      })
    );
  request();
  transport.requestStatePublish();
  flush();
  assert.equal(
    sent.length,
    0,
    "Startup must not replace the companion's session"
  );

  state = {
    ...state,
    sessionId: "existing-flight",
    sequence: 12,
    checklist: { id: "mh60", revision: "1", title: "MH-60" },
    activeGroup: { id: "start", title: "Start", index: 0, phase: "Engine Start" },
    nextOpenItem: { id: "apu", challenge: "APU", response: "On" },
    completedRequiredItems: 3,
    totalRequiredItems: 10,
  };
  ready = true;
  transport.requestStatePublish();
  flush();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].sessionId, "existing-flight");
  assert.equal(sent[0].sequence, 12);
  assert.equal(sent[0].nextOpenItem.id, "apu");
  assert.equal(sent[0].activeGroup.phase, "Engine Start");
  request();
  assert.equal(sent[1].requestId, "request");

  state = {
    ...state,
    sequence: 13,
    activeGroup: { id: "taxi", title: "Taxi", index: 1, phase: "Taxi" },
  };
  transport.requestStatePublish();
  flush();
  assert.equal(sent.at(-1).activeGroup.phase, "Taxi");

  // An actual flight reset or unsupported aircraft still clears the status.
  state = {
    ...state,
    sessionId: "new-flight",
    sequence: 1,
    checklist: null,
    activeGroup: null,
    nextOpenItem: null,
    completedRequiredItems: 0,
    totalRequiredItems: 0,
  };
  transport.requestStatePublish();
  flush();
  assert.equal(sent.at(-1).sessionId, "new-flight");
  assert.equal(sent.at(-1).checklist, null);
  assert.equal(sent.at(-1).activeGroup, null);
});
