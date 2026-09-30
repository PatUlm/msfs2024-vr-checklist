import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Explicit developer operation, never called by check/build/deploy.
// Task loads the ignored root .env. No API key is written into asset metadata.
const root = fileURLToPath(new URL('../', import.meta.url));
// Fixed announcements outside the checklist data, one directory and manifest each.
const clips = [
  { name: 'completion', text: 'Checklist completed.' },
  { name: 'no-checklist', text: 'No checklist available for this aircraft.' },
];
const voiceId = 'nPczCjzI2devNBz1zQrb';
const digest = value => createHash('sha256').update(value).digest('hex');

function plan({ name, text }) {
  const request = {
    text, model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.75, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1 },
    seed: 9172026,
  };
  const recipe = { voiceId, request, sourceFormat: 'mp3_44100_128', profile: 'clean',
    normalization: 'loudnorm=I=-20:TP=-2:LRA=11', format: 'ogg-opus-mono-48000-32k', revision: 1 };
  const hash = digest(JSON.stringify(recipe));
  const directory = path.join(root, 'assets/audio', name);
  const file = `${name}-${hash.slice(0, 16)}.opus`;
  return { request, recipe, hash, directory, file,
    metadataPath: path.join(directory, 'manifest.json'), outputPath: path.join(directory, file) };
}

async function isRendered({ hash, metadataPath, outputPath }) {
  try {
    const saved = JSON.parse(await readFile(metadataPath, 'utf8'));
    return saved.recipeHash === hash && saved.generationPlan === 'paid' &&
      digest(await readFile(outputPath)) === saved.sha256;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return false;
  }
}

async function render({ request, recipe, hash, directory, file, metadataPath, outputPath }) {
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
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${recipe.sourceFormat}`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(request), signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error(`ElevenLabs HTTP ${response.status}; no automatic retry or purchase.`);
  if (!response.headers.get('content-type')?.includes('audio')) throw new Error('ElevenLabs returned no audio.');
  const mp3 = Buffer.from(await response.arrayBuffer());
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
    generatedAt: new Date().toISOString(), provider: 'ElevenLabs', voice: 'Brian',
    generationPlan: 'paid', planEvidence: 'Operator confirmed active Starter subscription before rendering.',
    requestId: response.headers.get('request-id'), characterCost: response.headers.get('character-cost'),
    ffmpegVersion, licenseNotice: '../README.md' };
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
  console.log(`Rendered ${file}: ${encoded.length} bytes. One paid TTS request; radio is applied during playback.`);
}

async function main() {
  for (const clip of clips.map(plan)) {
    if (await isRendered(clip)) console.log(`Already rendered on a paid plan: ${clip.file}. No API request.`);
    else await render(clip);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
