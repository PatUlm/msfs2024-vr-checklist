import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(projectRoot, "checklists", "data");
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const checklistProperties = new Set(["schemaVersion", "id", "title", "aircraft", "revision", "sections"]);
const aircraftProperties = new Set(["manufacturer", "model"]);
const sectionProperties = new Set(["id", "title", "items"]);
const itemProperties = new Set([
  "id",
  "challenge",
  "response",
  "kind",
  "speech",
  "condition",
  "alternatives",
  "notes",
  "needsReview",
  "reviewNote"
]);
const alternativeProperties = new Set(["when", "response"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertObject(value, location) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${location} must be an object`);
}

function assertKnownProperties(value, allowedProperties, location) {
  for (const property of Object.keys(value)) {
    assert(allowedProperties.has(property), `${location} contains unknown property ${property}`);
  }
}

function assertSingleLineString(value, location) {
  assert(typeof value === "string" && value.trim().length > 0, `${location} must be a non-empty string`);
  assert(!/[\r\n]/.test(value), `${location} must not contain line breaks`);
}

function assertDate(value, location) {
  assert(typeof value === "string" && datePattern.test(value), `${location} must use YYYY-MM-DD`);
  const parsedDate = new Date(`${value}T00:00:00Z`);
  assert(!Number.isNaN(parsedDate.valueOf()), `${location} is not a valid date`);
  assert(parsedDate.toISOString().slice(0, 10) === value, `${location} is not a valid calendar date`);
}

function assertNoSourceCoupling(value, location) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSourceCoupling(entry, `${location}[${index}]`));
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert(key !== "source" && key !== "sourceDocument", `${location} contains forbidden field ${key}`);
    assertNoSourceCoupling(child, `${location}.${key}`);
  }
}

const fileNames = (await readdir(dataDirectory))
  .filter((fileName) => fileName.endsWith(".json") && fileName !== "checklist.schema.json")
  .sort();

JSON.parse(await readFile(path.join(dataDirectory, "checklist.schema.json"), "utf8"));
assert(fileNames.length > 0, "No checklist JSON files found");

const checklistIds = new Set();
const references = new Set();
let sectionCount = 0;
let itemCount = 0;
let speechOverrideCount = 0;
let reviewItemCount = 0;

for (const fileName of fileNames) {
  const checklist = JSON.parse(await readFile(path.join(dataDirectory, fileName), "utf8"));
  const checklistLocation = fileName;

  assertObject(checklist, checklistLocation);
  assertKnownProperties(checklist, checklistProperties, checklistLocation);
  assert(checklist.schemaVersion === 1, `${checklistLocation} has unsupported schemaVersion ${checklist.schemaVersion}`);
  assertSingleLineString(checklist.id, `${checklistLocation}.id`);
  assert(idPattern.test(checklist.id), `${checklistLocation} has invalid checklist id ${checklist.id}`);
  assert(fileName === `${checklist.id}.json`, `${checklistLocation} does not match checklist id ${checklist.id}`);
  assert(!checklistIds.has(checklist.id), `${checklistLocation} duplicates checklist id ${checklist.id}`);
  checklistIds.add(checklist.id);
  assertSingleLineString(checklist.title, `${checklistLocation}.title`);
  assertObject(checklist.aircraft, `${checklistLocation}.aircraft`);
  assertKnownProperties(checklist.aircraft, aircraftProperties, `${checklistLocation}.aircraft`);
  assertSingleLineString(checklist.aircraft.manufacturer, `${checklistLocation}.aircraft.manufacturer`);
  assertSingleLineString(checklist.aircraft.model, `${checklistLocation}.aircraft.model`);
  assertDate(checklist.revision, `${checklistLocation}.revision`);
  assert(Array.isArray(checklist.sections) && checklist.sections.length > 0, `${checklistLocation} has no sections`);
  assertNoSourceCoupling(checklist, checklistLocation);

  const sectionIds = new Set();
  for (const section of checklist.sections) {
    assertObject(section, `${checklist.id}.sections[]`);
    assertKnownProperties(section, sectionProperties, `${checklist.id}.sections[]`);
    assertSingleLineString(section.id, `${checklist.id}.sections[].id`);
    const sectionLocation = `${checklist.id}/${section.id}`;
    assert(idPattern.test(section.id), `${sectionLocation} has an invalid section id`);
    assert(!sectionIds.has(section.id), `${checklist.id} duplicates section id ${section.id}`);
    sectionIds.add(section.id);
    assertSingleLineString(section.title, `${sectionLocation}.title`);
    assert(Array.isArray(section.items) && section.items.length > 0, `${sectionLocation} has no items`);
    sectionCount += 1;

    const itemIds = new Set();
    for (const item of section.items) {
      assertObject(item, `${sectionLocation}.items[]`);
      assertKnownProperties(item, itemProperties, `${sectionLocation}.items[]`);
      assertSingleLineString(item.id, `${sectionLocation}.items[].id`);
      const reference = `${sectionLocation}/${item.id}`;
      assert(idPattern.test(item.id), `${reference} has an invalid item id`);
      assert(!itemIds.has(item.id), `${sectionLocation} duplicates item id ${item.id}`);
      assert(!references.has(reference), `Duplicate composite reference ${reference}`);
      itemIds.add(item.id);
      references.add(reference);

      assertSingleLineString(item.challenge, `${reference}.challenge`);
      assertSingleLineString(item.response, `${reference}.response`);
      assert(
        ["action", "verify", "communication"].includes(item.kind),
        `${reference} has invalid kind ${item.kind}`
      );
      if (item.speech !== undefined) {
        assertSingleLineString(item.speech, `${reference}.speech`);
        speechOverrideCount += 1;
      }
      if (item.condition !== undefined) {
        assertSingleLineString(item.condition, `${reference}.condition`);
      }
      if (item.alternatives !== undefined) {
        assert(
          Array.isArray(item.alternatives) && item.alternatives.length > 0,
          `${reference}.alternatives must be a non-empty array`
        );
        const alternativeConditions = new Set();
        for (const [index, alternative] of item.alternatives.entries()) {
          const alternativeLocation = `${reference}.alternatives[${index}]`;
          assertObject(alternative, alternativeLocation);
          assertKnownProperties(alternative, alternativeProperties, alternativeLocation);
          assertSingleLineString(alternative.when, `${alternativeLocation}.when`);
          assertSingleLineString(alternative.response, `${alternativeLocation}.response`);
          assert(
            !alternativeConditions.has(alternative.when),
            `${reference} duplicates alternative condition ${alternative.when}`
          );
          alternativeConditions.add(alternative.when);
        }
      }
      if (item.notes !== undefined) {
        assert(Array.isArray(item.notes) && item.notes.length > 0, `${reference}.notes must be a non-empty array`);
        item.notes.forEach((note, index) => assertSingleLineString(note, `${reference}.notes[${index}]`));
      }
      if (item.needsReview !== undefined) {
        assert(typeof item.needsReview === "boolean", `${reference}.needsReview must be a boolean`);
      }
      if (item.needsReview === true) {
        assertSingleLineString(item.reviewNote, `${reference}.reviewNote`);
        reviewItemCount += 1;
      }
      if (item.reviewNote !== undefined) {
        assertSingleLineString(item.reviewNote, `${reference}.reviewNote`);
        assert(item.needsReview === true, `${reference} has reviewNote without needsReview`);
      }
      itemCount += 1;
    }
  }
}

console.log(
  `Validated ${fileNames.length} checklists, ${sectionCount} sections and ${itemCount} items ` +
    `(${speechOverrideCount} speech overrides, ${reviewItemCount} review flags).`
);
