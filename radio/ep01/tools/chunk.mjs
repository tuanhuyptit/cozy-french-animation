// Split assets/words.json into one-line subtitle chunks → work/chunks.json [{ i, s, fr }] (prints them numbered).
// Breaks: sentence end; comma/colon once ≥ 5 words; hard cap 10 words (cut at the best spot, never leaving 1–2 orphan words).
import fs from 'node:fs';
const W = JSON.parse(fs.readFileSync('assets/words.json', 'utf8'));
const END = /[.!?…]["» ]*$|[.!?…] ?»$/, SOFT = /[,;:]$|[,;:] ?»$/;
const chunks = []; let cur = [];
const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
W.forEach((w, i) => {
  cur.push(w);
  const next = W[i + 1], t = w.t;
  if (!next) return flush();
  const gap = next.s - w.e > 0.7;
  // how many words until the sentence ends
  let k = i + 1; while (k < W.length && k - i < 12 && !END.test(W[k - 1].t)) k++;
  const left = k - i - 1;
  if (END.test(t)) return flush();
  if (SOFT.test(t) && cur.length >= 4 && left >= 3) return flush();
  if (gap && cur.length >= 3) return flush();
  if (cur.length >= 9 && left > 2) return flush();
  if (cur.length >= 12) return flush();
});
// glue lonely 1-word chunks onto a neighbour when that keeps it ≤ 11 words
for (let i = 0; i < chunks.length; i++) if (chunks[i].length === 1 && !END.test(chunks[i][0].t)) {
  if (chunks[i + 1] && chunks[i + 1].length <= 10) { chunks[i + 1].unshift(...chunks[i]); chunks.splice(i, 1); i--; }
}
const out = chunks.map((c, i) => ({ i, s: c[0].s, fr: c.map(w => w.t).join(' ') }));
fs.writeFileSync('work/chunks.json', JSON.stringify(out, null, 0));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
out.forEach(c => console.log(`${c.i}\t${mmss(c.s)}\t${c.fr}`));
console.error(`${out.length} chunks, max ${Math.max(...chunks.map(c => c.length))} words`);
