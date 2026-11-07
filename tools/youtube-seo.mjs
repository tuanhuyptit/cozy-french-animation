// Raw material for an episode's YouTube SEO file + caption uploads.
//
// Usage (repo root):  node tools/youtube-seo.mjs cozy-ep03
//
// Reads <ep>/episode.json + <ep>/assets/words.json and writes to <ep>/youtube/:
//   outline.txt      every subtitle chunk with its mm:ss start (◆ = explanation board, ★ = vocab word)
//                    → pick 6–10 chapter starts from it for the description (first must be 0:00)
//   vocab.md         the episode's vocabulary as a ready-to-paste description block
//   captions.fr.srt  French subtitles (upload as "French" in YouTube Studio → Subtitles)
//   captions.en.srt  English translation (upload as "English")
// Then write <ep>/youtube-seo.md by hand / with Claude (see skills/cozy-french-episode, "YouTube SEO").
import fs from 'node:fs';
import path from 'node:path';

const ep = process.argv[2];
if (!ep) { console.error('usage: node tools/youtube-seo.mjs <cozy-epNN>'); process.exit(1); }
const DIR = path.resolve(ep);
const EP = JSON.parse(fs.readFileSync(path.join(DIR, 'episode.json'), 'utf8'));
const W = JSON.parse(fs.readFileSync(path.join(DIR, 'assets/words.json'), 'utf8'));
const OUT = path.join(DIR, 'youtube');
fs.mkdirSync(OUT, { recursive: true });

// align chunks to word timestamps (same rule as tools/build.mjs)
const norm = s => s.toLowerCase().replace(/[^a-zà-ÿœæç']/g, '');
let wi = 0;
const chunks = EP.chunks.map((c, ci) => {
  const toks = c.fr.split(/[ \t\n]+/).map(raw => {
    const t = raw.replace(/[\[\]]/g, ''), w = W[wi++];
    if (!w || norm(w.t) !== norm(t)) throw new Error(`chunk ${ci}: "${t}" vs transcript "${w && w.t}"`);
    return w;
  });
  return { ...c, s: toks[0].s, e: toks[toks.length - 1].e };
});
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.end = n ? Math.min(c.e + 1.2, Math.max(n.s - 0.05, c.e)) : c.e + 1; });

const mmss = t => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = String(t % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`; };
const srtT = t => { const ms = Math.round(t * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
const name = { lea: 'Léa', mat: 'Mathieu' };

// outline
const outline = chunks.map(c => `${mmss(c.s).padStart(7)} ${c.board ? '◆' : ' '}${/\[/.test(c.fr) ? '★' : ' '} ${name[c.who].padEnd(7)} ${c.fr.replace(/[\[\]]/g, '')}   | ${c.en}`);
fs.writeFileSync(path.join(OUT, 'outline.txt'), outline.join('\n') + '\n');

// vocab block
const vocab = (EP.vocab || []).map(v => `• ${v.word} — ${v.mean}\n  « ${v.ex} » (${v.exEn})`);
fs.writeFileSync(path.join(OUT, 'vocab.md'), vocab.join('\n') + '\n');

// captions (speaker name only when the speaker changes, as YouTube recommends for multi-speaker videos)
const srt = key => chunks.map((c, i) => {
  const who = i && chunks[i - 1].who === c.who ? '' : `${name[c.who]}: `;
  return `${i + 1}\n${srtT(c.s)} --> ${srtT(c.end)}\n${who}${(key === 'fr' ? c.fr : c.en).replace(/[\[\]]/g, '')}\n`;
}).join('\n');
fs.writeFileSync(path.join(OUT, 'captions.fr.srt'), srt('fr'));
fs.writeFileSync(path.join(OUT, 'captions.en.srt'), srt('en'));

console.log(`${ep}: ${chunks.length} chunks, ${EP.vocab?.length || 0} vocab, audio ${mmss(EP.audioEnd)} → ${path.relative(process.cwd(), OUT)}/`);
