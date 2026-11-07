// move the last N words of chunk i to the start of chunk i+1 (N<0: move first |N| words of i+1 to end of i)
import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync('work/chunks.json','utf8'));
const W = JSON.parse(fs.readFileSync('assets/words.json','utf8'));
for (const [i, n] of JSON.parse(process.argv[2])) {
  const a = C[i].fr.split(' '), b = C[i+1].fr.split(' ');
  if (n > 0) { C[i].fr = a.slice(0, -n).join(' '); C[i+1].fr = [...a.slice(-n), ...b].join(' '); }
  else { C[i].fr = [...a, ...b.slice(0, -n)].join(' '); C[i+1].fr = b.slice(-n).join(' '); }
}
// recompute s
let k = 0; for (const c of C) { c.s = W[k].s; k += c.fr.split(' ').length; }
fs.writeFileSync('work/chunks.json', JSON.stringify(C, null, 1));
