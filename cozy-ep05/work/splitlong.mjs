// split long subtitle chunks in work/parts/*.json. Each entry: [chunk index, first-half French (prefix), en1, en2, opts]
// board stays on the first half; boardEnd / react move to the second half; opts.second = ['emote','illus'] to move more.
import fs from 'node:fs';
const files = fs.readdirSync('work/parts').filter(f => f.endsWith('.json')).sort();
let all = files.flatMap(f => JSON.parse(fs.readFileSync('work/parts/' + f, 'utf8')));
const S = JSON.parse(fs.readFileSync('work/splits.json', 'utf8')).sort((a, b) => b[0] - a[0]);
const strip = s => s.replace(/[\[\]]/g, '');
for (const [i, pre, en1, en2, opts = {}] of S) {
  const c = all[i]; const toks = c.fr.split(' ');
  let k = 0, acc = '';
  while (k < toks.length && strip(acc) !== pre) { acc = acc ? acc + ' ' + toks[k] : toks[k]; k++; }
  if (strip(acc) !== pre) throw new Error(`chunk ${i}: prefix "${pre}" not found in "${c.fr}"`);
  const a = { ...c, fr: toks.slice(0, k).join(' '), en: en1 }, b = { who: c.who, fr: toks.slice(k).join(' '), en: en2 };
  for (const key of ['boardEnd', 'react', ...(opts.second || [])]) { if (key in a) { b[key] = a[key]; delete a[key]; } if (key === 'illus' && 'label' in a && opts.second?.includes('illus')) { b.label = a.label; delete a.label; } }
  if ((a.fr.match(/\[/g) || []).length !== (a.fr.match(/\]/g) || []).length) throw new Error(`chunk ${i}: split cuts a vocab group`);
  all.splice(i, 1, a, b);
}
// board item timing fixes: { "title or word": [at, at, ...] }
const AT = JSON.parse(fs.readFileSync('work/splits-at.json', 'utf8'));
for (const c of all) if (c.board) {
  const key = c.board.title || c.board.word; const fix = AT[key]; if (!fix) continue;
  const lists = c.board.items ? [c.board.items] : [c.board.left.items, c.board.right.items];
  const items = lists.flat(); fix.forEach((v, j) => { items[j].at = v; });
}
fs.rmSync('work/parts', { recursive: true }); fs.mkdirSync('work/parts');
for (let p = 0; p * 100 < all.length; p++) fs.writeFileSync(`work/parts/0${p + 1}.json`, JSON.stringify(all.slice(p * 100, p * 100 + 100), null, 1));
console.log('chunks', all.length);
