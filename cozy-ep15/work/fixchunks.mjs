// merge n chunks starting at i and re-cut before the listed words (compared without punctuation) → chunks3.json/.txt
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks2.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
const nz = t => t.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœ'’-]/g, '');
const FIX = [
 [4,3,['pour']],[16,2,['mais']],[23,2,['un']],[28,2,['me']],[37,2,['que']],[39,3,['des']],[64,2,[]],[67,2,['distinguer']],
 [80,3,['ce']],[84,2,['ce']],[86,2,['il','ce']],[98,2,[]],[127,2,['que']],[132,3,['ne']],[143,2,['peuvent']],
 [185,3,['pour','elle','une']],[198,2,[]],[203,3,['davantage']],[207,2,['une']],[213,2,[]],[232,4,['que','plutôt']],[241,2,[]],
 [272,2,[]],[296,3,['de','à']],[325,2,['une']],[343,2,['le']],[345,4,['chaque','de']],[349,3,['passer']],[365,3,['pour']],
 [370,3,['un']],[384,2,['ont']],[425,3,['ne']],[435,2,['à','certaines']],[439,2,[]],[464,3,['quelques']],[471,2,['une']],
 [485,3,['mon']],[495,2,['avant']],[510,2,['et']],[524,3,['une','pour']],[547,2,['et']],
];
// note: [486,2] merges "Par exemple :"(485)? no — handled below
for (const [i, n, cuts] of FIX.sort((a, b) => b[0] - a[0])) {
  const g = c.slice(i, i + n); if (g.some(x => x.who !== g[0].who)) throw 'who ' + i;
  const ws = g.flatMap(x => x.ws); const parts = []; let cur = []; let ci = 0;
  for (const w of ws) { if (ci < cuts.length && nz(T[w]) === cuts[ci] && cur.length) { parts.push(cur); cur = []; ci++; } cur.push(w); }
  parts.push(cur); if (ci !== cuts.length) throw 'cut not found ' + i + ' ' + cuts;
  c.splice(i, n, ...parts.map(p => ({ who: g[0].who, line: g[0].line, ws: p, fr: p.map(w => T[w]).join(' ') })));
}
for (const x of c) if (x.fr.length > 50) console.log('LONG', x.fr.length, x.fr);
fs.writeFileSync('chunks3.json', JSON.stringify(c));
fs.writeFileSync('chunks3.txt', c.map((x, i) => i + '|' + x.who + '|' + x.fr).join('\n') + '\n');
console.log('chunks', c.length);
