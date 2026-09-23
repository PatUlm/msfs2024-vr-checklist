import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Offline inventory only: no credentials, synthesis, or generated product assets.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'checklists/data');
const output = path.join(root, 'tmp/checklist-audio');
const utterances = new Map();
const checklists = [];
const excludedItems = [];
for (const file of (await readdir(source)).sort()) {
  if (!file.endsWith('.json') || file === 'checklist.schema.json') continue;
  const checklist = JSON.parse(await readFile(path.join(source, file), 'utf8'));
  let items = 0;
  for (const section of checklist.sections) {
    for (const item of section.items) {
      items++;
      const text = item.speech ?? `${item.challenge}: ${item.response}`;
      const reference = `${checklist.id}/${section.id}/${item.id}`;
      const concerns = [];
      if (item.needsReview) concerns.push(`Content review: ${item.reviewNote ?? 'needsReview'}`);
      if (!item.speech) {
        if (item.condition || item.alternatives?.length)
          concerns.push('Condition or alternatives missing from speech fallback');
        if (/[\[\]/+]|\b(?:[A-Z]{2,}|kt|ft|rpm)\b/.test(text))
          concerns.push('Check pronunciation of abbreviations, units or compact notation');
      }
      if (!utterances.has(text)) utterances.set(text, {
        textId: createHash('sha256').update(text).digest('hex'), text, references: [],
      });
      utterances.get(text).references.push({ reference, source: item.speech ? 'speech' : 'fallback', concerns });
    }
  }
  checklists.push({ id: checklist.id, revision: checklist.revision, items });
}
const entries = [...utterances.values()];
const length = text => [...text].length;
const summary = {
  checklists: checklists.length,
  items: checklists.reduce((sum, entry) => sum + entry.items, 0),
  includedItems: entries.reduce((sum, entry) => sum + entry.references.length, 0),
  excludedItems: excludedItems.length,
  uniqueUtterances: entries.length,
  characters: entries.reduce((sum, entry) => sum + length(entry.text), 0),
  charactersWithoutReuse: entries.reduce((sum, entry) => sum + length(entry.text) * entry.references.length, 0),
  flaggedItems: entries.flatMap(entry => entry.references).filter(entry => entry.concerns.length).length,
};
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'plan.json'), JSON.stringify({ schemaVersion: 1, summary, checklists, utterances: entries, excludedItems }, null, 2) + '\n');
const escape = value => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
const rows = entries.flatMap(entry => entry.references.filter(ref => ref.concerns.length)
  .map(ref => `| ${escape(ref.reference)} | ${escape(entry.text)} | ${escape(ref.concerns.join('; '))} |`));
await writeFile(path.join(output, 'review.md'), [
  '# Checklist audio text review', '',
  'Generated from canonical checklist JSON. Edit speech overrides in the source, then regenerate.',
  'Flags are review hints, not proof of incorrect pronunciation. This inventory makes no API requests.',
  'Character counts are text volume, not a binding credit or currency quote. Completion audio is excluded.',
  'Text IDs identify exact text only; final asset hashes must also include the voice and render recipe.', '',
  '```json', JSON.stringify(summary, null, 2), '```', '',
  '| Item | Spoken text | Review hint |', '| --- | --- | --- |', ...rows, '',
  '## Deferred items (not sent to TTS)', '',
  '| Item | Reason |', '| --- | --- |',
  ...excludedItems.map(item => `| ${escape(item.reference)} | ${escape(item.reason)} |`), '',
].join('\n'));
console.log(JSON.stringify(summary, null, 2));
console.log('Review: tmp/checklist-audio/review.md; full inventory: tmp/checklist-audio/plan.json');
