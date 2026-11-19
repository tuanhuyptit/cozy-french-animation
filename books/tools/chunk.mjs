// Split assets/words.json into one-line subtitle chunks (≤ 50 French chars, like The Cozy French) → work/chunks.json [{ i, s, fr }].
// Usage (inside books/epNN/): node ../tools/chunk.mjs > work/chunks.txt
// Each sentence is cut on its own: as few pieces as possible, balanced lengths, preferring commas and pauses, never a 1–2 word orphan.
import fs from 'node:fs';
const MAX = 50;
const W = JSON.parse(fs.readFileSync('assets/words.json', 'utf8'));
const END = /[.!?…]["» ]*$/, SOFT = /[,;:]["» ]*$/;
const L = a => a.map(w => w.t).join(' ').length;
// sentences
const sents = []; let cur = [];
W.forEach(w => { cur.push(w); if (END.test(w.t)) { sents.push(cur); cur = []; } }); if (cur.length) sents.push(cur);
const chunks = [];
for (const s of sents) {
  if (L(s) <= MAX) { chunks.push(s); continue; }
  const n = s.length, best = Array(n + 1).fill(Infinity), from = Array(n + 1).fill(-1); best[0] = 0;
  const pieces = Math.ceil(L(s) / (MAX - 4)), target = L(s) / pieces;
  for (let j = 1; j <= n; j++) for (let i = Math.max(0, j - 14); i < j; i++) {
    const seg = s.slice(i, j), len = L(seg); if (len > MAX || best[i] === Infinity) continue;
    let c = 400 + Math.pow(len - target, 2) / 4;                       // fewer, even pieces
    const last = seg.at(-1);
    if (j < n) { if (SOFT.test(last.t)) c -= 260; if (s[j].s - last.e > 0.35) c -= 160;
      if (/^(de|d'|du|des|le|la|les|l'|un|une|et|ou|à|au|aux|en|ce|ces|son|sa|ses|mon|ma|que|qu'|qui|ne|n'|se|s'|te|t'|me|m'|je|j'|tu|il|on|y|pour|par|dans|sur|avec|très|plus|pas)$/i.test(last.t)) c += 500; }
    if (seg.length <= 2) c += 900;                                       // orphans
    if (best[i] + c < best[j]) { best[j] = best[i] + c; from[j] = i; }
  }
  const cut = []; for (let j = n; j > 0; j = from[j]) cut.unshift([from[j], j]);
  cut.forEach(([i, j]) => chunks.push(s.slice(i, j)));
}
const out = chunks.map((c, i) => ({ i, s: +c[0].s.toFixed(2), fr: c.map(w => w.t).join(' ') }));
fs.writeFileSync('work/chunks.json', JSON.stringify(out, null, 1));
out.forEach(c => console.log(`${c.i}\t${Math.floor(c.s / 60)}:${String(Math.floor(c.s % 60)).padStart(2, '0')}\t${c.fr}`));
console.error(`${out.length} chunks, ${out.filter(c => c.fr.length > MAX).length} over ${MAX} chars`);
