import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[92,['et']],[109,["qu'on"]],[111,["qu'un"]],[135,['Le']],[202,['et']],[211,['Elle']],[216,["qu'elle"]],[244,[]],[246,['à']],[264,[]],[326,[]],[328,[]],[371,[]],[376,["d'attendre"]],[446,[]],[597,[]],[600,['et']]];
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
