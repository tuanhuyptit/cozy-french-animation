// chunks.json (fr from words.json) + en.txt (idx|en|extras) + bracket list -> parts/*.json
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const chunks = JSON.parse(fs.readFileSync(dir + 'chunks.json', 'utf8'));
const lines = fs.readFileSync(dir + 'en.txt', 'utf8').split('\n').filter(Boolean);
if (lines.length !== chunks.length) throw new Error(`en lines ${lines.length} != chunks ${chunks.length}`);
// [chunk index, first token, last token] of each vocab phrase
const BR = [[51,'une','équilibrée'],[68,'les','ventre.'],[85,'varier','plaisirs'],[105,'mis','pâte.'],[122,"l'apport","l'apport"],[155,'me','tête.'],[164,'resté','faim.'],[175,'Les','féculents,'],[183,'trouver','compte.'],[204,'rassasiant','rassasiant'],[231,'privilégier','privilégier'],[252,'teneur','en'],[256,'Se','plaisir'],[271,'petit','petit.']];
const out = lines.map((l, i) => {
  let [idx, en, extra = ''] = l.split('|');
  if (+idx !== i) throw new Error(`line ${i} has idx ${idx}`);
  const c = { who: chunks[i].who, fr: chunks[i].fr, en };
  const bi = extra.indexOf('B={'); if (bi >= 0) { c.board = JSON.parse(extra.slice(bi + 2)); extra = extra.slice(0, bi).trim(); }
  if (/(^| )BE( |$)/.test(extra)) { c.boardEnd = true; extra = extra.replace(/(^| )BE( |$)/, ' ').trim(); }
  for (const m of extra.matchAll(/(\w)=([^ ]+(?: [^ =]+)*?)(?= \w=|$)/g)) {
    if (m[1] === 'e') c.emote = m[2]; if (m[1] === 'r') c.react = m[2];
    if (m[1] === 'i') { const [t, ...lab] = m[2].split(':'); c.illus = t; c.label = lab.join(':'); }
  }
  return c;
});
for (const [ci, a, b] of BR) {
  const t = out[ci].fr.split(' '); const s = t.indexOf(a); const e = t.indexOf(b, s);
  if (s < 0 || e < 0) throw new Error(`bracket ${ci} ${a}..${b} not found in: ${out[ci].fr}`);
  t[s] = '[' + t[s]; t[e] = t[e] + ']'; out[ci].fr = t.join(' ');
}
fs.rmSync(dir + 'parts', { recursive: true, force: true }); fs.mkdirSync(dir + 'parts');
for (let p = 0; p * 100 < out.length; p++) fs.writeFileSync(`${dir}parts/0${p + 1}.json`, JSON.stringify(out.slice(p * 100, p * 100 + 100), null, 1));
console.log('parts written', out.length, 'boards', out.filter(c => c.board).length, 'illus', out.filter(c => c.illus).length, 'emotes', out.filter(c => c.emote || c.react).length);
