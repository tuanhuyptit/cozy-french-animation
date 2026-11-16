import fs from 'node:fs';
const W=JSON.parse(fs.readFileSync('assets/words.json','utf8'));
const WH=JSON.parse(fs.readFileSync('assets/words.whisper.json','utf8'));
const c=JSON.parse(fs.readFileSync('work/chunks2.json','utf8'));
const norm=t=>t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9']/g,'');
const whSet=WH.map(w=>({k:norm(w.t),s:w.s}));
// for each chunk: duration per word; flag chunks with suspiciously short duration
c.forEach((x,i)=>{const s=W[x.ws[0]].s,e=W[x.ws.at(-1)].e;const d=e-s;const r=d/x.ws.length;
 if(r<0.12) console.log(i,x.who,s.toFixed(1),d.toFixed(2),x.fr);});
