import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, access, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { itemSpeech } from './lib/checklist-speech.mjs';

// Explicit developer operation, never called by check/build/deploy.
// Task loads the ignored root .env. No API key is written into asset metadata.
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'assets/audio/items');
const cache = path.join(root, 'tmp/checklist-audio/render-cache');
const digest = value => createHash('sha256').update(value).digest('hex');
const template = JSON.parse(await readFile(path.join(root, 'assets/audio/completion/manifest.json'), 'utf8')).recipe;
const plan = JSON.parse(await readFile(path.join(root, 'tmp/checklist-audio/plan.json'), 'utf8'));
const atomicJson = async (target, value) => {
  const temporary = target + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  await rename(temporary, target);
};

async function render(text) {
  const recipe = { ...template, request: { ...template.request, text } };
  const { request, voiceId } = recipe;
  const hash = digest(JSON.stringify(recipe));
  const file = 'item-' + hash.slice(0, 16) + '.opus';
  const outputPath = path.join(directory, file);
  const metadataPath = path.join(directory, file.replace('.opus', '.json'));
  try {
    const saved = JSON.parse(await readFile(metadataPath, 'utf8'));
    if (saved.recipeHash === hash && saved.generationPlan === 'paid') {
      const data = await readFile(outputPath);
      if (digest(data) === saved.sha256) {
        console.log(`Already rendered on a paid plan: ${file}. No API request.`);
        return saved;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!process.argv.includes('--paid-plan-confirmed'))
    throw new Error('Confirm an active paid ElevenLabs subscription with --paid-plan-confirmed. Free audition files must not be reused.');
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('Set ELEVENLABS_API_KEY in the ignored root .env.');
  const ffmpeg = process.env.VR_CHECKLIST_FFMPEG || 'ffmpeg';
  const run = (args, input) => {
    const result = spawnSync(ffmpeg, ['-hide_banner', ...args], { input, maxBuffer: 16 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`FFmpeg failed: ${result.stderr.toString().slice(-1500)}`);
    return result;
  };
  const ffmpegVersion = run(['-version']).stdout.toString().split('\n')[0];
  await mkdir(directory, { recursive: true });
  // Do not silently spend credits again after a failed/partial local render.
  try { await access(outputPath); throw new Error(`Existing asset ${file} needs manual inspection before rerendering.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(cache, { recursive: true });
  const cachedPath = path.join(cache, hash + '.json');
  const pendingPath = path.join(cache, hash + '.pending');
  let cached;
  try { cached = JSON.parse(await readFile(cachedPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!cached) {
    // A request interrupted before its response was saved requires inspection
    // of provider history. Never silently charge the same text a second time.
    await writeFile(pendingPath, 'Request started; inspect provider history before retrying.\n', { flag: 'wx' });
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${recipe.sourceFormat}`, {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) throw new Error(`ElevenLabs HTTP ${response.status}; no automatic retry or purchase.`);
    if (!response.headers.get('content-type')?.includes('audio')) throw new Error('ElevenLabs returned no audio.');
    const mp3 = Buffer.from(await response.arrayBuffer());
    cached = { mp3: mp3.toString('base64'), generatedAt: new Date().toISOString(),
      requestId: response.headers.get('request-id'), characterCost: response.headers.get('character-cost') };
    await atomicJson(cachedPath, cached);
    await rm(pendingPath);
  }
  const mp3 = Buffer.from(cached.mp3, 'base64');
  const measuredLog = run(['-i', 'pipe:0', '-af', recipe.normalization + ':print_format=json', '-f', 'null', '-'], mp3).stderr.toString();
  const measurement = JSON.parse(measuredLog.slice(measuredLog.lastIndexOf('{'), measuredLog.lastIndexOf('}') + 1));
  const parameters = [['measured_I','input_i'], ['measured_TP','input_tp'], ['measured_LRA','input_lra'],
    ['measured_thresh','input_thresh'], ['offset','target_offset']]
    .map(([target, source]) => `${target}=${measurement[source]}`).join(':');
  const encoded = run(['-v', 'error', '-i', 'pipe:0', '-af', recipe.normalization + ':' + parameters + ':linear=true',
    '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', '-application', 'voip', '-f', 'opus', 'pipe:1'], mp3).stdout;
  if (encoded.length < 100 || encoded.subarray(0,4).toString() !== 'OggS') throw new Error('Invalid Opus output.');
  await writeFile(outputPath, encoded);
  const metadata = { schemaVersion: 1, file, sha256: digest(encoded), recipeHash: hash, recipe,
    generatedAt: cached.generatedAt, provider: 'ElevenLabs', voice: 'Brian',
    generationPlan: 'paid', planEvidence: 'Operator confirmed active Starter subscription before rendering.',
    requestId: cached.requestId, characterCost: cached.characterCost,
    ffmpegVersion, licenseNotice: '../README.md' };
  await atomicJson(metadataPath, metadata);
  console.log(`Rendered ${file}: ${encoded.length} bytes.`);
  return metadata;
}

async function main() {
  // Refuse a stale plan even when called directly rather than through Task.
  for (const checklist of plan.checklists) {
    const current = JSON.parse(await readFile(path.join(root, 'checklists/data', checklist.id + '.json'), 'utf8'));
    if (current.revision !== checklist.revision) throw new Error('Stale plan: run task audio:plan.');
    const texts = new Map(current.sections.flatMap(section => section.items.map(item =>
      [current.id + '/' + section.id + '/' + item.id, itemSpeech(section, item)])));
    for (const utterance of plan.utterances)
      for (const ref of utterance.references.filter(ref => ref.reference.startsWith(current.id + '/')))
        if (texts.get(ref.reference) !== utterance.text) throw new Error('Stale plan text: run task audio:plan.');
  }
  if (plan.summary.flaggedItems) throw new Error('Resolve included text review hints before rendering.');
  const assets = [];
  const items = {};
  for (const [index, utterance] of plan.utterances.entries()) {
    console.log('[' + (index + 1) + '/' + plan.utterances.length + '] ' + utterance.text);
    const asset = await render(utterance.text);
    assets.push({ file: asset.file, sha256: asset.sha256, recipeHash: asset.recipeHash });
    for (const ref of utterance.references) items[ref.reference] = asset.file;
  }
  await atomicJson(path.join(directory, 'manifest.json'), {
    schemaVersion: 1, checklists: plan.checklists, assets, items, excludedItems: plan.excludedItems,
  });
  console.log('Complete: ' + assets.length + ' assets, ' + Object.keys(items).length + ' mapped items.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
