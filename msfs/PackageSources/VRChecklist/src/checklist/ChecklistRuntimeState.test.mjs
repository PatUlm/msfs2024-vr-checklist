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

test("skipping a partly completed phase completes earlier and optional items and opens the next phase", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const sections = runtime.checklist.sections;
  const first = sections[0];
  runtime.getItemState(first.id, first.items[0].id).set(true);
  runtime.activeSectionIndex.set(1);
  const target = sections[2];
  runtime.sectionItemsRefs[2].instance = { scrollTop: 250 };
  const targetItem = runtime.findNextOpenItem(target);

  assert.equal(runtime.skipPhase(1), true);
  assert.equal(runtime.activeSectionIndex.get(), 2);
  assert.equal(runtime.sectionItemsRefs[2].instance.scrollTop, 0);
  assert.deepEqual(runtime.getCompletedSectionIds(), sections.slice(0, 2).map(s => s.id));
  assert.equal(runtime.completedCount.get(), sections.slice(0, 2)
    .flatMap(s => s.items).filter(i => i.kind !== "optional").length);
  assert.equal(runtime.findNextOpenItem(target), targetItem);
  assert.equal(runtime.getCompletedItemKeys().length,
    sections.slice(0, 2).flatMap(s => s.items).length);
  assert.equal(runtime.skipPhase(1), false, "A stale click must not skip the new phase");
});

test("skipping preserves other phases and already completed target items", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  const sections = runtime.checklist.sections;
  runtime.activeSectionIndex.set(3); // Taxi, with earlier Engine Start still open.
  const target = sections[4];
  runtime.getItemState(target.id, target.items[0].id).set(true);
  assert.equal(runtime.skipPhase(3), true);
  assert.equal(runtime.activeSectionIndex.get(), 4);
  assert.equal(runtime.getItemState(sections[0].id, sections[0].items[0].id).get(), false);
  assert.equal(runtime.getItemState(target.id, target.items[0].id).get(), true);
  assert.equal(runtime.findNextOpenItem(target), target.items[1]);
  assert.equal(runtime.isSectionComplete(sections[2]), true);
  assert.equal(runtime.isSectionComplete(sections[3]), true);
});

test("MH-60's sole phase completes at the last group and resets normally", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("sikorsky-mh-60"));
  assert.equal(runtime.skipPhase(0), true);
  assert.equal(runtime.completedCount.get(), runtime.totalItemCount);
  assert.equal(runtime.getCompletedSectionIds().length, runtime.checklist.sections.length);
  assert.equal(runtime.activeSectionIndex.get(), runtime.checklist.sections.length - 1);
  assert.equal(runtime.findNextOpenItem(runtime.getActiveSection()), undefined);
  const completed = runtime.getCompletedItemKeys();
  assert.equal(runtime.finalPhaseComplete.get(), true);
  assert.equal(runtime.skipPhase(runtime.activeSectionIndex.get()), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), completed);
  runtime.reset();
  assert.equal(runtime.activeSectionIndex.get(), 0);
  assert.equal(runtime.completedCount.get(), 0);
  assert.equal(runtime.finalPhaseComplete.get(), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), []);
});

test("invalid groups leave progress untouched", () => {
  const runtime = new ChecklistRuntimeState(loadChecklist("diamond-da42"));
  assert.equal(runtime.skipPhase(-1), false);
  assert.equal(runtime.skipPhase(runtime.checklist.sections.length), false);
  assert.deepEqual(runtime.getCompletedItemKeys(), []);
  assert.equal(runtime.activeSectionIndex.get(), 0);
});

test("final phase completion includes earlier groups and optional items and clears on reopening", () => {
  const checklist = loadChecklist("sikorsky-mh-60");
  checklist.sections[0].items[0].kind = "optional";
  const runtime = new ChecklistRuntimeState(checklist);
  const earlierItem = checklist.sections[0].items[0];
  runtime.skipPhase(0);
  runtime.getItemState(checklist.sections[0].id, earlierItem.id).set(false);
  runtime.updateCompletedCount();
  assert.equal(runtime.completedCount.get(), runtime.totalItemCount);
  assert.equal(runtime.finalPhaseComplete.get(), false,
    "Even at 100% required progress, an optional item keeps Skip enabled");
  assert.equal(runtime.skipPhase(runtime.activeSectionIndex.get()), true);
  assert.equal(runtime.finalPhaseComplete.get(), true);
});
