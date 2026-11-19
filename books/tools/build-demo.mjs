// Builds books/books-demo.html — a ~2-minute playable preview of the Cozy French Books format
// (EP01 L'Alchimiste, 0:00–2:01), synced to the real voice.
// Usage: node books/tools/build-demo.mjs   then   python3 -m http.server -d books 8767 → http://localhost:8767/books-demo.html
//
// Léa (rig, outfits, gestures) + pencil filter come from ../demo-animation-style.html like every other channel build.
// All motion is one paused GSAP timeline driven by the audio clock (seek-safe, no Math.random) so it ports to HyperFrames.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as ART from '../art.mjs';

const BOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(BOOKS, '..');
const src = fs.readFileSync(path.join(ROOT, 'demo-animation-style.html'), 'utf8');

/* ---------- Léa from the main demo ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const a = src.indexOf('const knit=');
const b = src.lastIndexOf('/* ============================================================', src.indexOf('   TIMELINE'));
const sandbox = { Math: Object.create(Math), TOTAL: 60, document: { querySelectorAll: () => [] } };
sandbox.Math.random = mulberry32(7);
vm.createContext(sandbox);
vm.runInContext(`const rnd=(a,b)=>a+Math.random()*(b-a);const range=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');const pick=a=>a[Math.floor(Math.random()*a.length)];const rep=d=>Math.ceil(TOTAL/d)+1;
  ${src.slice(a, b)}
  this.leaSVG=leaSVG; this.GEST_ELBOW=GEST_ELBOW;`, sandbox);
const GEST_RUNTIME = src.slice(src.indexOf('/* GEST-RUNTIME-START'), src.indexOf('/* GEST-RUNTIME-END */'));
const DEFS = src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>') + '</defs></svg>'.length)
  .replace('</defs></svg>', `<filter id="cut" x="-5%" y="-10%" width="110%" height="125%"><feDropShadow dx="0" dy="-5" stdDeviation="6" flood-color="#5a3018" flood-opacity=".28"/></filter></defs></svg>`);
const OUTFIT = 'torsade';
const LEA = sandbox.leaSVG(OUTFIT, false).replace(/<div class="name">[^<]*<\/div>/, '');
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'brand/logo.png')).toString('base64');

/* ---------- words + subtitle chunks ---------- */
const W = JSON.parse(fs.readFileSync(path.join(BOOKS, 'demo/assets/words.json'), 'utf8'));
const FIX = { 6: 'Books,', 38: "L'Alchimiste,", 68: 'vingt', 169: 'simple :', 181: "d'Égypte.", 283: "L'Alchimiste,", 292: 'Saint-Jacques-', 293: 'de-', 294: 'Compostelle.' };
const GLUE = new Set([292, 293]);           // no space after these tokens
const VOCAB = new Set([172, 194, 195, 196, 290, 296]);
// [first token, last token, English]
const CHUNKS = [
  [0, 9, "Hello and welcome to Cozy French Books, I'm Léa."],
  [10, 22, 'Here, we open beautiful books and take the time to see'],
  [23, 31, 'what they can teach us about our own lives.'],
  [32, 41, "Today, I'd like to talk to you about The Alchemist, by Paulo Coelho,"],
  [42, 52, "and there's a question I'd like to follow with you"],
  [53, 58, 'throughout this episode.'],
  [59, 64, 'Where does real motivation come from?'],
  [65, 72, "When you're twenty, you sometimes wonder"],
  [73, 80, 'what you want to do with your life.'],
  [81, 87, 'A few years later, the question changes.'],
  [88, 93, "I've been talking about it for so long…"],
  [94, 102, 'what have I really done to get closer to it?'],
  [103, 114, 'And then, one day, you realise'],
  [115, 120, 'that this dream is still there.'],
  [121, 127, 'It has travelled through the years with you,'],
  [128, 139, "so you wonder whether it's still worth starting."],
  [140, 149, "If you've ever had that thought, stay with me,"],
  [150, 157, 'you may recognise a part of yourself'],
  [158, 163, 'in the story this book tells.'],
  [164, 169, 'The starting point is simple:'],
  [170, 174, 'a young Spanish shepherd, Santiago,'],
  [175, 181, 'dreams of a treasure near the pyramids of Egypt.'],
  [182, 192, 'To go and find it, he has to leave the life he knows'],
  [193, 198, 'and part with his sheep.'],
  [199, 205, 'It all sounds like an adventure tale,'],
  [206, 214, 'but what made me want to tell you about it'],
  [215, 223, 'is the way Coelho shows the moments when'],
  [224, 230, 'Santiago could very well do something else.'],
  [231, 236, 'He could keep what he has,'],
  [237, 241, 'go home after a bad experience'],
  [242, 251, "or stay somewhere he's finally happy."],
  [252, 257, 'Each of these choices makes sense.'],
  [258, 267, "That's why we can see ourselves in this boy,"],
  [268, 275, "even if we've never wanted"],
  [276, 281, 'to look for gold in the desert.'],
  [282, 289, 'Before The Alchemist, Coelho had already written about'],
  [290, 294, 'his pilgrimage to Santiago de Compostela.'],
  [295, 302, 'A pilgrimage is a journey you make'],
  [303, 308, 'for a religious or spiritual reason.'],
  [309, 314, 'In this novel we find the idea'],
  [315, 323, 'of a journey that changes the person who makes it.'],
  [324, 328, 'A road can be long,'],
  [329, 336, "but when you know what you're looking for,"],
  [337, 345, 'you can understand why you take the next step.'],
  [346, 356, "And that's where Santiago's first choice becomes interesting."],
];
const t = i => W[i].s;
const subHTML = CHUNKS.map(([i0, i1, en], k) => {
  let fr = '';
  for (let i = i0; i <= i1; i++) {
    let txt = FIX[i] ?? W[i].t;
    if (txt === '?' && fr) { fr = fr.replace(/<\/span> ?$/, '&nbsp;?</span> '); continue; }
    fr += `<span class="w${VOCAB.has(i) ? ' v' : ''}" id="w${i}">${txt}</span>${GLUE.has(i) ? '' : ' '}`;
  }
  return `<div class="sub" id="sub${k}"><div class="fr">${fr.trim()}</div><div class="en">${en}</div></div>`;
}).join('');
const SUBT = CHUNKS.map(([i0, i1], k) => [t(i0) - .05, k + 1 < CHUNKS.length ? t(CHUNKS[k + 1][0]) - .05 : 121.4]);
const WORDS = W.slice(0, 357).filter(w => w.t !== '?').map((w, i) => ({ s: w.s, e: w.e, n: w.t.length }));
const WIDX = W.slice(0, 357).map((w, i) => i).filter(i => W[i].t !== '?');

