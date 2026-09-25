import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

test("disabled actions never confirm, and toggling preserves registration and debounce", async (t) => {
  let handler;
  let registrations = 0;
  let confirmations = 0;
  let enabled = true;
  let active = true;
  let now = 1000;
  let destroyed = false;
  globalThis.confirmationTestManager = {
    interceptKey: (event, passThrough) => {
      assert.equal(event, "PLASMA_OFF");
      assert.equal(passThrough, true);
      registrations++;
    },
  };
  t.after(() => { delete globalThis.confirmationTestManager; });
  const bundled = await build({
    entryPoints: [fileURLToPath(new URL("./ConfirmationInput.ts", import.meta.url))],
    bundle: true, write: false, format: "esm",
    plugins: [{ name: "sdk-test-double", setup(build) {
      build.onResolve({ filter: /^@microsoft\/msfs-sdk$/ }, () => ({ path: "sdk", namespace: "test" }));
      build.onLoad({ filter: /.*/, namespace: "test" }, () => ({
        contents: "export const KeyEventManager = { getManager: async () => globalThis.confirmationTestManager };",
      }));
    } }],
  });
  const { ConfirmationInput } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
  const input = new ConfirmationInput({
    bus: { getSubscriber: () => ({ on: () => ({ handle: (callback) => {
      handler = callback;
      return { destroy: () => { destroyed = true; } };
    } }) }) },
    isViewActive: () => active, isActionEnabled: () => enabled,
    onConfirm: () => confirmations++, now: () => now,
  });
  input.start();
  await Promise.resolve();
  handler({ key: "PLASMA_OFF" });
  handler({ key: "PLASMA_OFF" });
  assert.equal(confirmations, 1);
  now += 100;
  enabled = false;
  handler({ key: "PLASMA_OFF" });
  assert.equal(confirmations, 1);
  enabled = true;
  handler({ key: "PLASMA_OFF" });
  assert.equal(confirmations, 2);
  active = false;
  now += 100;
  handler({ key: "PLASMA_OFF" });
  assert.equal(confirmations, 2);
  input.ensureInterception("settings changed");
  assert.equal(registrations, 1);
  input.invalidateInterception("new flight");
  input.ensureInterception("flight ready");
  assert.equal(registrations, 2);
  input.dispose();
  assert.equal(destroyed, true);
});
