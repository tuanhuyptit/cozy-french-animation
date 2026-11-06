// Turn a Léa & Mathieu dialogue script into one voice file with VoiceStudio (local app, http://127.0.0.1:3900).
//
// Usage:
//   node tools/voice-dialogue.mjs <script.txt> [--out voice.mp3] [--gap 350] [--para-gap 800]
//        [--seed 42] [--speed 1.0] [--steps 16] [--voice LEA=Léa --voice MATHIEU=Mathieu] [--force]
//
// Script format (UTF-8 text):
//   # comment lines are ignored
//   LÉA: Salut Mathieu ! Tu sais quoi ? [laughter]
//   MATHIEU: Ah bon ? [surprise-oh] Raconte.
//                                   <- a blank line = a longer pause (--para-gap)
//   LÉA: ... a line with no "NAME:" continues the previous speaker as a new take.
//
// Tags the default engine renders: [laughter] [sigh] [surprise-oh] [surprise-ah] [question-en] ...
// and [pause], [pause 500ms], [pause 1.5s]. Any other [tag] is read aloud, so the script refuses it.
//
// Each line is cached in <out>.lines/ by a hash of its voice, text and settings: edit one line and run
// again, only that line is regenerated. Writes <out> (mp3, -16 LUFS) and <out>.timeline.json
// (start/end/speaker/text per line, in seconds).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const API = process.env.VOICESTUDIO_URL || 'http://127.0.0.1:3900';
const SR = 24000;
const KNOWN_TAGS = new Set(['laughter', 'sigh', 'confirmation-en', 'question-en', 'question-ah', 'question-oh',
  'question-ei', 'question-yi', 'surprise-ah', 'surprise-oh', 'surprise-wa', 'surprise-yo', 'dissatisfaction-hnn']);
