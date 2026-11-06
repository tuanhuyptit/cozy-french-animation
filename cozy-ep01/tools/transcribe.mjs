// Transcribe a voice file into word timestamps + a draft episode (who speaks each line).
//
// Usage:
//   node tools/transcribe.mjs <voice.mp3> [--start 0] [--duration 36] [--model path/ggml-medium.bin]
//                             [--threshold 175] [--out <projectDir>]
//
// Writes into the project dir (default: this project):
//   assets/voice.mp3          the (trimmed) voice used by the video
//   assets/words.json         [{ s, e, t, f0 }]  one entry per word, seconds + median pitch (Hz)
//   episode.draft.json        subtitle chunks with a guessed speaker; fill "en" + mark vocab with [ ]
//
// Speaker guess: median pitch per chunk >= threshold → Léa (female), else Mathieu (male).
// Requires ffmpeg + whisper-cli (brew install ffmpeg whisper-cpp) and a multilingual ggml model.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const input = args.find((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--')));
if (!input) { console.error('usage: node tools/transcribe.mjs <voice.mp3> [--start s] [--duration s] [--model path] [--threshold hz] [--out dir]'); process.exit(1); }

const start = +opt('start', 0), duration = opt('duration'), threshold = +opt('threshold', 175);
const out = path.resolve(opt('out', PROJECT));
const model = opt('model', process.env.WHISPER_MODEL || [
  path.join(os.homedir(), '.cache/hyperframes/whisper/models/ggml-medium.bin'),
  path.join(os.homedir(), 'Desktop/Claude/youtube-videos/whisper.cpp/ggml-medium.bin'),
  path.join(os.homedir(), '.cache/hyperframes/whisper/models/ggml-small.bin'),
].find(p => fs.existsSync(p)));
if (!model || !fs.existsSync(model)) {
  console.error('No whisper model found. Download one, e.g.:\n  curl -L -o ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin\nthen pass --model ggml-medium.bin (or set WHISPER_MODEL).');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cozy-'));
const cut = [...(start ? ['-ss', String(start)] : []), ...(duration ? ['-t', String(duration)] : [])];
const run = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'ignore', 'inherit'] });

fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
run('ffmpeg', ['-y', '-loglevel', 'error', ...cut, '-i', input, '-c:a', 'libmp3lame', '-q:a', '2', path.join(out, 'assets/voice.mp3')]);
const wav = path.join(tmp, 'clip16k.wav');
run('ffmpeg', ['-y', '-loglevel', 'error', ...cut, '-i', input, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
console.log(`whisper (${path.basename(model)})…`);
run('whisper-cli', ['-m', model, '-l', 'fr', '-f', wav, '-ml', '1', '-sow', '-oj', '-of', path.join(tmp, 'words'), '-np']);

/* ---------- words ---------- */
const raw = JSON.parse(fs.readFileSync(path.join(tmp, 'words.json'), 'utf8')).transcription;
const words = raw.map(r => ({ s: r.offsets.from / 1000, e: r.offsets.to / 1000, t: r.text.trim() })).filter(w => w.t);

/* ---------- pitch per word (autocorrelation on 16 kHz PCM) ---------- */
const buf = fs.readFileSync(wav);
let p = 12; while (p < buf.length - 8 && buf.toString('ascii', p, p + 4) !== 'data') p += 8 + buf.readUInt32LE(p + 4);
const pcm = new Int16Array(buf.buffer.slice(buf.byteOffset + p + 8, buf.byteOffset + buf.length - ((buf.length - p - 8) % 2)));
const SR = 16000, N = 640;
function f0(a, b) {
  const ps = [];
  for (let st = Math.floor(a * SR); st + N < Math.min(b * SR, pcm.length); st += 320) {
    let m = 0; for (let i = 0; i < N; i++) m += pcm[st + i]; m /= N;
    let e = 0; for (let i = 0; i < N; i++) { const v = pcm[st + i] - m; e += v * v; }
    if (e / N < 500 * 500) continue;
    let best = 0, bl = 0;
    for (let l = 40; l < 200; l += 2) {
      let c = 0; for (let i = 0; i < N - l; i += 3) c += (pcm[st + i] - m) * (pcm[st + i + l] - m);
      if (c > best) { best = c; bl = l; }
    }
    if (best / (e / 3) > 0.45) ps.push(SR / bl);
  }
  ps.sort((x, y) => x - y);
  return ps.length ? Math.round(ps[ps.length >> 1]) : 0;
}
words.forEach(w => { w.f0 = f0(w.s, w.e); });
const r3 = n => Math.round(n * 1000) / 1000;
fs.writeFileSync(path.join(out, 'assets/words.json'), JSON.stringify(words.map(w => ({ s: r3(w.s), e: r3(w.e), t: w.t, f0: w.f0 })), null, 0));

/* ---------- draft subtitle chunks ---------- */
const chunks = []; let cur = [];
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  const endSentence = /[.!?…]$/.test(w.t);
  const softBreak = /[,;:]$/.test(w.t) && cur.length >= 5;
  const gap = next && next.s - w.e > 0.6;
  // long line: cut now unless punctuation comes within the next 3 words (avoid orphans like "adapté.")
  const punctSoon = words.slice(i + 1, i + 4).some(x => /[.!?…,;:]$/.test(x.t));
  const tooLong = (cur.length >= 9 && !punctSoon) || cur.length >= 13;
  if (!next || endSentence || softBreak || gap || tooLong) { chunks.push(cur); cur = []; }
});
const median = a => { const v = a.filter(Boolean).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : 0; };
const draft = chunks.map(c => {
  const hz = median(c.map(w => w.f0));
  return { who: hz >= threshold ? 'lea' : 'mat', hz, fr: c.map(w => w.t).join(' '), en: '' };
});
const ep = {
  scene: 'salon', lea: 'cardigan', mat: 'hoodie',
  audio: 'assets/voice.mp3',
  audioEnd: r3(words[words.length - 1].e + 0.45),
  chunks: draft,
  vocab: [],
};
fs.writeFileSync(path.join(out, 'episode.draft.json'), JSON.stringify(ep, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n${words.length} words, ${draft.length} chunks → ${path.relative(process.cwd(), out) || '.'}/episode.draft.json`);
draft.forEach(c => console.log(`  ${c.who === 'lea' ? 'Léa    ' : 'Mathieu'} ${String(c.hz).padStart(3)}Hz  ${c.fr}`));
console.log(`\nNext: check speakers, add "en", wrap vocab in [ ], add "vocab" entries, save as episode.json, then: node tools/build.mjs`);
