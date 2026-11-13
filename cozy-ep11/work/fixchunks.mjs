import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[18,['et']],[30,['et']],[35,['quand']],[89,['pour']],[105,['de']],[207,['quel']],[262,['travaille']],[267,['il']],[276,['où']],[281,['parce']],[303,['comme']],[326,['et','au']],[336,['si','en']],[339,['pendant']],[354,['peut']],[358,['que']],[368,['qui']],[378,['ou']],[380,['quand']],[395,['parce']],[412,['si']]];
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
