// Cozy French Books — artwork library (option A: hand-coded SVG, same pencil look as the main channel).
// Everything is drawn on a 1920×1080 stage. Story tableaux ("pages") are built from parallax layers
// that are each their own <svg> inside a div, so a camera pan only moves composited layers.
//
// Exports:
//   SHELF()              — opening close-up of a bookshelf, with the episode book as one spine
//   NOOK_BG(), NOOK_FG() — the reading nook where Léa sits (host scene)
//   COVER(book, w, h)    — the channel's own cover design for a book (never the real cover)
//   CARNET()             — Léa's reading notebook spread (ideas & questions)
//   PAGE_ALCHIMISTE_1(), PAGE_ALCHIMISTE_2() — story tableaux as { layers:[{k, svg}], html }
//   SANTIAGO, SHEEP(), PILGRIM — paper puppets
//   MAP_ALCHIMISTE()     — journey map used as progress bar

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
export const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
export const mk = seed => { const r = mulberry32(seed); const R = (a, b) => a + r() * (b - a); return { r, R, pick: a => a[Math.floor(r() * a.length)] }; };

const SPINES = ['#c9693f', '#8fae8b', '#5b7398', '#f3c96b', '#b8552a', '#6b8f71', '#d9a05b', '#7a5a8c', '#e8907e', '#3f5f6b', '#c9b48a'];

/* ---------------- book spines on a shelf ---------------- */
function shelfRow(g, x0, x1, yb, hMin, hMax, special) {
  let s = '', x = x0, i = 0;
  while (x < x1 - 30) {
    const w = g.R(34, 62), h = g.R(hMin, hMax), c = g.pick(SPINES);
    if (special && i === special.at) { s += special.svg(x, yb); x += special.w + 4; i++; continue; }
    const lean = g.r() > .9 && x < x1 - 120;
    s += `<g${lean ? ` transform="rotate(-9 ${x + w} ${yb})"` : ''}><rect x="${x}" y="${yb - h}" width="${w}" height="${h}" rx="4" fill="${c}"/>
      <rect x="${x + 5}" y="${yb - h + g.R(14, 30)}" width="${w - 10}" height="5" rx="2" fill="#fffaf0" opacity=".55"/>
      <rect x="${x + 5}" y="${yb - 26}" width="${w - 10}" height="4" rx="2" fill="#000" opacity=".15"/></g>`;
    x += w + g.R(2, 6) + (lean ? 18 : 0); i++;
  }
  return s;
}

/* ---------------- the channel's own cover design (sun, dunes, tiny caravan) ---------------- */
// b.art picks the painting: default = desert sunset (ep01) · 'moon' = night sky, full moon, a coin on the ground (ep02)
// long titles wrap onto two lines automatically
export function COVER(b, w = 380, h = 540, id = 'cv') {
  if (b.art === 'moon') return COVER_MOON(b, w, h, id);
  return `<svg viewBox="0 0 380 540" width="${w}" height="${h}" style="display:block">
 <defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2733f"/><stop offset=".55" stop-color="#f2a65e"/><stop offset="1" stop-color="#f8d394"/></linearGradient></defs>
 <g filter="url(#pencil)">
  <rect width="380" height="540" rx="10" fill="url(#${id}-sky)"/>
  <circle cx="250" cy="250" r="70" fill="#fff1cf" opacity=".92"/><circle cx="250" cy="250" r="96" fill="#fff1cf" opacity=".18"/>
  <path d="M0 380 C80 330 150 350 220 372 C280 390 330 360 380 340 V540 H0Z" fill="#d99a52"/>
  <path d="M0 430 C90 400 170 420 240 446 C300 466 340 440 380 428 V540 H0Z" fill="#c07a3e"/>
  <path d="M286 372 L318 330 L350 372Z" fill="#b36a35"/>
  ${range(4, i => `<g transform="translate(${70 + i * 30} ${402 - i * 3}) scale(.55)"><path d="M0 0 c4 -16 18 -22 26 -14 c6 -12 18 -12 22 0 l0 18 M8 0 v16 M40 0 v16" stroke="#5a3424" stroke-width="5" fill="#5a3424" stroke-linecap="round"/></g>`)}
  ${range(9, i => `<ellipse cx="${60 + i * 26}" cy="${505 - i * 9}" rx="5" ry="3" fill="#8a4f2a" opacity=".5"/>`)}
  <rect x="0" y="0" width="22" height="540" fill="#000" opacity=".12"/>
 </g>
 <text x="40" y="96" font-family="Playfair Display" font-weight="700" font-size="52" fill="#fffaf0">${b.title}</text>
 <rect x="42" y="118" width="80" height="5" rx="2" fill="#fffaf0" opacity=".8"/>
 <text x="42" y="156" font-family="Nunito" font-weight="800" font-size="20" letter-spacing="3" fill="#fff1dc">${b.author.toUpperCase()}</text>
</svg>`;
}