/* ---------- vocab cards ---------- */
const CARDS = [
  { at: t(172), pos: 'n.m.', w: 'un berger', ipa: '/bɛʁ.ʒe/', en: 'a shepherd', ex: 'Le berger rentre ses moutons avant l’orage.', exEn: 'The shepherd brings his sheep in before the storm.' },
  { at: t(194), pos: 'v. pron.', w: 'se séparer de', ipa: '/sə se.pa.ʁe də/', en: 'to part with, to let go of', ex: 'J’ai du mal à me séparer de mes vieux livres.', exEn: 'I find it hard to part with my old books.' },
  { at: t(296), pos: 'n.m.', w: 'un pèlerinage', ipa: '/pɛl.ʁi.naʒ/', en: 'a pilgrimage', ex: 'Ma grand-mère a fait un pèlerinage à Lourdes.', exEn: 'My grandmother went on a pilgrimage to Lourdes.' },
];
const cardHTML = CARDS.map((c, i) => `<div class="vcard" id="card${i}"><div class="rib"></div><span class="pos">${c.pos}</span><b>${c.w}</b><i>${c.ipa}</i><p class="mean">${c.en}</p><p class="ex">${c.ex}<br><span>${c.exEn}</span></p></div>`).join('');

/* ---------- key cue times ---------- */
const CUE = {
  nookIn: 4.4, bookCard: t(38), q: t(59), carnetIn: t(65) - .25, e1: t(65), e2: t(81), e2q: t(94), e3: t(103), e3b: t(115), e4: t(128),
  carnetOut: t(140) - .2, bookIn: t(164) - .45, sLabel: t(174), dream: t(175), mapIn: t(182), walk: t(188), part: t(194), dreamOut: t(188),
  sign1: t(233), sign2: t(237), sign3: t(243), signOut: t(258), pan: t(268), gold: t(278),
  turn: t(282) - .1, compo: t(292), note: t(316), close: t(324) - .2, chap: t(346) - .2, coins: t(351), end: 121.6,
  gest: [['palm', 5.3, 2.4], ['up', t(32) + .1, 2.4], ['think', t(59), 2.8], ['palm', t(147) - .2, 2.4], ['up', t(152), 2.6], ['up', t(324) + .2, 2.4], ['beat', t(337), 2.8]],
};

/* ---------- story pages ---------- */
const K = { sky: .1, far: .6, mid: .8, near: 1, fore: 1.25 };
const P1 = ART.PAGE_ALCHIMISTE_1(), P2 = ART.PAGE_ALCHIMISTE_2();
const puppet = (svg, x, y, cls, sc = 1, vb = '-150 -300 300 300') => `<div class="pup ${cls}" style="left:${x - 150}px;top:${y - 300}px;transform:scale(${sc});transform-origin:50% 100%"><svg viewBox="${vb}" width="300" height="300" overflow="visible">${svg}</svg></div>`;
const signs = [['garder ce qu’il a', -14, 0], ['rentrer', 10, 1], ['rester où il est heureux', -6, 2]];
const P1_EXTRA = `
 ${puppet(`<g filter="url(#pencil)">${ART.SANTIAGO}</g>`, 1180, 850, 'santW', 1.15)}
 <div class="tag sLabel" style="left:1300px;top:440px">Santiago<small>berger, Andalousie</small></div>
 <div class="dream" style="left:780px;top:110px"><svg viewBox="0 0 440 330" width="440" height="330"><g filter="url(#pencil)">
   <circle class="db d1" cx="400" cy="318" r="10" fill="#fffaf0"/><circle class="db d2" cx="372" cy="290" r="15" fill="#fffaf0"/>
   <path class="db d3" d="M60 150 C20 120 40 50 110 60 C130 10 220 0 250 44 C300 10 380 30 380 90 C430 110 420 190 360 200 C350 250 270 260 240 230 C200 270 110 260 100 220 C40 230 20 180 60 150Z" fill="#fffaf0" stroke="#c9a77c" stroke-width="5"/>
   <g class="db d3"><path d="M120 200 L190 100 L260 200Z" fill="#e8b35c"/><path d="M220 200 L270 130 L320 200Z" fill="#d99a52"/><path d="M190 100 L205 200 L260 200Z" fill="#c9823f" opacity=".5"/>
   <rect x="150" y="186" width="56" height="34" rx="6" fill="#8a5e42"/><path d="M150 196 C150 170 206 170 206 196Z" fill="#a8703f"/><rect x="172" y="190" width="12" height="12" fill="#f3c96b"/>
   <path class="spark" d="M178 160 l4 -14 l4 14 l14 4 l-14 4 l-4 14 l-4 -14 l-14 -4Z" fill="#f3c96b"/><circle cx="310" cy="80" r="22" fill="#f3c96b" opacity=".85"/></g></g></svg></div>
 <div class="post" style="left:560px;top:470px;width:420px;height:380px"><div style="position:absolute;left:189px;top:20px;width:22px;height:360px;background:#7a5038;border-radius:6px"></div>
  ${signs.map(([txt, rot, i]) => `<div class="sign sg${i}" style="top:${30 + i * 82}px;${i % 2 ? 'right:216px' : 'left:212px'};--r:${rot}deg"><span>${txt}</span></div>`).join('')}</div>
 <div class="gold" style="left:2250px;top:510px"><svg viewBox="-40 -40 80 80" width="80" height="80"><path d="M0 -34 l7 -0 l-7 0Z M0 -30 l8 22 l22 8 l-22 8 l-8 22 l-8 -22 l-22 -8 l22 -8Z" fill="#fff1a8"/></svg></div>`;
const P2_EXTRA = `
 ${puppet(`<g filter="url(#pencil)">${ART.PILGRIM}</g>`, 700, 895, 'pilW')}
 <div class="tag compo" style="left:760px;top:330px">Saint-Jacques-de-Compostelle<small>Espagne · fin du chemin</small></div>`;
const LIFT = { p1: [110, '#8fae6b'], p2: [80, '#7aa463'] };
const layerDiv = (L, w, cls) => { let body = ['far', 'mid', 'near'].includes(L.cls) ? `<g filter="url(#cut)">${L.svg}</g>` : L.svg;
  if (L.cls === 'near') { const [d, c] = LIFT[cls]; body = `<rect y="${1080 - d - 20}" width="${w}" height="${d + 20}" fill="${c}"/><g transform="translate(0 -${d})">${body}</g>`; }
  return `<div class="pl L-${L.cls}" style="width:${w}px"><svg viewBox="0 0 ${w} 1080" width="${w}" height="1080">${body}</svg>`; };
