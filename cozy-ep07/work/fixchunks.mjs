import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[95,['entre']],[98,['comprend']],[103,['plusieurs']],[112,['si','et']],[115,['sans']],[147,['et']],[198,['et']],[211,['et']],[276,['du']],[307,['parce','avec']],[310,['parce']],[327,['pour']],[346,['et']]];
const T = JSON.parse(fs.readFileSync('tokens.json','utf8'));
for (const [i, cuts] of FIX.sort((a,b)=>b[0]-a[0])) {
  const a = c[i], b = c[i+1]; if (a.who !== b.who) throw i;
  const ws = [...a.ws, ...b.ws]; const parts = []; let cur = []; let ci = 0;
  for (const w of ws) { if (ci < cuts.length && T[w] === cuts[ci] && cur.length) { parts.push(cur); cur = []; ci++; } cur.push(w); }
  parts.push(cur); if (ci !== cuts.length) throw 'cut not found ' + i;
  c.splice(i, 2, ...parts.map(p => ({ who: a.who, line: a.line, ws: p, fr: p.map(w => T[w]).join(' ') })));
}
fs.writeFileSync('chunks2.json', JSON.stringify(c));
c.forEach((x,i)=>console.log(i+'|'+x.who+'|'+x.fr));
