// Renders the Cozy French Radio thumbnail references (1280×720 PNG) from the real Radio scenes + Léa rig.
// Usage (repo root):
//   node skills/cozy-radio-thumbnail/tools/make-ref.mjs            → references/ref-disque.png, ref-studio.png
//   node skills/cozy-radio-thumbnail/tools/make-ref.mjs --layout disque --text "Pourquoi c’est si dur de dire *non* ?" --out radio/ep01/thumbnail.png
// Needs Google Chrome (headless). Also usable to make a real thumbnail: pass your own headline.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const OUT = path.resolve(HERE, '../references');
const { SCENES, PHONES } = await import(path.join(REPO, 'radio/scenes.mjs'));

const src = fs.readFileSync(path.join(REPO, 'demo-animation-style.html'), 'utf8');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const sb = { Math: Object.create(Math), TOTAL: 60, document: { querySelectorAll: () => [] } };
sb.Math.random = mulberry32(7); vm.createContext(sb);
const a = src.indexOf('const knit='), b = src.lastIndexOf('/* ============================================================', src.indexOf('   TIMELINE'));
vm.runInContext(`const rnd=(a,b)=>a+Math.random()*(b-a);const range=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');const pick=a=>a[Math.floor(Math.random()*a.length)];const rep=d=>Math.ceil(TOTAL/d)+1;
${src.slice(a, b)} this.leaSVG=leaSVG;`, sb);
const DEFS = src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>') + 13);
// Léa with a happy face + raised hand ("up" gesture) for a thumbnail
const lea = (outfit, phones) => {
  let s = sb.leaSVG(outfit, false).replace(/<div class="name">[^<]*<\/div>/, '');
  if (phones) s = s.replace('<g class="fx">', PHONES + '<g class="fx">');
  return s.replace('class="fx-smile" ', 'class="fx-smile" style="opacity:1" ').replace('class="mouth"', 'class="mouth" style="opacity:0"')
    .replace('class="gest g-up" opacity="0"', 'class="gest g-up" opacity="1"').replace(/class="armRest"/g, 'class="armRest" opacity="0"');
};
const badge = 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, 'badge-cozy-french-radio.png')).toString('base64');
const hl = t => t.replace(/\*(.+?)\*/g, '<em>$1</em>');

const page = (body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,800&family=Caveat:wght@700&display=block" rel="stylesheet">
<style>html,body{margin:0;width:1280px;height:720px;overflow:hidden}
#s{position:absolute;left:0;top:0;width:1920px;height:1080px;transform:scale(.6667);transform-origin:0 0;overflow:hidden}
svg.l{position:absolute;inset:0;width:1920px;height:1080px}
.char{position:absolute;width:360px;height:480px;transform-origin:0 0}.char svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
h1{position:absolute;margin:0;font:800 132px/1.02 'Playfair Display',serif;color:#3a2e28;letter-spacing:-1px}
h1 em{font-style:italic;color:#c9502e;background:linear-gradient(transparent 68%,#f3c96b 68%,#f3c96b 90%,transparent 90%)}
.hand{position:absolute;font:700 64px Caveat;color:#b8552a}
.badge{position:absolute;left:0;bottom:0;width:696px;height:111px}
</style></head><body>${DEFS}<div id="s">${body}<img class="badge" src="${badge}"></div></body></html>`;

function disque(text) {
  const S = SCENES.carnet;
  return page(`<svg class="l" viewBox="0 0 1920 1080">${S.bg()}</svg>
  <div class="char" style="left:${S.lea.x}px;top:${S.lea.y}px;transform:scale(${S.lea.s});clip-path:${S.lea.clip}">${lea('pull', true)}</div>
  <svg class="l" viewBox="0 0 1920 1080"><circle cx="600" cy="500" r="250" fill="none" stroke="#3a2e28" stroke-width="10" filter="url(#pencil)"/>
   <g fill="#d9774b">${[[1780, 150, 1], [1700, 250, .6]].map(([x, y, k]) => `<path d="M${x} ${y - 30 * k} L${x + 9 * k} ${y - 9 * k} L${x + 30 * k} ${y} L${x + 9 * k} ${y + 9 * k} L${x} ${y + 30 * k} L${x - 9 * k} ${y + 9 * k} L${x - 30 * k} ${y} L${x - 9 * k} ${y - 9 * k}Z"/>`).join('')}</g></svg>
  <h1 style="left:1000px;top:250px;width:860px">${hl(text)}</h1>`);
}
function studio(text, note = 'ce soir à la radio…') {
  const S = SCENES.studio;
  return page(`<svg class="l" viewBox="0 0 1920 1080">${S.bg()}</svg>
  <div class="char" style="left:${S.lea.x - 330}px;top:${S.lea.y}px;transform:scale(${S.lea.s})">${lea('cardigan', true)}</div>
  <svg class="l" viewBox="0 0 1920 1080"><g transform="translate(-330 0)">${S.fg()}</g>
   <g filter="url(#pencil)"><path d="M0 880 H1920 V1080 H0Z" fill="#7a5038" opacity="0"/><path d="M1060 880 H1920 V1080 H1060Z" fill="#7a5038"/><path d="M1060 880 H1920 V906 H1060Z" fill="#8f6246"/>
   <rect x="1000" y="150" width="860" height="740" rx="40" fill="#fffaf0"/></g>
   <path d="M1090 800 ${Array.from({ length: 18 }, (_, i) => `q19 ${i % 2 ? 34 : -34} 38 0`).join(' ')}" stroke="#d9774b" stroke-width="9" fill="none" stroke-linecap="round"/></svg>
  <div class="hand" style="left:1070px;top:200px">${note}</div>
  <h1 style="left:1070px;top:300px;width:760px;font-size:124px">${hl(text)}</h1>`);
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
function shot(html, name) {
  const f = path.join(OUT, name.replace('.png', '.html'));
  fs.writeFileSync(f, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,720', '--virtual-time-budget=5000', `--screenshot=${path.join(OUT, name)}`, 'file://' + f], { stdio: 'ignore' });
  fs.unlinkSync(f);
  console.log('wrote', path.join(OUT, name));
}
// CLI: --layout disque|studio --text "Headline with *key* word" [--note "ce soir à la radio…"] --out thumb.png
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
if (arg('text')) {
  const L = arg('layout') || 'disque', out = path.resolve(arg('out') || 'thumbnail.png');
  const html = L === 'studio' ? studio(arg('text'), arg('note')) : disque(arg('text'));
  const tmp = path.join(path.dirname(out), '.thumb-tmp.png'); shot(html, path.basename(tmp)); fs.renameSync(path.join(OUT, path.basename(tmp)), out); console.log('thumbnail →', out);
} else {
  shot(disque('Pourquoi c’est si dur de dire *non* ?'), 'ref-disque.png');
  shot(studio('Oser enfin *changer* de vie'), 'ref-studio.png');
}
