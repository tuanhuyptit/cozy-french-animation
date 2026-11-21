// chunks3.json (fr from words.json) + en.txt (en|extras) + BR list -> parts/*.json + vocab.json
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const chunks = JSON.parse(fs.readFileSync(dir + 'chunks3.json', 'utf8'));
const WJ = JSON.parse(fs.readFileSync(dir + '../assets/words.json', 'utf8'));
const lines = fs.readFileSync(dir + 'en.txt', 'utf8').split('\n').filter(Boolean);
if (lines.length !== chunks.length) throw new Error(`en lines ${lines.length} != chunks ${chunks.length}`);
// [substring of chunk fr, first token, last token] for each vocab phrase, in order
const BR = [['tellement convaincantes','convaincantes','convaincantes'],['raisons sont valables','valables','valables'],['me sens dépassé','me','dépassé'],['franchis la porte','franchis','porte'],['Au bout de','au','de'],['complètement gâché','gâché','gâché'],['à portée de main','à','main'],['épuisement',"l'épuisement","l'épuisement"],['mais bienveillante','bienveillante','bienveillante'],['vous reprocher','vous','reprocher'],['sur qui je peux compter','sur','compter'],['se trouver des excuses','se','excuses'],['tenir ses engagements','tenir','engagements'],['perdre le rythme','perdre','rythme']];
const nrm = x => x.replace(/[\s «»]/g, ' ').trim().replace(/[.,;:!?…]+$/, '').trim().toLowerCase();
const out = lines.map((l, i) => {
  let [en, ...rest] = l.split('|'); let extra = rest.join('|');
  const c = { who: chunks[i].who, fr: chunks[i].ws.map(k => WJ[k].t).join(' '), en };
  const bi = extra.indexOf('B={'); if (bi >= 0) { c.board = JSON.parse(extra.slice(bi + 2)); extra = extra.slice(0, bi).trim(); }
  if (/(^| )BE( |$)/.test(extra)) { c.boardEnd = true; extra = extra.replace(/(^| )BE( |$)/, ' ').trim(); }
  for (const m of extra.matchAll(/(\w)=([^ ]+(?: [^ =]+)*?)(?= \w=|$)/g)) {
    if (m[1] === 'e') c.emote = m[2]; if (m[1] === 'r') c.react = m[2];
    if (m[1] === 'i') { const [t, ...lab] = m[2].split(':'); c.illus = t; c.label = lab.join(':'); }
  }
  return c;
});
fs.writeFileSync(dir + 'vocab.json', fs.readFileSync(dir + 'vocab.full.json'));
let from = 0;
for (const [sub, a, b] of BR) {
  const ci = out.findIndex((c, k) => k >= from && c.fr.replace(/ /g, ' ').includes(sub));
  if (ci < 0) throw new Error('vocab chunk not found: ' + sub);
  const t = out[ci].fr.split(' '); const s = t.findIndex(x => nrm(x) === a.toLowerCase()); const e = t.findIndex((x, j) => j >= s && nrm(x) === b.toLowerCase());
  if (s < 0 || e < 0) throw new Error(`bracket ${ci} ${a}..${b} not found in: ${out[ci].fr}`);
  t[s] = '[' + t[s]; t[e] = t[e] + ']'; out[ci].fr = t.join(' '); from = ci + 1;
  console.log('vocab', ci, out[ci].fr);
}
// thin out emotes: same rules as build.mjs, plus ≥ GAP s between two emotes of one character
{ const GAP = 30, last = {}; let kept = 0, drop = 0;
  const ev = [];
  out.forEach((c, i) => { const ws = chunks[i].ws, s = WJ[ws[0]].s, e = WJ[ws.at(-1)].e, other = c.who === 'lea' ? 'mat' : 'lea';
    if (c.emote) ev.push({ who: c.who, t: s + 0.15, i, k: 'emote', pri: 0 });
    if (c.react) ev.push({ who: other, t: Math.max(s + 0.4, e - 0.5), i, k: 'react', pri: 1 }); });
  ev.sort((a, b) => a.t - b.t);
  for (const x of ev) { if (last[x.who] !== undefined && x.t < last[x.who] + GAP) { delete out[x.i][x.k]; drop++; continue; } last[x.who] = x.t; kept++; }
  console.log('emotes kept', kept, 'dropped', drop); }
fs.rmSync(dir + 'parts', { recursive: true, force: true }); fs.mkdirSync(dir + 'parts');
for (let p = 0; p * 100 < out.length; p++) fs.writeFileSync(`${dir}parts/${String(p + 1).padStart(2, '0')}.json`, JSON.stringify(out.slice(p * 100, p * 100 + 100), null, 1));
console.log('parts written', out.length, 'boards', out.filter(c => c.board).length, 'illus', out.filter(c => c.illus).length, 'emotes', out.filter(c => c.emote || c.react).length);
