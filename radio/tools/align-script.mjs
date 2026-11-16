// Align whisper words (assets/words.json) to the written script (work/script.txt) and fix misheard words.
// Usage (inside radio/epNN/): node ../tools/align-script.mjs [--write]
// Prints every difference; with --write, 1:1 substitutions take the script's spelling + punctuation
// (timestamps kept) and the result is saved to assets/words.json (original kept in work/words.whisper.json).
import fs from 'node:fs';
if (!fs.existsSync('work/words.whisper.json')) fs.copyFileSync('assets/words.json', 'work/words.whisper.json');
// whisper words; punctuation-only tokens (« ? », « » ») are glued to the word before (or « to the word after)
const W = [];
for (const w of JSON.parse(fs.readFileSync('work/words.whisper.json', 'utf8'))) {
  const t = w.t.trim(); if (!t) continue;
  if (/^[\p{L}\p{N}]/u.test(t) || !W.length) W.push({ ...w, t });
  else if (/^[«"“]$/.test(t)) W.push({ ...w, t, open: true });
  else if (!/[\p{L}\p{N}]/u.test(t)) { W[W.length - 1].t += (/^[?!:;»]/.test(t) ? '\u00a0' : '') + t; W[W.length - 1].e = Math.max(W[W.length - 1].e, w.e); }
  else W.push({ ...w, t });
}
for (let i = W.length - 2; i >= 0; i--) if (W[i].open) { W[i + 1].t = '«\u00a0' + W[i + 1].t; W[i + 1].s = W[i].s; W.splice(i, 1); }
const lines = fs.readFileSync('work/script.txt', 'utf8').split('\n')
  .filter(l => !/^(Section \d|Conclusion —|\[Word count|End of script|Cozy French Radio \|)/.test(l.trim()) && l.trim())
  .slice(1); // title line
// script tokens: French spacing kept with a no-break space (« Ça va, merci. », vas-tu ?)
const S = [];
for (const t of lines.join(' ').replace(/’/g, "'").split(/\s+/).filter(Boolean)) {
  if (t === '«') S.push('«'); else if (/^[?!:;»]+[.,]?$/.test(t) && S.length) S[S.length - 1] += '\u00a0' + t;
  else if (S.length && S[S.length - 1] === '«') S[S.length - 1] = '«\u00a0' + t; else S.push(t);
}
const norm = t => t.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿœæç0-9']/g, '').replace(/^'+|'+$/g, '');
const a = W.map(w => norm(w.t)), b = S.map(norm);
// LCS via DP on (n×m) ~ 2900×2900 — fine with Int16 rows + backtrack table of Uint8
const n = a.length, m = b.length, dir = new Uint8Array((n + 1) * (m + 1)); let prev = new Int32Array(m + 1), cur = new Int32Array(m + 1);
for (let i = 1; i <= n; i++) { for (let j = 1; j <= m; j++) {
  if (a[i - 1] === b[j - 1] && a[i - 1]) { cur[j] = prev[j - 1] + 1; dir[i * (m + 1) + j] = 1; }
  else if (prev[j] >= cur[j - 1]) { cur[j] = prev[j]; dir[i * (m + 1) + j] = 2; } else { cur[j] = cur[j - 1]; dir[i * (m + 1) + j] = 3; } }
  [prev, cur] = [cur, prev]; }
const ops = []; let i = n, j = m;
while (i > 0 || j > 0) { const d = i && j ? dir[i * (m + 1) + j] : (i ? 2 : 3);
  if (d === 1) { ops.push(['=', i - 1, j - 1]); i--; j--; } else if (d === 2) { ops.push(['-', i - 1]); i--; } else { ops.push(['+', null, j - 1]); j--; } }
ops.reverse();
// group runs of non-matches
const out = W.map(w => ({ ...w })); let k = 0, subs = 0;
while (k < ops.length) {
  if (ops[k][0] === '=') { const [, wi, si] = ops[k]; if (W[wi].t !== S[si]) out[wi].t = S[si]; k++; continue; }
  const del = [], ins = []; while (k < ops.length && ops[k][0] !== '=') { if (ops[k][0] === '-') del.push(ops[k][1]); else ins.push(ops[k][2]); k++; }
  const at = del.length ? W[del[0]].s.toFixed(1) : '';
  console.log(`${at.padStart(7)}s  whisper: ${del.map(x => W[x].t).join(' ') || '∅'}   |  script: ${ins.map(x => S[x]).join(' ') || '∅'}`);
  if (del.length === ins.length) { del.forEach((x, q) => { out[x].t = S[ins[q]]; }); subs += del.length; }
}
console.error(`${W.length} whisper words, ${S.length} script words, ${subs} substituted`);
if (process.argv.includes('--write')) fs.writeFileSync('assets/words.json', JSON.stringify(out.map(({ open, ...w }) => w)));