const spread = (P, w, cls, extra) => `<div class="spread ${cls}">${P.layers.map(L => layerDiv(L, w, cls) + (L.cls === 'near' ? extra : '') + '</div>').join('')}</div>`;
const SPREAD1 = spread(P1, 2600, 'p1', P1_EXTRA), SPREAD2 = spread(P2, 2200, 'p2', P2_EXTRA);
const ENDPAPER = `<svg viewBox="0 0 960 1080" width="960" height="1080"><rect width="960" height="1080" fill="#e9d9b8"/>${ART.range(9, r => ART.range(8, c => `<path transform="translate(${60 + c * 120 + (r % 2) * 60} ${60 + r * 120})" d="M0 -16 l5 11 l12 1 l-9 8 l3 12 l-11 -6 l-11 6 l3 -12 l-9 -8 l12 -1Z" fill="#d6c19a"/>`))}</svg>`;
const BIG_COVER = `<div style="position:absolute;inset:0;background:#b85a30;display:flex;align-items:center;justify-content:center">${ART.COVER({ title: 'L’Alchimiste', author: 'Paulo Coelho' }, 760, 1080, 'cvb')}</div>`;

/* ---------- carnet ---------- */
const CARNET_HTML = `
 <div class="ct" style="left:300px;top:118px;transform:rotate(-1.2deg)">D’où vient la vraie motivation&nbsp;?</div>
 <div class="ent e1" style="top:215px"><span class="lab">à 20 ans</span><div class="hw">Qu’est-ce que je veux faire de ma vie&nbsp;?</div></div>
 <div class="ent e2" style="top:365px"><span class="lab">quelques années plus tard</span><div class="hw">Qu’est-ce que j’ai vraiment fait<br>pour m’en approcher&nbsp;?</div></div>
 <div class="ent e3" style="top:560px"><span class="lab">et puis, un jour…</span><div class="hw">Le rêve est <u>toujours là</u>.</div><div class="hw e4" style="color:#b8552a">Ça vaut encore la peine de commencer&nbsp;?</div></div>
 <div class="rp">
  <svg viewBox="0 0 700 520" width="700" height="520" style="position:absolute;left:0;top:0"><path class="trail" d="M120 90 C260 60 330 160 300 230 C270 300 420 320 480 300 C560 280 600 380 560 450" pathLength="1" stroke="#c9963f" stroke-width="5" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="round"/></svg>
  ${[['20 ans', 60, 40, -6], ['25 ans', 250, 180, 4], ['30 ans…', 470, 380, -3]].map(([l, x, y, r], i) => `<div class="cal c${i}" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><span></span>${l}</div>`).join('')}
  <div class="star"><svg viewBox="-30 -30 60 60" width="64" height="64"><path d="M0 -26 l7 17 l18 1 l-14 12 l5 18 l-16 -10 l-16 10 l5 -18 l-14 -12 l18 -1Z" fill="#f3c96b" stroke="#c9963f" stroke-width="3"/></svg><em>le rêve</em></div>
 </div>
 <div class="pola"><div class="photo"><div class="lea" id="lea-p" style="left:-34px;top:-14px;transform:scale(.86)">${LEA}</div></div><span>Léa · carnet de lecture</span></div>`;

/* ---------- chapter card ---------- */
const CHAP_HTML = `<svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0"><rect width="1920" height="1080" fill="#7a5038"/>
 <g filter="url(#pencil)"><rect x="210" y="60" width="1500" height="960" rx="14" fill="#fbf4e6"/>${ART.range(18, i => `<path d="M240 ${150 + i * 48} H1680" stroke="#ecdcc0" stroke-width="2"/>`)}</g></svg>
 <div class="ribbon"></div>
 <div class="chN">Chapitre I</div><div class="chT">Se lancer</div><div class="chS">Le premier choix de Santiago</div>
 <div class="coins">${[0, 1, 2].map(i => `<svg class="coin k${i}" viewBox="-40 -40 80 80" width="96" height="96"><g filter="url(#pencil)"><circle r="34" fill="#f3c96b" stroke="#c9963f" stroke-width="6"/><circle r="22" fill="none" stroke="#d9a845" stroke-width="4"/><path d="M-6 -10 h12 M0 -12 v24 M-8 10 h16" stroke="#b07a26" stroke-width="4" stroke-linecap="round"/></g></svg>`).join('')}</div>`;

