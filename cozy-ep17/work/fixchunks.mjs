// merge n chunks starting at i and re-cut before the listed words → chunks3.json/.txt
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks2.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
const nz = t => t.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœ'’-]/g, '');
const FIX = [
 [3,2,['à','et']],[10,2,['ou']],[31,3,['et','des']],[49,5,['de','et','à','notre']],[65,4,['comme','des','et']],
 [77,4,['pourquoi','souvent','que']],[85,2,['plutôt']],[87,4,['regarder','ranger','que']],[95,2,[]],
 [100,5,['à','entre','et']],[105,2,['et']],[125,3,['le']],[129,2,['je']],[145,2,['pendant']],[152,2,['simplement']],
 [154,3,['mon','en']],[170,3,['et','après']],[184,3,['que']],[198,4,['au','je',"qu'il",'encore']],
 [207,4,['je','mais','à']],[225,4,['on','revoir','et']],[232,3,['si']],[249,3,['des','plutôt']],[252,4,['je','je']],
 [279,2,['les','peuvent']],[298,2,[]],[306,3,['une','peut']],[309,4,['ses','ou']],[320,2,['comment']],[322,2,['comment']],
 [337,2,[]],[342,4,['parfois','est','ou']],[356,4,['ton','un','tu']],[367,3,['bienveillant','compréhension']],
 [372,6,['je','je','je',"qu'est-ce"]],[378,3,['la','plutôt']],[387,2,[]],[416,2,['reprendre']],[418,4,['cette','après','sans']],
 [422,5,["j'ai",'pendant','mais','reprendre']],[429,4,['ont','à','ou']],[434,2,['tout']],[446,2,['et']],[461,2,[]],
 [483,2,['maintenant','quelques']],[513,3,['après','de']],[519,3,['après',"j'ai"]],[523,3,['rendre']],[558,3,['nous','sans']],
 [570,3,['pas','en']],[589,3,['ou','que']],[611,2,[]],[632,4,['que','peut','à']],
];
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
