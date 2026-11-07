// Align the original script (LÉA:/MATHIEU: lines) onto whisper word timings.
// Rewrites assets/words.json with the script's exact tokens (backup: assets/words.whisper.json)
// and writes work/spk.json (speaker per word) for chunk.mjs.
// usage (in cozy-epNN/): node work/align.mjs <script.txt>
import fs from 'node:fs';
const script = fs.readFileSync(process.argv[2], 'utf8');
if (!fs.existsSync('assets/words.whisper.json')) fs.copyFileSync('assets/words.json', 'assets/words.whisper.json');
const W = JSON.parse(fs.readFileSync('assets/words.whisper.json', 'utf8'));

const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
const isPunct = t => norm(t) === '';

// script tokens
const S = [];
for (const line of script.split('\n')) {
  const m = line.match(/^(LÉA|MATHIEU):\s*(.*)$/); if (!m) continue;
  const who = m[1] === 'LÉA' ? 'lea' : 'mat';
  for (const t of m[2].replace(/’/g, "'").split(/\s+/).filter(Boolean)) S.push({ t, who });
}
// French typography: glue lone punctuation to its neighbour so every token is a spoken word
const ST = [];
for (let i = 0; i < S.length; i++) {
  const x = S[i];
  if (isPunct(x.t) && /^[«(]$/.test(x.t) && S[i + 1]) { S[i + 1].t = x.t + '\u00a0' + S[i + 1].t; continue; }
  if (isPunct(x.t) && ST.length && ST.at(-1).who === x.who) { ST.at(-1).t += '\u00a0' + x.t; continue; }
  if (isPunct(x.t) && S[i + 1]) { S[i + 1].t = x.t + '\u00a0' + S[i + 1].t; continue; }
  ST.push({ ...x });
}
const WV = W.filter(w => !isPunct(w.t));
const a = ST.map(x => norm(x.t)), b = WV.map(w => norm(w.t));
const n = a.length, m = b.length;
const sim = (x, y) => x === y ? 0 : (x.length > 3 && y.length > 3 && (x.startsWith(y.slice(0, 4)) || y.startsWith(x.slice(0, 4)))) ? 0.6 : 1.2;
// Needleman–Wunsch
const D = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
const P = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
for (let i = 1; i <= n; i++) { D[i][0] = i; P[i][0] = 1; }
for (let j = 1; j <= m; j++) { D[0][j] = j; P[0][j] = 2; }
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
  const d = D[i - 1][j - 1] + sim(a[i - 1], b[j - 1]), u = D[i - 1][j] + 1, l = D[i][j - 1] + 1;
  if (d <= u && d <= l) { D[i][j] = d; P[i][j] = 0; } else if (u <= l) { D[i][j] = u; P[i][j] = 1; } else { D[i][j] = l; P[i][j] = 2; }
}
const pairs = []; // [si|-1, wi|-1]
for (let i = n, j = m; i || j;) {
  const p = P[i][j];
  if (p === 0) { pairs.push([i - 1, j - 1]); i--; j--; } else if (p === 1) { pairs.push([i - 1, -1]); i--; } else { pairs.push([-1, j - 1]); j--; }
}
pairs.reverse();
const out = ST.map(x => ({ t: x.t, s: null, e: null }));
let exact = 0;
for (let k = 0; k < pairs.length;) {
  const [si, wi] = pairs[k];
  if (si >= 0 && wi >= 0 && a[si] === b[wi]) { out[si].s = WV[wi].s; out[si].e = WV[wi].e; exact++; k++; continue; }
  // a run of non-exact pairs
  let k2 = k; const ss = [], ww = [];
  while (k2 < pairs.length && !(pairs[k2][0] >= 0 && pairs[k2][1] >= 0 && a[pairs[k2][0]] === b[pairs[k2][1]])) { if (pairs[k2][0] >= 0) ss.push(pairs[k2][0]); if (pairs[k2][1] >= 0) ww.push(pairs[k2][1]); k2++; }
  if (ss.length) {
    const prevE = ss[0] > 0 && out[ss[0] - 1].e != null ? out[ss[0] - 1].e : (ww.length ? WV[ww[0]].s : 0);
    let t0 = ww.length ? WV[ww[0]].s : prevE;
    let t1 = ww.length ? WV[ww.at(-1)].e : (k2 < pairs.length && pairs[k2][1] >= 0 ? WV[pairs[k2][1]].s : t0 + 0.3 * ss.length);
    if (!ww.length) { t0 = prevE; }
    const L = ss.map(i => Math.max(2, a[i].length)), tot = L.reduce((x, y) => x + y, 0);
    let acc = t0;
    ss.forEach((i, q) => { const d = (t1 - t0) * L[q] / tot; out[i].s = +acc.toFixed(2); out[i].e = +(acc + d).toFixed(2); acc += d; });
  }
  k = k2;
}
// monotonic clean-up
for (let i = 0; i < out.length; i++) {
  if (i && out[i].s < out[i - 1].s) out[i].s = out[i - 1].s;
  if (out[i].e < out[i].s) out[i].e = out[i].s;
}
const keys = Object.keys(W[0]);
const res = out.map(o => { const r = {}; for (const k of keys) r[k] = k === 't' ? o.t : k === 's' ? o.s : k === 'e' ? o.e : W[0][k] === undefined ? undefined : (typeof W[0][k] === 'number' ? 0 : W[0][k]); return r; });
fs.writeFileSync('assets/words.json', JSON.stringify(res));
fs.writeFileSync('work/spk.json', JSON.stringify(ST.map(x => x.who)));
console.log(`script tokens ${n}, whisper tokens ${m}, exact matches ${exact} (${(100 * exact / n).toFixed(1)}%)`);
// report suspicious runs
let bad = 0;
for (let k = 0; k < pairs.length; k++) { const [si, wi] = pairs[k]; if (!(si >= 0 && wi >= 0 && a[si] === b[wi])) bad++; }
console.log('non-exact pairs', bad);
