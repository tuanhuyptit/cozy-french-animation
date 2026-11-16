import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[12,[]],[18,['et']],[20,['pour']],[37,['et']],[40,['ou']],[47,['pour']],[78,["qu'une"]],[91,['si']],[98,['en']],[101,[]],[100,['pendant']],[103,['pour']],[105,['pour']],[113,['que']],[121,['que']],[132,["d'un"]],[147,['pour','et']],[149,['pour']],[159,['avec']],[165,['toutes']],[187,['sans']],[200,['peut']],[202,['que']],[220,['pour']],[226,['pendant']],[232,['et,']],[248,['sans']],[339,['quand']],[348,['ce']],[355,['en']],[366,['où']],[369,['et']],[393,['ou']]];
const T = JSON.parse(fs.readFileSync('tokens.json','utf8'));
for (const [i, cuts] of FIX.sort((a,b)=>b[0]-a[0]||0)) {
  const a = c[i], b = c[i+1]; if (a.who !== b.who) throw i;
  const ws = [...a.ws, ...b.ws]; const parts = []; let cur = []; let ci = 0;
  for (const w of ws) { if (ci < cuts.length && T[w] === cuts[ci] && cur.length) { parts.push(cur); cur = []; ci++; } cur.push(w); }
  parts.push(cur); if (ci !== cuts.length) throw 'cut not found ' + i;
  c.splice(i, 2, ...parts.map(p => ({ who: a.who, line: a.line, ws: p, fr: p.map(w => T[w]).join(' ') })));
}
fs.writeFileSync('chunks2.json', JSON.stringify(c));
c.forEach((x,i)=>console.log(i+'|'+x.who+'|'+x.fr));
