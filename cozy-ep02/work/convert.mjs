import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
fs.mkdirSync(dir + 'parts', { recursive: true });
for (const n of [1, 2, 3, 4]) {
  const out = fs.readFileSync(`${dir}src${n}.txt`, 'utf8').split('\n').filter(Boolean).map(l => {
    let [who, fr, en, extra = ''] = l.split('|');
    const c = { who, fr, en };
    const bi = extra.indexOf('B={'); if (bi >= 0) { c.board = JSON.parse(extra.slice(bi + 2)); extra = extra.slice(0, bi).trim(); }
    if (/(^| )BE( |$)/.test(extra)) { c.boardEnd = true; extra = extra.replace(/(^| )BE( |$)/, ' ').trim(); }
    for (const m of extra.matchAll(/(\w)=([^ ]+(?: [^ =]+)*?)(?= \w=|$)/g)) {
      if (m[1] === 'e') c.emote = m[2]; if (m[1] === 'r') c.react = m[2];
      if (m[1] === 'i') { const [t, ...lab] = m[2].split(':'); c.illus = t; c.label = lab.join(':'); }
    }
    return c;
  });
  fs.writeFileSync(`${dir}parts/0${n}.json`, JSON.stringify(out, null, 1));
}
