import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { itemSpeech } from './lib/checklist-speech.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'assets/audio/items');
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
const manifest = await readJson(path.join(directory, 'manifest.json'));
assert.equal(manifest.schemaVersion, 1);
const files = new Map();
for (const entry of manifest.assets) {
  assert.match(entry.file, /^item-[a-f0-9]{16}\.opus$/);
  assert(!files.has(entry.file), 'Duplicate asset');
  const metadata = await readJson(path.join(directory, entry.file.replace('.opus', '.json')));
  const bytes = await readFile(path.join(directory, entry.file));
  assert.equal(bytes.subarray(0, 4).toString(), 'OggS');
  assert.equal(hash(bytes), entry.sha256, entry.file + ' checksum');
  assert.equal(metadata.sha256, entry.sha256);
  assert.equal(hash(JSON.stringify(metadata.recipe)), entry.recipeHash);
  assert.equal(metadata.recipeHash, entry.recipeHash);
  assert.equal(entry.file, 'item-' + entry.recipeHash.slice(0, 16) + '.opus');
  assert.equal(metadata.generationPlan, 'paid');
  assert.equal(metadata.recipe.profile, 'clean');
  files.set(entry.file, metadata.recipe.request.text);
}
const expected = new Set();
for (const filename of await readdir(path.join(root, 'checklists/data'))) {
  if (!filename.endsWith('.json') || filename === 'checklist.schema.json') continue;
  const checklist = await readJson(path.join(root, 'checklists/data', filename));
  assert(manifest.checklists.some(saved => saved.id === checklist.id && saved.revision === checklist.revision),
    checklist.id + ': stale checklist revision');
  for (const section of checklist.sections) {
    for (const item of section.items) {
      const ref = checklist.id + '/' + section.id + '/' + item.id;
      if (item.kind === 'verify')
        assert(item.speech?.startsWith('Verify '), ref + ': missing spoken Verify cue');
      expected.add(ref);
      assert(Object.hasOwn(manifest.items, ref), ref + ': missing audio');
      assert.equal(files.get(manifest.items[ref]), itemSpeech(section, item),
        ref + ': stale or incorrect speech text');
    }
  }
}
assert.deepEqual(new Set(Object.keys(manifest.items)), expected);
assert.deepEqual(manifest.excludedItems, []);
assert.deepEqual(new Set(Object.values(manifest.items)), new Set(files.keys()));
console.log('Validated ' + files.size + ' paid clean audio assets and ' + expected.size + ' item mappings; no exclusions.');
