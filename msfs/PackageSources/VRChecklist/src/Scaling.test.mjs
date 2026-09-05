import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "./testing/bundleModule.mjs";

const { resolveScaling } = await importBundledModule(
  new URL("./Scaling.ts", import.meta.url)
);

// Layout boxes measured in MSFS, see docs/msfs-sdk-reference.md.
test("mounted tablet in VR is the VR profile reference at 17 px", () => {
  assert.deepEqual(resolveScaling(true, 468, 661), {
    profile: "vr",
    rootFontSizePx: 17,
  });
});

test("detached VR panel stays in the VR profile and scales continuously", () => {
  assert.deepEqual(resolveScaling(true, 401, 569), {
    profile: "vr",
    rootFontSizePx: 14.6,
  });
});

test("mounted tablet outside VR gets the VR profile by box size", () => {
  assert.deepEqual(resolveScaling(false, 468, 661), {
    profile: "vr",
    rootFontSizePx: 17,
  });
});

test("detached panels outside VR use the non-VR profile", () => {
  assert.deepEqual(resolveScaling(false, 624, 883), {
    profile: "non-vr",
    rootFontSizePx: 16,
  });
  assert.deepEqual(resolveScaling(false, 745, 1053), {
    profile: "non-vr",
    rootFontSizePx: 19.1,
  });
  assert.deepEqual(resolveScaling(false, 863, 1220), {
    profile: "non-vr",
    rootFontSizePx: 22.1,
  });
});

test("landscape orientation uses the short side", () => {
  assert.deepEqual(resolveScaling(false, 883, 624), {
    profile: "non-vr",
    rootFontSizePx: 16,
  });
});

test("the mounted threshold lies midway between 468 and 624", () => {
  assert.equal(resolveScaling(false, 545, 1000).profile, "vr");
  assert.equal(resolveScaling(false, 546, 1000).profile, "non-vr");
});