/* ---------- opening ---------- */
const SHELF_HTML = `<svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${ART.SHELF()}</svg>
 <div class="shDim"></div>
 <div class="spine"><svg viewBox="0 0 70 300" width="70" height="300"><g filter="url(#pencil)"><rect width="70" height="300" rx="5" fill="#e2733f"/><circle cx="35" cy="44" r="16" fill="#fff1cf"/><rect x="8" y="270" width="54" height="5" fill="#fffaf0" opacity=".6"/></g>
  <text x="44" y="90" transform="rotate(90 44 90)" font-family="Playfair Display" font-weight="700" font-size="26" fill="#fffaf0">L’Alchimiste</text></svg></div>
 <div class="opCover">${ART.COVER({ title: 'L’Alchimiste', author: 'Paulo Coelho' }, 380, 540, 'cvo')}</div>
 <div class="opTitle"><div class="o1">Cozy French</div><div class="o2">Books</div><div class="o3">Lire en français, grandir un peu</div><div class="o4">Épisode 1 · L’Alchimiste</div></div>`;

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cozy French Books — demo</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Nunito:wght@500;700;800;900&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#3a2e28;--terra:#b8552a;--terra2:#d9774b;--butter:#f3c96b;--paper:#fffaf0;--muted:#8a7a6c}
*{box-sizing:border-box} body{margin:0;background:#1e1a17;color:#efe4d6;font-family:Nunito,system-ui,sans-serif}
main{max-width:1280px;margin:0 auto;padding:28px 16px 40px}
h1{font:700 34px 'Playfair Display';margin:0 0 6px;color:#fffaf0} h1 em{color:var(--terra2)} .lead{color:#c9bcae;margin:0 0 18px;line-height:1.5}
.wrap{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px #0008;background:#000}
.frame{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden;background:#2a221c}
.layer{position:absolute;inset:0;width:1920px;height:1080px}
.frame svg{display:block}
.bar{display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap}
.bar button{font:800 15px Nunito;border:0;border-radius:22px;padding:9px 16px;background:#f6eddc;color:#3a2e28;cursor:pointer}
.bar button.main{background:var(--terra2);color:#fffaf0;min-width:110px}
.bar input{flex:1;min-width:200px;accent-color:#d9774b} .bar .tm{font:800 15px ui-monospace,monospace;color:#cbbfb3;min-width:110px}
.notes{color:#a89888;font-size:15px;line-height:1.6;margin-top:18px} .notes b{color:#efe4d6}
.start{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0006;cursor:pointer;z-index:9}
.start span{font:800 26px Nunito;background:var(--terra2);color:#fffaf0;padding:18px 34px;border-radius:40px;box-shadow:0 10px 30px #0006}
/* Léa */
.lea{position:absolute;width:360px;height:480px;transform-origin:0 0}
.lea svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
.lea .eye,.lea .mouth{transform-box:fill-box}
/* opening */
.shDim{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#2a1e1640,#1a120ce0);opacity:0}
.spine{position:absolute;left:925px;top:340px}
.opCover{position:absolute;left:330px;top:250px;opacity:0;filter:drop-shadow(0 24px 30px #0008)}
.opTitle{position:absolute;left:830px;top:330px;color:#fffaf0}
.opTitle>div{opacity:0} .o1{font:700 112px/1 'Playfair Display'} .o2{font:italic 700 140px/1 'Playfair Display';color:var(--butter);margin:-6px 0 0 120px}
.o3{font:800 30px Nunito;letter-spacing:.06em;color:#e9d9c4;margin-top:26px} .o4{display:inline-block;font:800 24px Nunito;background:#fffaf0;color:var(--ink);padding:8px 20px;border-radius:24px;margin-top:22px}
/* nook */
.chip{position:absolute;left:48px;top:40px;background:#fffaf0e8;color:var(--ink);border-radius:22px;padding:12px 26px 10px;font:700 34px 'Playfair Display'}
.chip em{color:var(--terra);font-style:italic} .chip small{display:block;font:800 19px Nunito;color:var(--muted);letter-spacing:.04em}
.bookCard{position:absolute;left:1330px;top:150px;opacity:0;filter:drop-shadow(0 20px 26px #0006)}
.bookCard .tagL{position:absolute;left:-20px;top:-34px;font:800 20px Nunito;letter-spacing:.12em;text-transform:uppercase;background:var(--ink);color:var(--butter);padding:7px 16px;border-radius:20px;transform:rotate(-4deg)}
.bookCard .yr{position:absolute;right:-24px;bottom:40px;font:700 34px Caveat;background:var(--butter);color:var(--ink);padding:4px 16px;border-radius:8px;transform:rotate(5deg)}
.qCard{position:absolute;left:520px;top:100px;width:880px;padding:30px 50px 34px;background:#e9d2a8;border-radius:6px;box-shadow:0 14px 0 #0000001f;opacity:0;transform:rotate(-1.5deg)}
.qCard .tape{position:absolute;left:50%;top:-20px;width:150px;height:40px;margin-left:-75px;background:#f3c96bd0;transform:rotate(3deg)}
.qCard .qt{font:700 74px/1.05 Caveat;color:var(--ink)} .qCard svg{position:absolute;left:50px;bottom:14px}
/* carnet */
.ct{position:absolute;font:700 46px Caveat;color:#5b7398}
.ent{position:absolute;left:300px;width:620px;transform:rotate(-1.2deg)}
.lab{display:inline-block;font:900 17px Nunito;letter-spacing:.12em;text-transform:uppercase;color:#fffaf0;background:var(--terra2);padding:5px 12px;border-radius:14px;opacity:0}
.hw{font:700 50px/1.06 Caveat;color:var(--ink);margin-top:10px;clip-path:inset(0 100% 0 0)} .hw u{text-decoration-color:var(--butter);text-decoration-thickness:8px;text-underline-offset:2px}
.rp{position:absolute;left:1030px;top:150px;width:700px;height:520px;transform:rotate(-1.2deg)}
.cal{position:absolute;width:150px;height:120px;background:#fffaf0;border:4px solid #8a7a6c;border-radius:10px;font:700 40px Caveat;color:var(--ink);text-align:center;padding-top:44px;opacity:0;box-shadow:0 6px 0 #0000001a}
.cal span{position:absolute;left:0;right:0;top:0;height:30px;background:#e8907e;border-radius:6px 6px 0 0}
.star{position:absolute;left:88px;top:-10px;text-align:center} .star em{display:block;font:700 30px Caveat;color:#c9963f;font-style:normal;margin-top:-6px}
.pola{position:absolute;left:1180px;top:560px;width:300px;padding:16px 16px 0;background:#fffaf0;box-shadow:0 12px 24px #0004;transform:rotate(4deg)}
.pola .photo{position:relative;width:268px;height:250px;overflow:hidden;background:#e9d6bb}
.pola>span{display:block;font:700 30px Caveat;color:var(--ink);text-align:center;padding:6px 0 10px}
/* book */
#book{transform-origin:960px 540px;perspective:2600px}
.spread{position:absolute;inset:0;overflow:hidden;background:#f7efdc}
.pl{position:absolute;left:0;top:0;height:1080px;will-change:transform}
.pl>svg{position:absolute;left:0;top:0}
.pup{position:absolute;width:300px;height:300px}
.gutter{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#0000 0,#0000 46%,#3a24101c 49%,#3a241038 50%,#3a24101c 51%,#0000 54%),linear-gradient(0deg,#0000 96%,#3a241018),linear-gradient(180deg,#0000 96%,#3a241018)}
.pageEdge{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 14px #f4e9d2,inset 0 0 0 16px #d9c7a4,inset 0 0 60px #6b4a3640}
#leaf,#cover{position:absolute;left:960px;top:0;width:960px;height:1080px;transform-origin:0 50%;transform-style:preserve-3d;visibility:hidden}
.face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.face.back{transform:rotateY(180deg)}
.face::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#3a241040,#0000 22%,#0000 85%,#3a24101a)}
.face.back::after{background:linear-gradient(270deg,#3a241040,#0000 22%)}
.face .spread{width:1920px}
.tag{position:absolute;font:700 46px/1 Caveat;color:var(--ink);background:#fffaf0;padding:10px 20px 12px;border-radius:10px;box-shadow:0 8px 0 #0000001a;opacity:0}
.tag small{display:block;font:800 17px Nunito;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.dream,.post,.gold{position:absolute}
.db{opacity:0}
.sign{position:absolute;width:210px;padding:12px 10px;background:#c9a06a;border:4px solid #7a5038;border-radius:6px;font:700 34px/1 Caveat;color:#3a2418;text-align:center;opacity:0;transform:rotate(var(--r))}
.sign::after{content:"";position:absolute;top:50%;width:0;height:0;border:24px solid transparent;margin-top:-24px}
.sg0::after,.sg2::after{right:-48px;border-left-color:#7a5038} .sg1::after{left:-48px;border-right-color:#7a5038}
.gold{opacity:0}
.mnote{position:absolute;left:1290px;top:110px;width:520px;font:700 54px/1.02 Caveat;color:#b8552a;background:#fffaf0e6;padding:16px 24px;border-radius:12px;transform:rotate(-3deg);opacity:0}
/* map */
#map{position:absolute;left:40px;top:28px;opacity:0;transform-origin:0 0;filter:drop-shadow(0 10px 14px #0004)}
/* chapter */
.ribbon{position:absolute;left:1440px;top:0;width:90px;height:0;background:#c9502e;clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 40px),0 100%)}
.chN{position:absolute;left:0;right:0;top:170px;text-align:center;font:900 30px Nunito;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);opacity:0}
.chT{position:absolute;left:0;right:0;top:215px;text-align:center;font:italic 700 170px/1 'Playfair Display';color:var(--terra);clip-path:inset(0 100% 0 0)}
.chS{position:absolute;left:0;right:0;top:405px;text-align:center;font:700 52px Caveat;color:var(--ink);opacity:0}
.coins{position:absolute;left:0;right:0;top:475px;display:flex;gap:26px;justify-content:center}
.coin{opacity:0}
/* subtitles + cards */
.sub{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);width:1340px;background:#fffaf0f2;border-radius:26px;padding:18px 40px 20px;text-align:center;box-shadow:0 10px 0 #00000022;opacity:0}
.sub .fr{font:800 46px/1.22 Nunito;color:#c4b5a6} .sub .en{font:600 25px Nunito;color:var(--muted);margin-top:6px}
.w{position:relative;display:inline-block}
.w.v::after{content:"";position:absolute;left:0;right:0;bottom:3px;height:10px;background:var(--butter);z-index:-1;border-radius:6px;transform:scaleX(var(--ul,0));transform-origin:left}
.vcard{position:absolute;left:1360px;top:150px;width:460px;background:#fffaf0;border-radius:6px 6px 22px 22px;padding:30px 32px 26px;box-shadow:0 18px 30px #0004;color:var(--ink);opacity:0}
.vcard .rib{position:absolute;left:36px;top:-150px;width:44px;height:170px;background:#c9502e;clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 16px),0 100%)}
.vcard .pos{position:absolute;right:26px;top:22px;font:900 16px Nunito;letter-spacing:.1em;color:var(--muted)}
.vcard b{display:block;font:700 54px/1.05 'Playfair Display';color:var(--terra);margin-top:6px} .vcard i{display:block;font:700 24px Nunito;font-style:normal;color:var(--muted)}
.vcard .mean{font:800 28px Nunito;margin:12px 0 10px} .vcard .ex{font:600 23px/1.35 Nunito;margin:0;border-top:3px dashed #e8d9c2;padding-top:12px} .vcard .ex span{color:var(--muted)}
.logo{position:absolute;right:40px;top:30px;width:120px;height:120px;border-radius:50%}
.grain{position:absolute;inset:0;pointer-events:none;opacity:.18;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
</style></head><body>
${DEFS}
<main>
<h1>Cozy French <em>Books</em>, bản demo</h1>
<p class="lead">EP01 · L’Alchimiste, 2 phút đầu, voice thật. Góc đọc sách → sổ tay câu hỏi → sách mở ra thành tranh giấy cắt → lật trang → thẻ chương. Bản đồ hành trình ở góc trái là thanh tiến độ của cả tập.</p>
<div class="wrap" id="wrap"><div class="frame" id="F">
 <div class="layer" id="sc-nook">
  <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${ART.NOOK_BG()}</svg>
  <div class="lea" id="lea-n" style="left:776px;top:340px;transform:scale(1.22)">${LEA}</div>
  <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${ART.NOOK_FG()}</svg>
  <div class="chip">Cozy French <em>Books</em><small>Lire, comprendre, grandir</small></div>
  <div class="bookCard"><span class="tagL">Le livre du jour</span>${ART.COVER({ title: 'L’Alchimiste', author: 'Paulo Coelho' }, 380, 540, 'cvn')}<span class="yr">1988 · roman</span></div>
  <div class="qCard"><div class="tape"></div><div class="qt">D’où vient la vraie motivation&nbsp;?</div><svg viewBox="0 0 700 20" width="700" height="20"><path class="qLine" d="M4 12 C200 4 500 18 696 8" pathLength="1" stroke="#b8552a" stroke-width="6" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="round"/></svg></div>
 </div>
 <div class="layer" id="sc-carnet"><svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${ART.CARNET()}</svg>${CARNET_HTML}</div>
 <div class="layer" id="sc-dark" style="background:radial-gradient(circle,#3a2e26,#17110d)"></div>
 <div class="layer" id="book">
  ${SPREAD1.replace('class="spread p1"', 'class="spread p1" id="p1"')}
  ${SPREAD2.replace('class="spread p2"', 'class="spread p2" id="p2"')}
  <div class="mnote">un voyage qui change<br>la personne qui le fait&nbsp;✶</div>
  <div class="gutter"></div><div class="pageEdge"></div>
  <div id="leaf"><div class="face front"><div class="spread p1" style="left:-960px">${SPREAD1.slice(SPREAD1.indexOf('>') + 1, -6)}</div></div><div class="face back"><div class="spread p2" style="left:0">${SPREAD2.slice(SPREAD2.indexOf('>') + 1, -6)}</div></div></div>
  <div id="cover"><div class="face front">${BIG_COVER}</div><div class="face back">${ENDPAPER}</div></div>
 </div>
 <div class="layer" id="sc-chap">${CHAP_HTML}</div>
 <div class="layer" id="sc-shelf">${SHELF_HTML}</div>
 <div id="map">${ART.MAP_ALCHIMISTE()}</div>
 ${cardHTML}
 ${subHTML}
 <img class="logo" src="${LOGO}" alt="">
 <div class="grain"></div>
 <div class="start" id="start"><span>▶ Xem demo</span></div>
</div></div>
<div class="bar"><button class="main" id="play">▶ Phát</button><span class="tm" id="tm">0:00 / 2:01</span><input type="range" id="scrub" min="0" max="${CUE.end}" step="0.01" value="0"></div>
<div class="bar">${[['Mở đầu', 0], ['Góc đọc', 4.6], ['Sổ tay', CUE.carnetIn], ['Mở sách', CUE.bookIn], ['Biển chỉ đường', CUE.sign1 - 1], ['Lật trang', CUE.turn - .5], ['Thẻ chương', CUE.chap - .3]].map(([l, s]) => `<button data-t="${s.toFixed(2)}">${l}</button>`).join('')}</div>
<p class="notes"><b>Đây là bản xem thử trong trình duyệt</b>, chưa phải video render. Mọi chuyển động nằm trên một timeline GSAP chạy theo đồng hồ của audio, kéo thanh trượt tới đâu thì hình đúng tới đó. Khi duyệt xong, khối này chuyển sang HyperFrames y như các kênh khác. Chưa có tiếng lật trang hay SFX.</p>
</main>
<audio id="aud" src="demo/assets/voice-demo.mp3" preload="auto"></audio>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const GEST_ELBOW=${JSON.stringify(sandbox.GEST_ELBOW)};
${GEST_RUNTIME}
const WORDS=${JSON.stringify(WORDS)}, WIDX=${JSON.stringify(WIDX)}, VOC=${JSON.stringify([...VOCAB])}, SUBT=${JSON.stringify(SUBT)}, CARDS=${JSON.stringify(CARDS.map(c => c.at))}, C=${JSON.stringify(CUE)};
const D=C.end, K=${JSON.stringify(K)};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const R=mulberry32(11), rnd=(a,b)=>a+R()*(b-a);
const tl=gsap.timeline({paused:true});
const ft=(el,from,to,at)=>tl.fromTo(el,from,{...to,immediateRender:false},at);
const loop=(el,from,to,dur,at=0,end=D)=>tl.fromTo(el,from,{...to,duration:dur,repeat:Math.ceil((end-at)/dur),ease:to.ease||'none',immediateRender:false},at);
const show=(el,a,b,d=.35)=>{ft(el,{opacity:0},{opacity:1,duration:d},a); if(b!=null) tl.to(el,{opacity:0,duration:d},b);};
const write=(el,at,d=1)=>ft(el,{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:d,ease:'power1.inOut'},at);

/* ---- scene visibility ---- */
['#sc-nook','#sc-carnet','#sc-dark','#book','#sc-chap'].forEach(s=>tl.set(s,{opacity:0},0));
tl.set('#sc-shelf',{opacity:1},0);
/* opening */
ft('.spine',{x:0,y:0,scale:1,rotation:0},{x:-14,y:-8,scale:1.12,rotation:-3,duration:.6,ease:'power2.out'},.35);
ft('.shDim',{opacity:0},{opacity:1,duration:.6},.9);
ft('.spine',{opacity:1},{opacity:0,duration:.25},1.05);
ft('.opCover',{opacity:0,scale:.35,rotation:-14,x:540},{opacity:1,scale:1,rotation:-4,x:0,duration:.75,ease:'back.out(1.5)'},1.05);
['.o1','.o2','.o3','.o4'].forEach((s,i)=>ft(s,{opacity:0,y:30},{opacity:1,y:0,duration:.45,ease:'back.out(1.8)'},1.5+i*.35));
ft('#sc-nook',{opacity:0,scale:1.08},{opacity:1,scale:1,duration:.7,ease:'power2.out'},C.nookIn);
tl.to('#sc-shelf',{opacity:0,duration:.5},C.nookIn+.2);
/* nook: book card + question */
ft('.bookCard',{opacity:0,y:-60,rotation:8},{opacity:1,y:0,rotation:3,duration:.6,ease:'back.out(1.6)'},C.bookCard);
tl.to('.bookCard',{opacity:0,y:-40,duration:.4},C.q-.5);
ft('.qCard',{opacity:0,y:-50},{opacity:1,y:0,duration:.45,ease:'back.out(1.6)'},C.q-.15);
ft('.qLine',{strokeDashoffset:1},{strokeDashoffset:0,duration:.8},C.q+1.4);
/* carnet slides up over the nook */
ft('#sc-carnet',{opacity:1,y:1120,rotation:4},{y:0,rotation:0,duration:.7,ease:'power3.out'},C.carnetIn);
tl.set('#sc-carnet',{opacity:1},C.carnetIn);
tl.set('.qCard',{opacity:0},C.carnetIn+.7);
show('.e1 .lab',C.e1,null); write('.e1 .hw',C.e1+.2,1.3);
show('.e2 .lab',C.e2,null); write('.e2 .hw',C.e2q-.3,1.6);
show('.e3 .lab',C.e3,null); write('.e3 .hw:not(.e4)',C.e3b-.2,1); write('.e4',C.e4,1.6);
[C.e1,C.e2,C.e3].forEach((s,i)=>ft('.c'+i,{opacity:0,scale:.6},{opacity:1,scale:1,duration:.4,ease:'back.out(2)'},s+.1));
ft('.trail',{strokeDashoffset:1},{strokeDashoffset:.62,duration:1.2},C.e2);
tl.to('.trail',{strokeDashoffset:0,duration:1.2},C.e3);
ft('.star',{x:0,y:0},{x:190,y:150,duration:1.2,ease:'power1.inOut'},C.e2);
tl.to('.star',{x:410,y:350,duration:1.2,ease:'power1.inOut'},C.e3);
loop('.star svg',{rotation:-8},{rotation:8,duration:1.1,yoyo:true,ease:'sine.inOut'},1.1,C.carnetIn,C.carnetOut+1);
ft('.pola',{opacity:0,scale:.7,rotation:-6},{opacity:1,scale:1,rotation:4,duration:.5,ease:'back.out(1.8)'},C.carnetIn+.8);
tl.to('#sc-carnet',{y:1120,rotation:-4,duration:.55,ease:'power2.in'},C.carnetOut);
tl.set('#sc-carnet',{opacity:0},C.carnetOut+.6);

/* ---- book opens ---- */
ft('#sc-dark',{opacity:0},{opacity:1,duration:.4},C.bookIn-.1);
tl.set('#book',{opacity:1,scale:.42,x:-202},C.bookIn);
tl.set('#p2',{opacity:0},0);
tl.set('#p1',{clipPath:'inset(0% 0% 0% 50%)'},C.bookIn);
tl.set('#cover',{visibility:'visible',rotationY:0},C.bookIn);
tl.set('.gutter,.pageEdge',{opacity:0},C.bookIn);
ft('#book',{y:40},{y:0,duration:.35,ease:'power2.out'},C.bookIn);
ft('#cover',{rotationY:0},{rotationY:-180,duration:1.05,ease:'power2.inOut'},C.bookIn+.3);
tl.set('#p1',{clipPath:'inset(0% 0% 0% 0%)'},C.bookIn+.82);
tl.set('.gutter,.pageEdge',{opacity:1},C.bookIn+.82);
tl.to('#cover .face.back',{opacity:0,duration:.3},C.bookIn+1.3);
tl.set('#cover',{visibility:'hidden'},C.bookIn+1.6);
ft('#book',{scale:.42,x:-202},{scale:1,x:0,duration:1.1,ease:'power2.inOut'},C.bookIn+1.1);
tl.set('#sc-nook',{opacity:0},C.bookIn+.3);
/* page 1 camera: slow drift, then pan right toward the desert */
Object.entries(K).forEach(([k,f])=>{const el='.p1 .L-'+k;
  ft(el,{x:0},{x:-130*f,duration:C.pan-C.bookIn,ease:'none'},C.bookIn);
  tl.to(el,{x:-640*f,duration:3.2,ease:'power2.inOut'},C.pan);});
/* ambient on page 1 */
for(let i=0;i<6;i++){ const at=rnd(0,4);
  loop('.sh'+i+' .shHead',{rotation:0,transformOrigin:'10% 80%'},{rotation:22,duration:rnd(1.4,2.2),yoyo:true,ease:'sine.inOut'},rnd(1.4,2.2),C.bookIn+at,C.turn+2); }
loop('.p1 .tuft',{skewX:-4},{skewX:4,duration:1.6,yoyo:true,ease:'sine.inOut'},1.6,C.bookIn,C.close);
loop('.p1 .c1',{x:0},{x:60,duration:12,yoyo:true,ease:'sine.inOut'},12,C.bookIn,C.close);
loop('.p1 .birds',{x:0,y:0},{x:-40,y:8,duration:3,yoyo:true,ease:'sine.inOut'},3,C.bookIn,C.close);
loop('.p1 .sBob',{y:0},{y:2,duration:1.8,yoyo:true,ease:'sine.inOut'},1.8,C.bookIn,C.walk);
/* Santiago: name, dream, walk away from the flock */
ft('.sLabel',{opacity:0,y:20},{opacity:1,y:0,duration:.4,ease:'back.out(2)'},C.sLabel-.6);
tl.to('.sLabel',{opacity:0,duration:.3},C.mapIn);
['.d1','.d2','.d3'].forEach((s,i)=>ft('.dream '+s,{opacity:0,scale:.4,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:.35,ease:'back.out(2)'},C.dream+i*.18));
loop('.dream .spark',{scale:.6,svgOrigin:'182 164'},{scale:1.25,duration:.5,yoyo:true,ease:'sine.inOut'},.5,C.dream,C.dreamOut+1);
tl.to('.dream .db',{opacity:0,duration:.35},C.dreamOut);
const walkEnd=C.walk+3.2;
ft('.p1 .santW',{x:0},{x:190,duration:3.2,ease:'none'},C.walk);
loop('.p1 .sLegF',{rotation:-16,svgOrigin:'10 -96'},{rotation:16,duration:.4,yoyo:true,ease:'sine.inOut'},.4,C.walk,walkEnd);
loop('.p1 .sLegB',{rotation:16,svgOrigin:'-10 -96'},{rotation:-16,duration:.4,yoyo:true,ease:'sine.inOut'},.4,C.walk,walkEnd);
loop('.p1 .sBob',{y:0},{y:-6,duration:.2,yoyo:true,ease:'sine.inOut'},.2,C.walk,walkEnd);
tl.set('.p1 .sLegF,.p1 .sLegB',{rotation:0},walkEnd+.05);
/* he turns back to look at the sheep */
ft('.p1 .sant',{scaleX:1},{scaleX:-1,duration:.25,ease:'power2.inOut'},Math.max(walkEnd,C.part+1.2));
ft('.p1 .sHead',{rotation:0,svgOrigin:'0 -200'},{rotation:-8,duration:.4,yoyo:true,repeat:1},Math.max(walkEnd,C.part+1.2)+.4);
/* map / progress bar */
ft('#map',{opacity:0,y:-40,scale:.9},{opacity:1,y:0,scale:.9,duration:.5,ease:'back.out(1.6)'},C.mapIn);
ft('.mapRoute',{strokeDashoffset:1},{strokeDashoffset:0,duration:2.6,ease:'power1.inOut'},C.mapIn+.4);
['.st0','.st1','.st2','.st3'].forEach((s,i)=>ft(s,{opacity:0,scale:.4,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:.3,ease:'back.out(2)'},C.mapIn+.3+i*.75));
loop('.pinPulse',{scale:.6,opacity:.5,transformOrigin:'50% 50%'},{scale:1.7,opacity:0,duration:1.2},1.2,C.mapIn,D);
tl.to('#map',{opacity:0,duration:.35},C.turn-.2);
/* three signposts: keep, go home, stay */
[C.sign1,C.sign2,C.sign3].forEach((s,i)=>ft('.sg'+i,{opacity:0,scale:.3},{opacity:1,scale:1,duration:.4,ease:'back.out(2.2)'},s-.1));
ft('.post',{opacity:0,y:40},{opacity:1,y:0,duration:.4},C.sign1-.4);
tl.to('.post,.sign',{opacity:0,duration:.4},C.signOut);
ft('.gold',{opacity:0,scale:.3,rotation:0},{opacity:1,scale:1.3,rotation:90,duration:.5,ease:'back.out(2)'},C.gold);
tl.to('.gold',{opacity:0,scale:.6,duration:.6},C.gold+1.6);

/* ---- page turn to the Camino ---- */
tl.set('#p2',{opacity:1,clipPath:'inset(0% 0% 0% 50%)'},C.turn);
tl.set('#p1',{clipPath:'inset(0% 50% 0% 0%)'},C.turn);
tl.set('#leaf',{visibility:'visible',rotationY:0},C.turn);
ft('#leaf',{rotationY:0},{rotationY:-180,duration:1,ease:'power2.inOut'},C.turn);
tl.set('#leaf',{visibility:'hidden'},C.turn+1.02);
tl.set('#p1',{opacity:0},C.turn+1.02);
tl.set('#p2',{clipPath:'inset(0% 0% 0% 0%)'},C.turn+1.02);
Object.entries(K).forEach(([k,f])=>ft('.p2 .L-'+k,{x:0},{x:-170*f,duration:C.close-C.turn+1,ease:'none'},C.turn));
loop('.p2 .tuft',{skewX:-4},{skewX:4,duration:1.6,yoyo:true,ease:'sine.inOut'},1.6,C.turn,C.close+1);
/* the pilgrim walks up the road, getting smaller */
const PATH=[[0,0,1.5],[200,-30,1.3],[360,-75,1.1],[480,-140,.9],[600,-215,.7],[730,-322,.48]];
const pd=(C.close-C.turn)/(PATH.length-1);
tl.set('.p2 .pilW',{x:0,y:0,scale:1.5,transformOrigin:'50% 100%'},C.turn);
PATH.slice(1).forEach(([x,y,s],i)=>tl.to('.p2 .pilW',{x,y,scale:s,duration:pd,ease:'none'},C.turn+i*pd));
loop('.p2 .pLegF',{rotation:-14,svgOrigin:'8 -64'},{rotation:14,duration:.42,yoyo:true,ease:'sine.inOut'},.42,C.turn,C.close+1);
loop('.p2 .pLegB',{rotation:14,svgOrigin:'-8 -64'},{rotation:-14,duration:.42,yoyo:true,ease:'sine.inOut'},.42,C.turn,C.close+1);
loop('.p2 .pBob',{y:0},{y:-4,duration:.21,yoyo:true,ease:'sine.inOut'},.21,C.turn,C.close+1);
ft('.compo',{opacity:0,y:20},{opacity:1,y:0,duration:.4,ease:'back.out(2)'},C.compo-.3);
tl.to('.compo',{opacity:0,duration:.3},C.note-.6);
ft('.mnote',{opacity:0,scale:.8},{opacity:1,scale:1,duration:.45,ease:'back.out(1.8)'},C.note);
tl.to('.mnote',{opacity:0,duration:.3},C.close-.2);

/* ---- book closes, back to Léa ---- */
tl.to('#book',{scale:.55,opacity:0,duration:.6,ease:'power2.in'},C.close);
tl.set('#sc-nook',{opacity:1},C.close);
tl.to('#sc-dark',{opacity:0,duration:.6},C.close);

/* ---- chapter card ---- */
ft('#sc-chap',{opacity:1,x:1920,rotation:3},{x:0,rotation:0,duration:.65,ease:'power3.out'},C.chap);
tl.set('#sc-chap',{opacity:1},C.chap);
ft('.ribbon',{height:0},{height:240,duration:.5,ease:'power2.out'},C.chap+.5);
show('.chN',C.chap+.6,null); write('.chT',C.chap+.85,.9); show('.chS',C.chap+1.7,null,.5);
[0,1,2].forEach(i=>ft('.k'+i,{opacity:0,y:-160,rotation:-40},{opacity:1,y:0,rotation:0,duration:.5,ease:'bounce.out'},C.coins+.2+i*.3));
ft('#map',{opacity:0,x:480,y:585,scale:1},{opacity:1,duration:.5},C.chap+2.4);
/* ---- vocab cards ---- */
CARDS.forEach((at,i)=>{ ft('#card'+i,{opacity:0,y:-80,rotation:4},{opacity:1,y:0,rotation:-1.5,duration:.55,ease:'back.out(1.6)'},at); tl.to('#card'+i,{opacity:0,y:-60,duration:.35},at+4.5); });
/* ---- subtitles + karaoke + lip sync ---- */
SUBT.forEach(([a,b],i)=>{ ft('#sub'+i,{opacity:0,y:20},{opacity:1,y:0,duration:.2,ease:'back.out(2)'},a); tl.set('#sub'+i,{opacity:0},b); });
WORDS.forEach((w,k)=>{ const i=WIDX[k], el='#w'+i, v=VOC.includes(i);
  ft(el,{color:'#c4b5a6'},{color:v?'#b8552a':'#3a2e28',duration:.1},w.s);
  if(v) ft(el,{'--ul':0},{'--ul':1,duration:.35},w.s);
  const len=Math.min(w.e-w.s,.08*w.n+.08), flaps=Math.max(1,Math.round(len/.2)), fd=len/flaps/2;
  for(let f=0;f<flaps;f++) ft('.lea .mouth',{scaleY:1},{scaleY:2.4+R()*1.8,transformOrigin:'50% 0%',duration:fd,yoyo:true,repeat:1,ease:'sine.inOut'},w.s+f*fd*2);
});
/* ---- Léa idle: blink, breathe, head tilt, gestures ---- */
for(let s=1.5;s<D;s+=rnd(2.8,5)) ft('.lea .eye',{scaleY:1},{scaleY:.1,transformOrigin:'50% 50%',duration:.07,yoyo:true,repeat:1},s);
loop('.lea .breath',{y:0},{y:2,duration:1.8,yoyo:true,ease:'sine.inOut'},1.8);
tl.set('.lea .head',{transformOrigin:'50% 95%'},0);
loop('.lea .head',{rotation:-1.5},{rotation:2,duration:2.6,yoyo:true,ease:'sine.inOut'},2.6);
tl.set('#lea-n .gest',{svgOrigin:'257 286',opacity:0},0);
Object.keys(GEST_ELBOW).forEach(k=>{ if(document.querySelector('#lea-n .g-'+k+' .fore')) tl.set('#lea-n .g-'+k+' .fore',{svgOrigin:GEST_ELBOW[k].join(' ')},0); });
C.gest.forEach(([p,s,d])=>{ const b=WORDS.filter(w=>w.s>s&&w.s<s+d).map(w=>w.s); gestTL(tl,'#lea-n',{p,t:s,d,b}); });
/* ---- nook ambience ---- */
document.querySelectorAll('#sc-nook .drop').forEach((d,i)=>{ const dur=rnd(.5,.9); loop(d,{y:-60,opacity:0},{y:90,opacity:.9,duration:dur},dur,-rnd(0,dur)+dur); });
loop('.lampGlow',{opacity:.85,scale:1,transformOrigin:'50% 50%'},{opacity:1,scale:1.04,duration:2.2,yoyo:true,ease:'sine.inOut'},2.2);
loop('.steamT',{y:0,opacity:.7},{y:-26,opacity:0,duration:2.4},2.4);
loop('.catB',{scaleY:1,transformOrigin:'50% 100%'},{scaleY:1.04,duration:1.6,yoyo:true,ease:'sine.inOut'},1.6);
tl.set({}, {}, D);

/* ---- player ---- */
const F=document.getElementById('F'), A=document.getElementById('aud'), P=document.getElementById('play'), S=document.getElementById('scrub'), TM=document.getElementById('tm');
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function fit(){F.style.transform='scale('+(document.getElementById('wrap').clientWidth/1920)+')'} addEventListener('resize',fit); fit();
function tick(){ tl.time(Math.min(A.currentTime,D)); S.value=A.currentTime; TM.textContent=fmt(A.currentTime)+' / 2:01'; requestAnimationFrame(tick); } tick();
const go=()=>{document.getElementById('start').style.display='none'; A.paused?A.play():A.pause();};
P.onclick=go; document.getElementById('start').onclick=go;
A.onplay=()=>P.textContent='❚❚ Dừng'; A.onpause=()=>P.textContent='▶ Phát';
S.oninput=()=>{A.currentTime=+S.value};
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{A.currentTime=+b.dataset.t; document.getElementById('start').style.display='none'; A.play();});
</script></body></html>`;
fs.writeFileSync(path.join(BOOKS, 'books-demo.html'), html);
console.log(`books-demo.html: ${(html.length / 1024).toFixed(0)} KB, ${CHUNKS.length} subtitle chunks, cues:`, Object.fromEntries(Object.entries(CUE).filter(([k, v]) => typeof v === 'number').map(([k, v]) => [k, +v.toFixed(2)])));
