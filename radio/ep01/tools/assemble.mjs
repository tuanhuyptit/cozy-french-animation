// work/chunks.json (tools/chunk.mjs) + work/en.json (one English line per chunk) + work/plan.json (scenes, vocab)
// → episode.json. Vocab: plan.vocab[].phrase = the exact words of that chunk to bracket.
import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync('work/chunks.json', 'utf8'));
const EN = JSON.parse(fs.readFileSync('work/en.json', 'utf8'));
const P = JSON.parse(fs.readFileSync('work/plan.json', 'utf8'));
const W = JSON.parse(fs.readFileSync('assets/words.json', 'utf8'));
if (EN.length !== C.length) throw new Error(`en.json has ${EN.length} lines, chunks.json ${C.length}`);
const chunks = C.map((c, i) => ({ fr: c.fr, en: EN[i] }));
for (const v of P.vocab) {
  const c = chunks[v.at]; if (!c) throw new Error(`vocab "${v.word}": no chunk ${v.at}`);
  v.phrase = v.phrase.replace(/ ([?!:;»])/g, "\u00a0$1"); const k = c.fr.indexOf(v.phrase); if (k < 0) throw new Error(`vocab "${v.word}": "${v.phrase}" not in chunk ${v.at}: ${c.fr}`);
  if ((k && c.fr[k - 1] !== ' ') || (c.fr[k + v.phrase.length] && c.fr[k + v.phrase.length] !== ' ')) throw new Error(`vocab "${v.word}": "${v.phrase}" must cover whole words`);
  c.fr = c.fr.slice(0, k) + '[' + v.phrase + ']' + c.fr.slice(k + v.phrase.length);
}
for (const s of P.scenes || []) { const { at, ...rest } = s; if (!chunks[at]) throw new Error(`scene at ${at}: no such chunk`); chunks[at].scene = rest; }
const SETUP = fs.existsSync('work/setup.json') ? JSON.parse(fs.readFileSync('work/setup.json', 'utf8')) : {};
const ep = { title: P.title, scene: SETUP.scene, ...(SETUP.ctx && { ctx: SETUP.ctx }), lea: SETUP.lea || P.lea, edition: P.edition, parts: P.parts, audio: 'assets/voice.mp3',
  audioEnd: +(W[W.length - 1].e + 0.6).toFixed(3), chunks,
  vocab: P.vocab.map(({ at, phrase, ...v }) => v) };
fs.writeFileSync('episode.json', JSON.stringify(ep, null, 1));
console.log(`episode.json: ${chunks.length} chunks, ${ep.vocab.length} vocab, scene ${ep.scene}, Léa ${ep.lea}, audio ${ep.audioEnd}s`);
