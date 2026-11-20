// Cozy French Books — reusable drawing kit (every episode). Book-specific tableaux live in books/epNN/art.mjs
// and are built from these pieces, so a new book only needs a few scenes + a plan.
//   PERSON(o)            — paper puppet, feet at (0,0), facing right, ~250 px tall
//   ICON[name]           — small doodles (64×64, centred) for thought bubbles, chapter cards, carnet
//   bubble(icon)         — thought bubble with an icon (SVG markup, 300×230)
//   sky / sun / hills / sea / dunes / palm / houses / stars — scenery helpers (SVG markup)
//   MAP(stops)           — journey map / progress bar, any number of stops
import { range, mk } from './art.mjs';
export { range, mk };

/* ---------------- puppets ---------------- */
export function PERSON(o = {}) {
  // suit: jacket (robe colour) + trousers (legs colour) + tie (tie colour) instead of a robe · glasses: round spectacles
  const { robe = '#8a5e42', trim = '#5a3a28', skin = '#e8b591', hair = '#3a2620', beard = null, head = 'none', headC = '#f3e6cf', old = false, prop = '', suit = false, legs = '#3a3a48', tie = '#8a3f3f', glasses = false } = o;
  const curls = (y0 = -238) => range(4, i => `<circle cx="${-24 + i * 13}" cy="${y0 + (i % 2) * 4}" r="8" fill="${hair}"/>`);
  const hw = {
    none: `<path d="M-30 -214 C-34 -252 22 -262 32 -230 C22 -240 4 -242 -8 -236 C-14 -228 -22 -224 -30 -214Z" fill="${hair}"/>${range(4, i => `<circle cx="${-24 + i * 13}" cy="${-242 + (i % 2) * 4}" r="9" fill="${hair}"/>`)}`,
    turban: `<path d="M-34 -222 C-38 -266 34 -268 34 -226 C24 -236 -24 -236 -34 -222Z" fill="${headC}"/><path d="M-30 -238 C-10 -252 14 -252 32 -236" stroke="${trim}" stroke-width="4" fill="none" opacity=".5"/>`,
    scarf: `<path d="M-36 -160 C-46 -220 -30 -262 4 -262 C38 -262 46 -220 34 -176 C22 -204 18 -226 2 -230 C-16 -228 -26 -200 -36 -160Z" fill="${headC}"/>`,
    crown: `<path d="M-30 -214 C-34 -250 30 -256 32 -222" fill="#f6f0e4"/><path d="M-22 -244 l8 -20 l8 14 l8 -18 l8 18 l8 -14 l6 20Z" fill="#e8b35c" stroke="#b07a26" stroke-width="2"/>`,
    hood: `<path d="M-38 -170 C-48 -230 -28 -266 4 -266 C40 -266 48 -226 38 -180 C30 -210 22 -228 2 -232 C-18 -230 -28 -206 -38 -170Z" fill="${headC}"/>`,
    fez: `${range(4, i => `<circle cx="${-24 + i * 13}" cy="${-238 + (i % 2) * 4}" r="8" fill="${hair}"/>`)}<path d="M-20 -238 L-16 -266 H16 L20 -238Z" fill="${headC}"/>`,
    bowler: `${curls(-232)}<path d="M-28 -236 C-30 -276 30 -276 28 -236Z" fill="${headC}"/><ellipse cx="2" cy="-236" rx="44" ry="7" fill="${headC}"/>`,
    bun: `<path d="M-32 -206 C-40 -252 18 -266 34 -230 C22 -242 2 -244 -10 -238 C-18 -230 -26 -222 -32 -206Z" fill="${hair}"/><circle cx="-26" cy="-246" r="17" fill="${hair}"/>`,
    beret: `${curls(-234)}<ellipse cx="-2" cy="-244" rx="38" ry="13" fill="${headC}" transform="rotate(-8 -2 -244)"/><path d="M2 -256 v-8" stroke="${headC}" stroke-width="5" stroke-linecap="round"/>`,
  }[head];
  const body = suit
    ? `<path d="M-30 -80 H30 L28 0 H4 L0 -60 L-4 0 H-28Z" fill="${legs}"/>
 <ellipse cx="-16" cy="-2" rx="16" ry="7" fill="#2a2220"/><ellipse cx="18" cy="-2" rx="16" ry="7" fill="#2a2220"/>
 <path d="M-42 -172 C-50 -130 -50 -90 -46 -66 H46 C50 -90 50 -130 42 -172 C30 -190 -30 -190 -42 -172Z" fill="${robe}"/>
 <path d="M-12 -186 L0 -150 L12 -186Z" fill="#fbf4e6"/><path d="M-3 -176 L3 -176 L6 -132 L0 -124 L-6 -132Z" fill="${tie}"/>
 <path d="M-14 -186 L-2 -140 L-20 -150Z M14 -186 L2 -140 L20 -150Z" fill="${trim}" opacity=".55"/><circle cx="0" cy="-100" r="3.5" fill="${trim}"/><circle cx="0" cy="-82" r="3.5" fill="${trim}"/>`
    : `<path d="M-44 -170 C-52 -120 -56 -40 -52 0 H52 C56 -40 52 -120 44 -170 C30 -190 -30 -190 -44 -170Z" fill="${robe}"/>
 <path d="M-52 0 H52 L50 -14 H-50Z" fill="${trim}" opacity=".7"/><path d="M0 -186 V-6" stroke="${trim}" stroke-width="5" opacity=".45"/>`;
  return `<g class="pBody">
 ${body}
 <rect x="-10" y="-202" width="20" height="20" rx="6" fill="${skin}" filter="brightness(.92)"/>
 <g class="pHead">
  <circle cx="0" cy="-214" r="31" fill="${skin}"/>
  ${hw}
  <ellipse cx="13" cy="-216" rx="3.5" ry="${old ? 3 : 5}" fill="#2a1e18"/>
  ${old ? `<path d="M6 -226 q8 -4 16 0" stroke="${beard || '#cfc6b8'}" stroke-width="4" fill="none" stroke-linecap="round"/>` : ''}
  ${glasses ? `<circle cx="14" cy="-216" r="11" fill="#fffaf044" stroke="#3a2e28" stroke-width="3"/><path d="M3 -218 H-18" stroke="#3a2e28" stroke-width="3"/>` : ''}
  ${beard ? `<path d="M-14 -200 C-12 -168 6 -150 18 -156 C30 -164 32 -186 28 -204 C20 -194 4 -194 -14 -200Z" fill="${beard}"/>` : `<path d="M9 -199 q8 5 15 -1" stroke="#8a3a2c" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="21" cy="-204" r="6" fill="#e8907e" opacity=".45"/>`}
 </g>
 <g class="pArm"><path d="M26 -172 C42 -150 46 -128 44 -110" stroke="${robe}" stroke-width="18" fill="none" stroke-linecap="round" filter="brightness(.9)"/><circle cx="44" cy="-106" r="10" fill="${skin}"/>${prop}</g>
</g>`;
}
export const STAFF = '<path d="M50 -4 L46 -258 C46 -284 74 -286 74 -262" stroke="#7a5038" stroke-width="8" fill="none" stroke-linecap="round"/>';

