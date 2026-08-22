import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(projectRoot, "checklists", "data");
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

const checklistIds = new Set();
const references = new Set();
let sectionCount = 0;
let itemCount = 0;

for (const fileName of fileNames) {
  const checklist = JSON.parse(await readFile(path.join(dataDirectory, fileName), "utf8"));
  const checklistLocation = fileName;

  assert(idPattern.test(checklist.id), `${checklistLocation} has invalid checklist id ${checklist.id}`);
  assert(!checklistIds.has(checklist.id), `${checklistLocation} duplicates checklist id ${checklist.id}`);
  checklistIds.add(checklist.id);
  assert(Array.isArray(checklist.sections) && checklist.sections.length > 0, `${checklistLocation} has no sections`);
  assertNoSourceCoupling(checklist, checklistLocation);

  const sectionIds = new Set();
  for (const section of checklist.sections) {
    const sectionLocation = `${checklist.id}/${section.id}`;
    assert(idPattern.test(section.id), `${sectionLocation} has an invalid section id`);
    assert(!sectionIds.has(section.id), `${checklist.id} duplicates section id ${section.id}`);
    sectionIds.add(section.id);
    assert(Array.isArray(section.items) && section.items.length > 0, `${sectionLocation} has no items`);
    sectionCount += 1;

    const itemIds = new Set();
    for (const item of section.items) {
      const reference = `${sectionLocation}/${item.id}`;
      assert(idPattern.test(item.id), `${reference} has an invalid item id`);
      assert(!itemIds.has(item.id), `${sectionLocation} duplicates item id ${item.id}`);
      assert(!references.has(reference), `Duplicate composite reference ${reference}`);
      itemIds.add(item.id);
      references.add(reference);

      assert(typeof item.challenge === "string" && item.challenge.length > 0, `${reference} has no challenge`);
      assert(typeof item.response === "string" && item.response.length > 0, `${reference} has no response`);
      assert(
        ["action", "verify", "communication"].includes(item.kind),
        `${reference} has invalid kind ${item.kind}`
      );
      if (item.speech !== undefined) {
        assert(typeof item.speech === "string" && item.speech.length > 0, `${reference} has invalid speech`);
      }
      if (item.needsReview === true) {
        assert(
          typeof item.reviewNote === "string" && item.reviewNote.length > 0,
          `${reference} needs a reviewNote`
        );
      }
      if (item.reviewNote !== undefined) {
        assert(item.needsReview === true, `${reference} has reviewNote without needsReview`);
      }
      itemCount += 1;
    }
  }
}

console.log(`Validated ${fileNames.length} checklists, ${sectionCount} sections and ${itemCount} items.`);
