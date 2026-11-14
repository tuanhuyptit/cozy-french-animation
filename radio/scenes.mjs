// Cozy French Radio — scene library (single source of truth for radio scenes).
// Each scene draws a 1920×1080 background (bg) and foreground (fg) around Léa.
// Léa herself comes from ../demo-animation-style.html (same rig as the main channel).
//
// Scene fields:
//   label    — name shown in the demo
//   kind     — 'host' (Léa in a room, for "Le thème") | 'interlude' (graphic, for segment changes, "Le mot du jour")
//   lea      — { x, y, s } position/scale of Léa's 360×480 box; clip: CSS clip-path on that box (optional)
//   phones   — draw headphones on Léa
//   outfit   — default outfit (any key of OUT_LEA in the demo)
//   brand    — 'dark' | 'light' | 'flat' (logo chip style)
//   sub      — 'box' (light card) | 'dark' (dark card) | 'kin' (big kinetic text, right column)
//   tag      — small line under the logo
//   gest     — Léa's hand gestures for this scene (keys of GEST_ELBOW in the demo); default palm,up,count,think,beat,shrug,wave. Pick ones whose hand stays inside lea.clip
//   kin      — interludes only: { x, y, w, cls } box of the big kinetic sentence (cls 'hand' = handwritten); default right column
//   bg(), fg() — SVG markup (inside <svg viewBox="0 0 1920 1080">)
//   html()   — extra HTML overlays (optional)
//
// Motion here is CSS for the demo; class names (.rain, .needle, .flame…) are the hooks a future
// HyperFrames build turns into seek-safe GSAP tweens.

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const mk = seed => { const r = mulberry32(seed); const R = (a, b) => a + r() * (b - a); return { r, R }; };

// Paris rooftops silhouette between x0..x1 standing on y0
function roofs({ r, R }, y0, x0, x1, col, lit) {
  let s = '', x = x0;
  while (x < x1) {
    const w = R(70, 140), h = R(60, 170);
    s += `<path d="M${x} ${y0} V${y0 - h} l${w / 2} -${R(20, 46)} l${w / 2} ${R(20, 46)} V${y0}Z" fill="${col}"/>`;
    if (lit) s += range(3, () => r() > .45 ? `<rect x="${x + R(10, w - 26)}" y="${y0 - R(18, h - 20)}" width="14" height="18" rx="2" fill="#f3c96b" opacity="${R(.5, .95).toFixed(2)}" class="${r() > .7 ? 'flick' : ''}"/>` : '');
    x += w + R(-6, 8);
  }
  return s;
}
const roofsLite = (x0, y0, x1) => { const g = mk(17); return roofs(g, y0, x0, x1, '#c98a6a', false); };
const MIC_DESK = (x, y) => `<path d="M${x} ${y} L${x} ${y - 52}" stroke="#2a2220" stroke-width="8"/><rect x="${x - 22}" y="${y - 112}" width="44" height="66" rx="22" fill="#3a2e28"/>
  ${range(3, i => `<path d="M${x - 10 + i * 10} ${y - 104} V${y - 58}" stroke="#7a6a5c" stroke-width="3" stroke-linecap="round"/>`)}<rect x="${x - 30}" y="${y - 6}" width="60" height="10" rx="4" fill="#2a2220"/>`;
const TEA = (x, y, c = '#8fae8b') => `<rect x="${x}" y="${y}" width="70" height="72" rx="14" fill="${c}"/><path d="M${x + 70} ${y + 16} q30 4 0 34" stroke="${c}" stroke-width="10" fill="none"/>`;
const STEAM = (x, y) => `<g class="steam2" stroke="#fffaf0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"><path d="M${x} ${y} q-12 -20 0 -40 q12 -20 0 -40"/><path d="M${x + 28} ${y} q-12 -20 0 -40 q12 -20 0 -40"/></g>`;