const DEFAULT_VOICES = { LEA: 'Léa', MATHIEU: 'Mathieu' }; // speaker -> VoiceStudio profile name

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const opts = k => args.flatMap((a, i) => (a === '--' + k ? [args[i + 1]] : []));
const flag = k => args.includes('--' + k);
const scriptPath = args.find((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--') && args[i - 1] !== '--force'));
if (!scriptPath || !fs.existsSync(scriptPath)) {
  console.error('usage: node tools/voice-dialogue.mjs <script.txt> [--out voice.mp3] [--gap 350] [--para-gap 800] [--seed 42] [--voice LEA=Léa]');
  process.exit(1);
}
const out = path.resolve(opt('out', scriptPath.replace(/\.[^.]+$/, '') + '.mp3'));
const gapMs = +opt('gap', 350), paraGapMs = +opt('para-gap', 800);
const settings = { seed: opt('seed', '42'), speed: opt('speed'), num_step: opt('steps', '16'), language: 'French' };

const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const voiceNames = { ...DEFAULT_VOICES };
for (const v of opts('voice')) { const [s, p] = v.split('='); voiceNames[key(s)] = p; }

// ---- parse ----
const lines = [];
let speaker = null, pendingPara = false, errors = [];
fs.readFileSync(scriptPath, 'utf8').split(/\r?\n/).forEach((raw, n) => {
  const t = raw.trim();
  if (!t) { if (lines.length) pendingPara = true; return; }
  if (t.startsWith('#')) return;
  const m = t.match(/^([\p{L} .'-]{2,20}):\s*(.*)$/u);
  let text = t;
  if (m) { speaker = key(m[1]); text = m[2].trim(); }
  if (!speaker) { errors.push(`line ${n + 1}: no speaker yet ("LÉA:" or "MATHIEU:")`); return; }
  if (!voiceNames[speaker]) errors.push(`line ${n + 1}: unknown speaker ${speaker} (add --voice ${speaker}=<profile>)`);
  for (const [, tag] of text.matchAll(/\[([^\]]+)\]/g)) {
    if (!KNOWN_TAGS.has(tag) && !/^pause( \d+(\.\d+)?(ms|s))?$/.test(tag)) errors.push(`line ${n + 1}: [${tag}] would be read aloud`);
  }
  if (!text.replace(/\[[^\]]+\]/g, '').trim()) { errors.push(`line ${n + 1}: no words to say`); return; }
  lines.push({ n: n + 1, speaker, text, gapBefore: lines.length ? (pendingPara ? paraGapMs : gapMs) : 0 });
  pendingPara = false;
});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (!lines.length) { console.error('script has no lines'); process.exit(1); }

// ---- VoiceStudio ----
try { await fetch(API + '/health').then(r => r.json()); }
catch { console.error(`VoiceStudio is not reachable at ${API}. Open the VoiceStudio app and try again.`); process.exit(1); }
const profiles = await fetch(API + '/profiles').then(r => r.json());
const profileId = {};
for (const [s, name] of Object.entries(voiceNames)) {
  const p = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (p) profileId[s] = p.id;
}
const missing = [...new Set(lines.map(l => l.speaker))].filter(s => !profileId[s]);
if (missing.length) {
  console.error(`no VoiceStudio profile for ${missing.map(s => `${s} (${voiceNames[s]})`).join(', ')}. Profiles: ${profiles.map(p => p.name).join(', ')}`);
  process.exit(1);
}

const cacheDir = out + '.lines';
fs.mkdirSync(cacheDir, { recursive: true });
const pcm = file => { // decoded mono 24 kHz s16 PCM of a wav
  return execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 30 });
};

const t0 = Date.now();
let made = 0;
for (const [i, l] of lines.entries()) {
  const pid = profileId[l.speaker];
  const hash = crypto.createHash('sha1').update(JSON.stringify([pid, l.text, settings])).digest('hex').slice(0, 10);
  l.file = path.join(cacheDir, `${String(i + 1).padStart(3, '0')}-${l.speaker.toLowerCase()}-${hash}.wav`);
  if (fs.existsSync(l.file) && !flag('force')) continue;
  const form = new FormData();
  form.set('text', l.text);
  form.set('profile_id', pid);
  for (const [k, v] of Object.entries(settings)) if (v != null) form.set(k, String(v));
  process.stdout.write(`[${i + 1}/${lines.length}] ${l.speaker}: ${l.text.slice(0, 60)}${l.text.length > 60 ? '…' : ''}\n`);
  const r = await fetch(API + '/generate', { method: 'POST', body: form });
  if (!r.ok) { console.error(`line ${l.n}: VoiceStudio ${r.status} ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  fs.writeFileSync(l.file, Buffer.from(await r.arrayBuffer()));
  made++;
}
// drop cached takes of lines that no longer exist
const keep = new Set(lines.map(l => path.basename(l.file)));
for (const f of fs.readdirSync(cacheDir)) if (!keep.has(f)) fs.rmSync(path.join(cacheDir, f));

// ---- stitch ----
const chunks = [], timeline = [];
let samples = 0;
for (const l of lines) {
  const gap = Math.round(l.gapBefore / 1000 * SR);
  chunks.push(Buffer.alloc(gap * 2)); samples += gap;
  const a = pcm(l.file);
  timeline.push({ line: l.n, speaker: l.speaker, text: l.text, start: +(samples / SR).toFixed(3), end: +((samples + a.length / 2) / SR).toFixed(3) });
  chunks.push(a); samples += a.length / 2;
}
const tail = Buffer.alloc(Math.round(0.5 * SR) * 2); chunks.push(tail);
const raw = out + '.raw';
fs.writeFileSync(raw, Buffer.concat(chunks));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', raw,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '2', out]);
fs.rmSync(raw);
fs.writeFileSync(out + '.timeline.json', JSON.stringify(timeline, null, 2) + '\n');

console.log(`\n${out}  (${(samples / SR / 60).toFixed(1)} min, ${lines.length} lines, ${made} generated, ${lines.length - made} cached, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
console.log(`${out}.timeline.json`);