function coverTitle(t) {
  const words = t.split(' '); if (t.length <= 13) return [t];
  let best = [t, ''], diff = 1e9;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), z = words.slice(i).join(' '), d = Math.abs(a.length - z.length); if (d < diff) { diff = d; best = [a, z]; } }
  return best;
}
function COVER_MOON(b, w, h, id) {
  const g = mk(8), L = coverTitle(b.title), fs = Math.min(52, Math.floor(600 / Math.max(...L.map(x => x.length))));
  return `<svg viewBox="0 0 380 540" width="${w}" height="${h}" style="display:block">
 <defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2744"/><stop offset=".6" stop-color="#3b4a6e"/><stop offset="1" stop-color="#6a6f8e"/></linearGradient></defs>
 <g filter="url(#pencil)">
  <rect width="380" height="540" rx="10" fill="url(#${id}-sky)"/>
  ${range(26, () => `<circle cx="${g.R(30, 370).toFixed(0)}" cy="${g.R(190, 380).toFixed(0)}" r="${g.R(1.2, 2.8).toFixed(1)}" fill="#fff6dc" opacity="${g.R(.5, 1).toFixed(2)}"/>`)}
  <circle cx="250" cy="290" r="104" fill="#f6eddc" opacity=".14"/><circle cx="250" cy="290" r="70" fill="#f6eddc"/><circle cx="228" cy="272" r="12" fill="#e3d6bf"/><circle cx="272" cy="310" r="9" fill="#e3d6bf"/>
  <path d="M0 430 C90 410 200 420 380 404 V540 H0Z" fill="#3a3a48"/><path d="M0 470 C120 456 260 470 380 452 V540 H0Z" fill="#2a2a38"/>
  <path d="M70 404 V318 L96 296 L122 318 V404Z" fill="#2f3854"/><rect x="88" y="350" width="16" height="20" fill="#f3c96b"/>
  <circle cx="190" cy="488" r="15" fill="#d6d6d0" stroke="#9a9a92" stroke-width="4"/><circle cx="190" cy="488" r="34" fill="#f6eddc" opacity=".12"/>
  <rect x="0" y="0" width="22" height="540" fill="#000" opacity=".12"/>
 </g>
 ${L.map((x, i) => `<text x="40" y="${86 + i * (fs + 8)}" font-family="Playfair Display" font-weight="700" font-size="${fs}" fill="#fffaf0">${x}</text>`).join('')}
 <rect x="42" y="${86 + (L.length - 1) * (fs + 8) + 22}" width="80" height="5" rx="2" fill="#f3c96b" opacity=".9"/>
 <text x="42" y="${86 + (L.length - 1) * (fs + 8) + 58}" font-family="Nunito" font-weight="800" font-size="18" letter-spacing="3" fill="#e9dcc4">${b.author.toUpperCase()}</text>
</svg>`;
}

/* ---------------- opening: bookshelf close-up ---------------- */
export function SHELF() {
  const g = mk(5);
  const rows = [300, 640, 980];
  return `<rect width="1920" height="1080" fill="#5a3a28"/>
 <g filter="url(#pencil)">
  ${rows.map((yb, k) => `<rect x="0" y="${yb - 330}" width="1920" height="330" fill="#3e281c"/>
   ${shelfRow(g, -20, 1940, yb, 230, 310, null)}
   <rect x="0" y="${yb}" width="1920" height="26" fill="#8a5e42"/><rect x="0" y="${yb + 26}" width="1920" height="10" fill="#000" opacity=".2"/>`).join('')}
 </g>`;
}

