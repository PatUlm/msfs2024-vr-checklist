import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { build } from "esbuild";

// Only the SDK's observable values and DOM refs are replaced; exercise the
// actual runtime mutations, completion counts and navigation without MSFS.
const bundle = await build({
  entryPoints: [new URL("./ChecklistRuntimeState.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  write: false,
  plugins: [{
    name: "sdk-state-stub",
    setup(builder) {
      builder.onResolve({ filter: /^@microsoft\/msfs-sdk$/ }, () => ({
        path: "sdk", namespace: "stub",
      }));
      builder.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: `
        export class Subject {
          static create(value) { return new Subject(value); }
          constructor(value) { this.value = value; }
          get() { return this.value; }
          set(value) { this.value = value; }
          map(mapper) { return { get: () => mapper(this.value) }; }
        }
        export const FSComponent = {
          createRef: () => ({ instance: undefined, getOrDefault() { return this.instance; } })
        };
      ` }));
    },
  }],
});
const { ChecklistRuntimeState } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

function loadChecklist(name) {
  return JSON.parse(readFileSync(new URL(
    `../../../../../checklists/data/${name}.json`, import.meta.url
  )));
}

test("only the last group of each phase block is a phase end", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  assert.deepEqual(runtime.checklist.sections.map((_, index) => runtime.isPhaseEnd(index)),
    [false, true, false, true, false, true, true]);
});

test("skipping a partly completed phase completes earlier and optional items and stays at its end", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const sections = runtime.checklist.sections;
  const first = sections[0];
  runtime.getItemState(first.id, first.items[0].id).set(true);
  runtime.activeSectionIndex.set(0);
  runtime.sectionItemsRefs[1].instance = { scrollTop: 250 };

  assert.equal(runtime.skipPhase(0), true);
  assert.equal(runtime.activeSectionIndex.get(), 1);
  assert.equal(runtime.sectionItemsRefs[1].instance.scrollTop, 0);
  assert.deepEqual(runtime.getCompletedSectionIds(), sections.slice(0, 2).map(s => s.id));
  assert.equal(runtime.completedCount.get(), sections.slice(0, 2)
    .flatMap(s => s.items).filter(i => i.kind !== "optional").length);
  assert.equal(runtime.getCompletedItemKeys().length,
    sections.slice(0, 2).flatMap(s => s.items).length);
  assert.deepEqual(runtime.getCompletedPhases(),
    [{ firstGroupId: first.id, phase: "Engine Start", skipped: true }]);
  assert.equal(runtime.phaseCompletion[0].get(), true);
  assert.equal(runtime.skipPhase(1), false, "A complete phase must not be skipped again");
});

test("skipping preserves other phases and the next phase's items", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const sections = runtime.checklist.sections;
  runtime.activeSectionIndex.set(3); // Taxi, with earlier Engine Start still open.
  const next = sections[4];
  runtime.getItemState(next.id, next.items[0].id).set(true);
  assert.equal(runtime.skipPhase(3), true);
  assert.equal(runtime.activeSectionIndex.get(), 3);
  assert.equal(runtime.getItemState(sections[0].id, sections[0].items[0].id).get(), false);
  assert.equal(runtime.getItemState(next.id, next.items[0].id).get(), true);
  assert.equal(runtime.findNextOpenItem(next), next.items[1]);
  assert.equal(runtime.isSectionComplete(sections[2]), true);
  assert.equal(runtime.isSectionComplete(sections[3]), true);
  assert.deepEqual(runtime.getCompletedPhases().map(p => p.phase), ["Taxi"]);
});

test("a phase completes with its last group even while an earlier group is open", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const [first, last] = runtime.checklist.sections;
  for (const item of last.items) {
    runtime.getItemState(last.id, item.id).set(true);
  }
  runtime.updateCompletedCount();
  assert.deepEqual(runtime.getCompletedPhases(),
    [{ firstGroupId: first.id, phase: "Engine Start", skipped: false }]);
  assert.deepEqual(runtime.phaseCompletion.slice(0, 3).map(state => state.get()),
    [true, true, false]);
  for (const index of [0, 1]) {
    runtime.activeSectionIndex.set(index);
    assert.equal(runtime.skipPhase(index), false, "A complete phase must not be skipped");
  }
  assert.equal(runtime.findNextOpenItem(first), first.items[0], "The open group stays open");
});

test("a reopened item ends the skipped state; completing by hand reports a normal phase end", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const [first, second] = runtime.checklist.sections;
  runtime.skipPhase(0);
  const item = runtime.getItemState(second.id, second.items[0].id);
  item.set(false);
  runtime.updateCompletedCount();
  assert.deepEqual(runtime.getCompletedPhases(), []);
  assert.equal(runtime.phaseCompletion[0].get(), false);
  item.set(true);
  runtime.updateCompletedCount();
  assert.deepEqual(runtime.getCompletedPhases(),
    [{ firstGroupId: first.id, phase: "Engine Start", skipped: false }]);
});

test("MH-60's sole phase completes at the last group and resets normally", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("sikorsky-mh-60"));
  assert.equal(runtime.skipPhase(0), true);
  assert.equal(runtime.completedCount.get(), runtime.totalItemCount);
  assert.equal(runtime.getCompletedSectionIds().length, runtime.checklist.sections.length);
  assert.equal(runtime.activeSectionIndex.get(), runtime.checklist.sections.length - 1);
  assert.equal(runtime.findNextOpenItem(runtime.getActiveSection()), undefined);
  const completed = runtime.getCompletedItemKeys();
  assert.equal(runtime.phaseCompletion[0].get(), true);
  assert.equal(runtime.skipPhase(runtime.activeSectionIndex.get()), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), completed);
  runtime.reset();
  assert.equal(runtime.activeSectionIndex.get(), 0);
  assert.equal(runtime.completedCount.get(), 0);
  assert.equal(runtime.phaseCompletion[0].get(), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), []);
  assert.deepEqual(runtime.getCompletedPhases(), []);
});

test("invalid groups leave progress untouched", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  assert.equal(runtime.skipPhase(-1), false);
  assert.equal(runtime.skipPhase(runtime.checklist.sections.length), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), []);
  assert.equal(runtime.activeSectionIndex.get(), 0);
});

test("an open optional item in the last group keeps the phase open", () => {
  const checklist = loadChecklist("sikorsky-mh-60");
  const last = checklist.sections.at(-1);
  last.items[0].kind = "optional";
  const runtime = new ChecklistRuntimeState(checklist);
  runtime.skipPhase(0);
  runtime.getItemState(last.id, last.items[0].id).set(false);
  runtime.updateCompletedCount();
  assert.equal(runtime.completedCount.get(), runtime.totalItemCount);
  assert.equal(runtime.phaseCompletion[0].get(), false,
    "Even at 100% required progress, an optional item keeps Skip enabled");
  assert.equal(runtime.skipPhase(runtime.activeSectionIndex.get()), true);
  assert.equal(runtime.phaseCompletion[0].get(), true);
});
