// split "word !" / "« word" tokens into separate tokens in words.json and parts/*.json
import fs from 'node:fs';
const NB = ' ';
const W = JSON.parse(fs.readFileSync('assets/words.json', 'utf8'));
const out = [];
for (const w of W) {
  const ps = w.t.split(NB);
  if (ps.length === 1) { out.push(w); continue; }
  ps.forEach(p => {
    const punct = !/[a-zà-ÿœç0-9]/i.test(p);
    const lead = punct && /^[«(]$/.test(p);
    out.push({ ...w, t: p, s: punct ? (lead ? w.s : w.e) : w.s, e: punct ? (lead ? w.s : w.e) : w.e });
  });
}
fs.writeFileSync('assets/words.json', JSON.stringify(out));
for (const f of fs.readdirSync('work/parts')) {
  const P = JSON.parse(fs.readFileSync('work/parts/' + f, 'utf8'));
  for (const c of P) c.fr = c.fr.replace(new RegExp(NB + '([^\\s\\]]+)\\]', 'g'), ']' + NB + '$1').replace(/\[« /g, '« [').split(NB).join(' ');
  fs.writeFileSync('work/parts/' + f, JSON.stringify(P, null, 1));
}
console.log(W.length, '->', out.length);
