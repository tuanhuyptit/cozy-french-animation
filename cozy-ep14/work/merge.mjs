// merge tiny fragment chunks (≤12 chars, not ending a sentence) into a neighbour of the same line
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
const txt = x => x.ws.map(w => T[w]).join(' ');
for (let i = 0; i < c.length; i++) {
  const x = c[i], s = txt(x);
  if (s.length > 12 || /[.?!…]»?$/.test(s)) continue;
  const n = c[i + 1], p = c[i - 1];
  if (n && n.line === x.line && (s + ' ' + txt(n)).length <= 50) { n.ws = [...x.ws, ...n.ws]; c.splice(i, 1); i--; continue; }
  if (p && p.line === x.line && (txt(p) + ' ' + s).length <= 50) { p.ws = [...p.ws, ...x.ws]; c.splice(i, 1); i--; continue; }
  console.log('kept', i, s);
}
c.forEach(x => x.fr = txt(x));
fs.writeFileSync('chunks2.json', JSON.stringify(c));
fs.writeFileSync('chunks2.txt', c.map((x, i) => i + '|' + x.who + '|' + x.fr).join('\n') + '\n');
console.log('chunks', c.length);
