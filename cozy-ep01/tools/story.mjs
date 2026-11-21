// Story cutaways ("séquences animées") for The Cozy French.
// The video cuts from the table to a full-screen page where what they are saying is shown as motion graphics
// in the channel's pencil + paper look: moving text, a mini map of France, icons, a list, a calendar, a battery…
// and, only when it helps, little standing Léa / Mathieu (or a paper puppet from the Books kit) acting it out.
// Then it cuts straight back to the table (no transition effect — the owner asked for plain cuts). Subtitles, vocab cards and the logo stay on top.
//
// episode.json → "stories": [ {
//   "c": [12, 18],                 chunk range shown (inclusive): cut in just before chunk 12, cut back after chunk 18
//   "place": "papier",             background: papier · chambre · bureau · cuisine · rue · carte · or any Books place "books:salon" (books/scenes.mjs)
//   "tag": "Souvenir|Mathieu, étudiant",  optional label top-left ("bold part|rest")
//   "cast": [ { "id": "m", "who": "mat", "x": 860, "outfit": "#8fae8b", "flip": false, "s": 1.12 } ],   optional; who = lea | mat | person (+ "o": PERSON options)
//   "beats": [ { "c": 13, "w": "guitare", "do": "hold", "on": "m", "prop": "guitar" }, … ]
// } ]
// Beat time = start of word "w" (text inside the chunk, or its index) in chunk "c" (default: the story's first chunk).
// "d" = seconds it lasts (when it matters), "until": {c, w} = fade out then (otherwise it stays to the end of the story), "id" = name for "hide".
// Beats — see BEATS below for the parameters of each.
import { SCENES as BOOK_SCENES } from '../../books/scenes.mjs';
import { PERSON, ICON as BICON } from '../../books/kit.mjs';
import fs from 'node:fs';
import rough from './rough.esm.js';

// shared drawing data at the repo root (see data/excalidraw/CREDITS.md): Excalidraw library drawings (MIT)
const DATA = new URL('../../data/', import.meta.url);
const lazyJSON = f => { let v; return () => v ??= JSON.parse(fs.readFileSync(new URL(f, DATA), 'utf8')); };
const EXI = lazyJSON('excalidraw/items.json'), EXN = lazyJSON('excalidraw/names.json');
const RG = rough.generator();
const CAVEAT = new URL('../../brand/fonts/Caveat-700-latin.woff2', import.meta.url);   // handwriting font (OFL), embedded only when a story writes by hand

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R2 = n => (+n).toFixed(2);
const P = 'url(#pencil)';

/* ---------------- icons: demo ILLUS name · "b:<books icon>" · "x:<excalidraw drawing>" · any character (♪ ★ ✓ …) ----------------
   Every drawing is DRAWN ON when it appears (drawCode): ILLUS / Books icons get an ink outline traced first, then the colours fade in;
   Excalidraw drawings are already pencil strokes, so their own strokes are traced. */
const SHAPE = /<(path|circle|ellipse|rect|polygon|polyline|line)\b/g;
const outlineOf = c => c.replace(/<text[\s\S]*?<\/text>/g, '').replace(/\s(fill|stroke|stroke-width|class|opacity|fill-opacity|stroke-dasharray|stroke-dashoffset|filter)="[^"]*"/g, '')
  .replace(SHAPE, '<$1 pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"');
const dashify = c => c.replace(/<path\b([^>]*?)\sfill="(?!none)([^"]*)"/g, '<path$1 fill="$2" class="st-xf" fill-opacity="0"')
  .replace(/<path\b/g, '<path pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"').replace(/<text\b/g, '<text class="st-xt" opacity="0"');
export const exItem = n => { const id = EXN()[n] || n, it = EXI()[id]; if (!it) throw new Error(`unknown drawing "x:${n}" (have: ${Object.keys(EXN()).join(', ')})`); return it; };
function iconSVG(ILLUS, n, w = 150) {
  if (!n) return '';
  const traced = (vb, ww, hh, c) => `<svg viewBox="${vb}" width="${ww}" height="${hh}"><g filter="${P}"><g class="st-fl" opacity="0">${c}</g><g class="st-ol" fill="none" stroke="#3a2e28" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${outlineOf(c)}</g></g></svg>`;
  if (ILLUS[n]) return traced('0 0 300 200', w, w * 2 / 3, ILLUS[n].svg);
  if (n.startsWith('b:') && BICON[n.slice(2)]) return traced('-40 -40 80 80', w * .6, w * .6, BICON[n.slice(2)]);
  if (n.startsWith('x:')) { const it = exItem(n.slice(2)), s = Math.min(w / it.w, w * .75 / it.h);
    return `<svg viewBox="0 0 ${it.w} ${it.h}" width="${(it.w * s).toFixed(0)}" height="${(it.h * s).toFixed(0)}"><g class="st-xd">${dashify(it.svg)}</g></svg>`; }
  return `<span class="st-glyph" style="font-size:${w * .5}px">${esc(n)}</span>`;
}
// tween code that draws every traced drawing inside sel (only the parts present, so GSAP never warns about empty targets)
function drawCode(sel, t, html, dur = .8) {
  let c = '';
  if (html.includes('stroke-dashoffset="1"')) c += `tl.fromTo('${sel} [pathLength]',{strokeDashoffset:1},{strokeDashoffset:0,duration:${dur},ease:'power1.inOut',stagger:{amount:.35},immediateRender:false},${R2(t)});`;
  if (html.includes('st-fl')) c += `tl.to('${sel} .st-fl',{opacity:1,duration:.35,immediateRender:false},${R2(t + dur * .7)});tl.to('${sel} .st-ol',{opacity:0,duration:.4,immediateRender:false},${R2(t + dur + .1)});`;
  if (html.includes('st-xf')) c += `tl.to('${sel} .st-xf',{fillOpacity:1,duration:.35,immediateRender:false},${R2(t + dur * .6)});`;
  if (html.includes('st-xt')) c += `tl.to('${sel} .st-xt',{opacity:1,duration:.3,immediateRender:false},${R2(t + dur * .6)});`;
  return c;
}

/* ---------------- rough.js: sketchy frames + shapes (deterministic: every call gets its own seed) ---------------- */
let SEED = 11;
const rpaths = (shape, extra = '') => RG.toPaths(shape).map(p => `<path d="${p.d.replace(/(\d+\.\d{2})\d+/g, '$1')}" fill="${p.fill || 'none'}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${extra}/>`).join('');
const ro = (o = {}) => ({ seed: SEED++, roughness: 1.3, strokeWidth: 3.5, stroke: '#3a2e28', ...o });
// frame behind an HTML box of any size: stretched SVG with non-scaling strokes (sketchy outline + paper or hachure fill)
const rframe = (fill = '#fffaf0', o = {}) => `<svg class="st-rf" viewBox="0 0 400 240" preserveAspectRatio="none">${rpaths(RG.rectangle(8, 8, 384, 224, ro({ fill, fillStyle: o.hachure ? 'hachure' : 'solid', hachureGap: 16, fillWeight: 2.5, ...o })), ' vector-effect="non-scaling-stroke"')}</svg>`;
// a hand-drawn stroke that draws on (arrow, circle, underline): rough paths with pathLength
const rdraw = (shape, extra = '') => rpaths(shape, ` pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round"${extra}`);

/* ---------------- places (1920×1080) ---------------- */
const WINDOW = (x, y, w, h, night = true) => `<g transform="translate(${x} ${y})"><defs><linearGradient id="stw${x}" x1="0" y1="0" x2="0" y2="1">${night ? '<stop offset="0" stop-color="#26304e"/><stop offset="1" stop-color="#4a5a82"/>' : '<stop offset="0" stop-color="#9cc0d8"/><stop offset="1" stop-color="#dcebf0"/>'}</linearGradient></defs>
  <rect width="${w}" height="${h}" rx="10" fill="url(#stw${x})"/>
  ${night ? [[.15, .15], [.8, .2], [.6, .1], [.3, .4], [.88, .6], [.1, .7]].map(([a, b]) => `<circle cx="${a * w}" cy="${b * h}" r="3.5" fill="#fff6dc"/>`).join('') : ''}
  <g transform="translate(${w * .78} ${h * .18})"><g class="st-moon" data-w="${w}" data-h="${h}"><circle r="${night ? 34 : 40}" fill="${night ? '#fff1cf' : '#ffe08a'}"/></g></g>
  <path d="M${w / 2} 0 V${h} M0 ${h / 2} H${w}" stroke="#f6eddc" stroke-width="14"/><rect width="${w}" height="${h}" rx="10" fill="none" stroke="#f6eddc" stroke-width="18"/></g>`;
