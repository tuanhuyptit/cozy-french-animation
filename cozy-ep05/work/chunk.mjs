// auto-chunk words.json by speaker (from script alignment) + punctuation -> work/chunks.json
import fs from 'node:fs';
const W = JSON.parse(fs.readFileSync('assets/words.json','utf8'));
const spk = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const end = t => /[.?!…](\u00a0»)?$/.test(t);
// sentences
const sents = []; let cur = null;
W.forEach((w,i) => {
  if (!cur || cur.who !== spk[i]) { cur = { who: spk[i], ws: [] }; sents.push(cur); }
  cur.ws.push(i);
  if (end(w.t) && !(W[i+1] && /^[?!]$/.test(W[i+1].t))) cur = null;
});
// split long sentences
const split = ws => {
  if (ws.length <= 10) return [ws];
  let best = -1, bs = 1e9;
  for (let k = 3; k <= ws.length - 3; k++) {
    const t = W[ws[k-1]].t; const comma = /[,;:»]$/.test(t);
    const score = Math.abs(k - ws.length/2) - (comma ? 6 : 0) + (/^(et|de|du|des|le|la|les|un|une|à|au|en|que|qui|pour|se|son|sa|ses|ta|ton|tes|ma|mon|mes|ne|je|tu|il|elle|on|toute|tout|ce|dans|sans|où|qu'on|qu'une|si|avec|par|plus|très|leur|notre|votre|d'une|d'un|l'|l'eau|aux|me|te|nous|vous|est|a|pas|être)$/i.test(W[ws[k-1]].t) ? 5 : 0);
    if (score < bs) { bs = score; best = k; }
  }
  return [...split(ws.slice(0,best)), ...split(ws.slice(best))];
};
let chunks = sents.flatMap(s => split(s.ws).map(ws => ({ who: s.who, ws })));
// merge short neighbours of same speaker
const out = [];
for (const c of chunks) {
  const p = out.at(-1);
  if (p && p.who === c.who && (p.ws.length <= 2 || c.ws.length <= 2) && p.ws.length + c.ws.length <= 9 && W[c.ws[0]].s - W[p.ws.at(-1)].e < 0.8) p.ws.push(...c.ws);
  else out.push(c);
}
const res = out.map(c => ({ who: c.who, s: W[c.ws[0]].s, fr: c.ws.map(i => W[i].t).join(' ') }));
fs.writeFileSync('work/chunks.json', JSON.stringify(res, null, 1));
res.forEach((c,i) => console.log(i, c.s.toFixed(1), c.who, c.fr));
