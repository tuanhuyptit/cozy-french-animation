// merge n chunks starting at i and re-cut before the listed tokens → chunks3.json/.txt
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks2.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
const FIX = [[2, 2, ['et']], [309, 4, ['uniquement']], [554, 3, ['peut']], [584, 2, ['devient']], [604, 2, ['énormément']], [52, 3, ['une', 'ne']], [199, 3, ['est', 'que']], [226, 3, ['commence', 'en']], [77, 2, ['Laissez']], [778, 4, ['un', 'réfléchir']], [413, 2, ['pendant']], [422, 3, ['risque']], [474, 2, ['Et']], [721, 4, ['il', 'à']]];
for (const [i, n, cuts] of FIX.sort((a, b) => b[0] - a[0])) {
  const g = c.slice(i, i + n); if (g.some(x => x.who !== g[0].who)) throw 'who ' + i;
  const ws = g.flatMap(x => x.ws); const parts = []; let cur = []; let ci = 0;
  for (const w of ws) { if (ci < cuts.length && T[w] === cuts[ci] && cur.length) { parts.push(cur); cur = []; ci++; } cur.push(w); }
  parts.push(cur); if (ci !== cuts.length) throw 'cut not found ' + i;
  c.splice(i, n, ...parts.map(p => ({ who: g[0].who, line: g[0].line, ws: p, fr: p.map(w => T[w]).join(' ') })));
}
for (const x of c) if (x.fr.length > 50) console.log('LONG', x.fr.length, x.fr);
fs.writeFileSync('chunks3.json', JSON.stringify(c));
fs.writeFileSync('chunks3.txt', c.map((x, i) => i + '|' + x.who + '|' + x.fr).join('\n') + '\n');
console.log('chunks', c.length);