const WALL = (c1, c2, stripes = '#b8552a') => `<defs><linearGradient id="stwall${c1.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1920" height="1080" fill="url(#stwall${c1.slice(1)})"/>${stripes ? `<g opacity=".16" stroke="${stripes}" stroke-width="3">${Array.from({ length: 24 }, (_, k) => `<path d="M${k * 84 + 30} 0 V820"/>`).join('')}</g>` : ''}`;
const FLOOR = (c = '#c9a77c', l = '#a8875f') => `<rect y="800" width="1920" height="280" fill="${c}"/><path d="M0 800 H1920" stroke="${l}" stroke-width="8"/>`;
export const PLACES = {
  // blank paper page — for text, maps, lists, icons (no characters needed)
  papier: () => `<rect width="1920" height="1080" fill="#f6eddc"/><g opacity=".22" stroke="#c9b48e" stroke-width="2">${Array.from({ length: 20 }, (_, k) => `<path d="M0 ${k * 56 + 40} H1920"/>`).join('')}</g>
    <path d="M150 0 V1080" stroke="#e8907e" stroke-width="3" opacity=".5"/>`,
  // big map table — use with the "map" beat
  carte: () => `<rect width="1920" height="1080" fill="#e9dcc4"/><g opacity=".25" stroke="#b89a6c" stroke-width="2">${Array.from({ length: 14 }, (_, k) => `<path d="M0 ${k * 80} H1920 M${k * 150} 0 V1080"/>`).join('')}</g>
    <g filter="${P}" transform="translate(-1440 420)"><circle cx="1720" cy="200" r="90" fill="none" stroke="#b89a6c" stroke-width="4"/><path d="M1720 90 V310 M1610 200 H1830" stroke="#b89a6c" stroke-width="3"/><path d="M1720 110 l14 90 l-14 -20 l-14 20Z" fill="#b8552a"/><text x="1708" y="80" font-family="Playfair Display" font-weight="700" font-size="34" fill="#8a5e42">N</text></g>`,
  // student bedroom / small flat: window (night), desk + lamp, bed, pennant
  chambre: () => `${WALL('#efe3cc', '#e3d2b2')}${FLOOR()}<g filter="${P}">${WINDOW(1180, 150, 360, 380)}
    <path d="M1150 140 C1220 180 1210 450 1170 550 L1140 550 L1140 140Z M1570 140 C1500 180 1510 450 1550 550 L1580 550 L1580 140Z" fill="#d9774b"/>
    <g transform="translate(1200 640)"><rect width="440" height="26" rx="6" fill="#8a5e42"/><path d="M30 26 V160 M410 26 V160" stroke="#6b4a36" stroke-width="18"/>
     <rect x="40" y="-60" width="110" height="60" rx="4" fill="#c9693f"/><rect x="52" y="-82" width="90" height="22" rx="4" fill="#8fae8b"/><rect x="60" y="-100" width="72" height="18" rx="4" fill="#f3c96b"/>
     <path d="M330 0 L360 -110 L300 -150" stroke="#3a2e28" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M262 -170 l72 -16 l-8 52Z" fill="#f3c96b"/>
     <path class="st-lampglow" d="M290 -140 L180 0 H400Z" fill="#fff1b8" opacity=".35"/></g>
    <g transform="translate(160 150)"><path d="M0 0 L250 40 L0 80Z" fill="#b8552a"/><text x="70" y="52" font-family="Playfair Display" font-weight="700" font-size="30" fill="#fffaf0">FAC</text><path d="M0 -10 V120" stroke="#6b4a36" stroke-width="8"/></g>
    <g transform="translate(120 560)"><rect width="520" height="200" rx="18" fill="#5b7398"/><rect x="-20" y="-80" width="40" height="300" rx="12" fill="#8a5e42"/>
     <rect x="20" y="-30" width="160" height="70" rx="30" fill="#fffaf0"/><path d="M200 -10 H520 V60 H200Z" fill="#8fae8b" opacity=".85"/></g></g>`,
  // home office: window on the roofs, big desk on the right with laptop + lamp (the "pile" beat stacks papers on it)
  bureau: () => `${WALL('#e9e2cf', '#ddd2b8', '#5b7398')}${FLOOR('#b89470', '#94724f')}<g filter="${P}">${WINDOW(200, 150, 420, 400)}
    <g transform="translate(200 150)">${Array.from({ length: 6 }, (_, k) => `<rect x="${10 + k * 70}" y="${300 - (k % 3) * 40}" width="62" height="${100 + (k % 3) * 40}" fill="#3a4466" opacity=".8"/>`).join('')}</g>
    <g transform="translate(920 600)"><rect width="820" height="28" rx="8" fill="#8a5e42"/><path d="M40 28 V200 M780 28 V200" stroke="#6b4a36" stroke-width="20"/>
     <path d="M120 0 L150 -130 H360 L390 0Z" fill="#3a3a48"/><rect x="160" y="-120" width="190" height="112" rx="6" fill="#9cc0d8"/><rect x="90" y="-4" width="330" height="10" rx="4" fill="#5a5a68"/>
     <path d="M700 0 L730 -150 L660 -200" stroke="#3a2e28" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M610 -220 l80 -14 l-10 56Z" fill="#d9774b"/>
     <path class="st-lampglow" d="M650 -190 L520 0 H780Z" fill="#fff1b8" opacity=".3"/>
     <g transform="translate(470 0)"><rect x="-18" y="-46" width="36" height="46" rx="6" fill="#8fae8b"/><path d="M18 -36 c14 0 14 22 0 22" stroke="#8fae8b" stroke-width="6" fill="none"/></g></g>
    <g transform="translate(1800 800)"><path d="M-40 0 L-30 -90 H30 L40 0Z" fill="#c9693f"/><path d="M0 -90 C-60 -160 -70 -230 -20 -270 M0 -90 C40 -170 80 -200 70 -260 M0 -90 C0 -160 10 -220 0 -300" stroke="#6f8e6b" stroke-width="16" fill="none" stroke-linecap="round"/></g></g>`,
  // kitchen: tiles, shelf with jars, window (day), counter
  cuisine: () => `${WALL('#f1e6d0', '#e6d7b9', '')}<g opacity=".35">${Array.from({ length: 16 }, (_, i) => Array.from({ length: 4 }, (_, j) => `<rect x="${i * 120}" y="${430 + j * 90}" width="116" height="86" fill="${(i + j) % 2 ? '#dfe8e4' : '#f6f2ea'}"/>`).join('')).join('')}</g>
    ${FLOOR('#a8875f', '#8a6a48')}<g filter="${P}">${WINDOW(1300, 120, 380, 300, false)}
    <rect x="0" y="640" width="1920" height="40" fill="#8a5e42"/><rect x="0" y="680" width="1920" height="120" fill="#c9693f"/>${Array.from({ length: 8 }, (_, k) => `<rect x="${40 + k * 240}" y="700" width="200" height="80" rx="8" fill="#d9774b"/><circle cx="${140 + k * 240}" cy="740" r="7" fill="#6b4a36"/>`).join('')}
    <rect x="160" y="250" width="600" height="18" rx="6" fill="#8a5e42"/>${['#f3c96b', '#8fae8b', '#e8907e', '#5b7398', '#d9774b'].map((c, k) => `<rect x="${190 + k * 110}" y="${170 - (k % 2) * 20}" width="70" height="${80 + (k % 2) * 20}" rx="12" fill="${c}"/><rect x="${186 + k * 110}" y="${160 - (k % 2) * 20}" width="78" height="18" rx="6" fill="#6b4a36"/>`).join('')}
    <g transform="translate(980 640)"><ellipse cx="0" cy="-30" rx="90" ry="34" fill="#3a3a48"/><rect x="-90" y="-60" width="180" height="30" fill="#3a3a48"/><path d="M90 -50 h70" stroke="#3a3a48" stroke-width="14" stroke-linecap="round"/><path class="st-steam" d="M-30 -100 c-20 -30 20 -50 0 -80 M20 -100 c-20 -30 20 -50 0 -80" stroke="#fffaf0" stroke-width="7" fill="none" opacity=".7"/></g></g>`,
  // street by day: shop fronts, awnings, lamp post, cobbles
  rue: () => `<rect width="1920" height="1080" fill="#cfe2ea"/><g filter="${P}"><circle cx="1650" cy="160" r="70" fill="#ffe08a"/>
    ${[['#f3e6cf', '#d9774b', 'Boulangerie'], ['#e8d9c0', '#5b7398', 'Café'], ['#efe3cc', '#8fae8b', 'Fleurs'], ['#e6d4b8', '#b8552a', 'Librairie']].map(([w, a, n], k) => `<g transform="translate(${k * 480} 0)"><rect x="20" y="120" width="440" height="680" fill="${w}"/>
     ${[0, 1].map(j => `<rect x="${70 + j * 200}" y="${190}" width="120" height="150" rx="6" fill="#9cb8c8"/><rect x="${64 + j * 200}" y="${336}" width="132" height="14" fill="#fffaf0"/>`).join('')}
     <rect x="20" y="430" width="440" height="60" fill="${a}"/><text x="240" y="472" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="36" fill="#fffaf0">${n}</text>
     <path d="M20 490 h440 l-20 60 h-400Z" fill="${a}" opacity=".85"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${40 + i * 70} 550 l35 0" stroke="#fffaf0" stroke-width="10"/>`).join('')}
     <rect x="60" y="590" width="220" height="210" fill="#9cb8c8"/><rect x="310" y="590" width="110" height="210" fill="#6b4a36"/></g>`).join('')}
    <path d="M1700 800 V380" stroke="#3a3a48" stroke-width="16"/><path d="M1660 380 h80 l-14 -60 h-52Z" fill="#3a3a48"/></g>
    <rect y="800" width="1920" height="280" fill="#b9ab98"/>${Array.from({ length: 30 }, (_, k) => `<rect x="${k * 66}" y="${810 + (k % 3) * 22}" width="56" height="16" rx="6" fill="#a89a86"/>`).join('')}`,
};
const placeHTML = (name, k) => {
  if (name.startsWith('books:')) {
    const fn = BOOK_SCENES[name.slice(6)]; if (!fn) throw new Error(`story ${k}: unknown Books place "${name}" (have: ${Object.keys(BOOK_SCENES).join(', ')})`);
    const sc = fn(); const x0 = -(sc.w - 1920) / 2;
    return sc.layers.map(L => `<svg class="st-lay" data-k="${L.k || 0}" viewBox="0 0 ${sc.w} 1080" width="${sc.w}" height="1080" style="position:absolute;left:${x0}px;top:${-(L.lift || 0)}px">${L.svg}</svg>`).join('');
  }
  if (!PLACES[name]) throw new Error(`story ${k}: unknown place "${name}" (have: ${Object.keys(PLACES).join(', ')}, books:<${Object.keys(BOOK_SCENES).join('|')}>)`);
  return `<svg class="st-lay" data-k="0" viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${PLACES[name]()}</svg>`;
};