/* ---------------- reading nook (host scene) ---------------- */
export function NOOK_BG() {
  const g = mk(21);
  const drops = range(46, () => { const x = g.R(150, 540), y = g.R(170, 600), l = g.R(16, 30); return `<path class="drop" d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 ${l.toFixed(0)}" stroke="#c7d3e8" stroke-width="2.5" stroke-linecap="round" opacity="${g.R(.4, .85).toFixed(2)}"/>`; });
  const lit = range(14, () => `<rect x="${g.R(170, 520).toFixed(0)}" y="${g.R(440, 560).toFixed(0)}" width="10" height="13" rx="2" fill="#f3c96b" opacity="${g.R(.5, .95).toFixed(2)}"/>`);
  let shelves = '';
  [300, 470, 640, 800].forEach((yb, k) => {
    shelves += `<rect x="1300" y="${yb - 150}" width="540" height="150" fill="#6b4a36"/>`;
    if (k === 1) shelves += shelfRow(g, 1320, 1640, yb, 100, 140, null) + `<g transform="translate(1700 ${yb})"><rect x="-40" y="-60" width="80" height="60" rx="10" fill="#d9774b"/>${range(6, i => `<path d="M${-30 + i * 12} -60 C${-40 + i * 14} -110 ${-30 + i * 16} -140 ${-20 + i * 14} -150" stroke="#5f8f5a" stroke-width="7" fill="none" stroke-linecap="round" class="leafy"/>`)}</g>`;
    else if (k === 2) shelves += shelfRow(g, 1320, 1560, yb, 100, 140, null) + `<g transform="translate(1640 ${yb})"><rect x="0" y="-120" width="150" height="120" rx="6" fill="#f6eddc" stroke="#8a5e42" stroke-width="10"/><circle cx="75" cy="-70" r="26" fill="#e8b35c"/><path d="M14 -14 L60 -60 L90 -34 L120 -64 L140 -14Z" fill="#8fae8b"/></g>`;
    else shelves += shelfRow(g, 1320, 1830, yb, 100, 140, null);
    shelves += `<rect x="1290" y="${yb}" width="560" height="20" fill="#8a5e42"/>`;
  });
  return `<defs>
  <linearGradient id="nk-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f4c6b"/><stop offset="1" stop-color="#7b7f98"/></linearGradient>
  <radialGradient id="nk-glow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".75"/><stop offset=".5" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <clipPath id="nk-win"><rect x="150" y="160" width="400" height="460"/></clipPath>
  <pattern id="nk-stripe" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#ecd9bd"/><rect width="26" height="60" fill="#e5cfb0"/></pattern></defs>
 <rect width="1920" height="1080" fill="url(#nk-stripe)"/>
 <g filter="url(#pencil)">
  <rect x="0" y="780" width="1920" height="300" fill="#b9875e"/>${range(9, i => `<path d="M${i * 240} 780 L${i * 240 - 140} 1080" stroke="#a5754f" stroke-width="5"/>`)}
  <rect x="0" y="760" width="1920" height="24" fill="#8a5e42"/>
  <g clip-path="url(#nk-win)"><rect x="150" y="160" width="400" height="460" fill="url(#nk-night)"/>
   <circle cx="470" cy="240" r="34" fill="#f6eddc" opacity=".85"/>
   <path d="M150 560 V470 h50 v-40 l30 -30 l30 30 v40 h60 v-70 h70 v60 l40 -30 l40 30 v-20 h80 V620 H150Z" fill="#2e3550"/>${lit}
   <g class="rainG">${drops}</g></g>
  <rect x="150" y="160" width="400" height="460" fill="none" stroke="#8a5e42" stroke-width="24"/>
  <path d="M350 160 V620 M150 390 H550" stroke="#8a5e42" stroke-width="12"/>
  <rect x="120" y="610" width="460" height="26" rx="6" fill="#8a5e42"/>
  <path d="M100 120 H600" stroke="#6b4a36" stroke-width="10" stroke-linecap="round"/>
  <path class="curtL" d="M110 124 C150 300 90 500 140 700 L60 700 C40 500 80 300 70 124Z" fill="#8fae8b"/>
  <path class="curtR" d="M590 124 C550 300 610 500 560 700 L640 700 C660 500 620 300 630 124Z" fill="#8fae8b"/>
  ${shelves}
  <rect x="1290" y="110" width="560" height="40" fill="#8a5e42"/><rect x="1290" y="110" width="22" height="720" fill="#7a5038"/><rect x="1828" y="110" width="22" height="720" fill="#7a5038"/>
 </g>
 <circle class="lampGlow" cx="700" cy="400" r="330" fill="url(#nk-glow)"/>
 <g filter="url(#pencil)">
  <path d="M700 420 V900" stroke="#3a2e28" stroke-width="10"/><ellipse cx="700" cy="905" rx="60" ry="14" fill="#3a2e28"/>
  <path d="M640 330 h120 l30 90 h-180Z" fill="#f3c96b"/><path d="M640 330 h120 l30 90 h-180Z" fill="none" stroke="#c9963f" stroke-width="5"/>
  <!-- wing armchair behind Léa -->
  <path d="M770 900 C740 700 760 470 800 400 C850 330 1130 330 1180 400 C1220 470 1240 700 1210 900Z" fill="#c9693f"/>
  <path d="M820 880 C800 700 815 520 850 450 C900 400 1080 400 1130 450 C1165 520 1180 700 1160 880Z" fill="#b5592f"/>
  ${range(5, i => `<circle cx="${870 + i * 60}" cy="${470 + (i % 2) * 10}" r="6" fill="#8a3f20"/>`)}
 </g>`;
}

