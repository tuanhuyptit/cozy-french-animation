import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('chunks.json','utf8'));
const FIX = [[14,['parce']],[27,['une']],[34,['à']],[37,['au']],[39,['qui','et']],[60,['pendant']],[68,['si']],[71,["c'est"]],[101,['sont']],[108,[]],[110,['que','quelque']],[121,[]],[132,['parce']],[145,[]],[159,['ce','ou']],[227,["qu'on",'ou']],[230,['et']],[248,[]],[252,['et']],[264,['et']],[269,['à']],[275,['pour']],[278,['pour']],[294,['et']],[300,['ou']],[339,['avant']],[349,['malgré']],[376,['où']],[378,['et']],[387,[]],[386,['que','et']],[404,['pendant']]];
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
