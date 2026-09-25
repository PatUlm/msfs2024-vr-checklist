import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const { EfbSettings } = await importBundledModule(new URL("./EfbSettings.ts", import.meta.url));
const { processEfbSettingsRequest } = await importBundledModule(new URL("../transport/EfbSettingsProtocol.ts", import.meta.url));

function fixture() {
  const values = new Map();
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) };
  return { storage, settings: new EfbSettings(storage) };
}

test("default on, durable off, and resident/recreated contexts share the choice", () => {
  const { settings, storage } = fixture();
  const resident = new EfbSettings(storage);
  assert.equal(settings.isEnabled("PLASMA_OFF"), true);
  assert.equal(settings.isEnabled("unrelated"), false);
  settings.set({ PLASMA_OFF: false });
  assert.equal(resident.isEnabled("PLASMA_OFF"), false);
  assert.equal(new EfbSettings(storage).isEnabled("PLASMA_OFF"), false);
  resident.set({ PLASMA_OFF: true });
  assert.equal(settings.isEnabled("PLASMA_OFF"), true);
});

test("settings writes validate the whole request and avoid repeat writes", () => {
  const { settings, storage } = fixture();
  assert.throws(() => settings.set({ PLASMA_OFF: false, OTHER: true }));
  assert.throws(() => settings.set({ PLASMA_OFF: "false" }));
  assert.throws(() => settings.set({}));
  assert.equal(settings.isEnabled("PLASMA_OFF"), true);
  settings.set({ PLASMA_OFF: false });
  storage.set = () => { throw new Error("must not rewrite"); };
  settings.set({ PLASMA_OFF: false });
  assert.throws(() => settings.set({ PLASMA_OFF: true }));
  assert.equal(settings.isEnabled("PLASMA_OFF"), false);
});

test("only the addressed EFB context applies and acknowledges settings", () => {
  const { settings } = fixture();
  const request = JSON.stringify({ protocolVersion: 1, type: "setConfirmationActions", requestId: "r1",
    instanceId: "active", actions: { PLASMA_OFF: false } });
  assert.equal(processEfbSettingsRequest(request, "old", settings), undefined);
  assert.equal(settings.isEnabled("PLASMA_OFF"), true);
  const response = JSON.parse(processEfbSettingsRequest(request, "active", settings));
  assert.equal(response.requestId, "r1");
  assert.equal(response.instanceId, "active");
  assert.equal(response.actions[0].enabled, false);
  assert.equal(response.error, null);
});

test("failed saves and invalid payloads cannot report success or re-enable input", (t) => {
  const original = console.error;
  console.error = () => {};
  t.after(() => { console.error = original; });
  const { settings, storage } = fixture();
  settings.set({ PLASMA_OFF: false });
  const request = { protocolVersion: 1, type: "setConfirmationActions", requestId: "r1", instanceId: "active" };
  const process = (actions) => JSON.parse(processEfbSettingsRequest(JSON.stringify({ ...request, actions }), "active", settings));
  for (const invalid of [null, [], {}, { OTHER: false }, { PLASMA_OFF: 0 }]) {
    assert.equal(process(invalid).actions, null);
    assert.equal(settings.isEnabled("PLASMA_OFF"), false);
  }
  storage.set = () => {};
  assert.match(process({ PLASMA_OFF: true }).error, /Could not/);
  storage.get = () => { throw new Error("storage unavailable"); };
  assert.equal(settings.isEnabled("PLASMA_OFF"), false);
  assert.match(process({ PLASMA_OFF: true }).error, /Could not/);
  assert.throws(() => processEfbSettingsRequest("null", "active", settings));
  assert.throws(() => processEfbSettingsRequest("{", "active", settings));
});
