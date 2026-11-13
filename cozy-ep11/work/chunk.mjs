// usage: node chunk.mjs script.txt out.json  -> chunks from script tokens (same tokenisation as align.mjs)
import fs from 'node:fs';
const script = fs.readFileSync(process.argv[2], 'utf8');
const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
const isPunct = t => norm(t) === '';
const S = [];
let line = 0;
for (const l of script.split('\n')) {
  const m = l.match(/^(LÉA|MATHIEU):\s*(.*)$/); if (!m) continue;
  const who = m[1] === 'LÉA' ? 'lea' : 'mat'; line++;
  for (const t of m[2].replace(/’/g, "'").split(/\s+/).filter(Boolean)) S.push({ t, who, line });
}
const ST = [];
for (let i = 0; i < S.length; i++) {
  const x = S[i];
  if (isPunct(x.t) && /^[«(]$/.test(x.t) && S[i + 1]) { S[i + 1].t = x.t + ' ' + S[i + 1].t; continue; }
  if (isPunct(x.t) && ST.length && ST.at(-1).who === x.who) { ST.at(-1).t += ' ' + x.t; continue; }
  if (isPunct(x.t) && S[i + 1]) { S[i + 1].t = x.t + ' ' + S[i + 1].t; continue; }
  ST.push({ ...x });
}
ST.forEach((x, i) => x.i = i); fs.writeFileSync("tokens.json", JSON.stringify(ST.map(x => x.t)));
const pri = t => /[.?!…]»?$/.test(t) ? 0 : /[;:]$/.test(t) ? 1 : /[,»)]$/.test(t) ? 2 : 6;
const MAX = 10;
const WEAK = new Set(['que','qui','de','à','a','le','la','les','un','une','des','du','par','pour','en','au','aux','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','votre','nos','vos','leur','ce','cette','ces','je','tu','il','elle','on','nous','vous','ils','elles','se','me','te','ne','dans','sur','avec','sans','chez','très','plus',"j'ai","c'est",'est','et','ou','mais','donc']);
const len = a => a.map(x => x.t).join(' ').length;
function split(arr) {
  if (arr.length <= MAX && (len(arr) <= 58 || arr.length < 5)) {
    // still split two full sentences if both halves are decent
    const k = arr.findIndex((x, i) => i >= 2 && i <= arr.length - 3 && pri(x.t) === 0);
    if (k < 0 || arr.length < 7) return [arr];
    return [arr.slice(0, k + 1), arr.slice(k + 1)];
  }
  let best = null;
  for (let k = 2; k <= arr.length - 2; k++) {
    const p = pri(arr[k - 1].t);
    const w = arr[k - 1].t.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœ']/g,''); const score = p * 5 + (p === 6 && WEAK.has(w) ? 8 : 0) + Math.abs(arr.length - 2 * k) * 0.6 + (k < 3 || arr.length - k < 3 ? 6 : 0) + (k > MAX ? 3 : 0) + (arr.length - k > MAX ? 3 : 0);
    if (!best || score < best.s) best = { k, s: score };
  }
  return [...split(arr.slice(0, best.k)), ...split(arr.slice(best.k))];
}
// group per line, but split a line into sentences first if line long
const lines = [];
for (const x of ST) { if (!lines.length || lines.at(-1)[0].line !== x.line) lines.push([]); lines.at(-1).push(x); }
const chunks = [];
for (const L of lines) for (const c of split(L)) chunks.push({ who: c[0].who, line: c[0].line, ws: c.map(x => x.i), fr: c.map(x => x.t).join(' ') });
fs.writeFileSync(process.argv[3], JSON.stringify(chunks, null, 0));
console.log('tokens', ST.length, 'chunks', chunks.length);
const lens = chunks.map(c => c.ws.length); console.log('max len', Math.max(...lens), 'single', lens.filter(l => l === 1).length);
