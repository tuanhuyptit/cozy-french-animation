import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[30,['qui']],[70,['pour']],[83,['et']],[240,['une']],[268,['«\u00a0Le']],[273,["«\u00a0C'est",'Et']],[372,['et']]];
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