export function NOOK_FG() {
  return `<g filter="url(#pencil)">
  <!-- arms + seat of the armchair -->
  <path d="M690 1000 C684 930 690 880 716 860 C746 840 806 840 826 866 C846 900 846 950 840 1000Z" fill="#d6764a"/>
  <path d="M1290 1000 C1296 930 1290 880 1264 860 C1234 840 1174 840 1154 866 C1134 900 1134 950 1140 1000Z" fill="#d6764a"/>
  <path d="M800 870 C900 850 1080 850 1180 870 L1190 990 H790Z" fill="#c9693f"/>
  <!-- knitted blanket on the lap -->
  <path d="M830 860 C900 830 1080 830 1150 862 L1170 1010 C1040 1030 940 1030 810 1010Z" fill="#f3c96b"/>
  ${range(6, i => `<path d="M${870 + i * 50} 850 C${860 + i * 50} 900 ${880 + i * 50} 950 ${866 + i * 50} 1012" stroke="#d9a845" stroke-width="7" fill="none" stroke-dasharray="14 8"/>`)}
  <!-- side table with books + teapot -->
  <rect x="1330" y="770" width="240" height="22" rx="6" fill="#8a5e42"/><path d="M1350 792 L1340 1000 M1550 792 L1560 1000" stroke="#6b4a36" stroke-width="16"/>
  <rect x="1350" y="738" width="200" height="32" rx="4" fill="#5b7398"/><rect x="1362" y="706" width="180" height="32" rx="4" fill="#8fae8b"/>
  <rect x="1356" y="676" width="190" height="30" rx="4" fill="#e2733f"/><circle cx="1500" cy="691" r="9" fill="#fff1cf"/>
  <g transform="translate(1450 676)"><path d="M-46 0 C-50 -50 50 -50 46 0Z" fill="#fffaf0"/>${range(5, i => `<circle cx="${-30 + i * 15}" cy="-18" r="4" fill="#d9774b"/>`)}
   <path d="M44 -18 C70 -24 74 -40 66 -48" stroke="#fffaf0" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-44 -26 C-60 -30 -62 -14 -46 -8" stroke="#fffaf0" stroke-width="7" fill="none"/><circle cx="0" cy="-40" r="7" fill="#d9774b"/></g>
 </g>
 <g class="steamT" fill="none" stroke="#fffaf0" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M1514 618 c-10 -16 10 -24 0 -40"/><path d="M1528 612 c-10 -16 10 -24 0 -40"/></g>
 <!-- sleeping cat -->
 <g class="catB" filter="url(#pencil)">
  <path d="M120 880 C120 820 180 800 230 806 C290 812 320 850 316 880Z" fill="#7d6a5c"/>
  <path d="M120 880 C110 860 116 830 140 820 L136 790 L160 812 L182 794 L182 822 C196 842 190 870 170 880Z" fill="#7d6a5c"/>
  <path d="M140 850 q8 5 16 0 M164 850 q6 4 12 0" stroke="#3a2e28" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M316 880 C360 878 370 850 350 834" stroke="#7d6a5c" stroke-width="16" fill="none" stroke-linecap="round"/>
 </g>`;
}

/* ---------------- Léa's reading notebook ---------------- */
export function CARNET() {
  const lines = (x0, x1) => range(17, i => `<path d="M${x0} ${210 + i * 44} H${x1}" stroke="#b9c7d6" stroke-width="2"/>`);
  return `<rect width="1920" height="1080" fill="#7a5038"/>
 <g filter="url(#pencil)">${range(7, i => `<path d="M0 ${i * 170 + 40} C600 ${i * 170 + 20} 1300 ${i * 170 + 70} 1920 ${i * 170 + 30}" stroke="#6b4530" stroke-width="6" fill="none"/>`)}</g>
 <g transform="rotate(-1.2 960 540)">
  <rect x="130" y="80" width="1660" height="940" rx="18" fill="#000" opacity=".22" transform="translate(10 16)"/>
  <g filter="url(#pencil)">
   <rect x="130" y="80" width="1660" height="940" rx="18" fill="#5b7398"/>
   <path d="M150 96 H950 V1004 H150Z" fill="#fbf4e6"/><path d="M970 96 H1770 V1004 H970Z" fill="#fbf4e6"/>
   ${lines(190, 920)}${lines(1000, 1730)}
   <path d="M260 96 V1004" stroke="#e8a59a" stroke-width="2.5"/>
   <rect x="940" y="96" width="40" height="908" fill="#000" opacity=".08"/>
   ${range(12, i => `<ellipse cx="960" cy="${130 + i * 76}" rx="16" ry="7" fill="none" stroke="#8a7a6c" stroke-width="5"/>`)}
   <circle cx="1560" cy="300" r="78" fill="none" stroke="#c9a77c" stroke-width="10" opacity=".35"/>
   <rect x="700" y="70" width="170" height="44" fill="#f3c96b" opacity=".85" transform="rotate(6 785 92)"/>
  </g>
 </g>`;
}

