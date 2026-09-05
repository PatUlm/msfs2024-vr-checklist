import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "../testing/bundleModule.mjs";

const {
  createAircraftIdentityKey,
  describeAircraftIdentity,
  hasAircraftIdentity,
  normalizeMsfsIdentityValue,
  selectChecklistForAircraft,
} = await importBundledModule(new URL("./AircraftMatching.ts", import.meta.url));

function checklist(id, ...msfsMatches) {
  return {
    id,
    title: id,
    aircraft: { manufacturer: "Test", model: id, msfsMatches },
    revision: "1",
    sections: [],
  };
}

const g36 = checklist("g36", { atcModel: { equals: "BE36" } });
const da42 = checklist("da42", {
  atcModel: { equals: "DA42" },
  title: { contains: "NG" },
});
const h500 = checklist("h500", { title: { contains: "500" } });

test("identity values are normalised to upper-case alphanumerics", () => {
  assert.equal(normalizeMsfsIdentityValue("  Beech G36 Bonanza-NG "), "BEECHG36BONANZANG");
  assert.equal(normalizeMsfsIdentityValue("TT:ATCCOM.AC_MODEL BE36.0.text"), "TTATCCOMACMODELBE360TEXT");
});

test("the identity key ignores whitespace and casing differences", () => {
  const key = createAircraftIdentityKey({
    atcModel: "BE36",
    atcType: "Beechcraft",
    title: "Bonanza G36",
  });
  assert.equal(key, "BE36|BEECHCRAFT|BONANZAG36");
  assert.equal(
    createAircraftIdentityKey({
      atcModel: " be36 ",
      atcType: "BEECHCRAFT",
      title: "bonanza-g36",
    }),
    key
  );
});

test("an identity counts as present once any field carries a value", () => {
  assert.equal(hasAircraftIdentity({ atcModel: "", atcType: "", title: "" }), false);
  assert.equal(hasAircraftIdentity({ atcModel: "", atcType: "", title: "-" }), false);
  assert.equal(hasAircraftIdentity({ atcModel: "", atcType: "", title: "X" }), true);
});

test("describeAircraftIdentity joins the raw fields and labels empty ones on request", () => {
  const identity = { atcModel: "BE36", atcType: "", title: "Bonanza" };
  assert.equal(describeAircraftIdentity(identity), "BE36 |  | Bonanza");
  assert.equal(
    describeAircraftIdentity(identity, "(leer)"),
    "BE36 | (leer) | Bonanza"
  );
});

test("a single matching checklist is selected", () => {
  const selection = selectChecklistForAircraft([g36, da42, h500], {
    atcModel: "be36",
    atcType: "Beechcraft",
    title: "Bonanza G36",
  });
  assert.equal(selection.checklist, g36);
  assert.deepEqual(selection.matchingChecklists, [g36]);
});

test("every criterion of a rule must match", () => {
  const withoutNg = selectChecklistForAircraft([da42], {
    atcModel: "DA42",
    atcType: "",
    title: "Diamond DA42 Classic",
  });
  assert.equal(withoutNg.checklist, undefined);
  assert.deepEqual(withoutNg.matchingChecklists, []);

  const withNg = selectChecklistForAircraft([da42], {
    atcModel: "DA42",
    atcType: "",
    title: "Diamond DA42-NG",
  });
  assert.equal(withNg.checklist, da42);
});

test("an ambiguous identity selects nothing but reports every match", () => {
  const selection = selectChecklistForAircraft([g36, da42, h500], {
    atcModel: "BE36",
    atcType: "",
    title: "Hughes 500 conversion",
  });
  assert.equal(selection.checklist, undefined);
  assert.deepEqual(selection.matchingChecklists, [g36, h500]);
});

test("a rule without criteria and an empty identity never match", () => {
  const openRule = checklist("open", {});
  assert.deepEqual(
    selectChecklistForAircraft([openRule, g36], {
      atcModel: "",
      atcType: "",
      title: "",
    }),
    { checklist: undefined, matchingChecklists: [] }
  );
});