export const SCENES = {

/* ---------------- studio : radio booth at night ---------------- */
studio: {
  label: 'Studio de nuit', kind: 'host', phones: true, outfit: 'cardigan', brand: 'dark', sub: 'box', tag: '21:00 · Le thème',
  lea: { x: 520, y: 262, s: 1.45 },
  bg() {
    const g = mk(7);
    const rain = range(46, () => { const x = g.R(1250, 1790), y = g.R(110, 560); return `<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y + 34}" class="rain" style="animation-duration:${g.R(.6, 1.1).toFixed(2)}s;animation-delay:-${g.R(0, 1).toFixed(2)}s"/>`; });
    const foam = range(9, rw => range(7, c => `<rect x="${40 + c * 150}" y="${60 + rw * 92}" width="134" height="78" rx="18" fill="${(rw + c) % 2 ? '#3d3446' : '#433a4d'}"/>`));
    return `<defs>
  <radialGradient id="st-lamp" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(380 330) scale(900 700)"><stop offset="0" stop-color="#f3c96b" stop-opacity=".55"/><stop offset="1" stop-color="#f3c96b" stop-opacity="0"/></radialGradient>
  <linearGradient id="st-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2a44"/><stop offset="1" stop-color="#3b4a6b"/></linearGradient>
  <radialGradient id="st-onair" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a5c" stop-opacity=".7"/><stop offset="1" stop-color="#ff8a5c" stop-opacity="0"/></radialGradient></defs>
 <rect width="1920" height="1080" fill="#352d3e"/>
 <g filter="url(#pencil)">${foam}</g>
 <g filter="url(#pencil)"><rect x="1220" y="90" width="600" height="500" rx="22" fill="#5a4436"/><rect x="1242" y="112" width="556" height="456" rx="12" fill="url(#st-night)"/>
  <circle cx="1690" cy="200" r="42" fill="#f6eddc"/><circle cx="1708" cy="190" r="38" fill="#2a3653"/>
  <g>${roofs(g, 568, 1242, 1798, '#18203a', true)}</g><path d="M1520 112 V568 M1242 340 H1798" stroke="#5a4436" stroke-width="14"/></g>
 <g stroke="#bcd0ea" stroke-width="2.5" opacity=".55">${rain}</g>
 <g transform="translate(830 70)"><circle class="onglow" cx="130" cy="44" r="190" fill="url(#st-onair)"/>
  <g filter="url(#pencil)"><rect width="260" height="88" rx="20" fill="#2a2220"/><rect class="onlamp" x="12" y="12" width="236" height="64" rx="14" fill="#d9574a"/></g>
  <text x="130" y="60" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="40" fill="#fff4e4" letter-spacing="6">ON AIR</text></g>
 <rect width="1920" height="1080" fill="url(#st-lamp)" class="lampLight"/>
 <g filter="url(#pencil)"><path d="M250 880 L300 640 L360 560" stroke="#2a2220" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M300 520 L440 560 L410 620 L280 590Z" fill="#b8552a"/></g>
 <g filter="url(#pencil)"><rect x="60" y="420" width="300" height="16" fill="#6b4a36"/>
  ${range(9, i => `<rect x="${80 + i * 28}" y="${300 + (i % 3) * 8}" width="22" height="${120 - (i % 3) * 8}" rx="3" fill="${['#d9774b', '#8fae8b', '#f3c96b', '#5b7398', '#c9502e'][i % 5]}"/>`)}</g>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <path d="M0 880 H1920 V1080 H0Z" fill="#7a5038"/><path d="M0 880 H1920 V906 H0Z" fill="#8f6246"/>
  <path d="M1460 880 L1460 820 M1460 820 L1290 640 L1110 600" stroke="#2a2220" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="1290" cy="640" r="14" fill="#5a4436"/>
  <g transform="rotate(-18 1060 610)"><rect x="990" y="560" width="150" height="104" rx="52" fill="#d4c7b4"/><rect x="1004" y="572" width="122" height="80" rx="40" fill="#3a2e28"/>
   ${range(5, i => `<path d="M${1020 + i * 22} 580 V644" stroke="#7a6a5c" stroke-width="5" stroke-linecap="round"/>`)}<rect x="1050" y="660" width="30" height="20" rx="6" fill="#b8552a"/></g>
  <rect x="1400" y="868" width="120" height="16" rx="6" fill="#2a2220"/>
  <rect x="1560" y="760" width="250" height="140" rx="20" fill="#2a2220"/><rect x="1576" y="776" width="218" height="96" rx="12" fill="#f6eddc"/>
  <path d="M1600 860 A85 85 0 0 1 1770 860" stroke="#d9574a" stroke-width="5" fill="none" stroke-dasharray="6 8"/>
  <line class="needle" x1="1685" y1="866" x2="1685" y2="796" stroke="#3a2e28" stroke-width="5" stroke-linecap="round"/>
  <path d="M160 900 l230 -22 l40 60 l-240 26z" fill="#f6eddc"/><path d="M190 905 l190 -18" stroke="#c9b9a6" stroke-width="4"/>
  ${TEA(470, 830)}</g>${STEAM(490, 815)}`;
  },
},

/* ---------------- grenier : attic room at golden hour (lofi) ---------------- */
grenier: {
  label: 'La chambre sous les toits', kind: 'host', phones: false, outfit: 'torsade', brand: 'light', sub: 'dark', tag: 'Lofi · on écoute ensemble',
  lea: { x: 560, y: 320, s: 1.02 },
  bg() {
    const g = mk(11);
    const motes = range(26, () => `<circle class="mote" cx="${g.R(560, 1300)}" cy="${g.R(200, 760)}" r="${g.R(2.5, 5).toFixed(1)}" style="animation-delay:-${g.R(0, 9).toFixed(1)}s;animation-duration:${g.R(7, 12).toFixed(1)}s"/>`);
    return `<defs>
  <linearGradient id="gr-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a96b"/><stop offset=".6" stop-color="#f6c98a"/><stop offset="1" stop-color="#f9e0b0"/></linearGradient>
  <linearGradient id="gr-beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>
  <clipPath id="gr-oeil"><circle cx="1360" cy="400" r="230"/></clipPath></defs>
 <rect width="1920" height="1080" fill="#f1dcc0"/>
 <g filter="url(#pencil)">
  <path d="M0 0 H700 L0 520Z" fill="#e2c3a0"/><path d="M1920 0 H1700 L1920 300Z" fill="#e2c3a0"/>
  <path d="M0 520 L700 0" stroke="#8a5e42" stroke-width="26"/><path d="M1700 0 L1920 300" stroke="#8a5e42" stroke-width="26"/>
  <g clip-path="url(#gr-oeil)"><rect x="1100" y="160" width="520" height="480" fill="url(#gr-dusk)"/><circle cx="1440" cy="430" r="60" fill="#fff1cf" opacity=".9"/>
   <path d="M1300 640 L1318 420 L1322 360 L1326 420 L1344 640Z M1306 560 H1338 M1311 480 H1334" stroke="#9b6a5a" stroke-width="5" fill="#b9877a"/>
   ${roofs(g, 640, 1120, 1600, '#c98a6a', false)}${roofs(g, 640, 1110, 1610, '#a86c58', false)}</g>
  <circle cx="1360" cy="400" r="230" fill="none" stroke="#8a5e42" stroke-width="28"/><path d="M1360 170 V630 M1130 400 H1590" stroke="#8a5e42" stroke-width="12"/>
  <path d="M0 760 H1920 V1080 H0Z" fill="#c9946a"/>${range(8, i => `<path d="M${i * 260} 760 L${i * 260 - 160} 1080" stroke="#b07c56" stroke-width="5"/>`)}
  <ellipse cx="1500" cy="860" rx="330" ry="60" fill="#d9774b"/><ellipse cx="1500" cy="860" rx="280" ry="44" fill="none" stroke="#f3c96b" stroke-width="6" stroke-dasharray="14 12"/>
  <rect x="120" y="560" width="360" height="18" fill="#8a5e42"/><rect x="150" y="490" width="200" height="70" rx="10" fill="#6b4a36"/></g>
 <g transform="translate(240 512) scale(1 .32)"><g class="vinyl"><circle r="70" fill="#2a2220"/><circle r="52" fill="none" stroke="#4a3c36" stroke-width="3"/><circle r="20" fill="#d9774b"/><path d="M-60 -10 A62 62 0 0 1 -10 -60" stroke="#7a6a64" stroke-width="6" fill="none"/></g></g>
 <g filter="url(#pencil)"><path d="M330 470 L300 505" stroke="#d4c7b4" stroke-width="6" stroke-linecap="round"/>
  ${range(4, i => `<rect x="${380 + i * 22}" y="${470 - (i % 2) * 10}" width="18" height="${90 + (i % 2) * 10}" rx="3" fill="${['#8fae8b', '#f3c96b', '#5b7398', '#c9502e'][i]}"/>`)}</g>
 <g class="sway2" style="transform-origin:960px 0"><path d="M960 0 V170" stroke="#3a2e28" stroke-width="3"/><g filter="url(#pencil)"><path d="M925 170 h70 l-10 50 h-50Z" fill="#c9825c"/>
  ${range(7, k => `<path d="M${935 + k * 8} 200 C${915 + k * 10} ${250 + k * 8} ${905 + k * 12} ${300 + k * 8} ${925 + k * 10} ${330 + (k % 3) * 26}" stroke="#5f8f5a" stroke-width="5" fill="none"/><ellipse cx="${925 + k * 10}" cy="${330 + (k % 3) * 26}" rx="9" ry="14" fill="#7fa673"/>`)}</g></g>
 <polygon points="1170,250 1560,560 1000,1080 380,1080" fill="url(#gr-beam)"/>
 <g fill="#fff6dc" opacity=".8">${motes}</g>`;
  },
  fg() {
    return `<g transform="translate(0 -100)"><g filter="url(#pencil)">
  <rect x="440" y="842" width="720" height="26" rx="6" fill="#8a5e42"/><path d="M470 868 V1060 M1130 868 V1060" stroke="#6b4a36" stroke-width="22"/>
  ${MIC_DESK(870, 842)}
  <path d="M940 842 L1100 842 L1080 740 L960 740Z" fill="#d4c7b4"/><rect x="972" y="752" width="96" height="70" rx="6" fill="#f6eddc"/>
  <ellipse cx="1500" cy="960" rx="150" ry="40" fill="#8fae8b"/></g>
 <g class="breathe" style="transform-origin:1500px 950px" filter="url(#pencil)">
  <path d="M1400 950 C1400 880 1460 860 1510 866 C1570 872 1600 910 1596 950Z" fill="#e9a35a"/>
  <path d="M1400 950 C1390 930 1396 900 1420 890 L1416 860 L1440 882 L1462 864 L1462 892 C1476 912 1470 940 1450 950Z" fill="#e9a35a"/>
  <path d="M1420 920 q8 5 16 0 M1444 920 q6 4 12 0" stroke="#3a2e28" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M1500 880 q20 30 0 60 M1540 878 q18 30 2 62" stroke="#c97f3a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M1596 950 C1640 948 1650 920 1630 904" stroke="#e9a35a" stroke-width="16" fill="none" stroke-linecap="round"/></g>
 <g class="zz" font-family="Caveat" font-size="38" fill="#8a7a6c"><text x="1440" y="840">z</text><text x="1466" y="810" font-size="30">z</text></g></g>`;
  },
},

/* ---------------- matin : Paris balcony, morning ---------------- */
matin: {
  label: 'Le balcon du matin', kind: 'host', phones: false, outfit: 'mariniere', brand: 'light', sub: 'box', tag: '8:00 · Café et motivation',
  lea: { x: 600, y: 300, s: 1.4 },
  bg() {
    const g = mk(23);
    const win = (x, y) => `<rect x="${x}" y="${y}" width="120" height="190" rx="6" fill="#5b7398"/><rect x="${x + 8}" y="${y + 8}" width="104" height="174" rx="4" fill="#9cb4cc"/>
      <path d="M${x + 60} ${y + 8} V${y + 182} M${x + 8} ${y + 70} H${x + 112}" stroke="#f6eddc" stroke-width="5"/>
      <rect x="${x - 16}" y="${y + 190}" width="152" height="12" fill="#e9dcc6"/><path d="M${x - 10} ${y + 202} v40 M${x + 130} ${y + 202} v40 M${x - 10} ${y + 242} H${x + 130}" stroke="#2a2220" stroke-width="5"/>
      ${range(7, k => `<path d="M${x + 6 + k * 18} ${y + 206} q8 18 0 34" stroke="#2a2220" stroke-width="3" fill="none"/>`)}`;
    const birds = range(3, i => `<g class="bird" style="animation-delay:-${(i * 3.1).toFixed(1)}s;animation-duration:${(11 + i * 2)}s"><path d="M0 ${120 + i * 50} q14 -14 28 0 q14 -14 28 0" stroke="#3a2e28" stroke-width="4" fill="none" stroke-linecap="round"/></g>`);
    const clouds = range(3, i => `<g class="cloud2" style="animation-duration:${60 + i * 25}s;animation-delay:-${i * 20}s"><ellipse cx="${300 + i * 600}" cy="${90 + i * 40}" rx="110" ry="34" fill="#fffaf0" opacity=".9"/><ellipse cx="${360 + i * 600}" cy="${74 + i * 40}" rx="70" ry="34" fill="#fffaf0" opacity=".9"/></g>`);
    return `<defs><linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6e6"/><stop offset="1" stop-color="#f6e7cf"/></linearGradient></defs>
 <rect width="1920" height="1080" fill="url(#mt-sky)"/>
 ${clouds}
 <g filter="url(#pencil)">
  <rect x="120" y="180" width="1680" height="760" fill="#efe1c8"/><path d="M100 180 H1820 L1800 150 H120Z" fill="#7d8ea3"/>
  ${range(6, i => `<path d="M${180 + i * 280} 150 l60 -70 l60 70" fill="#6d7f95"/><rect x="${215 + i * 280}" y="95" width="50" height="45" rx="6" fill="#efe1c8"/>`)}
  ${range(6, i => win(200 + i * 280, 240))}
  ${range(6, i => win(200 + i * 280, 560))}
  <path d="M120 520 H1800" stroke="#e1d0b4" stroke-width="10"/>
 </g>
 <circle cx="1720" cy="110" r="56" fill="#fff1cf" class="sun"/>
 ${birds}`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <!-- balcony railing (behind the table) -->
  <path d="M0 860 H1920" stroke="#2a2220" stroke-width="12"/><path d="M0 1040 H1920" stroke="#2a2220" stroke-width="10"/>
  ${range(40, i => `<path d="M${i * 50 + 10} 866 V1040" stroke="#2a2220" stroke-width="5"/><path d="M${i * 50 + 10} 900 q18 20 0 40 q-18 20 0 40" stroke="#2a2220" stroke-width="3" fill="none"/>`)}
  <!-- geranium pots -->
  ${[180, 1560, 1760].map((x, i) => `<g class="sway3" style="transform-origin:${x}px 830px;animation-delay:-${i}s"><path d="M${x - 50} 790 h100 l-12 70 h-76Z" fill="#c9825c"/>
    ${range(5, k => `<circle cx="${x - 36 + k * 18}" cy="${770 - (k % 2) * 16}" r="16" fill="#7fa673"/>`)}${range(4, k => `<circle cx="${x - 28 + k * 19}" cy="${750 - (k % 2) * 14}" r="11" fill="#d9574a"/>`)}</g>`).join('')}
  <!-- bistro table -->
  <ellipse cx="860" cy="880" rx="300" ry="34" fill="#4f6f6b"/><path d="M860 912 V1080" stroke="#3a4f4c" stroke-width="18"/>
  ${MIC_DESK(1040, 878)}
  <ellipse cx="700" cy="874" rx="80" ry="16" fill="#fffaf0"/><path d="M650 866 q50 -40 100 0 q-50 14 -100 0Z" fill="#e2a24c"/><path d="M670 858 q30 -18 60 0" stroke="#b8752e" stroke-width="4" fill="none"/>
  ${TEA(880, 806, '#f6eddc')}</g>${STEAM(900, 792)}`;
  },
},

/* ---------------- train : morning train window, landscape scrolling ---------------- */
train: {
  label: 'Le train du matin', kind: 'host', phones: false, outfit: 'trench', brand: 'dark', sub: 'box', tag: 'En route · Le thème',
  lea: { x: 420, y: 280, s: 1.42 },
  bg() {
    const g = mk(31);
    const strip = (w, f) => `${f(0)}${f(w)}${f(2 * w)}`; // drawn 3× so the loop is seamless
    const hills = (w, y, col, amp) => strip(w, ox => `<path d="M${ox} 640 ${range(8, i => `Q${ox + i * w / 8 + w / 16} ${y - amp * (0.4 + ((i * 7) % 5) / 5)} ${ox + (i + 1) * w / 8} ${y}`)} V640Z" fill="${col}"/>`);
    const trees = w => strip(w, ox => range(9, i => { const x = ox + i * w / 9 + 40; return `<path d="M${x} 640 V560" stroke="#6b4a36" stroke-width="10"/><circle cx="${x}" cy="540" r="${36 + (i % 3) * 8}" fill="${['#6f8f6b', '#7fa673', '#5f8f5a'][i % 3]}"/>`; }));
    const lav = w => strip(w, ox => range(14, i => `<path d="M${ox + i * w / 14} 640 L${ox + i * w / 14 + 60} 600" stroke="#9b86c4" stroke-width="16" stroke-linecap="round"/>`));
    const poles = w => strip(w, ox => `<path d="M${ox + 200} 640 V230 M${ox + 170} 260 H${ox + 230}" stroke="#4a3c36" stroke-width="12"/>`);
    return `<defs><linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9cbe0"/><stop offset="1" stop-color="#f6e2c2"/></linearGradient>
  <clipPath id="tr-win"><rect x="880" y="170" width="940" height="470" rx="60"/></clipPath></defs>
 <rect width="1920" height="1080" fill="#6b4a5e"/>
 <g filter="url(#pencil)"><rect x="0" y="0" width="1920" height="120" fill="#5a3d4f"/><path d="M60 110 H1860" stroke="#c9b9a6" stroke-width="8"/>${range(12, i => `<path d="M${90 + i * 150} 110 v30" stroke="#c9b9a6" stroke-width="5"/>`)}
  <rect x="300" y="40" width="240" height="66" rx="10" fill="#d9774b"/><rect x="580" y="54" width="180" height="52" rx="10" fill="#8fae8b"/></g>
 <g clip-path="url(#tr-win)">
  <rect x="880" y="170" width="940" height="470" fill="url(#tr-sky)"/><circle cx="1650" cy="260" r="46" fill="#fff1cf"/>
  <g class="scroll s1">${hills(1200, 470, '#b7c6a7', 70)}</g>
  <g class="scroll s2">${hills(1000, 540, '#93ad86', 50)}</g>
  <g class="scroll s3">${lav(900)}${trees(900)}</g>
  <g class="scroll s4">${poles(800)}</g>
 </g>
 <g filter="url(#pencil)"><rect x="880" y="170" width="940" height="470" rx="60" fill="none" stroke="#3a2e28" stroke-width="26"/><rect x="866" y="156" width="968" height="498" rx="70" fill="none" stroke="#8a6a74" stroke-width="10"/>
  <path d="M80 200 h700 v420 H80Z" fill="#7a5568"/>${range(5, i => `<path d="M${120 + i * 140} 220 v380" stroke="#6b4a5e" stroke-width="6"/>`)}</g>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <path d="M0 860 H1920 V1080 H0Z" fill="#4a3442"/>
  <path d="M640 860 H1520 L1500 900 H660Z" fill="#c9a27c"/><path d="M640 860 H1520" stroke="#a8825e" stroke-width="6"/>
  ${MIC_DESK(1180, 862)}
  <path d="M760 854 l200 -14 l26 18 l-210 16z" fill="#f6eddc"/>
  ${TEA(1320, 790, '#d9774b')}</g>${STEAM(1340, 776)}`;
  },
},

/* ---------------- cheminee : winter evening by the fire ---------------- */
cheminee: {
  label: 'Soir d’hiver', kind: 'host', phones: false, outfit: 'doudoune', brand: 'dark', sub: 'box', tag: '20:00 · Au coin du feu',
  lea: { x: 560, y: 280, s: 1.42 },
  bg() {
    const g = mk(43);
    const snow = range(50, () => `<circle class="snow" cx="${g.R(110, 470)}" cy="${g.R(150, 560)}" r="${g.R(3, 6).toFixed(1)}" style="animation-duration:${g.R(4, 8).toFixed(1)}s;animation-delay:-${g.R(0, 8).toFixed(1)}s"/>`);
    return `<defs>
  <radialGradient id="ch-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1560 760) scale(900 640)"><stop offset="0" stop-color="#ffb35c" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
  <linearGradient id="ch-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26324f"/><stop offset="1" stop-color="#55678a"/></linearGradient>
  <clipPath id="ch-win"><rect x="110" y="150" width="360" height="420" rx="10"/></clipPath></defs>
 <rect width="1920" height="1080" fill="#7a4a3c"/>
 <g filter="url(#pencil)">${range(16, i => `<rect x="${i * 124}" y="0" width="62" height="860" fill="#83503f"/>`)}
  <rect x="90" y="130" width="400" height="460" rx="16" fill="#5a3a2c"/></g>
 <g clip-path="url(#ch-win)"><rect x="110" y="150" width="360" height="420" fill="url(#ch-night)"/>
  <path d="M110 520 q90 -40 180 -10 q90 30 180 -20 V570 H110Z" fill="#eef2f7"/>
  <path d="M200 510 l40 -90 l40 90Z M330 500 l30 -70 l30 70Z" fill="#2f4a3a"/>
  <g fill="#fffaf0">${snow}</g></g>
 <g filter="url(#pencil)"><path d="M290 150 V570 M110 360 H470" stroke="#5a3a2c" stroke-width="14"/><rect x="80" y="580" width="420" height="22" fill="#e9dcc6"/>
  <!-- fireplace -->
  <rect x="1300" y="420" width="520" height="440" fill="#d4c7b4"/><rect x="1270" y="400" width="580" height="40" rx="6" fill="#efe3cf"/>
  <rect x="1380" y="560" width="360" height="300" rx="20" fill="#2a2220"/>
  <path d="M1420 840 h280" stroke="#6b4a36" stroke-width="22" stroke-linecap="round"/>
  <rect x="1340" y="300" width="60" height="100" rx="6" fill="#8fae8b"/><circle cx="1600" cy="350" r="40" fill="#f6eddc"/><path d="M1600 350 l0 -24 M1600 350 l16 10" stroke="#3a2e28" stroke-width="5" stroke-linecap="round"/>
  <path d="M1700 400 l20 -110 l20 110Z" fill="#c9502e"/></g>
 <g class="fire" style="transform-origin:1560px 840px">
  <path class="flame f1" d="M1480 840 C1470 760 1530 740 1520 660 C1570 720 1600 760 1590 840Z" fill="#e8664f"/>
  <path class="flame f2" d="M1530 840 C1520 770 1580 750 1590 690 C1630 750 1650 790 1640 840Z" fill="#f3a04b"/>
  <path class="flame f3" d="M1520 840 C1520 800 1560 780 1560 740 C1590 780 1600 810 1596 840Z" fill="#f3c96b"/></g>
 <rect width="1920" height="1080" fill="url(#ch-glow)" class="fireGlow"/>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <path d="M0 860 H1920 V1080 H0Z" fill="#5a3a2c"/><ellipse cx="900" cy="980" rx="560" ry="70" fill="#b8552a"/><ellipse cx="900" cy="980" rx="500" ry="52" fill="none" stroke="#f3c96b" stroke-width="6" stroke-dasharray="16 12"/>
  <path d="M520 880 H1180 L1160 910 H540Z" fill="#8a5e42"/><path d="M560 910 V1060 M1140 910 V1060" stroke="#6b4a36" stroke-width="20"/>
  ${MIC_DESK(1020, 880)}
  <path d="M600 874 l140 -10 l14 14 l-146 10z" fill="#d9774b"/><path d="M606 862 l130 -8 l12 12 l-134 8z" fill="#8fae8b"/>
  ${TEA(820, 808, '#f6eddc')}</g>${STEAM(840, 794)}`;
  },
},

/* ---------------- carnet : graphic interlude (segment changes, mot du jour) ---------------- */
carnet: {
  label: 'Carnet radio', kind: 'interlude', phones: true, outfit: 'pull', brand: 'flat', sub: 'kin', tag: 'Épisode 01 · Oser dire non',
  lea: { x: 356, y: 282, s: 1.25, clip: 'circle(196px at 195px 174px)' },
  bg() {
    return `<defs><clipPath id="cn-disc"><circle cx="600" cy="500" r="250"/></clipPath></defs>
 <rect width="1920" height="1080" fill="#f6eddc"/>
 ${range(24, i => `<path d="M0 ${60 + i * 44} H1920" stroke="#e8dcc6" stroke-width="2"/>`)}<path d="M150 0 V1080" stroke="#e7b9a2" stroke-width="3"/>
 <g class="disc" style="transform-origin:600px 500px"><circle cx="600" cy="500" r="330" fill="#2a2220"/>
  ${range(9, i => `<circle cx="600" cy="500" r="${300 - i * 18}" fill="none" stroke="#3d322e" stroke-width="3"/>`)}
  <path d="M380 330 A280 280 0 0 1 560 240" stroke="#5a4a44" stroke-width="10" fill="none" stroke-linecap="round"/></g>
 <circle cx="600" cy="500" r="262" fill="#f3c96b" filter="url(#pencil)"/>
 <g clip-path="url(#cn-disc)"><rect x="340" y="240" width="520" height="520" fill="#f6c98a"/><circle cx="480" cy="360" r="70" fill="#f9e0b0"/></g>`;
  },
  fg() {
    const g = mk(5);
    const bars = range(48, i => `<rect class="bar" x="${i * 18}" y="0" width="10" height="120" rx="5" style="animation-delay:-${(g.r() * 1.2).toFixed(2)}s;animation-duration:${g.R(.5, 1.1).toFixed(2)}s"/>`);
    return `<circle cx="600" cy="500" r="250" fill="none" stroke="#3a2e28" stroke-width="10" filter="url(#pencil)"/>
 <g transform="translate(990 640)" fill="#d9774b">${bars}</g>
 <g font-family="Nunito" font-weight="800" font-size="26" fill="#3a2e28">
  <path d="M260 960 H1660" stroke="#d4c7b4" stroke-width="10" stroke-linecap="round"/><path class="prog" d="M260 960 H760" stroke="#d9774b" stroke-width="10" stroke-linecap="round"/>
  ${[['Le thème', 260], ['Le mot du jour', 727], ['Le courrier', 1193], ['La question', 1660]].map(([t, x], i) => `<circle cx="${x}" cy="960" r="18" fill="${i < 1 ? '#d9774b' : '#f6eddc'}" stroke="#3a2e28" stroke-width="5"/><text x="${x}" y="1020" text-anchor="middle" opacity="${i < 2 ? 1 : .5}">${t}</text>`).join('')}</g>`;
  },
  html: () => `<div class="note"><span>Le mot du jour</span><b>oser</b><i>/o.ze/ · to dare</i></div>`,
},

/* ---------------- tsf : vintage radio set, the dial is the progress bar ---------------- */
tsf: {
  label: 'La radio TSF', kind: 'interlude', phones: false, outfit: 'lilas', brand: 'flat', sub: 'kin', tag: 'Épisode 01 · Oser dire non',
  lea: { x: 316, y: 247, s: 1.15, clip: "path('M-14 307 V150 A208.5 140 0 0 1 403 150 V307 Z')" },
  kin: { x: 1010, y: 250, w: 820 },
  gest: ['up', 'wave', 'count', 'think', 'scratch', 'beat'],
  bg() {
    return `<defs><radialGradient id="ts-glow" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#ffe2a8"/><stop offset="1" stop-color="#f3b86b"/></radialGradient>
  <pattern id="ts-cloth" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#c9a27c"/><path d="M0 7 H14 M7 0 V14" stroke="#b08a64" stroke-width="2"/></pattern></defs>
 <rect width="1920" height="1080" fill="#efe4d0"/>
 ${range(40, i => range(23, j => `<circle cx="${30 + i * 48}" cy="${30 + j * 48}" r="2.4" fill="#ddcdb3"/>`))}
 <g filter="url(#pencil)">
  <ellipse cx="540" cy="880" rx="420" ry="30" fill="#d9c7aa"/>
  <path d="M180 870 V330 C180 160 900 160 900 330 V870 Z" fill="#8a5e42"/>
  <path d="M220 840 V340 C220 205 860 205 860 340 V840 Z" fill="#a8744f"/>
  <path d="M286 600 V397 A254 170 0 0 1 794 397 V600 Z" fill="#5a3d2c"/>
  <path d="M302 600 V407 A238 156 0 0 1 778 407 V600 Z" fill="url(#ts-glow)"/>
 </g>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <path d="M302 600 V407 A238 156 0 0 1 778 407 V600 Z" fill="none" stroke="#3a2e28" stroke-width="10"/>
  <g class="grille" style="transform-origin:540px 700px"><rect x="300" y="630" width="480" height="140" rx="24" fill="url(#ts-cloth)"/>
   ${range(5, i => `<path d="M${340 + i * 100} 640 C${300 + i * 100} 680 ${380 + i * 100} 720 ${340 + i * 100} 760" stroke="#8a5e42" stroke-width="10" fill="none" stroke-linecap="round"/>`)}</g>
  <rect x="300" y="630" width="480" height="140" rx="24" fill="none" stroke="#5a3d2c" stroke-width="8"/>
  ${[360, 720].map((x, i) => `<g class="knob" style="transform-origin:${x}px 815px;animation-delay:-${i * 1.3}s"><circle cx="${x}" cy="815" r="30" fill="#f3e6cf" stroke="#3a2e28" stroke-width="6"/><path d="M${x} 815 V789" stroke="#3a2e28" stroke-width="6" stroke-linecap="round"/></g>`).join('')}
  <circle cx="540" cy="815" r="12" fill="#e8664f" class="onlamp"/>
 </g>
 <!-- frequency dial = progress -->
 <g font-family="Nunito" font-weight="800" fill="#3a2e28">
  <rect x="200" y="905" width="1520" height="110" rx="26" fill="#3a2e28"/><rect x="216" y="921" width="1488" height="78" rx="18" fill="#f6e2b8"/>
  ${range(75, i => `<path d="M${240 + i * 19.6} 935 v${i % 5 ? 12 : 22}" stroke="#8a5e42" stroke-width="3"/>`)}
  ${['88', '92', '96', '100', '104', '108'].map((t, i) => `<text x="${250 + i * 284}" y="985" font-size="20" text-anchor="middle" fill="#8a5e42">${t}</text>`).join('')}
  ${[['Le thème', 330], ['Le mot du jour', 770], ['Le courrier', 1210], ['La question', 1630]].map(([t, x], i) => `<text x="${x}" y="1052" font-size="24" text-anchor="middle" opacity="${i < 2 ? 1 : .5}" fill="${i === 1 ? '#b8552a' : '#3a2e28'}">${t}</text>`).join('')}
  <g class="tune"><path d="M770 915 V1005" stroke="#d9574a" stroke-width="7" stroke-linecap="round"/><circle cx="770" cy="915" r="8" fill="#d9574a"/></g>
 </g>`;
  },
},

/* ---------------- polaroid : word of the day, Léa in an instant photo ---------------- */
polaroid: {
  label: 'Polaroïd du mot', kind: 'interlude', phones: false, outfit: 'rose', brand: 'flat', sub: 'kin', tag: 'Le mot du jour',
  lea: { x: 237.5, y: 205, s: 1.5, clip: "path('M15 0 H375 V357 H15 Z')" },
  kin: { x: 960, y: 560, w: 860 },
  bg() {
    return `<defs><linearGradient id="pl-photo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6e6"/><stop offset="1" stop-color="#f6d9a8"/></linearGradient></defs>
 <rect width="1920" height="1080" fill="#e4ead9"/>
 ${range(28, i => `<path d="M${i * 72} 0 V1080" stroke="#d6dfc8" stroke-width="2"/>`)}${range(16, i => `<path d="M0 ${i * 72} H1920" stroke="#d6dfc8" stroke-width="2"/>`)}
 <g filter="url(#pencil)">
  <rect x="236" y="186" width="600" height="700" rx="8" fill="#00000014" transform="translate(12 14)"/>
  <rect x="230" y="170" width="600" height="700" rx="8" fill="#fffdf7"/>
  <rect x="260" y="200" width="540" height="540" fill="url(#pl-photo)"/>
  <circle cx="700" cy="300" r="50" fill="#fff3d6"/>
  ${roofsLite(260, 740, 800)}
 </g>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <rect x="260" y="200" width="540" height="540" fill="none" stroke="#3a2e28" stroke-width="4"/>
  <rect x="440" y="140" width="190" height="56" fill="#f3c96bcc" transform="rotate(-6 535 168)"/>
  <rect x="740" y="820" width="150" height="48" fill="#8fae8bcc" transform="rotate(14 815 844)"/>
  <text x="530" y="830" text-anchor="middle" font-family="Caveat" font-size="54" font-weight="600" fill="#5a4436">Léa · Paris</text>
 </g>
 <g class="twinkle" fill="#d9774b">${[[1640, 210, 1], [1760, 330, .7], [1560, 400, .55]].map(([x, y, k], i) => `<path style="animation-delay:-${i * .7}s" d="M${x} ${y - 28 * k} L${x + 8 * k} ${y - 8 * k} L${x + 28 * k} ${y} L${x + 8 * k} ${y + 8 * k} L${x} ${y + 28 * k} L${x - 8 * k} ${y + 8 * k} L${x - 28 * k} ${y} L${x - 8 * k} ${y - 8 * k}Z"/>`).join('')}</g>
 <path class="squig" d="${range(1, () => { let d = 'M960 900'; for (let i = 0; i < 24; i++) d += ` q18 ${i % 2 ? 40 : -40} 36 0`; return d; })}" stroke="#d9774b" stroke-width="8" fill="none" stroke-linecap="round"/>
 <g font-family="Nunito" font-weight="800" font-size="20">${['Le thème', 'Le mot du jour', 'Le courrier', 'La question'].map((t, i) => `<rect x="${1010 + i * 210}" y="40" width="196" height="46" rx="23" fill="${i === 1 ? '#3a2e28' : '#fffdf7'}" stroke="#3a2e28" stroke-width="3"/><text x="${1108 + i * 210}" y="70" text-anchor="middle" fill="${i === 1 ? '#f3c96b' : '#8a7a6c'}">${t}</text>`).join('')}</g>`;
  },
  html: () => `<div class="mot"><span>Le mot du jour</span><b>oser</b><i>/o.ze/ · verbe · to dare</i></div>`,
},

/* ---------------- lettre : listeners' mail, Léa on a postage stamp ---------------- */
lettre: {
  label: 'Le courrier', kind: 'interlude', phones: false, outfit: 'foulard', brand: 'flat', sub: 'kin', tag: 'Le courrier des auditeurs',
  lea: { x: 226, y: 180, s: 1.2, clip: "path('M53 8 H337 V342 H53 Z')" },
  kin: { x: 940, y: 290, w: 800, cls: 'hand' },
  gest: ['up', 'count', 'think', 'beat', 'scratch'],
  bg() {
    const scal = (x0, y0, x1, y1, r) => range(Math.round((x1 - x0) / (r * 2.4)) + 1, i => `<circle cx="${x0 + i * (x1 - x0) / Math.round((x1 - x0) / (r * 2.4))}" cy="${y0}" r="${r}" fill="#e7cfa8"/><circle cx="${x0 + i * (x1 - x0) / Math.round((x1 - x0) / (r * 2.4))}" cy="${y1}" r="${r}" fill="#e7cfa8"/>`)
      + range(Math.round((y1 - y0) / (r * 2.4)) + 1, i => `<circle cx="${x0}" cy="${y0 + i * (y1 - y0) / Math.round((y1 - y0) / (r * 2.4))}" r="${r}" fill="#e7cfa8"/><circle cx="${x1}" cy="${y0 + i * (y1 - y0) / Math.round((y1 - y0) / (r * 2.4))}" r="${r}" fill="#e7cfa8"/>`);
    return `<rect width="1920" height="1080" fill="#e7cfa8"/>
 ${range(60, i => `<path d="M${(i * 137) % 1920} ${(i * 251) % 1080} l${18 + (i % 5) * 6} ${(i % 3) - 1}" stroke="#d8bd92" stroke-width="3" stroke-linecap="round"/>`)}
 <g filter="url(#pencil)">
  <!-- envelope -->
  <rect x="120" y="520" width="680" height="400" rx="10" fill="#f3e3c4"/><path d="M120 530 L460 760 L800 530" stroke="#d4bf98" stroke-width="6" fill="none"/>
  <path d="M120 920 L400 720 M800 920 L520 720" stroke="#e0cca6" stroke-width="5"/>
  <!-- stamp -->
  <rect x="256" y="156" width="408" height="468" fill="#00000012" transform="translate(10 12)"/>
  <rect x="260" y="160" width="400" height="460" fill="#fffaf0"/>
  ${scal(260, 160, 660, 620, 11)}
  <rect x="290" y="190" width="340" height="400" fill="#f3c96b"/><circle cx="560" cy="270" r="54" fill="#f9e0b0"/>
  <!-- letter -->
  <g class="floaty" style="transform-origin:1330px 520px"><rect x="868" y="128" width="930" height="800" rx="6" fill="#00000014" transform="rotate(1.5 1330 520) translate(10 12)"/>
  <rect x="868" y="128" width="930" height="800" rx="6" fill="#fffdf7" transform="rotate(1.5 1330 520)"/>
  <g transform="rotate(1.5 1330 520)">${range(14, i => `<path d="M910 ${250 + i * 48} H1760" stroke="#e8dcc6" stroke-width="2"/>`)}<path d="M960 140 V915" stroke="#efc3ad" stroke-width="3"/></g></g>
 </g>`;
  },
  fg() {
    return `<g filter="url(#pencil)">
  <rect x="290" y="190" width="340" height="400" fill="none" stroke="#3a2e28" stroke-width="4"/>
  <text x="600" y="580" text-anchor="end" font-family="Playfair Display" font-weight="700" font-size="44" fill="#fffaf0">1€</text>
 </g>
 <g class="stampmark" style="transform-origin:640px 560px" stroke="#b8552a" stroke-width="6" fill="none" opacity=".75">
  <circle cx="640" cy="560" r="96"/><circle cx="640" cy="560" r="76"/>
  ${range(4, i => `<path d="M${740 + i * 0} ${520 + i * 26} q30 -14 60 0 q30 14 60 0 q30 -14 60 0"/>`)}
  <text x="640" y="552" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="22" fill="#b8552a" stroke="none">PARIS</text>
  <text x="640" y="582" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="18" fill="#b8552a" stroke="none">RADIO</text>
 </g>
 <text x="460" y="860" text-anchor="middle" font-family="Caveat" font-size="50" font-weight="600" fill="#8a5e42">pour Léa ♡</text>`;
  },
  html: () => `<div class="letterhead">Chère Léa,</div><div class="sign">— Marco, Italie</div>`,
},
/* ---------------- metro : Paris métro station, the line map is the progress bar ---------------- */
metro: {
  label: 'Station Léa', kind: 'interlude', phones: false, outfit: 'camel', brand: 'flat', sub: 'kin', tag: 'Ligne L · Oser dire non',
  lea: { x: 326, y: 260, s: 1.2, clip: 'circle(191px at 195px 175px)' },
  kin: { x: 1010, y: 268, w: 760, cls: 'light' },
  bg() {
    const tiles = range(26, i => range(14, j => `<rect x="${(j % 2 ? -40 : 0) + i * 80 + 3}" y="${j * 80 + 3}" width="74" height="74" rx="10" fill="#fbf8f1" stroke="#e6dfd2" stroke-width="3"/>`));
    const lamp = x => `<path d="M${x} 860 V300 C${x} 240 ${x + 30} 220 ${x + 60} 236" stroke="#2f5d50" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M${x} 860 V300 C${x} 240 ${x - 30} 220 ${x - 60} 236" stroke="#2f5d50" stroke-width="16" fill="none" stroke-linecap="round"/>
      <ellipse class="bulb" cx="${x + 64}" cy="256" rx="22" ry="30" fill="#f3a04b"/><ellipse class="bulb" cx="${x - 64}" cy="256" rx="22" ry="30" fill="#f3a04b" style="animation-delay:-.8s"/>`;
    return `<rect width="1920" height="1080" fill="#efe9dc"/>
 <g filter="url(#pencil)">${tiles}
  <rect x="0" y="860" width="1920" height="220" fill="#d4c7b4"/><path d="M0 860 H1920" stroke="#2f5d50" stroke-width="10"/>
  ${lamp(150)}
  <circle cx="560" cy="470" r="262" fill="#2f5d50"/><circle cx="560" cy="470" r="238" fill="#f3c96b"/>
  <circle cx="560" cy="470" r="230" fill="#f6d9a8"/><circle cx="480" cy="330" r="60" fill="#fbe8c4"/>
  <rect x="960" y="210" width="860" height="420" rx="30" fill="#1f4e8c"/><rect x="980" y="230" width="820" height="380" rx="20" fill="none" stroke="#fffaf0" stroke-width="6"/>
 </g>`;
  },
  fg() {
    const st = [['Le thème', 300], ['Le mot du jour', 760], ['Le courrier', 1220], ['La question', 1680]];
    return `<circle cx="560" cy="470" r="230" fill="none" stroke="#3a2e28" stroke-width="6" filter="url(#pencil)"/>
 <g font-family="Nunito" font-weight="800" fill="#3a2e28">
  <circle cx="190" cy="960" r="40" fill="#d9774b" stroke="#3a2e28" stroke-width="5"/><text x="190" y="975" text-anchor="middle" font-size="40" fill="#fffaf0">L</text>
  <path d="M260 960 H1700" stroke="#d9774b" stroke-width="22" stroke-linecap="round"/>
  ${st.map(([t, x], i) => `<circle cx="${x}" cy="960" r="${i === 1 ? 22 : 16}" fill="${i === 1 ? '#3a2e28' : '#fffaf0'}" stroke="#3a2e28" stroke-width="6"/><text x="${x}" y="915" text-anchor="middle" font-size="26" opacity="${i <= 1 ? 1 : .5}">${t}</text>`).join('')}
  <g class="rame"><rect x="296" y="992" width="96" height="40" rx="18" fill="#2f5d50"/><rect x="310" y="1000" width="22" height="16" rx="4" fill="#fffaf0"/><rect x="340" y="1000" width="22" height="16" rx="4" fill="#fffaf0"/><rect x="370" y="1000" width="14" height="16" rx="4" fill="#f3c96b"/></g>
 </g>`;
  },
},

/* ---------------- journal : front page of a newspaper, the sentence is the headline ---------------- */
journal: {
  label: 'À la une', kind: 'interlude', phones: true, outfit: 'chemise', brand: 'flat', sub: 'kin', tag: 'Le thème',
  lea: { x: 198, y: 190, s: 1.6, clip: "path('M1 -6 H389 V394 H1 Z')" },
  kin: { x: 930, y: 290, w: 880 },
  bg() {
    return `<defs><pattern id="jn-dot" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.4" fill="#3a2e28"/></pattern></defs>
 <rect width="1920" height="1080" fill="#f1ebdd"/>
 ${range(90, i => `<path d="M${(i * 211) % 1920} ${(i * 97) % 1080} l14 2" stroke="#e2d8c4" stroke-width="3" stroke-linecap="round"/>`)}
 <g filter="url(#pencil)">
  <text x="1375" y="150" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="82" fill="#3a2e28">Le Petit Journal de Léa</text>
  <path d="M930 178 H1820 M930 190 H1820" stroke="#3a2e28" stroke-width="4"/>
  <text x="930" y="226" font-family="Nunito" font-weight="800" font-size="22" fill="#8a7a6c" letter-spacing="2">ÉDITION DU SOIR · N° 01</text>
  <text x="1820" y="226" text-anchor="end" font-family="Nunito" font-weight="800" font-size="22" fill="#8a7a6c" letter-spacing="2">COZY FRENCH RADIO</text>
  <rect x="206" y="190" width="620" height="640" fill="#00000012" transform="translate(10 12)"/>
  <rect x="200" y="180" width="620" height="640" fill="#e9d8bc"/><circle cx="660" cy="300" r="80" fill="#f3e3c8"/>
  <path d="M200 700 q160 -60 320 -10 q160 50 300 -20 V820 H200Z" fill="#d9c3a0"/>
 </g>`;
  },
  fg() {
    const col = (x, y, n) => range(n, i => `<path d="M${x} ${y + i * 26} H${x + 270 - (i === n - 1 ? 110 : (i * 37) % 40)}" stroke="#cfc3ad" stroke-width="9" stroke-linecap="round"/>`);
    return `<rect x="200" y="180" width="620" height="640" fill="url(#jn-dot)" opacity=".08"/>
 <g filter="url(#pencil)">
  <rect x="200" y="180" width="620" height="640" fill="none" stroke="#3a2e28" stroke-width="5"/>
  <text x="200" y="870" font-family="Playfair Display" font-style="italic" font-weight="700" font-size="30" fill="#5a4436">Léa, au micro, ce soir.</text>
  <g transform="rotate(-10 300 200)"><rect x="200" y="160" width="230" height="70" rx="10" fill="none" stroke="#c9502e" stroke-width="7"/><text x="315" y="208" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="34" fill="#c9502e" letter-spacing="3">À LA UNE</text></g>
  ${col(930, 690, 7)}${col(1240, 690, 7)}${col(1550, 690, 6)}
  <path d="M1220 680 V860 M1530 680 V860" stroke="#d8ccb6" stroke-width="3"/>
 </g>
 <g class="press" fill="#d9774b"><circle cx="1790" cy="270" r="9"/><circle cx="1790" cy="270" r="22" fill="none" stroke="#d9774b" stroke-width="4"/></g>`;
  },
},
};

// Headphones drawn on Léa's head (her 360×480 viewBox), inserted before the face-fx layer.
export const PHONES = `<g class="phones"><path d="M140 136 C128 66 196 30 238 58 C256 70 264 92 262 116" stroke="#2a2220" stroke-width="11" fill="none" stroke-linecap="round"/>
 <rect x="122" y="126" width="38" height="58" rx="16" fill="#2a2220"/><rect x="128" y="133" width="26" height="44" rx="11" fill="#d9774b"/></g>`;

// Demo-only CSS motion (the video build will re-create these with seek-safe GSAP).
export const SCENE_CSS = `
.rain{animation:rain linear infinite} @keyframes rain{from{transform:translate(0,-40px);opacity:0}20%{opacity:1}to{transform:translate(-10px,60px);opacity:0}}
.onlamp{animation:onair 3s ease-in-out infinite} .onglow{animation:onglow 3s ease-in-out infinite} @keyframes onair{50%{fill:#e8664f}} @keyframes onglow{50%{opacity:.6}}
.lampLight{animation:lamp 6s ease-in-out infinite} @keyframes lamp{50%{opacity:.85}}
.needle{transform-origin:50% 100%;transform-box:fill-box;animation:needle 1.1s ease-in-out infinite}
@keyframes needle{0%,100%{transform:rotate(-34deg)}20%{transform:rotate(12deg)}35%{transform:rotate(-8deg)}55%{transform:rotate(26deg)}75%{transform:rotate(-14deg)}}
.flick{animation:flick 5s steps(1) infinite} @keyframes flick{60%{opacity:.15}}
.steam2 path{animation:steam 3s ease-in-out infinite} .steam2 path+path{animation-delay:-1.4s} @keyframes steam{0%{transform:translateY(10px);opacity:0}40%{opacity:.8}100%{transform:translateY(-30px);opacity:0}}
.vinyl{animation:spin 2.4s linear infinite;transform-box:fill-box;transform-origin:center} .disc{animation:spin 9s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}
.sway2{animation:sw 5s ease-in-out infinite} @keyframes sw{50%{transform:rotate(2deg)}}
.sway3{animation:sw3 4s ease-in-out infinite} @keyframes sw3{50%{transform:rotate(-3deg)}}
.mote{animation:mote linear infinite} @keyframes mote{0%{transform:translate(0,0);opacity:0}30%{opacity:.9}100%{transform:translate(60px,-120px);opacity:0}}
.breathe{animation:catb 3.4s ease-in-out infinite} @keyframes catb{50%{transform:scale(1.03,1.05)}}
.zz text{animation:zz 3.4s ease-in-out infinite} .zz text+text{animation-delay:-1.7s} @keyframes zz{0%{opacity:0;transform:translateY(10px)}50%{opacity:1}100%{opacity:0;transform:translateY(-24px)}}
.bar{transform-origin:50% 50%;transform-box:fill-box;animation:bar ease-in-out infinite alternate} @keyframes bar{from{transform:scaleY(.12)}to{transform:scaleY(1)}}
.prog{stroke-dasharray:1400;animation:prog 14s linear infinite} @keyframes prog{from{stroke-dashoffset:1400}to{stroke-dashoffset:900}}
.bird{animation:bird linear infinite} @keyframes bird{from{transform:translateX(-100px)}to{transform:translateX(2050px)}}
.cloud2{animation:cloud linear infinite} @keyframes cloud{from{transform:translateX(-700px)}to{transform:translateX(1300px)}}
.sun{animation:sun 6s ease-in-out infinite} @keyframes sun{50%{opacity:.8}}
.scroll{animation:scrollx linear infinite} .s1{--w:-1200px;animation-duration:40s} .s2{--w:-1000px;animation-duration:16s} .s3{--w:-900px;animation-duration:6s} .s4{--w:-800px;animation-duration:2.2s}
@keyframes scrollx{from{transform:translateX(880px)}to{transform:translateX(calc(880px + var(--w)))}}
.snow{animation:snow linear infinite} @keyframes snow{from{transform:translate(0,-60px)}to{transform:translate(20px,440px)}}
.flame{transform-box:fill-box;transform-origin:50% 100%;animation:flame .9s ease-in-out infinite alternate} .f2{animation-duration:.7s} .f3{animation-duration:.5s}
@keyframes flame{from{transform:scale(1,1) skewX(0)}to{transform:scale(.92,1.12) skewX(4deg)}}
.fireGlow{animation:fglow 1.6s ease-in-out infinite alternate} @keyframes fglow{to{opacity:.7}}
.grille{animation:grille .5s ease-in-out infinite alternate} @keyframes grille{to{transform:scale(1.015)}}
.knob{animation:knob 4s ease-in-out infinite} @keyframes knob{50%{transform:rotate(25deg)}}
.tune{animation:tune 6s ease-in-out infinite alternate} @keyframes tune{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
.twinkle path{transform-box:fill-box;transform-origin:center;animation:tw 2.1s ease-in-out infinite} @keyframes tw{50%{transform:scale(.55) rotate(30deg);opacity:.5}}
.squig{stroke-dasharray:30 14;animation:squig 1.4s linear infinite} @keyframes squig{to{stroke-dashoffset:-88}}
.floaty{animation:floaty 6s ease-in-out infinite} @keyframes floaty{50%{transform:translateY(-6px) rotate(-.3deg)}}
.stampmark{animation:stamp 5s ease-in-out infinite} @keyframes stamp{50%{transform:rotate(-4deg)}}

.bulb{animation:bulb 2.4s ease-in-out infinite} @keyframes bulb{50%{fill:#f7c46b}}
.rame{animation:rame 7s ease-in-out infinite} @keyframes rame{0%,15%{transform:translateX(0)}60%,100%{transform:translateX(410px)}}
.press circle+circle{transform-box:fill-box;transform-origin:center;animation:press 1.6s ease-out infinite} @keyframes press{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
`;