/* ---------------- icons (64×64 box centred on 0,0) ---------------- */
export const ICON = {
  treasure: `<rect x="-26" y="-6" width="52" height="30" rx="5" fill="#8a5e42"/><path d="M-26 -4 C-26 -30 26 -30 26 -4Z" fill="#a8703f"/><rect x="-6" y="-2" width="12" height="12" fill="#f3c96b"/><path d="M-18 -26 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3Z" fill="#f3c96b"/>`,
  pyramids: `<path d="M-30 22 L-4 -22 L22 22Z" fill="#e8b35c"/><path d="M-4 -22 L4 22 L22 22Z" fill="#c9823f"/><path d="M8 22 L22 0 L36 22Z" fill="#d99a52"/><circle cx="22" cy="-20" r="8" fill="#f3c96b"/>`,
  church: `<path d="M-24 24 V-6 L0 -22 L24 -6 V24Z" fill="#dcc6a0"/><rect x="-6" y="6" width="12" height="18" rx="6" fill="#5a4636"/><path d="M0 -22 V-34 M-6 -29 H6" stroke="#8a5e42" stroke-width="4"/>`,
  road: `<path d="M-30 26 C-10 6 10 0 4 -10 C-2 -20 14 -26 24 -28" stroke="#e8d3a6" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="24" cy="-28" r="7" fill="#e2733f"/>`,
  coins: `${[[-14, 6], [10, 10], [-2, -12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#f3c96b" stroke="#c9963f" stroke-width="4"/>`).join('')}`,
  heart: `<path d="M0 22 C-34 0 -30 -26 -12 -26 C-4 -26 0 -18 0 -14 C0 -18 4 -26 12 -26 C30 -26 34 0 0 22Z" fill="#e8907e"/>`,
  ship: `<path d="M-30 6 H30 L20 20 H-20Z" fill="#8a5e42"/><path d="M0 4 V-30" stroke="#5a3a28" stroke-width="4"/><path d="M2 -28 L24 0 H2Z" fill="#fffaf0"/><path d="M-2 -22 L-20 0 H-2Z" fill="#f6eddc"/><path d="M-34 24 q8 -6 16 0 q8 6 16 0 q8 -6 16 0 q8 6 16 0" stroke="#5b7398" stroke-width="4" fill="none"/>`,
  city: `<rect x="-30" y="0" width="22" height="22" fill="#fbf4e6"/><rect x="-6" y="-8" width="20" height="30" fill="#f6eddc"/><rect x="16" y="4" width="16" height="18" fill="#fbf4e6"/><rect x="-2" y="-30" width="8" height="24" fill="#e9dcc4"/><circle cx="2" cy="-32" r="5" fill="#e9dcc4"/><path d="M-36 24 H36" stroke="#c9a77c" stroke-width="4"/>`,
  stones: `<ellipse cx="-12" cy="4" rx="15" ry="12" fill="#3a2e28"/><ellipse cx="14" cy="6" rx="14" ry="11" fill="#fbf4e6" stroke="#c9b8a4" stroke-width="3"/><path d="M-18 -2 l6 -4" stroke="#7a6a5c" stroke-width="3" stroke-linecap="round"/>`,
  globe: `<circle r="26" fill="#8fb4c8"/><path d="M-14 -16 C-4 -10 -10 0 -2 6 C6 12 0 20 -6 24 M10 -22 C18 -14 12 -6 20 0" stroke="#7fa05c" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  glass: `<path d="M-16 -24 H16 L10 6 H-10Z" fill="#cfe4ec" stroke="#8fb4c8" stroke-width="3"/><path d="M0 6 V20 M-12 22 H12" stroke="#8fb4c8" stroke-width="4" stroke-linecap="round"/><path d="M-8 -18 l3 12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  tea: `<path d="M-18 -10 H18 L14 20 H-14Z" fill="#cfe4ec" stroke="#8fb4c8" stroke-width="3"/><rect x="-14" y="2" width="28" height="16" fill="#c9823f" opacity=".7"/><path d="M-6 -16 c-6 -8 6 -12 0 -22 M6 -16 c-6 -8 6 -12 0 -22" stroke="#c9b8a4" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  wind: `<path d="M-30 -10 H14 C30 -10 30 -28 16 -28 M-30 4 H24 C40 4 40 24 24 24 M-24 16 H4" stroke="#8fb4c8" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  question: `<text x="0" y="22" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="62" fill="#b8552a">?</text>`,
  sheep: `${[[-12, -4, 13], [4, -10, 14], [16, -2, 12], [-2, 6, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6eddc" stroke="#d6c9b4" stroke-width="2"/>`).join('')}<ellipse cx="26" cy="-6" rx="9" ry="11" fill="#3a2e28"/><path d="M-8 14 v12 M8 14 v12" stroke="#3a2e28" stroke-width="5"/>`,
  book: `<path d="M-30 -20 C-14 -26 -4 -22 0 -16 C4 -22 14 -26 30 -20 V22 C14 16 4 20 0 26 C-4 20 -14 16 -30 22Z" fill="#fbf4e6" stroke="#8a5e42" stroke-width="3"/><path d="M0 -16 V26" stroke="#8a5e42" stroke-width="3"/>`,
  star: `<path d="M0 -26 l7 17 l18 1 l-14 12 l5 18 l-16 -10 l-16 10 l5 -18 l-14 -12 l18 -1Z" fill="#f3c96b" stroke="#c9963f" stroke-width="3"/>`,
  sun: `<circle r="16" fill="#f3c96b"/>${range(8, i => `<path d="M0 -22 V-30" stroke="#e8b35c" stroke-width="5" stroke-linecap="round" transform="rotate(${i * 45})"/>`)}`,
  door: `<rect x="-20" y="-28" width="40" height="54" rx="20" fill="#8a5e42"/><rect x="-14" y="-22" width="28" height="48" rx="14" fill="#f3c96b" opacity=".8"/><circle cx="8" cy="2" r="3" fill="#5a3a28"/>`,
  phone: `<rect x="-14" y="-26" width="28" height="52" rx="7" fill="#3a2e28"/><rect x="-10" y="-20" width="20" height="36" rx="3" fill="#cfe4ec"/>`,
  calendar: `<rect x="-24" y="-20" width="48" height="44" rx="6" fill="#fffaf0" stroke="#8a7a6c" stroke-width="3"/><rect x="-24" y="-20" width="48" height="12" rx="4" fill="#e8907e"/><path d="M-12 4 h6 M2 4 h6 M-12 14 h6" stroke="#8a7a6c" stroke-width="4"/>`,
  search: `<circle cx="-4" cy="-4" r="16" fill="#cfe4ec" stroke="#3a2e28" stroke-width="5"/><path d="M8 8 L22 22" stroke="#3a2e28" stroke-width="7" stroke-linecap="round"/>`,
  moon: `<circle r="24" fill="#f6eddc"/><circle cx="-8" cy="-6" r="5" fill="#e3d6bf"/><circle cx="9" cy="8" r="4" fill="#e3d6bf"/><circle cx="6" cy="-12" r="2.5" fill="#e3d6bf"/>`,
  sixpence: `<circle r="22" fill="#d6d6d0" stroke="#9a9a92" stroke-width="4"/><text x="0" y="9" text-anchor="middle" font-family="Playfair Display" font-weight="700" font-size="24" fill="#7a7a72">6d</text>`,
  palette: `<path d="M-28 4 C-34 -22 -6 -32 14 -26 C34 -20 34 0 20 4 C10 6 12 16 4 22 C-10 30 -24 22 -28 4Z" fill="#e8d3a6" stroke="#a8803f" stroke-width="3"/>${[[-14, -12, '#c9502e'], [2, -18, '#f3c96b'], [16, -10, '#5b7398'], [-16, 6, '#5f8f5a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/>`).join('')}<path d="M10 30 L34 -2" stroke="#7a5038" stroke-width="5" stroke-linecap="round"/><path d="M34 -2 l4 -8" stroke="#c9502e" stroke-width="6" stroke-linecap="round"/>`,
  letter: `<rect x="-28" y="-18" width="56" height="38" rx="4" fill="#fffaf0" stroke="#a8906c" stroke-width="3"/><path d="M-28 -16 L0 6 L28 -16" stroke="#a8906c" stroke-width="3" fill="none"/><circle cx="0" cy="8" r="6" fill="#c9502e"/>`,
  typewriter: `<path d="M-24 -10 L-18 -30 H18 L24 -10Z" fill="#fffaf0" stroke="#a8906c" stroke-width="2"/><rect x="-32" y="-12" width="64" height="30" rx="6" fill="#3a3a48"/><rect x="-36" y="-16" width="72" height="8" rx="4" fill="#5a5a68"/>${range(3, r => range(6 - r, k => `<circle cx="${-20 + k * 8 + r * 4}" cy="${-2 + r * 7}" r="2.6" fill="#e9dcc4"/>`)).toString()}`,
  cabin: `<path d="M-30 24 V-4 L0 -26 L30 -4 V24Z" fill="#a8703f"/><path d="M-34 -2 L0 -30 L34 -2" stroke="#6b4530" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="-8" y="4" width="14" height="20" fill="#5a3a28"/><rect x="12" y="0" width="10" height="10" fill="#f3c96b"/><path d="M-36 26 H36" stroke="#7fa05c" stroke-width="5"/>`,
  easel: `<path d="M-18 30 L-4 -28 M18 30 L4 -28 M0 -28 V30" stroke="#8a5e42" stroke-width="5" stroke-linecap="round"/><rect x="-22" y="-24" width="44" height="34" fill="#fffaf0" stroke="#a8906c" stroke-width="2"/><path d="M-16 4 C-8 -14 4 -2 16 -16" stroke="#5f8f5a" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="10" cy="-14" r="5" fill="#e2733f"/>`,
  lantern: `<path d="M0 -30 V-22" stroke="#5a3a28" stroke-width="3"/><path d="M-14 -22 H14 L18 14 H-18Z" fill="#f3c96b" stroke="#b07a26" stroke-width="3"/><rect x="-10" y="14" width="20" height="8" fill="#b07a26"/>`,
};
export const icon = (n, s = 1, x = 0, y = 0) => `<g transform="translate(${x} ${y}) scale(${s})">${ICON[n] || ''}</g>`;

/* thought bubble: tail points down-right */
export const bubble = (ic, flip = false) => `<svg viewBox="0 0 300 230" width="300" height="230"${flip ? ' style="transform:scaleX(-1)"' : ''}><g filter="url(#pencil)">
 <circle class="bt1" cx="268" cy="218" r="8" fill="#fffaf0" stroke="#c9a77c" stroke-width="3"/><circle class="bt2" cx="246" cy="196" r="12" fill="#fffaf0" stroke="#c9a77c" stroke-width="3"/>
 <path d="M40 110 C10 86 26 30 82 38 C98 4 168 -2 190 30 C228 6 288 22 286 70 C306 88 296 150 252 152 C244 186 186 196 162 172 C132 204 70 196 64 166 C22 168 10 132 40 110Z" fill="#fffaf0" stroke="#c9a77c" stroke-width="4"/>
 <g${flip ? ' transform="translate(300 0) scale(-1 1)"' : ''}>${icon(ic, 1.9, flip ? 148 : 152, 98)}</g></g></svg>`;

/* ---------------- scenery ---------------- */
export const skyDef = (id, a, b, c = b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
export const sun = (x, y, r = 80, c = '#fff1cf') => `<circle class="sunG" cx="${x}" cy="${y}" r="${r * 1.6}" fill="${c}" opacity=".2"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
export function hills(w, y, amp, c, seed, step = 300) {
  const g = mk(seed); let d = `M0 ${y}`, x = 0;
  while (x < w) { const nx = x + step, ny = y + g.R(-amp, amp); d += ` C${x + step * .4} ${y + g.R(-amp, amp)} ${nx - step * .4} ${ny} ${nx} ${ny}`; x = nx; }
  return `<path d="${d} V1080 H0Z" fill="${c}"/>`;
}
export const dunes = (w, y, c, seed) => hills(w, y, 40, c, seed, 420);
export const sea = (w, y, c = '#7fa7bf', c2 = '#9bbfd2') => `<rect x="0" y="${y}" width="${w}" height="${1080 - y}" fill="${c}"/>${range(Math.ceil(w / 160), i => `<path class="wave" d="M${i * 160} ${y + 30 + (i % 3) * 40} q20 -10 40 0 q20 10 40 0" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round"/>`)}`;
export const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C6 -80 -6 -160 10 -230" stroke="#8a5e42" stroke-width="18" fill="none" stroke-linecap="round"/>
 <g class="frond">${range(7, i => { const a = -170 + i * 30; return `<path d="M10 -230 q${Math.cos(a * Math.PI / 180) * 60} ${Math.sin(a * Math.PI / 180) * 40 - 30} ${Math.cos(a * Math.PI / 180) * 120} ${Math.sin(a * Math.PI / 180) * 60 + 10}" stroke="#5f8f5a" stroke-width="16" fill="none" stroke-linecap="round"/>`; })}</g></g>`;
export const houses = (x0, n, y, seed, col = '#fbf4e6', roof = '#c9693f') => { const g = mk(seed); return range(n, i => { const x = x0 + i * 52, h = g.R(44, 80), yy = y - (i % 3) * 18; return `<rect x="${x}" y="${yy - h}" width="50" height="${h}" fill="${col}"/>${roof ? `<path d="M${x - 4} ${yy - h} l29 -18 l29 18Z" fill="${roof}"/>` : ''}<rect x="${x + 18}" y="${yy - h + 16}" width="12" height="16" fill="#5b7398" opacity=".8"/>`; }); };
export const stars = (w, h, n, seed) => { const g = mk(seed); return range(n, () => `<circle class="twk" cx="${g.R(0, w).toFixed(0)}" cy="${g.R(0, h).toFixed(0)}" r="${g.R(1.5, 3.5).toFixed(1)}" fill="#fff6dc" opacity="${g.R(.5, 1).toFixed(2)}"/>`); };
export const tufts = (w, n, seed, c = '#5f7f45') => { const g = mk(seed); return range(n, () => { const x = g.R(0, w).toFixed(0), y = g.R(1000, 1080).toFixed(0); return `<path class="tuft" d="M${x} ${y} l-10 -40 M${x} ${y} l2 -48 M${x} ${y} l14 -38" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`; }); };

/* ---------------- journey map / progress bar ---------------- */
export function MAP(stops, title = '') {
  const W = 880, x0 = 80, x1 = W - 80, xs = stops.map((_, i) => x0 + (stops.length > 1 ? i * (x1 - x0) / (stops.length - 1) : 0));
  let d = `M${xs[0]} 74`; for (let i = 1; i < xs.length; i++) { const m = (xs[i - 1] + xs[i]) / 2; d += ` C${m - 30} ${i % 2 ? 50 : 98} ${m + 30} ${i % 2 ? 98 : 50} ${xs[i]} 74`; }
  return `<svg viewBox="0 0 ${W} 150" width="${W}" height="150">
 <g filter="url(#pencil)"><path d="M10 18 C200 6 680 6 870 18 L862 132 C680 142 200 142 18 132Z" fill="#f4e6c8" stroke="#c9a77c" stroke-width="4"/></g>
 ${title ? `<text x="440" y="40" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="15" letter-spacing="3" fill="#a08a70">${title.toUpperCase()}</text>` : ''}
 <path d="${d}" stroke="#d6c3a2" stroke-width="5" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>
 <path class="mapRoute" d="${d}" pathLength="1" stroke="#b8552a" stroke-width="5" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="butt"/>
 <path class="mapReturn" d="M${xs.at(-1)} 74 C${xs.at(-1) - 200} 140 ${xs[0] + 200} 140 ${xs[0]} 74" pathLength="1" stroke="#5b7398" stroke-width="4" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" stroke-linecap="butt"/>
 ${stops.map((n, i) => `<g class="stop st${i}" transform="translate(${xs[i]} 74)"><circle r="9" fill="#fbf4e6" stroke="#b8552a" stroke-width="4"/>
  <text y="40" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="30" fill="#5a3a28">${n}</text></g>`).join('')}
 <g class="mapPin" transform="translate(${xs[0]} 74)"><circle class="pinPulse" r="16" fill="#e2733f" opacity=".35"/><circle r="11" fill="#e2733f" stroke="#fffaf0" stroke-width="4"/></g>
</svg>`;
}
export const mapStopsX = n => Array.from({ length: n }, (_, i) => 80 + (n > 1 ? i * 720 / (n - 1) : 0));

/* ---------------- puppets & props ready to drop on a page (books/scenes.mjs → page(scene, pups, props)) ---------------- */
// pup: a PERSON puppet on a page. extra = { name, s, flip, hidden } — name is what plan.mjs beats use (`who`)
export const pup = (o, x, y, extra = {}) => ({ svg: `<g filter="url(#pencil)">${PERSON(o)}</g>`, x, y, ...extra });
// a puppet from ready-made markup (e.g. art.mjs SANTIAGO, PILGRIM)
export const pupSvg = (svg, x, y, extra = {}) => ({ svg: `<g filter="url(#pencil)">${svg}</g>`, x, y, ...extra });
// sailing boat with passengers ([svg, x] pairs, drawn at .6 scale on the deck); rocks with class .rock
export const BOAT = (passengers = []) => `<g filter="url(#pencil)"><g class="rock"><path d="M-170 -60 H170 L120 0 H-120Z" fill="#8a5e42"/><path d="M-160 -60 H160" stroke="#6b4a36" stroke-width="10"/>
      <path d="M-10 -60 V-330" stroke="#5a3a28" stroke-width="9"/><path d="M-4 -320 C70 -260 90 -170 80 -80 H-4Z" fill="#fffaf0"/><path d="M-16 -300 C-80 -240 -90 -160 -84 -84 H-16Z" fill="#f6eddc"/>
      ${passengers.map(([svg, x, s = .6]) => `<g transform="translate(${x} -54) scale(${s})">${svg}</g>`).join('')}</g></g>`;
// objects: class names are the ones the build hides at page start (chest, hole, tea, jar, jc, stones) — show them with a beat
const at = (cls, x, y, inner, style = '') => `<div class="prop ${cls}" style="left:${x}px;top:${y}px${style}">${inner}</div>`;
export const PROP = {
  chest: (x, y) => at('chest', x, y, `<svg viewBox="-40 -40 80 80" width="110" height="110">${icon('treasure', 1.2)}</svg>`),
  hole: (x, y) => at('hole', x, y, '', ';width:120px;height:36px;border-radius:50%;background:#6b4a36'),
  coins: (x, y) => at('coins', x, y, `<svg viewBox="-40 -40 80 80" width="90" height="90">${icon('coins', 1.1)}</svg>`),
  pouch: (x, y) => at('pouch', x, y, `<svg viewBox="-20 -24 40 48" width="44" height="52"><path d="M-14 -6 C-18 16 18 16 14 -6 C10 -14 -10 -14 -14 -6Z" fill="#a8703f"/><path d="M-10 -12 C-4 -18 4 -18 10 -12" stroke="#5a3a28" stroke-width="4" fill="none"/></svg>`),
  tea: (x, y) => at('tea', x, y, `<svg viewBox="-110 -50 220 100" width="220" height="100">${icon('tea', 1, -60, 0)}${icon('tea', 1, 0, 0)}${icon('tea', 1, 60, 0)}</svg>`),
  jar: (x, y) => at('jar', x, y, `<svg viewBox="-50 -70 100 130" width="100" height="130"><path d="M-36 -40 C-46 20 -40 50 0 50 C40 50 46 20 36 -40Z" fill="#d6ecf2" stroke="#8fb4c8" stroke-width="4" opacity=".9"/><rect x="-30" y="-56" width="60" height="18" rx="6" fill="#8a5e42"/>
        ${range(5, i => `<ellipse class="jc jc${i}" cx="${-14 + (i % 3) * 14}" cy="${40 - Math.floor(i / 1.6) * 12}" rx="14" ry="6" fill="#f3c96b" stroke="#c9963f" stroke-width="2"/>`)}</svg>`),
  stones: (x, y) => at('stones', x, y, `<svg viewBox="-40 -30 80 60" width="110" height="80">${icon('stones', 1.2)}</svg>`),
  icon: (cls, name, x, y, size = 100) => at(cls, x, y, `<svg viewBox="-40 -40 80 80" width="${size}" height="${size}">${icon(name, 1.1)}</svg>`),
};