/* ---------------- cast: standing Léa / Mathieu (same heads as at the table), or a Books paper puppet ---------------- */
// local coords: feet at (0,0), facing right, ~560 px tall. Front hand at (60,-232) holds props.
const HEADS = {
  mat: `<path d="M140 112 C140 80 172 68 204 72 C238 76 250 106 248 142 C247 182 232 212 202 215 C170 218 148 198 144 170 C141 150 140 130 140 112 Z" fill="#e8b591"/>
    <ellipse cx="143" cy="152" rx="10" ry="14" fill="#dca684"/>
    <g fill="#2f2420"><circle cx="150" cy="98" r="22"/><circle cx="172" cy="78" r="24"/><circle cx="202" cy="70" r="24"/><circle cx="230" cy="80" r="21"/><circle cx="246" cy="102" r="15"/><circle cx="138" cy="124" r="15"/><circle cx="188" cy="92" r="20"/></g>
    <circle cx="228" cy="176" r="10" fill="#e08a74" opacity=".45"/>`,
  matFront: `<g stroke="#3a2a24" stroke-width="3.5" fill="none"><circle cx="187" cy="147" r="16"/><circle cx="228" cy="145" r="14"/><path d="M203 146 q6 -5 11 -1 M171 147 L148 142"/></g>
    <path d="M241 150 C252 163 250 171 238 172" stroke="#c4886a" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
  leaBack: `<path d="M112 140 C104 82 150 56 192 58 C242 60 266 102 258 152 C264 188 256 218 238 230 C222 238 206 230 200 222 L152 222 C136 234 112 230 106 206 C100 186 115 166 112 140 Z" fill="#6b3a26"/>`,
  lea: `<path d="M140 115 C140 82 172 70 202 74 C236 79 250 108 247 145 C245 185 228 210 200 213 C172 216 150 198 145 172 C141 155 140 135 140 115 Z" fill="#f2c6a2"/>
    <ellipse cx="143" cy="154" rx="9" ry="13" fill="#e8b08e"/>
    <circle cx="228" cy="174" r="11" fill="#e8907e" opacity=".5"/><circle cx="168" cy="174" r="9" fill="#e8907e" opacity=".45"/>`,
  leaFront: `<path d="M240 150 C250 162 248 170 237 171" stroke="#cf8d72" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path d="M138 128 C144 84 190 62 232 78 C250 86 258 106 256 122 C240 102 214 94 194 100 C174 106 158 118 138 134 Z" fill="#6b3a26"/>`,
};
// face variants (shared eye / mouth spots): toggled by the "face" beat
const FACE = (ink, lip) => `
  <g class="f-brow"><path d="M175 129 q11 -5 22 0 M216 127 q9 -4 18 0" stroke="${ink}" stroke-width="5" stroke-linecap="round" fill="none"/></g>
  <g class="f-browup" opacity="0"><path d="M175 120 q11 -8 22 -2 M216 118 q9 -7 18 -1" stroke="${ink}" stroke-width="5" stroke-linecap="round" fill="none"/></g>
  <g class="f-browsad" opacity="0"><path d="M175 124 q11 6 22 4 M216 128 q9 -6 18 -6" stroke="${ink}" stroke-width="5" stroke-linecap="round" fill="none"/></g>
  <g class="f-eyes"><ellipse cx="187" cy="147" rx="4.5" ry="6" fill="${ink}"/><ellipse cx="227" cy="145" rx="4" ry="5.5" fill="${ink}"/></g>
  <g class="f-star" opacity="0">${[[187, 147], [227, 145]].map(([x, y]) => `<path d="M${x} ${y - 11} l3.5 7.5 l8 1 l-6 5.5 l1.8 8 l-7.3 -4 l-7.3 4 l1.8 -8 l-6 -5.5 l8 -1Z" fill="#f3c96b" stroke="#b8552a" stroke-width="1.5"/>`).join('')}</g>
  <g class="f-happy" opacity="0" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none"><path d="M180 150 q7 -9 14 0 M221 148 q6 -8 12 0"/></g>
  <g class="f-tired" opacity="0" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M179 149 q8 4 16 0 M220 147 q7 4 14 0"/><path d="M180 160 q7 3 14 0 M221 158 q6 3 12 0" stroke="#9a7a8a" stroke-width="3" opacity=".6"/></g>
  <path class="f-smile" d="M202 188 q12 10 24 -1" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path class="f-grin" opacity="0" d="M200 186 q14 18 28 -1 Z" fill="${lip}"/>
  <path class="f-flat" opacity="0" d="M204 194 q10 -3 20 0" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse class="f-o" opacity="0" cx="214" cy="194" rx="7" ry="9" fill="${lip}"/>
  <path class="f-frown" opacity="0" d="M203 198 q11 -9 22 0" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
const FACES = {   // which variant groups are on
  normal: ['f-brow', 'f-eyes', 'f-smile'], star: ['f-browup', 'f-star', 'f-grin'], happy: ['f-browup', 'f-happy', 'f-grin'],
  tired: ['f-browsad', 'f-tired', 'f-flat'], flat: ['f-brow', 'f-eyes', 'f-flat'], wow: ['f-browup', 'f-eyes', 'f-o'], sad: ['f-browsad', 'f-eyes', 'f-frown'],
};
const ALL_F = ['f-brow', 'f-browup', 'f-browsad', 'f-eyes', 'f-star', 'f-happy', 'f-tired', 'f-smile', 'f-grin', 'f-flat', 'f-o', 'f-frown'];
const PROPS = {
  guitar: arm => `<path d="M-36 -300 C-60 -250 -40 -220 20 -230 C80 -240 150 -290 196 -316" stroke="${arm}" stroke-width="30" fill="none" stroke-linecap="round"/><circle cx="198" cy="-318" r="16" fill="#e8b591"/>
    <path d="M40 -250 L238 -342" stroke="#6b4a36" stroke-width="20" stroke-linecap="round"/><path d="M232 -350 l26 -12 l8 16 l-26 12Z" fill="#5a3a28"/>
    <g transform="rotate(-25 20 -230)"><ellipse cx="-30" cy="-230" rx="62" ry="56" fill="#d9774b" stroke="#9a4a26" stroke-width="5"/><ellipse cx="44" cy="-230" rx="50" ry="44" fill="#d9774b" stroke="#9a4a26" stroke-width="5"/><ellipse cx="44" cy="-230" rx="45" ry="39" fill="#d9774b"/><ellipse cx="-30" cy="-230" rx="57" ry="51" fill="#d9774b"/>
     <circle cx="16" cy="-230" r="17" fill="#3a2620"/><rect x="-58" y="-244" width="10" height="28" rx="3" fill="#6b4a36"/></g><path d="M-50 -210 L236 -344" stroke="#fff6e0" stroke-width="1.5" opacity=".8"/>`,
  book: () => `<g transform="translate(78 -262) rotate(-10)"><path d="M-50 0 L0 10 L50 0 L50 -60 L0 -50 L-50 -60Z" fill="#fffaf0" stroke="#8a5e42" stroke-width="4"/><path d="M0 10 V-50" stroke="#8a5e42" stroke-width="3"/>${[0, 1, 2].map(i => `<path d="M-40 ${-42 + i * 12} l30 5 M10 ${-37 + i * 12} l30 -5" stroke="#c9b48e" stroke-width="3"/>`).join('')}<path d="M-54 2 L0 14 L54 2" stroke="#b8552a" stroke-width="6" fill="none"/></g>`,
  phone: () => `<g transform="translate(70 -262) rotate(12)"><rect x="-20" y="-38" width="40" height="72" rx="8" fill="#3a3a48"/><rect x="-15" y="-31" width="30" height="54" rx="4" fill="#9cc0d8"/></g>`,
  cup: () => `<g transform="translate(74 -250)"><rect x="-20" y="-40" width="40" height="44" rx="8" fill="#d9774b"/><path d="M20 -30 c16 0 16 22 0 22" stroke="#d9774b" stroke-width="6" fill="none"/><path class="st-steam" d="M-8 -50 c-10 -14 10 -22 0 -36 M8 -50 c-10 -14 10 -22 0 -36" stroke="#c9b48e" stroke-width="4" fill="none"/></g>`,
  papers: () => `<g transform="translate(80 -250) rotate(-8)">${[0, 1, 2].map(i => `<rect x="${-40 + i * 4}" y="${-60 - i * 6}" width="80" height="100" rx="3" fill="#fffaf0" stroke="#c9b48e" stroke-width="3"/>`).join('')}${[0, 1, 2, 3].map(i => `<path d="M-24 ${-60 + i * 16} h56" stroke="#c9b48e" stroke-width="3"/>`).join('')}</g>`,
  laptop: () => `<g transform="translate(82 -236)"><path d="M-60 0 H60 L50 -10 H-50Z" fill="#5a5a68"/><path d="M-46 -10 L-38 -86 H42 L50 -10Z" fill="#3a3a48"/><path d="M-36 -18 L-30 -78 H36 L42 -18Z" fill="#9cc0d8"/></g>`,
};
// index of the word to marker-highlight ("mark": word text or index) in a title/text beat, -1 if none
const markIdx = (words, m) => { if (m === undefined) return -1; if (typeof m === 'number') return m;
  const nw = x => x.toLowerCase().replace(/[^a-zà-ÿœæç0-9']/g, ''); const i = words.findIndex(w => nw(w).includes(nw(m))); if (i < 0) throw new Error(`mark "${m}" not in "${words.join(' ')}"`); return i; };
function castSVG(c, ctx, k) {
  const flip = c.flip ? -1 : 1, s = c.s ?? 1.12, x = c.x;
  const id = `st${k}c${c.id}`;
  if (c.who === 'person') return `<g transform="translate(${x} 800) scale(${flip * s * 1.6} ${s * 1.6})"><g id="${id}"><g class="mv"><g class="bob"><g filter="${P}">${PERSON(c.o || {})}</g></g></g></g></g>`;
  const o = (c.who === 'lea' ? ctx.OUT_LEA : ctx.OUT_MAT)[c.who === 'lea' ? ctx.lea : ctx.mat] || {};
  const top = c.outfit || o.top || '#8fae8b', arm = c.outfit || o.arm || top, legs = c.legs || (c.who === 'lea' ? '#3f4e6b' : '#4a5a78');
  const skin = c.who === 'lea' ? '#f2c6a2' : '#e8b591', ink = c.who === 'lea' ? '#3a2a24' : '#2f2420', lip = c.who === 'lea' ? '#8a3a2c' : '#7a3328';
  const prop = Object.keys(PROPS).map(p => `<g class="pr-${p}" opacity="0">${PROPS[p](arm)}</g>`).join('');
  return `<g transform="translate(${x} 800) scale(${flip * s} ${s})"><g id="${id}"><g class="mv"><g class="bob"><g filter="${P}">
  <path d="M-34 -150 L-40 -6 H-6 L0 -120 L6 -6 H40 L34 -150Z" fill="${legs}"/>
  <ellipse cx="-24" cy="-4" rx="24" ry="10" fill="#3a2e28"/><ellipse cx="26" cy="-4" rx="24" ry="10" fill="#3a2e28"/>
  <path d="M-30 -320 C-56 -280 -60 -230 -54 -186" stroke="${arm}" stroke-width="28" fill="none" stroke-linecap="round"/><path d="M-30 -320 C-56 -280 -60 -230 -54 -186" stroke="#000" stroke-opacity=".15" stroke-width="28" fill="none" stroke-linecap="round"/><circle cx="-54" cy="-180" r="14" fill="${skin}"/>
  <path d="M-58 -150 C-66 -230 -60 -300 -40 -330 C-10 -350 40 -350 62 -330 C78 -300 80 -230 70 -150Z" fill="${top}"/>
  <path d="M62 -330 C78 -300 80 -230 70 -150 L52 -150 C60 -220 62 -280 62 -330Z" fill="#000" opacity=".12"/>
  <rect x="-12" y="-362" width="26" height="30" rx="9" fill="${c.who === 'lea' ? '#e2a988' : '#d9a07c'}"/>
  <g class="hd"><g transform="translate(-195 -566)">${c.who === 'lea' ? HEADS.leaBack + HEADS.lea : HEADS.mat}${FACE(ink, lip)}${c.who === 'lea' ? HEADS.leaFront : HEADS.matFront}</g></g>
  <g class="props">${prop}</g>
  <g class="aDown"><path d="M44 -320 C66 -280 70 -230 62 -186" stroke="${arm}" stroke-width="28" fill="none" stroke-linecap="round"/><circle cx="62" cy="-180" r="14" fill="${skin}"/></g>
  <g class="aUp" opacity="0"><path d="M40 -310 C70 -280 72 -250 56 -234" stroke="${arm}" stroke-width="28" fill="none" stroke-linecap="round"/><circle cx="58" cy="-232" r="15" fill="${skin}"/>
   <g class="band" opacity="0"><rect x="44" y="-242" width="28" height="11" rx="4" fill="#fff6e0" stroke="#c9a77c" stroke-width="2"/></g></g>
  </g></g></g></g></g>`;
}

/* ---------------- mini map of France (lon/lat → px in a 620×620 box) ---------------- */
const MX = lon => 20 + (lon + 5.2) / 15 * 580, MY = lat => 20 + (51.3 - lat) / 9.4 * 580;
const FR = [[2.4, 51.05], [4.2, 50.1], [5.8, 49.5], [8.2, 49.0], [7.6, 47.6], [6.1, 46.3], [7.0, 45.9], [6.9, 44.4], [7.5, 43.8], [5.9, 43.1], [4.5, 43.4], [3.1, 42.5], [1.7, 42.5], [-1.8, 43.4], [-1.2, 44.6], [-1.2, 46.2], [-2.2, 47.2], [-4.4, 47.9], [-4.8, 48.4], [-3.0, 48.8], [-1.6, 48.6], [-1.9, 49.7], [-1.2, 49.3], [0.1, 49.5], [1.6, 50.2]];
export const CITIES = {
  Paris: [2.35, 48.86], Lyon: [4.84, 45.76], Marseille: [5.37, 43.3], Bordeaux: [-0.58, 44.84], Lille: [3.06, 50.63], Strasbourg: [7.75, 48.58], Nantes: [-1.55, 47.22],
  Nice: [7.27, 43.7], Toulouse: [1.44, 43.6], Rennes: [-1.68, 48.11], Brest: [-4.49, 48.39], Montpellier: [3.88, 43.61], Grenoble: [5.72, 45.19], Annecy: [6.13, 45.9],
  Avignon: [4.8, 43.95], Caen: [-0.37, 49.18], Biarritz: [-1.56, 43.48], 'Mont-Saint-Michel': [-1.51, 48.64], Tours: [0.69, 47.39], Dijon: [5.04, 47.32], Reims: [4.03, 49.26],
  Chamonix: [6.87, 45.92], 'La Rochelle': [-1.15, 46.16], Ajaccio: [8.74, 41.93], Bastia: [9.45, 42.7], Provence: [5.45, 43.75], Bretagne: [-2.8, 48.2], Normandie: [0.0, 49.2], Alsace: [7.4, 48.3],
};
const FR_PATH = 'M' + FR.map(([a, b]) => `${MX(a).toFixed(0)} ${MY(b).toFixed(0)}`).join(' L') + 'Z';
const CORSE = `M${MX(9.4).toFixed(0)} ${MY(43.0).toFixed(0)} L${MX(9.55).toFixed(0)} ${MY(42.1).toFixed(0)} L${MX(9.2).toFixed(0)} ${MY(41.4).toFixed(0)} L${MX(8.6).toFixed(0)} ${MY(41.9).toFixed(0)} L${MX(8.7).toFixed(0)} ${MY(42.6).toFixed(0)}Z`;

/* ---------------- beats ---------------- */
// cast:   face {on, face: normal|star|happy|tired|flat|wow|sad} · hold {on, prop: guitar|book|phone|cup|papers|laptop} · drop {on}
//         bob {on, d} happy bounce · work {on, d} arm motion (strum, write…) · walk {on, to: x, d} · droop {on} head down · band {on} plaster on the hand
//         enter {on, from: left|right} · exit {on, to: left|right}
//         say {on, text} speech bubble · whisper {on, text} the "little voice" (small creature by the head) · zzz {on}
// text:   title {text, sub?, x?, y?} big title, words pop + hand underline · text {text, x?, y?, size?, color?} words appear one by one (with "d")
//         note {text, x, y, rot?, color?} sticky note · stamp {text, x, y, color?} rubber stamp
// things: icons {items: [{icon, label?, c?, w?}], y?} row of badges (demo ILLUS names, "b:<books icon>", or a character)
//         list {title?, items: [{text, icon?, c?, w?}], x?, y?} checklist, ticks drawn · vs {left: {icon, label}, right: {…}, mid?: "≠"} two sides
//         map {pins: [{city, label?, c?, w?}], route?: true, title?, x?, y?, s?} mini map of France, pins drop, route draws
//         calendar {labels: [...], x, y, d} pages tear off · count {labels: [...], x, y, d} big number ticks up · clock {x, y, d, turns?} hands spin
//         bars {title?, items: [{label, v (0–100)}], x?, y?} bars grow · battery {from, to, x, y, d, label?} energy drains / fills
//         dream {icon | icons: [...], label?, x?, y?} thought bubble · heart {label?, x, y, broken?: true} · burst {icons?: ["♪","♥","★"], on? | x,y}
//         pile {n, x?, y?, d} papers stack up · sky {d} sun/moon crosses the window (chambre, bureau, cuisine) · hide {ids: [...]}
// hand-drawn (rough.js, drawn on): arrow {from: [x,y], to: [x,y], bend?, color?} · circle {x, y, rx?, ry?, label?} loop around something
//         underline {x, y, width} squiggle · write {text, x, y, size?} handwriting (Caveat) letter by letter · draw {icon, x, y, size?, label?} one drawing traced
//         title/text {mark: "word"} = marker highlight swept behind that word
// boards: flap {lines: ["PARIS 08:15", …], title?} split-flap departure board · wheel {value: "1 000", label?, size?, d?} rolling digits
// Icons everywhere: demo ILLUS names · "b:<books icon>" · "x:<drawing>" from data/excalidraw/names.json (emoji faces e-*, 
//         objects: laptop smartphone clock calendar mail home basket alarm bell pencil letter parcel microphone headphones flag target…) · or a character.
// Every drawing is traced (drawn on) when it appears; boxes have rough.js sketchy frames and "boil" (re-pose by ~1 px every 0.1 s).
export const BEATS = ['face', 'hold', 'drop', 'bob', 'work', 'walk', 'droop', 'band', 'enter', 'exit', 'say', 'whisper', 'zzz', 'title', 'text', 'note', 'stamp',
  'icons', 'list', 'vs', 'map', 'calendar', 'count', 'clock', 'bars', 'battery', 'dream', 'heart', 'burst', 'pile', 'sky', 'hide',
  'arrow', 'circle', 'underline', 'write', 'draw', 'flap', 'wheel'];


// ctx: { chunks, ILLUS, OUT_LEA, OUT_MAT, lea, mat }
export function buildStories(list, ctx) {
  if (!list || !list.length) return { html: '', css: '', js: '', sfx: [], wins: [] };
  const { chunks, ILLUS } = ctx;
  const sfx = [], wins = [];
  const wordT = (k, b, where) => {
    const ci = b.c ?? list[k].c[0], ch = chunks[ci]; if (!ch) throw new Error(`${where}: no chunk ${ci}`);
    if (b.w === undefined) return ch.s;
    if (typeof b.w === 'number') { if (!ch.toks[b.w]) throw new Error(`${where}: chunk ${ci} has no word #${b.w}`); return ch.toks[b.w].s; }
    const nw = s => s.toLowerCase().replace(/[^a-zà-ÿœæç0-9']/g, '');
    const i = ch.toks.findIndex(t => nw(t.t).includes(nw(b.w))); if (i < 0) throw new Error(`${where}: word "${b.w}" not in chunk ${ci}: ${ch.toks.map(t => t.t).join(' ')}`);
    return ch.toks[i].s;
  };
  let html = '', js = '', usesCaveat = false; const boils = [];
  list.forEach((st, k) => {
    const where0 = `story ${k}`;
    if (!Array.isArray(st.c) || st.c.length !== 2 || !chunks[st.c[0]] || !chunks[st.c[1]] || st.c[1] < st.c[0]) throw new Error(`${where0}: "c" must be [first chunk, last chunk]`);
    const IN = +(chunks[st.c[0]].s - 0.15).toFixed(3), OUT = +(chunks[st.c[1]].e + 0.2).toFixed(3);
    wins.push({ s: IN, e: OUT, k });
    const cast = st.cast || [];
    cast.forEach((c, i) => { if (c.x === undefined) c.x = cast.length === 1 ? 760 : [620, 1240, 940][i] ?? 940; });
    const castIds = new Set(cast.map(c => c.id));
    const R = `#st${k}`;
    let fx = '', svgFx = '', code = '';
    const at = b => R2(wordT(k, b, `${where0} beat ${b.do}`));
    const endOf = b => b.until ? R2(wordT(k, b.until, `${where0} beat ${b.do} until`)) : null;
    const cs = on => { if (!castIds.has(on)) throw new Error(`${where0}: beat needs "on" = a cast id (${[...castIds].join(', ') || 'no cast'})`); return `${R}c${on}`; };
    const castX = on => cast.find(c => c.id === on).x;
    const armed = (on, what) => { const c = cast.find(c => c.id === on); if (c && !['lea', 'mat'].includes(c.who)) throw new Error(`${where0}: "${what}" needs Léa or Mathieu (cast "${on}" is ${c.who})`); };
    // initial state
    code += `tl.set('${R}',{opacity:0},0);`;
    cast.forEach(c => { const C = `${R}c${c.id}`;
      if (c.who !== 'person') { code += `tl.set('${C} .aUp',{svgOrigin:'40 -310'},0);tl.set('${C} .hd',{svgOrigin:'0 -340'},0);`; code += faceCode(C, c.face || 'normal', 0); }
    });
    (st.beats || []).forEach((b, j) => {
      const where = `${where0} beat ${j} (${b.do})`; if (!BEATS.includes(b.do)) throw new Error(`${where}: unknown beat (have: ${BEATS.join(', ')})`);
      const t = +at(b), id = `st${k}b${j}_`, d = b.d ?? 2, end = endOf(b);
      if (b.id) b._el = id;
      const box = (inner, x, y, cls = '') => { fx += `<div class="st-box ${cls}" style="left:${x}px;top:${y}px"><div class="st-bo"><div id="${id}" class="st-in">${inner}</div></div></div>`; return inner; };
      const popIn = (sel = `#${id}`, dt = t) => { code += `tl.fromTo('${sel}',{opacity:0,scale:.3,y:24},{opacity:1,scale:1,y:0,duration:.45,ease:'back.out(2)',immediateRender:false},${R2(dt)});`; };
      const out = (sel = `#${id}`) => { if (end) code += `tl.to('${sel}',{opacity:0,duration:.35,immediateRender:false},${end});`; };
      switch (b.do) {
        case 'face': code += faceCode(cs(b.on), b.face, t); break;
        case 'hold': { armed(b.on, 'hold'); const C = cs(b.on); if (!PROPS[b.prop]) throw new Error(`${where}: prop ${b.prop} (have: ${Object.keys(PROPS).join(', ')})`);
          code += `tl.set('${C} .aDown',{opacity:0},${t});tl.set('${C} .aUp',{opacity:1},${t});tl.fromTo('${C} .pr-${b.prop}',{opacity:0,y:-200},{opacity:1,y:0,duration:.5,ease:'back.out(1.4)',immediateRender:false},${t});`;
          sfx.push({ t, k: 'thud' }, { t: t + 0.3, k: 'pop' }); break; }
        case 'drop': { const C = cs(b.on); code += `tl.to('${C} .props > g',{opacity:0,duration:.25,immediateRender:false},${t});tl.set('${C} .aDown',{opacity:1},${t + .25});tl.set('${C} .aUp',{opacity:0},${t + .25});`; break; }
        case 'bob': code += `tl.fromTo('${cs(b.on)} .bob',{y:0},{y:-18,duration:.25,yoyo:true,repeat:${Math.max(1, Math.round(d / .25) - 1) | 1},ease:'sine.inOut',immediateRender:false},${t});`; break;
        case 'work': { armed(b.on, 'work'); const C = cs(b.on); code += `tl.set('${C} .aDown',{opacity:0},${t});tl.set('${C} .aUp',{opacity:1},${t});tl.fromTo('${C} .aUp',{rotation:-8},{rotation:10,duration:.2,yoyo:true,repeat:${Math.max(1, Math.round(d / .2) - 1) | 1},ease:'sine.inOut',immediateRender:false},${t});`; break; }
        case 'walk': { const C = cs(b.on), dx = (b.to - castX(b.on)) / (cast.find(c => c.id === b.on).s ?? 1.12);
          code += `tl.to('${C} .mv',{x:${R2(dx)},duration:${d},ease:'power1.inOut',immediateRender:false},${t});tl.fromTo('${C} .bob',{y:0},{y:-12,duration:.2,yoyo:true,repeat:${Math.max(1, Math.round(d / .2) - 1) | 1},ease:'sine.inOut',immediateRender:false},${t});`;
          sfx.push(...Array.from({ length: Math.floor(d / .4) }, (_, i) => ({ t: t + i * .4, k: 'tap' }))); break; }
        case 'droop': code += `tl.to('${cs(b.on)} .hd',{rotation:9,duration:.6,immediateRender:false},${t});`; break;
        case 'band': armed(b.on, 'band'); code += `tl.set('${cs(b.on)} .band',{opacity:1},${t});`; break;
        case 'enter': { const C = cs(b.on); code += `tl.fromTo('${C} .mv',{x:${b.from === 'right' ? 1400 : -1400}},{x:0,duration:${b.d ?? 1.2},ease:'power2.out',immediateRender:false},${t});tl.set('${C} .mv',{x:${b.from === 'right' ? 1400 : -1400}},0);`; sfx.push({ t, k: 'swish' }); break; }
        case 'exit': code += `tl.to('${cs(b.on)} .mv',{x:${b.to === 'left' ? -1400 : 1400},duration:${b.d ?? 1},ease:'power2.in',immediateRender:false},${t});`; sfx.push({ t, k: 'swish' }); break;
        case 'say': case 'whisper': {
          const x = b.x ?? castX(b.on) + (b.do === 'say' ? 230 : 250), y = b.y ?? 170;
          const creature = b.do === 'whisper' ? `<svg class="st-imp" viewBox="-60 -60 120 120" width="110" height="110"><g filter="${P}"><path d="M-40 10 C-50 -30 -20 -50 0 -50 C24 -50 50 -30 40 10 C34 40 -34 40 -40 10Z" fill="#b9a6d6"/><path d="M-26 -42 l-8 -16 l18 8 M26 -42 l8 -16 l-18 8" fill="#9a86c0"/><circle cx="-12" cy="-8" r="5" fill="#3a2e28"/><circle cx="14" cy="-8" r="5" fill="#3a2e28"/><path d="M-12 12 q12 10 24 0" stroke="#3a2e28" stroke-width="4" fill="none" stroke-linecap="round"/></g></svg>` : '';
          box(`${creature}<div class="st-say ${b.do}">${rframe('#fffaf0', b.do === 'whisper' ? { stroke: '#7a66a0', strokeLineDash: [10, 8] } : {})}${esc(b.text)}</div>`, x, y);
          popIn(); out(); sfx.push({ t, k: b.do === 'say' ? 'pop' : 'rise' });
          if (b.do === 'whisper') code += `tl.fromTo('#${id} .st-imp',{y:0},{y:-10,duration:.5,yoyo:true,repeat:${Math.max(1, Math.round(((end ? +end : OUT) - t) / .5)) | 1},ease:'sine.inOut',immediateRender:false},${t});`;
          break; }
        case 'zzz': { const x = castX(b.on) + 80; [0, 1, 2].forEach(i => { svgFx += `<text class="st-z" id="${id}z${i}" x="${x + i * 50}" y="${380 - i * 50}" font-family="Nunito" font-weight="800" font-size="${40 + i * 12}" fill="#5b7398" opacity="0">z</text>`;
            code += `tl.fromTo('#${id}z${i}',{opacity:0,y:0},{opacity:1,y:-40,duration:.8,repeat:${Math.max(0, Math.round(d / 1.2) - 1)},repeatDelay:.4,immediateRender:false},${R2(t + i * .35)});tl.set('#${id}z${i}',{opacity:0},${R2(t + d + i * .35 + .8)});`; }); break; }
        case 'title': { const words = String(b.text).split(/\s+/), mk = markIdx(words, b.mark);
          box(`<div class="st-title">${words.map((w, i) => `<span class="st-w" id="${id}w${i}">${i === mk ? `<i class="st-mk" id="${id}mk"></i>` : ''}${esc(w)}</span>`).join(' ')}</div>
            <svg class="st-ul" viewBox="0 0 600 30" width="600" height="30"><path id="${id}u" d="M10 18 C150 6 300 26 590 10" pathLength="1" stroke="#d9774b" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
            ${b.sub ? `<div class="st-sub" id="${id}s">${esc(b.sub)}</div>` : ''}`, b.x ?? 960, b.y ?? 380);
          code += `tl.set('#${id}',{opacity:1},${t});`;
          words.forEach((_, i) => code += `tl.fromTo('#${id}w${i}',{opacity:0,y:40,rotation:-6},{opacity:1,y:0,rotation:0,duration:.4,ease:'back.out(2)',immediateRender:false},${R2(t + i * .16)});`);
          code += `tl.fromTo('#${id}u',{strokeDashoffset:1},{strokeDashoffset:0,duration:.6,ease:'power2.out',immediateRender:false},${R2(t + words.length * .16)});`;
          if (b.sub) code += `tl.fromTo('#${id}s',{opacity:0,y:20},{opacity:1,y:0,duration:.4,immediateRender:false},${R2(t + words.length * .16 + .4)});`;
          if (mk >= 0) { code += `tl.fromTo('#${id}mk',{scaleX:0},{scaleX:1,duration:.45,ease:'power2.out',immediateRender:false},${R2(t + words.length * .16 + .5)});`; sfx.push({ t: t + words.length * .16 + .5, k: 'scribble' }); }
          out(); sfx.push({ t, k: 'swish' }, { t: t + words.length * .16, k: 'scribble' }); break; }
        case 'text': { const words = String(b.text).split(/\s+/), step = Math.min(.3, (b.d ?? words.length * .2) / words.length), mk = markIdx(words, b.mark);
          box(`<div class="st-text" style="font-size:${b.size ?? 64}px;color:${b.color ?? '#3a2e28'}">${words.map((w, i) => `<span class="st-w" id="${id}w${i}">${i === mk ? `<i class="st-mk" id="${id}mk"></i>` : ''}${esc(w)}</span>`).join(' ')}</div>`, b.x ?? 960, b.y ?? 400);
          if (mk >= 0) { code += `tl.fromTo('#${id}mk',{scaleX:0},{scaleX:1,duration:.45,ease:'power2.out',immediateRender:false},${R2(t + words.length * step + .3)});`; sfx.push({ t: t + words.length * step + .3, k: 'scribble' }); }
          code += `tl.set('#${id}',{opacity:1},${t});`;
          words.forEach((_, i) => code += `tl.fromTo('#${id}w${i}',{opacity:0,y:24},{opacity:1,y:0,duration:.3,ease:'power2.out',immediateRender:false},${R2(t + i * step)});`);
          out(); sfx.push({ t, k: 'tap' }); break; }
        case 'note': box(`<div class="st-note" style="transform:rotate(${b.rot ?? -4}deg)">${rframe(b.color ?? '#f3c96b', { strokeWidth: 2.5 })}<i></i>${esc(b.text)}</div>`, b.x ?? 1400, b.y ?? 300); popIn(); out(); sfx.push({ t, k: 'card' }); break;
        case 'stamp': box(`<div class="st-stamp" style="color:${b.color ?? '#b8552a'}">${rframe('rgba(255,250,240,.6)', { stroke: b.color ?? '#b8552a', strokeWidth: 6, roughness: 1.8 })}${esc(b.text)}</div>`, b.x ?? 960, b.y ?? 420);
          code += `tl.fromTo('#${id}',{opacity:0,scale:2.4,rotation:-14},{opacity:1,scale:1,rotation:-7,duration:.28,ease:'power3.in',immediateRender:false},${t});`; out(); sfx.push({ t: t + .25, k: 'stamp' }); break;
        case 'icons': { const n = b.items.length, gap = Math.min(330, 1500 / n), x0 = 960 - gap * (n - 1) / 2;
          b.items.forEach((it, i) => { const ti = it.c !== undefined || it.w !== undefined ? +R2(wordT(k, { c: it.c ?? b.c, w: it.w }, where)) : t + i * .45;
            const ih = iconSVG(ILLUS, it.icon, 170);
            fx += `<div class="st-box" style="left:${x0 + i * gap}px;top:${(b.y ?? 380) + (i % 2 ? -30 : 20)}px"><div class="st-bo"><div id="${id}i${i}" class="st-in st-badge">${rframe()}${ih}${it.label ? `<div>${esc(it.label)}</div>` : ''}</div></div></div>`;
            popIn(`#${id}i${i}`, ti); code += drawCode(`#${id}i${i}`, ti + .15, ih); sfx.push({ t: ti, k: 'pop' }); if (end) code += `tl.to('#${id}i${i}',{opacity:0,duration:.3,immediateRender:false},${end});`; }); break; }
        case 'list': {
          const lis = b.items.map((it, i) => `<div class="st-li" id="${id}l${i}"><svg viewBox="0 0 40 40" width="44" height="44">${rpaths(RG.rectangle(4, 4, 32, 32, ro({ strokeWidth: 2.5, fill: '#fffaf0', fillStyle: 'solid' })))}<path id="${id}k${i}" d="M9 21 l8 8 l15 -18" stroke="#b8552a" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1" pathLength="1"/></svg>${it.icon ? `<span class="st-lic">${iconSVG(ILLUS, it.icon, 70)}</span>` : ''}<span>${esc(it.text)}</span></div>`);
          fx += `<div class="st-box" style="left:${b.x ?? 960}px;top:${b.y ?? 380}px"><div class="st-bo"><div id="${id}" class="st-in st-list">${rframe()}${b.title ? `<h3>${esc(b.title)}</h3>` : ''}${lis.join('')}</div></div></div>`;
          code += `tl.fromTo('#${id}',{opacity:0,y:30},{opacity:1,y:0,duration:.4,immediateRender:false},${t});`;
          b.items.forEach((it, i) => { const ti = it.c !== undefined || it.w !== undefined ? +R2(wordT(k, { c: it.c ?? b.c, w: it.w }, where)) : t + .3 + i * .6;
            code += `tl.fromTo('#${id}l${i}',{opacity:0,x:-40},{opacity:1,x:0,duration:.35,immediateRender:false},${R2(ti)});tl.fromTo('#${id}k${i}',{strokeDashoffset:1},{strokeDashoffset:0,duration:.3,immediateRender:false},${R2(ti + .3)});`;
            if (it.icon) code += drawCode(`#${id}l${i} .st-lic`, ti, iconSVG(ILLUS, it.icon, 70));
            sfx.push({ t: ti, k: 'tap' }, { t: ti + .3, k: 'tick' }); });
          out(); break; }
        case 'vs': { const side = (o, cl) => `<div class="st-vs ${cl}">${rframe(cl === 'r' ? '#fbe7d8' : '#fffaf0')}${iconSVG(ILLUS, o.icon, 200)}<div>${esc(o.label || '')}</div></div>`;
          box(`<div class="st-vsrow">${side(b.left, 'l')}<div class="st-vsmid">${esc(b.mid ?? '≠')}</div>${side(b.right, 'r')}</div>`, b.x ?? 960, b.y ?? 400);
          const tr = b.right.c !== undefined || b.right.w !== undefined ? +R2(wordT(k, { c: b.right.c ?? b.c, w: b.right.w }, where)) : t + 1.2;
          code += `tl.set('#${id}',{opacity:1},${t});tl.fromTo('#${id} .l',{opacity:0,x:-120},{opacity:1,x:0,duration:.45,ease:'back.out(1.6)',immediateRender:false},${t});`
            + `tl.fromTo('#${id} .st-vsmid',{opacity:0,scale:3},{opacity:1,scale:1,duration:.3,immediateRender:false},${R2(tr - .3)});tl.fromTo('#${id} .r',{opacity:0,x:120},{opacity:1,x:0,duration:.45,ease:'back.out(1.6)',immediateRender:false},${R2(tr)});`;
          code += drawCode(`#${id} .l`, t + .1, iconSVG(ILLUS, b.left.icon, 200)) + drawCode(`#${id} .r`, tr + .1, iconSVG(ILLUS, b.right.icon, 200));
          out(); sfx.push({ t, k: 'swish' }, { t: tr - .3, k: 'stamp' }, { t: tr, k: 'swish' }); break; }
        case 'map': { const s = b.s ?? .9, X = b.x ?? 960, Y = b.y ?? 400;
          const pins = b.pins.map(p => { const ll = CITIES[p.city]; if (!ll) throw new Error(`${where}: unknown city "${p.city}" (have: ${Object.keys(CITIES).join(', ')})`); return { ...p, x: MX(ll[0]), y: MY(ll[1]) }; });
          const route = pins.length > 1 && b.route !== false ? `M${pins.map(p => `${p.x.toFixed(0)} ${p.y.toFixed(0)}`).join(' L')}` : '';
          box(`<svg viewBox="0 0 640 640" width="${640 * s}" height="${640 * s}"><g filter="${P}"><path d="${FR_PATH}" fill="#c9dcb4" stroke="#6f8e6b" stroke-width="5" stroke-linejoin="round"/><path d="${CORSE}" fill="#c9dcb4" stroke="#6f8e6b" stroke-width="4"/>
            ${route ? `<path id="${id}r" d="${route}" pathLength="1" stroke="#b8552a" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>` : ''}
            ${pins.map((p, i) => `<g transform="translate(${p.x.toFixed(0)} ${p.y.toFixed(0)})"><g id="${id}p${i}" opacity="0"><path d="M0 0 C-14 -20 -18 -30 -18 -40 A18 18 0 1 1 18 -40 C18 -30 14 -20 0 0Z" fill="#d9774b" stroke="#8a3f2a" stroke-width="3"/><circle cy="-40" r="7" fill="#fffaf0"/>
              <text x="${p.x > 500 ? -24 : 24}" y="-34" text-anchor="${p.x > 500 ? 'end' : 'start'}" font-family="Nunito" font-weight="800" font-size="30" fill="#3a2e28" stroke="#f6eddc" stroke-width="6" paint-order="stroke">${esc(p.label ?? p.city)}</text></g></g>`).join('')}</g></svg>
            ${b.title ? `<div class="st-maptitle">${esc(b.title)}</div>` : ''}`, X, Y);
          code += `tl.fromTo('#${id}',{opacity:0,scale:.6,rotation:-6},{opacity:1,scale:1,rotation:0,duration:.6,ease:'back.out(1.5)',immediateRender:false},${t});`;
          const pt = pins.map((p, i) => p.c !== undefined || p.w !== undefined ? +R2(wordT(k, { c: p.c ?? b.c, w: p.w }, where)) : t + .7 + i * .7);
          pins.forEach((p, i) => { code += `tl.fromTo('#${id}p${i}',{opacity:0,y:-60},{opacity:1,y:0,duration:.45,ease:'bounce.out',immediateRender:false},${R2(pt[i])});`; sfx.push({ t: pt[i], k: 'pop' }); });
          if (route) code += `tl.fromTo('#${id}r',{strokeDashoffset:1},{strokeDashoffset:0,duration:${R2(Math.max(.6, pt[pt.length - 1] - pt[0]))},ease:'none',immediateRender:false},${R2(pt[0] + .2)});`;
          out(); sfx.push({ t, k: 'paper' }); break; }
        case 'calendar': { const L = b.labels, x = b.x ?? 1600, y = b.y ?? 300, step = Math.min(.8, d / Math.max(1, L.length - 1));
          box(`<svg viewBox="-100 -110 200 230" width="200" height="230"><g filter="${P}"><circle cx="0" cy="-92" r="8" fill="#6b4a36"/>${L.map((l, i) => `<g id="${id}g${i}">${rpaths(RG.rectangle(-80, -80, 160, 170, ro({ fill: '#fffaf0', fillStyle: 'solid', strokeWidth: 3 })))}${rpaths(RG.rectangle(-80, -80, 160, 46, ro({ fill: '#d9774b', fillStyle: 'solid', strokeWidth: 3 })))}<text x="0" y="48" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="${l.length > 4 ? 32 : 50}" fill="#3a2e28">${esc(l)}</text></g>`).reverse().join('')}</g></svg>`, x, y);
          popIn();
          L.slice(0, -1).forEach((_, i) => { const ti = t + .5 + i * step; code += `tl.to('#${id}g${i}',{rotation:${i % 2 ? 24 : -28},y:420,x:${i % 2 ? 70 : -60},opacity:0,duration:${R2(Math.min(.6, step))},ease:'power2.in',transformOrigin:'50% 0%',immediateRender:false},${R2(ti)});`; sfx.push({ t: ti, k: 'paper' }); });
          out(); break; }
        case 'count': { const L = b.labels, step = d / L.length;
          box(`<div class="st-count">${L.map((l, i) => `<span id="${id}n${i}" style="font-size:${80 + i * 10}px">${esc(l)}</span>`).join('')}</div>`, b.x ?? 500, b.y ?? 260);
          code += `tl.set('#${id}',{opacity:1},${t});`;
          L.forEach((_, i) => { const ti = t + i * step; code += `tl.set('#${id}n${i}',{opacity:1},${R2(ti)});` + (i < L.length - 1 ? `tl.set('#${id}n${i}',{opacity:0},${R2(ti + step)});` : ''); sfx.push({ t: ti, k: 'tick' }); });
          code += `tl.set('#${id} span',{opacity:0},0);`; out(); break; }
        case 'clock': box(`<svg viewBox="-110 -110 220 220" width="240" height="240"><g filter="${P}">${rpaths(RG.circle(0, 0, 200, ro({ fill: '#fffaf0', fillStyle: 'solid', strokeWidth: 6 })))}${Array.from({ length: 12 }, (_, i) => `<path d="M0 -84 V-72" stroke="#3a2e28" stroke-width="5" transform="rotate(${i * 30})"/>`).join('')}
            <path id="${id}h" d="M0 8 V-50" stroke="#3a2e28" stroke-width="9" stroke-linecap="round"/><path id="${id}m" d="M0 10 V-76" stroke="#b8552a" stroke-width="6" stroke-linecap="round"/><circle r="8" fill="#3a2e28"/></g></svg>`, b.x ?? 1500, b.y ?? 320);
          popIn(); code += `tl.set(['#${id}h','#${id}m'],{svgOrigin:'0 0'},0);tl.fromTo('#${id}m',{rotation:0},{rotation:${360 * (b.turns ?? 6)},duration:${d},ease:'power1.inOut',immediateRender:false},${t});tl.fromTo('#${id}h',{rotation:0},{rotation:${30 * (b.turns ?? 6)},duration:${d},ease:'power1.inOut',immediateRender:false},${t});`;
          out(); sfx.push(...Array.from({ length: Math.floor(d / .5) }, (_, i) => ({ t: t + i * .5, k: 'tick' }))); break;
        case 'bars': {
          box(`<div class="st-bars">${rframe()}${b.title ? `<h3>${esc(b.title)}</h3>` : ''}<div class="st-barrow">${b.items.map((it, i) => `<div class="st-bar"><div class="st-bv" id="${id}v${i}" style="height:${Math.round(it.v * 3.2)}px">${rframe(['#d9774b', '#8fae8b', '#5b7398', '#e2a53f', '#e8907e'][i % 5], { hachure: true })}</div><span>${esc(it.label)}</span></div>`).join('')}</div></div>`, b.x ?? 960, b.y ?? 400);
          popIn(); b.items.forEach((_, i) => { code += `tl.fromTo('#${id}v${i}',{scaleY:0,transformOrigin:'50% 100%'},{scaleY:1,duration:.6,ease:'power2.out',immediateRender:false},${R2(t + .4 + i * .3)});`; sfx.push({ t: t + .4 + i * .3, k: 'rise' }); });
          out(); break; }
        case 'battery': { const from = b.from ?? 100, to = b.to ?? 10;
          box(`<div class="st-batt"><svg viewBox="0 0 260 130" width="300" height="150"><g filter="${P}">${rpaths(RG.rectangle(6, 6, 226, 118, ro({ fill: '#fffaf0', fillStyle: 'solid', strokeWidth: 6 })))}${rpaths(RG.rectangle(234, 40, 20, 50, ro({ fill: '#3a2e28', fillStyle: 'solid' })))}
            <g id="${id}f">${rpaths(RG.rectangle(22, 22, 194, 86, ro({ fill: '#6f8e6b', fillStyle: 'hachure', hachureGap: 9, fillWeight: 4, stroke: 'none' })))}</g></g></svg>${b.label ? `<div>${esc(b.label)}</div>` : ''}</div>`, b.x ?? 1500, b.y ?? 300);
          popIn();
          const cl = v => v > 50 ? '#6f8e6b' : v > 25 ? '#e2a53f' : '#d9572b';
          code += `tl.set('#${id}f',{scaleX:${from / 100},transformOrigin:'0% 50%'},0);tl.set('#${id}f path',{stroke:'${cl(from)}'},0);tl.to('#${id}f',{scaleX:${Math.max(.04, to / 100)},duration:${d},ease:'power1.inOut',immediateRender:false},${R2(t + .4)});tl.to('#${id}f path',{stroke:'${cl(to)}',duration:${d},ease:'power1.inOut',immediateRender:false},${R2(t + .4)});`;
          out(); sfx.push({ t, k: 'pop' }, { t: t + .4 + d, k: to < from ? 'buzz' : 'chime' }); break; }
        case 'dream': { const ics = b.icons || [b.icon];
          box(`<svg class="st-cloudsvg" viewBox="-300 -200 600 380" width="600" height="380"><g filter="${P}">${[[-180, 0, 110], [-60, -70, 130], [90, -60, 130], [200, 10, 110], [60, 70, 120], [-100, 70, 120]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffaf0" stroke="#c9b48e" stroke-width="4"/>`).join('')}
            ${[[-180, 0, 106], [-60, -70, 126], [90, -60, 126], [200, 10, 106], [60, 70, 116], [-100, 70, 116]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffaf0"/>`).join('')}</g></svg>
            <div class="st-dreamin">${ics.map(n => iconSVG(ILLUS, n, ics.length > 1 ? 150 : 220)).join('')}</div>${b.label ? `<div class="st-dreamlab">${esc(b.label)}</div>` : ''}`, b.x ?? 1300, b.y ?? 300);
          code += `tl.fromTo('#${id}',{opacity:0,scale:.3},{opacity:1,scale:1,duration:.6,ease:'back.out(1.5)',immediateRender:false},${t});` + drawCode(`#${id} .st-dreamin`, t + .4, ics.map(n => iconSVG(ILLUS, n, 150)).join(''));
          out(); sfx.push({ t, k: 'chime' }); break; }
        case 'heart': box(`<svg viewBox="-80 -70 160 140" width="180" height="160"><g filter="${P}"><path d="M0 50 C-70 0 -62 -56 -24 -56 C-8 -56 0 -40 0 -32 C0 -40 8 -56 24 -56 C62 -56 70 0 0 50Z" fill="#e8907e" stroke="#9a4a3a" stroke-width="4"/>
            ${b.broken !== false ? '<path d="M2 -30 L-10 -6 L8 8 L-4 34" stroke="#9a4a3a" stroke-width="5" fill="none"/><rect x="-36" y="-14" width="72" height="22" rx="6" fill="#fff6e0" stroke="#c9a77c" stroke-width="3" transform="rotate(-20)"/>' : ''}</g></svg>${b.label ? `<div class="st-lab">${esc(b.label)}</div>` : ''}`, b.x ?? 1110, b.y ?? 330);
          popIn(); out(); sfx.push({ t, k: 'rise' }); break;
        case 'burst': { const ics = b.icons || ['♪', '♫', '♥', '♪', '★'], cx = b.x ?? (b.on ? castX(b.on) + 40 : 960), cy = b.y ?? 330;
          ics.forEach((s, i) => { const a = -Math.PI * (0.1 + 0.8 * i / Math.max(1, ics.length - 1)), x = cx + Math.cos(a) * 260, y = cy + Math.sin(a) * 150;
            fx += `<div class="st-box" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px"><div id="${id}x${i}" class="st-in st-glyph" style="font-size:66px;color:${s === '♥' ? '#e8907e' : s === '★' ? '#f3c96b' : '#b8552a'}">${esc(s)}</div></div>`;
            code += `tl.fromTo('#${id}x${i}',{opacity:0,scale:.3,y:30},{opacity:1,scale:1,y:0,duration:.4,ease:'back.out(2.5)',immediateRender:false},${R2(t + i * .12)});tl.to('#${id}x${i}',{y:-60,opacity:0,duration:1.4,ease:'power1.in',immediateRender:false},${R2(t + 1.4 + i * .12)});`;
            sfx.push({ t: t + i * .12, k: 'pop' }); }); break; }
        case 'pile': { const n = b.n ?? 6, x = b.x ?? 1300, y = b.y ?? 600, step = d / n;
          for (let i = 0; i < n; i++) { svgFx += `<g transform="translate(${x + ((i * 37) % 30) - 15} ${y - 14 - i * 16}) rotate(${((i * 53) % 14) - 7})"><g id="${id}s${i}" opacity="0" filter="${P}"><rect x="-90" y="-10" width="180" height="16" rx="3" fill="#fffaf0" stroke="#c9b48e" stroke-width="3"/></g></g>`;
            code += `tl.fromTo('#${id}s${i}',{opacity:0,y:-200},{opacity:1,y:0,duration:.35,ease:'power2.in',immediateRender:false},${R2(t + i * step)});`; sfx.push({ t: t + i * step + .3, k: 'paper' }); }
          if (end) for (let i = 0; i < n; i++) code += `tl.to('#${id}s${i}',{opacity:0,duration:.3,immediateRender:false},${end});`; break; }
        case 'sky': { const n = b.n ?? 3; code += `tl.fromTo('${R} .st-moon',{x:-250,y:190},{x:0,y:0,duration:${R2(Math.max(.6, d / n))},ease:'none',repeat:${n - 1},immediateRender:false},${t});tl.set('${R} .st-moon',{x:0,y:0},${R2(t + d + .05)});`
          + `tl.fromTo('${R} .st-lampglow',{opacity:.15},{opacity:.5,duration:.45,yoyo:true,repeat:${Math.max(1, Math.round(d / .45)) | 1},immediateRender:false},${t});`; break; }
        // ---- hand-drawn strokes (rough.js, drawn on) ----
        case 'arrow': { const [x1, y1] = b.from, [x2, y2] = b.to, L = Math.hypot(x2 - x1, y2 - y1), bend = b.bend ?? .18, nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
          const mx = (x1 + x2) / 2 + nx * L * bend, my = (y1 + y2) / 2 + ny * L * bend, a = Math.atan2(y2 - my, x2 - mx), col = b.color ?? '#b8552a';
          const head = [[x2 - 36 * Math.cos(a - .45), y2 - 36 * Math.sin(a - .45)], [x2, y2], [x2 - 36 * Math.cos(a + .45), y2 - 36 * Math.sin(a + .45)]];
          svgFx += `<g id="${id}">${rdraw(RG.curve([[x1, y1], [mx, my], [x2, y2]], ro({ stroke: col, strokeWidth: 6, roughness: 1.1 })))}${rdraw(RG.linearPath(head, ro({ stroke: col, strokeWidth: 6, roughness: .8 })))}</g>`;
          code += drawCode(`#${id}`, t, 'stroke-dashoffset="1"', b.d ?? .6); out(); sfx.push({ t, k: 'scribble' }); break; }
        case 'circle': { const col = b.color ?? '#b8552a', rx = b.rx ?? 160, ry = b.ry ?? 90;
          svgFx += `<g id="${id}">${rdraw(RG.ellipse(b.x, b.y, rx * 2, ry * 2, ro({ stroke: col, strokeWidth: 6, roughness: 1.8 })))}${b.label ? `<text id="${id}t" x="${b.x + rx * .7}" y="${b.y - ry - 14}" font-family="Caveat, cursive" font-weight="700" font-size="54" fill="${col}" opacity="0">${esc(b.label)}</text>` : ''}</g>`;
          code += drawCode(`#${id}`, t, 'stroke-dashoffset="1"', b.d ?? .7) + (b.label ? `tl.fromTo('#${id}t',{opacity:0,y:10},{opacity:1,y:0,duration:.35,immediateRender:false},${R2(t + .6)});` : '');
          if (b.label) usesCaveat = true; out(); sfx.push({ t, k: 'scribble' }); break; }
        case 'underline': { const col = b.color ?? '#d9774b', w = b.width ?? 400, x0 = b.x - w / 2, n = 6;
          const pts = Array.from({ length: n + 1 }, (_, i) => [x0 + w * i / n, b.y + (i % 2 ? -7 : 7)]);
          svgFx += `<g id="${id}">${rdraw(RG.curve(pts, ro({ stroke: col, strokeWidth: 7, roughness: .9 })))}</g>`;
          code += drawCode(`#${id}`, t, 'stroke-dashoffset="1"', b.d ?? .5); out(); sfx.push({ t, k: 'scribble' }); break; }
        case 'write': { const chars = [...String(b.text)], step = Math.min(.08, (b.d ?? chars.length * .06) / chars.length); usesCaveat = true;
          box(`<div class="st-write" style="font-size:${b.size ?? 80}px;color:${b.color ?? '#3a2e28'}">${chars.map((ch, i) => `<span id="${id}c${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</div>`, b.x ?? 960, b.y ?? 400);
          code += `tl.set('#${id}',{opacity:1},${t});`;
          chars.forEach((_, i) => code += `tl.fromTo('#${id}c${i}',{opacity:0,y:6,scale:.6},{opacity:1,y:0,scale:1,duration:.12,immediateRender:false},${R2(t + i * step)});`);
          out(); sfx.push({ t, k: 'scribble' }, ...(chars.length > 12 ? [{ t: t + chars.length * step / 2, k: 'scribble' }] : [])); break; }
        // a single drawing (Excalidraw "x:…", ILLUS name, "b:…") drawn on anywhere on the page
        case 'draw': { const h = box(`${iconSVG(ILLUS, b.icon, b.size ?? 260)}${b.label ? `<div class="st-lab">${esc(b.label)}</div>` : ''}`, b.x ?? 960, b.y ?? 400);
          code += `tl.set('#${id}',{opacity:1},${t});` + drawCode(`#${id}`, t, h, b.d ?? .9) + (b.label ? `tl.fromTo('#${id} .st-lab',{opacity:0,y:12},{opacity:1,y:0,duration:.35,immediateRender:false},${R2(t + .7)});` : '');
          out(); sfx.push({ t, k: 'scribble' }); break; }
        // ---- departure board (split-flap): lines of text flip into place letter by letter ----
        case 'flap': { const lines = b.lines.map(l => String(l).toUpperCase()), W2 = Math.max(...lines.map(l => l.length)), AL = 'ABCDEFGHIJKLMNOPRSTUVZ0123456789';
          let cells = '', cc = 0, last = t;
          const rows = lines.map(l => { let r = ''; [...l.padEnd(W2)].forEach((ch, ci) => {
            const seq = ch === ' ' ? [' '] : [...Array.from({ length: 5 }, (_, q) => AL[(cc * 7 + q * 11 + ci * 3) % AL.length]), ch], cid = `${id}f${cc}`, t0 = t + .3 + cc * .045;
            r += `<span class="st-fc" id="${cid}">${seq.map((x, q) => `<b class="q${q}">${x === ' ' ? '&nbsp;' : esc(x)}</b>`).join('')}</span>`;
            if (seq.length > 1) seq.forEach((_, q) => { const tq = t0 + q * .075; if (q) code += `tl.set('#${cid} .q${q - 1}',{opacity:0},${R2(tq)});`; code += `tl.set('#${cid} .q${q}',{opacity:1},${R2(tq)});tl.fromTo('#${cid}',{scaleY:.55},{scaleY:1,duration:.07,immediateRender:false},${R2(tq)});`; last = Math.max(last, tq); });
            cc++; }); return `<div class="st-fr">${r}</div>`; });
          box(`<div class="st-flap">${b.title ? `<h4>${esc(b.title)}</h4>` : ''}${rows.join('')}</div>`, b.x ?? 960, b.y ?? 380);
          code += `tl.set('#${id} .st-fc b',{opacity:0},0);` + lines.map(() => '').join('');
          code += `Array.from(document.querySelectorAll('#${id} .st-fc')).forEach(c=>{ if(c.children.length===1) tl.set(c.children[0],{opacity:1},0); });`;
          popIn(); for (let q = t + .3; q < last; q += .15) sfx.push({ t: q, k: 'tick' }); out(); break; }
        // ---- rolling number (odometer): digits spin into place ----
        case 'wheel': { const val = String(b.value), dd = b.d ?? 1.8; let di = 0;
          const cols = [...val].map(ch => /\d/.test(ch) ? `<span class="st-wc"><span class="st-ws" id="${id}d${di++}">${Array.from({ length: 30 }, (_, q) => `<b>${q % 10}</b>`).join('')}</span></span>` : `<span class="st-wx">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`);
          box(`<div class="st-wheel" style="font-size:${b.size ?? 140}px">${cols.join('')}</div>${b.label ? `<div class="st-wlab">${esc(b.label)}</div>` : ''}`, b.x ?? 960, b.y ?? 380);
          popIn(); let n = 0;
          [...val].forEach(ch => { if (!/\d/.test(ch)) return; const k2 = n++; code += `tl.fromTo('#${id}d${k2}',{yPercent:0},{yPercent:${-(20 + +ch) / 30 * 100},duration:${R2(dd - k2 * .1)},ease:'power3.out',immediateRender:false},${R2(t + .2 + k2 * .1)});`; });
          sfx.push(...Array.from({ length: Math.floor(dd / .12) }, (_, q) => ({ t: t + .2 + q * .12, k: 'tick' })), { t: t + .2 + dd, k: 'ding' }); out(); break; }
        case 'hide': (b.ids || []).forEach(n => { const tgt = (st.beats || []).find(x => x.id === n); if (!tgt) throw new Error(`${where}: no beat with id "${n}"`); code += `tl.to('[id^="${tgt._el}"]',{opacity:0,duration:.35,immediateRender:false},${t});`; }); break;
      }
    });
    html += `<div class="st-page" id="st${k}">
      ${placeHTML(st.place || 'papier', k)}
      <svg class="st-cast" viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${cast.map(c => castSVG(c, ctx, k)).join('')}${svgFx}</svg>
      ${fx}
      <div class="st-frame"></div>${st.tag ? `<div class="st-tag">${st.tag.includes('|') ? `<b>${esc(st.tag.split('|')[0])}</b> · ${esc(st.tag.split('|')[1])}` : esc(st.tag)}</div>` : ''}
    </div>`;
    boils.push([IN, OUT, k]);
    js += `tl.set('${R}',{opacity:1},${R2(IN)});tl.set('${R}',{opacity:0},${R2(OUT)});`
      + `Array.from(document.querySelectorAll('${R} .st-lay')).forEach(l=>{const kk=+l.dataset.k;if(kk)tl.fromTo(l,{x:0},{x:-60*kk,duration:${R2(OUT - IN)},ease:'none',immediateRender:false},${IN});});`
      + (st.tag ? `tl.fromTo('${R} .st-tag',{y:-120},{y:0,duration:.5,ease:'back.out(1.6)',immediateRender:false},${R2(IN + .2)});` : '') + code;
  });
  wins.forEach((w, i) => { if (i && w.s < wins[i - 1].e) throw new Error(`story ${w.k} overlaps story ${wins[i - 1].k} — merge them or move one`); });
  html = `<div id="story" data-layout-ignore>${html}</div>`;
  js = `
    // ---- story cutaways (tools/story.mjs) ----
    (function(){
      ${js}
      // hand-drawn "boil": every box on the page re-poses by ~1px every 0.1 s (seeded, a pure function of the time → seek-safe)
      const bels=${JSON.stringify(boils)}.map(([s,e,k])=>[s,e,Array.from(document.querySelectorAll('#st'+k+' .st-bo'))]).filter(x=>x[2].length);
      if(bels.length){
        const hh=(n,sd)=>{const x=Math.sin(n*127.1+sd*311.7)*43758.5453;return (x-Math.floor(x))*2-1;};
        const prev=tl.eventCallback('onUpdate');
        tl.eventCallback('onUpdate',function(){ if(prev) prev.apply(this,arguments); const t=tl.time(), q=Math.floor(t*10);
          bels.forEach(([s,e,els])=>{ if(t<s-.2||t>e+.2) return; els.forEach((el,i)=>gsap.set(el,{x:hh(q*3+i*97,7)*1.4,y:hh(q*3+1+i*97,7)*1.4,rotation:hh(q*3+2+i*97,7)*.5})); }); });
      }
    })();`;
  if (html.includes('Caveat')) usesCaveat = true;
  const css = `${usesCaveat ? `
    @font-face{font-family:"Caveat";src:url(data:font/woff2;base64,${fs.readFileSync(CAVEAT).toString('base64')}) format("woff2");font-weight:700;font-display:block}` : ''}
    #story{position:absolute;inset:0;pointer-events:none}
    .st-page{position:absolute;inset:0;opacity:0;overflow:hidden;background:#f6eddc}
    .st-frame{position:absolute;inset:18px;border:6px solid #3a2e28;border-radius:22px;box-shadow:inset 0 0 0 10px #f6eddc, inset 0 0 120px rgba(120,80,40,.3)}
    .st-tag{position:absolute;left:60px;top:46px;padding:10px 26px;background:#fffaf0;border:3px solid #3a2e28;border-radius:14px;font:600 34px Nunito;color:#3a2e28;transform:rotate(-2deg)}
    .st-tag b{color:#b8552a;font-family:"Playfair Display";font-weight:700}
    .st-box{position:absolute;transform:translate(-50%,-50%)}
    .st-in{opacity:0;display:flex;flex-direction:column;align-items:center;gap:8px}
    .st-glyph{font-family:"Nunito";font-weight:800;line-height:1}
    .st-title{font:700 96px "Playfair Display";color:#3a2e28;text-align:center;white-space:nowrap}
    .st-text{font-family:Nunito;font-weight:800;text-align:center;max-width:1500px;line-height:1.2}
    .st-w{display:inline-block;opacity:0;position:relative}
    .st-title,.st-text{isolation:isolate}
    .st-mk{position:absolute;left:-.08em;right:-.08em;bottom:.1em;height:.42em;background:#f3c96b;opacity:.8;z-index:-1;transform-origin:0 50%;transform:scaleX(0);border-radius:.25em .1em .3em .12em}
    .st-rf{position:absolute;left:-6px;top:-6px;width:calc(100% + 12px);height:calc(100% + 12px);z-index:-1;overflow:visible}
    .st-lic{display:inline-flex}
    .st-write{font-family:"Caveat",cursive;font-weight:700;white-space:nowrap;line-height:1.15}
    .st-write span{display:inline-block;opacity:0}
    .st-flap{display:flex;flex-direction:column;gap:10px;padding:22px 26px;background:#2f3440;border-radius:18px;box-shadow:6px 8px 0 rgba(58,46,40,.25)}
    .st-flap h4{margin:0 0 4px;font:800 30px Nunito;color:#f3c96b;letter-spacing:5px}
    .st-fr{display:flex;gap:6px}
    .st-fc{position:relative;display:inline-block;width:56px;height:80px;background:#1f232c;border-radius:8px;font:800 58px Nunito;color:#f6eddc}
    .st-fc b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800}
    .st-fc::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(0,0,0,.5)}
    .st-wheel{display:flex;font-family:"Playfair Display";font-weight:700;color:#b8552a;line-height:1.1}
    .st-wc{display:inline-block;height:1.1em;overflow:hidden}
    .st-ws{display:flex;flex-direction:column}
    .st-ws b{display:block;height:1.1em;font-weight:700;text-align:center}
    .st-wx{display:inline-block;min-width:.28em;text-align:center}
    .st-wlab{font:800 40px Nunito;color:#3a2e28}
    .st-ul{margin-top:-6px}
    .st-sub{font:700 40px Nunito;color:#5b7398;opacity:0}
    .st-note{position:relative;isolation:isolate;padding:30px 34px 26px;max-width:420px;font:800 36px Nunito;color:#3a2e28;text-align:center}
    .st-note i{position:absolute;left:50%;top:-12px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:#b8552a;border:3px solid #3a2e28}
    .st-stamp{position:relative;isolation:isolate;white-space:nowrap;padding:14px 38px;font:900 64px Nunito;letter-spacing:2px;text-transform:uppercase}
    .st-say{max-width:460px;padding:22px 32px;font:800 36px Nunito;color:#3a2e28;text-align:center;position:relative;isolation:isolate}
    .st-say.whisper{color:#5a4680;font-style:italic}
    .st-badge{position:relative;isolation:isolate;padding:16px 22px 14px}
    .st-badge div{font:800 34px Nunito;color:#3a2e28}
    .st-list{position:relative;isolation:isolate;align-items:flex-start;padding:26px 44px;gap:14px}
    .st-list h3{margin:0 0 4px;font:700 50px "Playfair Display";color:#b8552a}
    .st-li{display:flex;align-items:center;gap:18px;font:800 42px Nunito;color:#3a2e28;opacity:0}
    .st-vsrow{display:flex;align-items:center;gap:60px}
    .st-vs{position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:center;padding:22px 32px;font:800 44px Nunito;color:#3a2e28;opacity:0}
    .st-vsmid{font:900 110px "Playfair Display";color:#b8552a;opacity:0}
    .st-maptitle{font:700 46px "Playfair Display";color:#3a2e28;margin-top:-16px}
    .st-count{position:relative;width:420px;height:200px}
    .st-count span{position:absolute;left:0;right:0;text-align:center;top:30px;font-family:"Playfair Display";font-weight:700;color:#b8552a;opacity:0}
    .st-bars{position:relative;isolation:isolate;padding:26px 44px}
    .st-bars h3{margin:0 0 10px;font:700 46px "Playfair Display";color:#3a2e28;text-align:center}
    .st-barrow{display:flex;align-items:flex-end;gap:40px;height:360px}
    .st-bar{display:flex;flex-direction:column;align-items:center;gap:8px;font:800 30px Nunito;color:#3a2e28}
    .st-bv{position:relative;isolation:isolate;width:110px}
    .st-batt{display:flex;flex-direction:column;align-items:center;font:800 36px Nunito;color:#3a2e28}
    .st-dreamin{position:absolute;left:0;right:0;top:110px;display:flex;justify-content:center;gap:10px}
    .st-dreamlab{position:absolute;left:50%;top:-10px;transform:translateX(-50%);padding:8px 26px;background:#8fae8b;border-radius:12px;font:800 32px Nunito;color:#fffaf0;white-space:nowrap}
    .st-lab{padding:8px 24px;background:#fffaf0;border:3px solid #c9b48e;border-radius:12px;font:800 30px Nunito;color:#3a2e28;white-space:nowrap}`;
  return { html, css, js, sfx, wins };
}
function faceCode(C, face, t) {
  const on = FACES[face]; if (!on) throw new Error(`face "${face}" (have: ${Object.keys(FACES).join(', ')})`);
  return ALL_F.map(g => `tl.set('${C} .${g}',{opacity:${on.includes(g) ? 1 : 0}},${R2(t)});`).join('');
}