/* ---------------- paper puppets ---------------- */
// Santiago, feet at (0,0), facing right, ~265 px tall.
export const SANTIAGO = `<g class="sant"><g class="sBob">
 <g class="sLegB"><path d="M-10 -96 L-16 -4" stroke="#4a3022" stroke-width="20" stroke-linecap="round"/><ellipse cx="-12" cy="-2" rx="16" ry="8" fill="#3a2418"/></g>
 <g class="sLegF"><path d="M10 -96 L16 -4" stroke="#5e3e2c" stroke-width="20" stroke-linecap="round"/><ellipse cx="22" cy="-2" rx="16" ry="8" fill="#3a2418"/></g>
 <path d="M-40 -96 C-44 -150 -32 -182 0 -186 C32 -182 44 -150 40 -96 C20 -86 -20 -86 -40 -96Z" fill="#c9824a"/>
 <path d="M-46 -168 C-30 -192 30 -192 46 -168 L48 -120 C30 -132 -30 -132 -48 -118Z" fill="#9c5a34"/>
 <path d="M-40 -118 H40" stroke="#5a3424" stroke-width="8"/>
 <path d="M-30 -176 L30 -110" stroke="#6b4530" stroke-width="7"/><rect x="18" y="-122" width="34" height="30" rx="7" fill="#8a5e42"/>
 <rect x="-10" y="-200" width="20" height="20" rx="6" fill="#d9a07c"/>
 <g class="sHead">
  <circle cx="0" cy="-222" r="32" fill="#e8b591"/>
  <path d="M-32 -224 C-36 -262 22 -270 34 -238 C24 -248 6 -250 -6 -244 C-12 -236 -20 -232 -32 -224Z" fill="#3a2620"/>
  ${range(5, i => `<circle cx="${-26 + i * 12}" cy="${-250 + (i % 2) * 4}" r="9" fill="#3a2620"/>`)}
  <circle cx="-14" cy="-218" r="7" fill="#d9a07c"/>
  <ellipse cx="14" cy="-222" rx="3.5" ry="5" fill="#2a1e18"/>
  <path d="M10 -206 q8 5 15 -1" stroke="#8a3a2c" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="22" cy="-210" r="6" fill="#e8907e" opacity=".5"/>
 </g>
 <g class="sArm"><path d="M28 -170 C44 -150 50 -130 50 -116" stroke="#9c5a34" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="50" cy="-112" r="10" fill="#e8b591"/>
  <path d="M54 -6 L50 -258 C50 -284 78 -286 78 -262" stroke="#7a5038" stroke-width="8" fill="none" stroke-linecap="round"/></g>
</g></g>`;

// Sheep, feet at (0,0), facing right, ~110 px wide. Each one gets its own pivot class index.
export const SHEEP = i => `<g class="sheep sh${i}">
 ${[-26, -10, 14, 28].map(x => `<rect x="${x}" y="-30" width="8" height="30" rx="3" fill="#3a2e28"/>`).join('')}
 <g class="shWool">${[[-30, -50, 22], [-8, -60, 24], [16, -56, 22], [32, -44, 18], [-14, -38, 20], [10, -36, 20], [-38, -36, 15]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6eddc"/>`).join('')}</g>
 <g class="shHead"><ellipse cx="50" cy="-50" rx="15" ry="19" fill="#3a2e28" transform="rotate(20 50 -50)"/><circle cx="44" cy="-66" r="9" fill="#f6eddc"/>
  <ellipse cx="38" cy="-56" rx="9" ry="4" fill="#3a2e28" transform="rotate(-30 38 -56)"/><circle cx="54" cy="-52" r="2.6" fill="#fffaf0"/></g>
</g>`;

// Pilgrim seen from behind, feet at (0,0), ~180 px tall.
export const PILGRIM = `<g class="pil"><g class="pBob">
 <g class="pLegB"><path d="M-8 -64 L-10 -2" stroke="#4a5a6b" stroke-width="15" stroke-linecap="round"/></g>
 <g class="pLegF"><path d="M8 -64 L10 -2" stroke="#5b6b7c" stroke-width="15" stroke-linecap="round"/></g>
 <path d="M-30 -66 C-32 -110 -22 -128 0 -130 C22 -128 32 -110 30 -66Z" fill="#8fae8b"/>
 <rect x="-24" y="-124" width="48" height="56" rx="12" fill="#c9693f"/>
 <path d="M-10 -108 c4 -10 16 -10 20 0 c-2 10 -18 10 -20 0Z" fill="#fffaf0"/>${range(4, i => `<path d="M0 -104 L${-8 + i * 5} -114" stroke="#c9963f" stroke-width="1.5"/>`)}
 <circle cx="0" cy="-142" r="18" fill="#c48e6c"/>
 <ellipse cx="0" cy="-152" rx="30" ry="8" fill="#e8d3a6"/><path d="M-16 -154 C-16 -172 16 -172 16 -154Z" fill="#e8d3a6"/>
 <path d="M38 -4 L32 -170" stroke="#7a5038" stroke-width="5" stroke-linecap="round"/><circle cx="31" cy="-92" r="7" fill="#c48e6c"/>
