// chunks.json (fr from words.json) + en.txt (idx|en|extras) + bracket list -> parts/*.json
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const chunks = JSON.parse(fs.readFileSync(dir + 'chunks2.json', 'utf8'));
const WJ = JSON.parse(fs.readFileSync(dir + '../assets/words.json', 'utf8'));
const lines = fs.readFileSync(dir + 'en.txt', 'utf8').split('\n').filter(Boolean);
if (lines.length !== chunks.length) throw new Error(`en lines ${lines.length} != chunks ${chunks.length}`);
// [chunk index, first token, last token] of each vocab phrase
const BR = [[57,"j'étais",'intimidée'],[72,'Oser,','Oser,'],[84,'Être','hauteur,'],[101,'Se','sous-estimer,'],[120,'Avoir','trac,'],[131,'Perdre','moyens,'],[144,'Une','compétence,'],[157,'Reconnaître','limites,'],[173,'Prendre','recul,'],[187,'Se','question,'],[226,'Se','lancer,'],[255,'Faire','preuves,'],[271,'Gagner','assurance,'],[284,'Avoir','soi,']];
const out = lines.map((l, i) => {
  let [idx, en, ...rest] = l.split('|'); let extra = rest.join('|');
  if (+idx !== i) throw new Error(`line ${i} has idx ${idx}`);
  const WHO = { 395: 'mat', 396: 'mat', 397: 'lea', 404: 'mat', 405: 'mat' };   // the voice differs from the script here (pitch)
  const c = { who: WHO[i] || chunks[i].who, fr: chunks[i].ws.map(k => WJ[k].t).join(' '), en };
  const bi = extra.indexOf('B={'); if (bi >= 0) { c.board = JSON.parse(extra.slice(bi + 2)); extra = extra.slice(0, bi).trim(); }
  if (/(^| )BE( |$)/.test(extra)) { c.boardEnd = true; extra = extra.replace(/(^| )BE( |$)/, ' ').trim(); }
  for (const m of extra.matchAll(/(\w)=([^ ]+(?: [^ =]+)*?)(?= \w=|$)/g)) {
    if (m[1] === 'e') c.emote = m[2]; if (m[1] === 'r') c.react = m[2];
    if (m[1] === 'i') { const [t, ...lab] = m[2].split(':'); c.illus = t; c.label = lab.join(':'); }
  }
  return c;
});
const GAP = process.env.GAP ? process.env.GAP.split('-').map(Number) : null;
const inGap = i => GAP && i >= GAP[0] && i <= GAP[1];
if (GAP) out.forEach((c, i) => { if (inGap(i)) for (const k of ['emote', 'react', 'illus', 'label', 'board', 'boardEnd']) delete c[k]; });
{ const V = JSON.parse(fs.readFileSync(dir + 'vocab.full.json', 'utf8')); fs.writeFileSync(dir + 'vocab.json', JSON.stringify(V.filter((v, k) => !inGap(BR[k][0])), null, 1)); }
for (const [ci, a, b] of BR.filter(x => !inGap(x[0]))) {
  const t = out[ci].fr.split(' '); const s = t.indexOf(a); const e = t.indexOf(b, s);
  if (s < 0 || e < 0) throw new Error(`bracket ${ci} ${a}..${b} not found in: ${out[ci].fr}`);
  t[s] = '[' + t[s]; t[e] = t[e] + ']'; out[ci].fr = t.join(' ');
}
fs.rmSync(dir + 'parts', { recursive: true, force: true }); fs.mkdirSync(dir + 'parts');
for (let p = 0; p * 100 < out.length; p++) fs.writeFileSync(`${dir}parts/0${p + 1}.json`, JSON.stringify(out.slice(p * 100, p * 100 + 100), null, 1));
console.log('parts written', out.length, 'boards', out.filter(c => c.board).length, 'illus', out.filter(c => c.illus).length, 'emotes', out.filter(c => c.emote || c.react).length);
