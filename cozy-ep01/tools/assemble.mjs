// Assemble episode.json from pieces written in batches (handy for 20-minute episodes).
//
// Inputs (in the project dir):
//   episode.draft.json   from transcribe.mjs (audio, audioEnd)
//   work/setup.json      { "scene": "...", "lea": "...", "mat": "...", "decor": ["drapeau", "macarons"] }
//   work/parts/*.json    arrays of chunks { who, fr, en, emote?, react?, illus?, label? } in order (01.json, 02.json, …)
//                        emote = speaker's reaction, react = listener's: rire surpris idee question coeur gene triste fatigue
//                        illus = illustration bubble type (see ILLUS in demo-animation-style.html), label = its French caption
//   work/vocab.json      array of { tag, word, ipa, mean, ex, exEn } in the order the [ ] groups appear
// Output: episode.json, then checks every chunk's words against assets/words.json.
// Usage : node tools/assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const draft = read('episode.draft.json');
const setup = read('work/setup.json');
const partsDir = path.join(ROOT, 'work/parts');
const chunks = fs.readdirSync(partsDir).filter(f => f.endsWith('.json')).sort().flatMap(f => read('work/parts/' + f));
const vocab = read('work/vocab.json');

const ep = { scene: setup.scene, lea: setup.lea, mat: setup.mat, ...(setup.decor && { decor: setup.decor }), audio: draft.audio, audioEnd: draft.audioEnd,
  chunks: chunks.map(c => ({ who: c.who, fr: c.fr, en: c.en, ...(c.emote && { emote: c.emote }), ...(c.react && { react: c.react }), ...(c.illus && { illus: c.illus }), ...(c.label && { label: c.label }), ...(c.act && { act: c.act }), ...(c.board && { board: c.board }), ...(c.boardEnd && { boardEnd: true }) })), vocab };

// validate against the transcript before writing
const W = read('assets/words.json');
const norm = s => s.toLowerCase().replace(/[^a-zà-ÿœæç']/g, '');
let wi = 0, groups = 0, problems = [];
ep.chunks.forEach((c, ci) => {
  if (!['lea', 'mat'].includes(c.who)) problems.push(`chunk ${ci}: who="${c.who}"`);
  if (!c.en) problems.push(`chunk ${ci}: missing en`);
  const toks = c.fr.split(/[ \t\n]+/);   // NBSP (French punctuation spacing) stays inside a token
  toks.forEach(raw => {
    if (raw.startsWith('[')) groups++;
    const w = W[wi++];
    if (!w || norm(w.t) !== norm(raw.replace(/[\[\]]/g, ''))) problems.push(`chunk ${ci}: "${raw}" vs transcript "${w && w.t}" (word ${wi - 1})`);
  });
});
if (wi !== W.length) problems.push(`chunks cover ${wi} words, transcript has ${W.length}`);
if (groups !== vocab.length) problems.push(`[ ] groups ${groups} != vocab entries ${vocab.length}`);
vocab.forEach((v, i) => ['tag', 'word', 'ipa', 'mean', 'ex', 'exEn'].forEach(k => { if (!v[k]) problems.push(`vocab ${i}: missing ${k}`); }));
if (problems.length) { console.error(problems.slice(0, 30).join('\n') + (problems.length > 30 ? `\n… ${problems.length - 30} more` : '')); process.exit(1); }

fs.writeFileSync(path.join(ROOT, 'episode.json'), JSON.stringify(ep, null, 2) + '\n');
console.log(`episode.json: ${ep.chunks.length} chunks, ${W.length} words, ${vocab.length} vocab, scene=${ep.scene}`);