</g></g>`;

/* ---------------- story tableau 1: Andalusia at dusk ---------------- */
// k = parallax factor (1 = moves with the camera's pan). Width 2600 so the camera can pan right.
export function PAGE_ALCHIMISTE_1() {
  const g = mk(31);
  const olives = (y0, n, x0, x1, c) => range(n, () => { const x = g.R(x0, x1), y = y0 + g.R(-30, 30); return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${g.R(16, 26).toFixed(0)}" ry="${g.R(12, 18).toFixed(0)}" fill="${c}"/>`; });
  const village = range(9, i => { const x = 1400 + i * 46 + (i % 3) * 8, y = 600 - (i % 4) * 22; return `<rect x="${x}" y="${y}" width="44" height="${44 + (i % 3) * 10}" fill="#fbf4e6"/><path d="M${x - 4} ${y} l26 -18 l26 18Z" fill="#c9693f"/><rect x="${x + 16}" y="${y + 16}" width="10" height="14" fill="#5b7398"/>`; });
  const flowers = range(30, () => { const x = g.R(0, 2600), y = g.R(990, 1070); return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${g.R(5, 9).toFixed(0)}" fill="${g.pick(['#f3c96b', '#fffaf0', '#e8907e'])}"/>`; });
  const tufts = range(26, () => { const x = g.R(0, 2600), y = g.R(1000, 1080); return `<path class="tuft" d="M${x.toFixed(0)} ${y.toFixed(0)} l-10 -40 M${x.toFixed(0)} ${y.toFixed(0)} l2 -48 M${x.toFixed(0)} ${y.toFixed(0)} l14 -38" stroke="#5f7f45" stroke-width="7" stroke-linecap="round"/>`; });
  const sheep = [[680, 930, 1, .95], [820, 960, -1, 1.05], [1430, 925, 1, .9], [1580, 975, -1, 1.1], [990, 990, 1, 1.15], [1720, 930, 1, .85]];
  return {
    layers: [
      { k: 0, cls: 'sky', svg: `<defs><linearGradient id="p1-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef9f68"/><stop offset=".5" stop-color="#f6c88e"/><stop offset="1" stop-color="#fbe7c4"/></linearGradient></defs>
        <rect width="2600" height="1080" fill="url(#p1-sky)"/><circle cx="1500" cy="380" r="84" fill="#fff1cf"/><circle cx="1500" cy="380" r="130" fill="#fff1cf" opacity=".22"/>
        <g filter="url(#pencil)" fill="#fbe9cf" opacity=".9"><path class="cloud c1" d="M300 220 c20 -50 90 -50 110 -10 c30 -30 90 -10 90 30 c40 0 50 50 10 60 H300 c-40 -10 -40 -70 0 -80Z"/>
        <path class="cloud c2" d="M1900 160 c20 -40 80 -40 96 -6 c26 -24 76 -8 76 26 c34 0 40 44 8 50 H1900 c-34 -8 -34 -60 0 -70Z"/></g>
        <g class="birds" fill="none" stroke="#7a4a32" stroke-width="4" stroke-linecap="round"><path d="M900 260 q12 -12 24 0 q12 -12 24 0"/><path d="M960 230 q9 -9 18 0 q9 -9 18 0"/></g>` },
      { k: .2, cls: 'far', svg: `<g filter="url(#pencil)">
        <path d="M0 640 L180 540 L320 600 L520 500 L700 590 L900 520 L1120 600 L1320 530 L1500 600 L1700 540 L1880 600 L2000 620 V1080 H0Z" fill="#dda07c"/>
        <path d="M1780 640 C2100 630 2200 650 2600 640 V1080 H1780Z" fill="#9ab4b8"/>
        <path d="M1880 612 C1960 592 2080 596 2600 604 V650 H1880Z" fill="#e8c27e"/><path d="M1990 606 L2060 516 L2130 606Z" fill="#c98a4a"/><path d="M2060 516 L2075 606 L2130 606Z" fill="#a8703f"/><path d="M1930 606 L1966 562 L2002 606Z" fill="#c98a4a"/>
        </g>` },
      { k: .5, cls: 'mid', svg: `<g filter="url(#pencil)">
        <path d="M0 720 C300 640 600 660 900 700 C1200 740 1500 650 1800 660 C2100 670 2300 640 2600 700 V1080 H0Z" fill="#b9a660"/>
        ${olives(700, 46, 40, 1900, '#7f8f4a')}${village}
        <path d="M0 800 C400 760 800 780 1200 800 C1600 820 2000 770 2600 790 V1080 H0Z" fill="#a49650"/>
        ${olives(800, 30, 60, 2500, '#6f7f3e')}</g>` },
      { k: 1, cls: 'near', svg: `<g filter="url(#pencil)">
        <path d="M0 880 C400 840 900 850 1300 870 C1800 890 2200 850 2600 870 V1080 H0Z" fill="#8fae6b"/>
        <!-- ruined church + sycamore growing inside -->
        <g transform="translate(150 0)">
         <path d="M80 900 V620 L190 540 L300 620 L310 900Z" fill="#dcc6a0"/><path d="M300 640 L420 640 L430 900 H300Z" fill="#cdb48c"/>
         <path d="M330 640 L360 600 L380 640" fill="#dcc6a0"/><path d="M80 620 L190 540 L240 576 L200 600 L150 590Z" fill="#b98f62"/>
         <path d="M150 900 V760 C150 720 230 720 230 760 V900Z" fill="#5a4636"/><path d="M174 660 C174 636 206 636 206 660 V700 H174Z" fill="#5a4636"/>
         ${range(7, i => `<rect x="${92 + (i % 3) * 66}" y="${780 - Math.floor(i / 3) * 60}" width="40" height="18" fill="#c7ad84" opacity=".7"/>`)}
         <path d="M262 900 C270 800 250 700 270 600" stroke="#6b4a36" stroke-width="30" fill="none" stroke-linecap="round"/>
         <g class="treeTop"><circle cx="270" cy="520" r="110" fill="#6f8f4f"/><circle cx="190" cy="560" r="80" fill="#7fa05c"/><circle cx="350" cy="560" r="84" fill="#7fa05c"/><circle cx="280" cy="440" r="80" fill="#88a865"/></g>
        </g>
        </g>
        <g class="flock">${sheep.map(([x, y, f, s], i) => `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${SHEEP(i)}</g>`).join('')}</g>` },
      { k: 1.35, cls: 'fore', svg: `<g filter="url(#pencil)">${tufts}${flowers}</g>` },
    ],
    // Santiago lives in the "near" layer but is animated on his own, so he is an HTML overlay layer too
    puppet: { x: 1180, y: 960, s: 1 },
  };
}

/* ---------------- story tableau 2: the Camino, Galicia, morning ---------------- */
export function PAGE_ALCHIMISTE_2() {
  const g = mk(44);
  const trees = (n, x0, x1, y0, s0) => range(n, () => { const x = g.R(x0, x1), y = y0 + g.R(-20, 20), s = s0 * g.R(.8, 1.2); return `<path d="M${x} ${y} V${y - 90 * s}" stroke="#6b4a36" stroke-width="${10 * s}"/><ellipse cx="${x}" cy="${y - 110 * s}" rx="${34 * s}" ry="${52 * s}" fill="${g.pick(['#5f8f5a', '#6f9f63', '#4f7f4f'])}"/>`; });
  const walls = range(5, i => `<path d="M${200 + i * 380} ${760 + (i % 2) * 20} h220" stroke="#b9ad98" stroke-width="16" stroke-linecap="round" stroke-dasharray="26 6"/>`);
  return {
    layers: [
      { k: 0, cls: 'sky', svg: `<defs><linearGradient id="p2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0dc"/><stop offset="1" stop-color="#f7efdc"/></linearGradient></defs>
        <rect width="2200" height="1080" fill="url(#p2-sky)"/><circle cx="420" cy="260" r="70" fill="#fff6dc"/>
        <g filter="url(#pencil)" fill="#fffaf0" opacity=".9"><path class="cloud c1" d="M1200 200 c20 -50 90 -50 110 -10 c30 -30 90 -10 90 30 c40 0 50 50 10 60 H1200 c-40 -10 -40 -70 0 -80Z"/></g>` },
      { k: .2, cls: 'far', svg: `<g filter="url(#pencil)">
        <path d="M0 620 C300 560 600 580 900 600 C1200 620 1500 560 1800 580 C2000 590 2100 600 2200 600 V1080 H0Z" fill="#a9c39a"/>
        <!-- distant cathedral -->
        <g transform="translate(1420 590)" fill="#8f9c8e"><rect x="-70" y="-60" width="140" height="60"/><rect x="-70" y="-150" width="40" height="150"/><rect x="30" y="-150" width="40" height="150"/>
         <path d="M-74 -150 L-50 -200 L-26 -150Z M26 -150 L50 -200 L74 -150Z"/><circle cx="-50" cy="-210" r="6"/><circle cx="50" cy="-210" r="6"/><path d="M-20 -60 L0 -100 L20 -60Z"/></g></g>` },
      { k: .5, cls: 'mid', svg: `<g filter="url(#pencil)">
        <path d="M0 720 C400 660 800 690 1200 700 C1600 710 1900 670 2200 690 V1080 H0Z" fill="#8fb47a"/>${walls}${trees(14, 40, 2150, 720, .8)}</g>` },
      { k: 1, cls: 'near', svg: `<g filter="url(#pencil)">
        <path d="M0 850 C500 800 1000 820 1400 830 C1800 840 2000 820 2200 830 V1080 H0Z" fill="#7aa463"/>
        <path id="p2-road" d="M380 1080 C560 980 900 960 1060 900 C1200 846 1180 800 1300 760 C1360 740 1400 720 1430 650" stroke="#e8d3a6" stroke-width="150" fill="none" stroke-linecap="round"/>
        <path d="M380 1080 C560 980 900 960 1060 900 C1200 846 1180 800 1300 760 C1360 740 1400 720 1430 650" stroke="#f3e2bb" stroke-width="40" fill="none" stroke-linecap="round" opacity=".7"/>
        ${trees(5, 1600, 2150, 880, 1.3)}${trees(3, 40, 300, 900, 1.4)}
        <!-- milestone with yellow arrow + shell -->
        <g transform="translate(1560 990)"><path d="M-60 0 V-170 C-60 -200 60 -200 60 -170 V0Z" fill="#c9c1b0"/><path d="M-60 -150 h120 v62 h-120Z" fill="#5b7398"/>
         <path d="M-30 -120 h40 v-14 l24 22 l-24 22 v-14 h-40Z" fill="#f3c96b"/>
         <g transform="translate(0 -40)"><path d="M-22 0 c6 -26 38 -26 44 0 c-8 18 -36 18 -44 0Z" fill="#f3c96b"/>${range(5, i => `<path d="M0 6 L${-16 + i * 8} -16" stroke="#c9963f" stroke-width="3"/>`)}</g></g>
        </g>` },
      { k: 1.35, cls: 'fore', svg: `<g filter="url(#pencil)">${range(22, () => { const x = g.R(0, 2200), y = g.R(1000, 1080); return `<path class="tuft" d="M${x.toFixed(0)} ${y.toFixed(0)} l-10 -40 M${x.toFixed(0)} ${y.toFixed(0)} l2 -48 M${x.toFixed(0)} ${y.toFixed(0)} l14 -38" stroke="#4f7f45" stroke-width="7" stroke-linecap="round"/>`; })}
        ${range(16, () => `<circle cx="${g.R(0, 2200).toFixed(0)}" cy="${g.R(990, 1070).toFixed(0)}" r="7" fill="${g.pick(['#fffaf0', '#f3c96b', '#c9b4e0'])}"/>`)}</g>` },
    ],
  };
}

/* ---------------- journey map (progress bar for this book) ---------------- */
export const STOPS_ALCHIMISTE = [['Espagne', 80], ['Tanger', 320], ['Désert', 560], ['Pyramides', 800]];
export function MAP_ALCHIMISTE() {
  const icon = {
    Espagne: `<path d="M-14 -4 V-26 L0 -36 L14 -26 V-4Z" fill="#dcc6a0" stroke="#8a5e42" stroke-width="3"/><circle cx="10" cy="-34" r="10" fill="#7fa05c"/>`,
    Tanger: `<path d="M-16 -4 V-26 C-16 -40 16 -40 16 -26 V-4Z" fill="#fbf4e6" stroke="#8a5e42" stroke-width="3"/><path d="M-6 -4 V-18 C-6 -26 6 -26 6 -18 V-4" fill="#5b7398"/>`,
    Désert: `<path d="M-22 -4 C-12 -22 4 -22 22 -4Z" fill="#e8b35c" stroke="#8a5e42" stroke-width="3"/><circle cx="12" cy="-30" r="7" fill="#f3c96b"/>`,
    Pyramides: `<path d="M-20 -4 L0 -36 L20 -4Z" fill="#e8b35c" stroke="#8a5e42" stroke-width="3"/>`,
  };
  const path = 'M80 74 C150 54 250 98 320 74 C390 50 490 96 560 74 C630 52 730 98 800 74';
  return `<svg viewBox="0 0 880 140" width="880" height="140">
 <g filter="url(#pencil)"><path d="M10 18 C200 6 680 6 870 18 L862 126 C680 136 200 136 18 126Z" fill="#f4e6c8"/><path d="M10 18 C200 6 680 6 870 18 L862 126 C680 136 200 136 18 126Z" fill="none" stroke="#c9a77c" stroke-width="4"/></g>
 <path class="mapRoute" d="${path}" pathLength="1" stroke="#b8552a" stroke-width="5" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="round"/>
 <path class="mapReturn" d="M800 74 C620 128 260 128 80 74" pathLength="1" stroke="#5b7398" stroke-width="4" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="round" opacity=".8"/>
 ${STOPS_ALCHIMISTE.map(([n, x], i) => `<g class="stop st${i}" transform="translate(${x} 74)"><g transform="translate(0 -6)">${icon[n]}</g><circle r="7" fill="#fbf4e6" stroke="#b8552a" stroke-width="4"/>
  <text y="38" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="28" fill="#5a3a28">${n}</text></g>`).join('')}
 <g class="mapPin" transform="translate(80 74)"><circle class="pinPulse" r="16" fill="#e2733f" opacity=".35"/><circle r="10" fill="#e2733f" stroke="#fffaf0" stroke-width="4"/></g>
</svg>`;
}
