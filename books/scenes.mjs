// Cozy French Books — shared backdrop library. Every episode re-uses these and only adds its own
// characters (pups) and objects (props) in books/epNN/art.mjs:  page(SCENES.marche(), pups, props).
// Before drawing a new place, look here first; a new place that could serve another book belongs here, not in epNN/.
//
// A backdrop = { w, ground, amb, layers: [{ cls: sky|far|mid|near|fore|<overlay>, k, lift?, svg }] }
//   k = drift speed of the slow camera move · lift = px the layer is raised (feet must stay above y ≈ 800)
//   amb = ambience bed in tools/sfx.mjs (rain · birds · sea · market · wind · night · shop)
// Classes the build animates if present: .cloud .birds .wave .tuft .shHead .lamp .flag .twk .wnd .sand .spark
//
// id            place                                         used in
// campagne      countryside, ruined chapel + big tree, flock  ep01 (Andalousie; {flock:false, dusk:true} = trésor)
// chemin        green hills, road to a far cathedral          ep01 (Camino)
// interieur     whitewashed room, window on a road, table     ep01 (maison du père)
// placeMer      town square by the sea, fountain, bench       ep01 (Tarifa)
// mer           open sea at sunset, two far coasts            ep01 (détroit) — put kit BOAT() on it
// marche        covered market, arches, stalls, lanterns      ep01 (Tanger)
// boutique      shop with shelves of glassware, window        ep01 (cristal) — .dust / .sparks to clean it
// oasis         palms, pool, well, tents, desert sunset       ep01
// desertNuit    desert at night, camp, wind swirls, dawn      ep01 (le vent) — beat `wind`, overlay .L-dawn
// pyramides     pyramids under the moon                       ep01
import { PAGE_ALCHIMISTE_1, PAGE_ALCHIMISTE_2 } from './art.mjs';
import { skyDef, sun, dunes, sea, palm, houses, stars, range, mk, icon } from './kit.mjs';

const cut = s => `<g filter="url(#pencil)">${s}</g>`;

export const SCENES = {
  campagne({ flock = true, dusk = false } = {}) {
    const p = PAGE_ALCHIMISTE_1(), lift = { far: 40, mid: 70, near: 160 }, K = { sky: .1, far: .6, mid: .8, near: 1, fore: 1.25 };
    const layers = p.layers.map(L => ({ ...L, k: K[L.cls], lift: lift[L.cls] || 0, svg: !flock && L.cls === 'near' ? L.svg.replace(/<g class="flock">[\s\S]*$/, '') : L.svg }));
    if (dusk) layers.push({ cls: 'dusk', k: 0, svg: '<rect width="2600" height="1080" fill="#5a3a6a" opacity=".28"/>' });
    return { w: 2600, ground: '#8fae6b', amb: 'birds', layers };
  },
  chemin() {
    const p = PAGE_ALCHIMISTE_2(), lift = { far: 30, mid: 60, near: 160 };
    return { w: 2200, ground: '#7aa463', amb: 'birds', layers: p.layers.map(L => ({ ...L, lift: lift[L.cls] || 0 })) };
  },
  interieur() {
    return {
      w: 2100, ground: '#b9754f', amb: 'shop',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2100" height="1080" fill="#f3e6cf"/>${cut(`<rect x="0" y="0" width="2100" height="90" fill="#8a5e42"/>${range(9, i => `<rect x="${i * 240}" y="0" width="34" height="120" fill="#6b4a36"/>`)}`)}` },
        { cls: 'far', k: .4, svg: cut(`<defs>${skyDef('ms-sky', '#9cc3d8', '#e9f0e6')}</defs>
        <rect x="1180" y="230" width="420" height="330" fill="url(#ms-sky)"/><path d="M1180 470 C1260 440 1340 480 1420 455 C1500 430 1560 470 1600 460 V560 H1180Z" fill="#a9c39a"/>
        <path d="M1260 560 C1330 520 1400 500 1460 470" stroke="#e8d3a6" stroke-width="22" fill="none" stroke-linecap="round"/>
        <rect x="1180" y="230" width="420" height="330" fill="none" stroke="#8a5e42" stroke-width="22"/><path d="M1390 230 V560" stroke="#8a5e42" stroke-width="10"/>
        <path d="M1140 220 h50 v350 h-50Z M1590 220 h50 v350 h-50Z" fill="#5b7398"/>
        <rect x="1160" y="560" width="460" height="22" rx="6" fill="#8a5e42"/>`) },
        { cls: 'mid', k: .7, svg: cut(`<rect x="0" y="760" width="2100" height="320" fill="#b9754f"/>${range(12, i => `<path d="M${i * 180} 760 V1080" stroke="#a5653f" stroke-width="5"/>`)}
        <rect x="240" y="240" width="300" height="16" fill="#8a5e42"/>${range(4, i => `<path d="M${270 + i * 70} 240 c-20 -10 -20 -50 0 -60 c20 10 20 50 0 60Z" fill="${['#c9693f', '#d99a52', '#8fae8b', '#c9693f'][i]}"/>`)}
        <path d="M660 160 V300" stroke="#3a2e28" stroke-width="4"/><circle cx="660" cy="320" r="26" fill="#3a2e28"/><path d="M640 330 h40 l-6 30 h-28Z" fill="#c9693f"/>
        <circle cx="900" cy="330" r="64" fill="#fffaf0" stroke="#8a5e42" stroke-width="8"/><path d="M900 290 V330 L930 344" stroke="#3a2e28" stroke-width="6" fill="none" stroke-linecap="round"/>`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="440" y="600" width="560" height="26" rx="6" fill="#8a5e42"/><path d="M480 626 V790 M960 626 V790" stroke="#6b4a36" stroke-width="22"/>
        <path d="M520 600 c0 -40 70 -40 70 0Z" fill="#e8d3a6"/><circle cx="700" cy="590" r="16" fill="#fffaf0"/><rect x="760" y="560" width="40" height="40" rx="8" fill="#8fae8b"/>
        <path d="M1700 790 V340 C1700 300 1820 300 1820 340 V790Z" fill="#6b4a36"/><path d="M1716 790 V350 C1716 320 1804 320 1804 350 V790Z" fill="#8a5e42"/><circle cx="1790" cy="580" r="7" fill="#f3c96b"/>`) },
      ],
    };
  },
  placeMer({ flock = '' } = {}) {
    return {
      w: 2200, ground: '#e3cfa4', amb: 'sea',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('tf-sky', '#9cc6dc', '#dcecf0', '#f6efdc')}</defs><rect width="2200" height="1080" fill="url(#tf-sky)"/>${sun(1700, 220, 70)}
        <g fill="#fffaf0" opacity=".9" filter="url(#pencil)"><path class="cloud" d="M400 200 c20 -50 90 -50 110 -10 c30 -30 90 -10 90 30 c40 0 50 50 10 60 H400 c-40 -10 -40 -70 0 -80Z"/></g>` },
        { cls: 'far', k: .4, svg: cut(`${sea(2200, 520, '#8fb4c8', '#b4d0de')}<path d="M1300 520 C1450 490 1700 486 2200 500 V520 H1300Z" fill="#b8a98c" opacity=".7"/>`) },
        { cls: 'mid', k: .7, svg: cut(`${houses(60, 12, 640, 5)}<g transform="translate(820 0)"><rect x="0" y="380" width="120" height="260" fill="#e9dcc4"/>${range(4, i => `<rect x="${i * 32}" y="360" width="20" height="24" fill="#e9dcc4"/>`)}<rect x="44" y="460" width="30" height="40" rx="15" fill="#5a4636"/></g>
        ${houses(1000, 10, 650, 9)}${palm(1560, 700, 1.1)}`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="690" width="2200" height="390" fill="#e3cfa4"/>${range(14, i => `<path d="M${i * 170} 700 L${i * 170 - 120} 1080" stroke="#d4bd90" stroke-width="5"/>`)}
        <g transform="translate(1180 0)"><ellipse cx="0" cy="760" rx="150" ry="30" fill="#c9b48a"/><rect x="-120" y="700" width="240" height="60" fill="#dcc6a0"/><ellipse cx="0" cy="700" rx="120" ry="24" fill="#8fb4c8"/><path d="M0 700 V630" stroke="#c9b48a" stroke-width="16"/><path class="jet" d="M0 630 c-30 -10 -50 20 -60 60 M0 630 c30 -10 50 20 60 60" stroke="#b4d0de" stroke-width="7" fill="none" stroke-linecap="round"/></g>
        <rect x="420" y="700" width="380" height="22" rx="6" fill="#8a5e42"/><path d="M440 722 V790 M780 722 V790" stroke="#6b4a36" stroke-width="16"/>`) + flock },
      ],
    };
  },
  mer() {
    return {
      w: 2200, ground: '#7fa7bf', amb: 'sea',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('dt-sky', '#f0a36a', '#f8d39a', '#fbe7c4')}</defs><rect width="2200" height="1080" fill="url(#dt-sky)"/>${sun(1500, 380, 76)}
        <g class="birds" fill="none" stroke="#7a4a32" stroke-width="4" stroke-linecap="round"><path d="M700 260 q12 -12 24 0 q12 -12 24 0"/><path d="M780 220 q9 -9 18 0 q9 -9 18 0"/></g>` },
        { cls: 'far', k: .4, svg: cut(`<path d="M0 560 C120 470 260 500 380 540 C440 556 480 560 520 570 V600 H0Z" fill="#c99a7a"/>
        <path d="M1500 580 C1600 540 1800 530 2200 540 V600 H1500Z" fill="#d9b48a"/>${houses(1640, 8, 560, 12, '#fbf4e6', null)}<rect x="1820" y="440" width="22" height="100" fill="#f6eddc"/><circle cx="1831" cy="436" r="12" fill="#f6eddc"/>`) },
        { cls: 'mid', k: .7, svg: cut(sea(2200, 590, '#7fa7bf', '#a8c8da')) },
        { cls: 'near', k: 1, svg: '' },
        { cls: 'fore', k: 1.2, svg: cut(`<path d="M0 860 C300 830 600 880 900 850 C1200 820 1500 870 2200 840 V1080 H0Z" fill="#6f98b2"/>`) },
      ],
    };
  },
  marche() {
    const g = mk(91);
    const arch = x => `<path d="M${x} 760 V420 C${x} 300 ${x + 240} 300 ${x + 240} 420 V760" fill="none" stroke="#c9824a" stroke-width="34"/>`;
    return {
      w: 2200, ground: '#d9b48a', amb: 'market',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2200" height="1080" fill="#e9c08a"/>${cut(`<rect x="0" y="0" width="2200" height="240" fill="#f6dcae"/>`)}` },
        { cls: 'far', k: .4, svg: cut(`<rect x="0" y="240" width="2200" height="540" fill="#e2a86e"/>${range(9, i => arch(i * 250 + 10))}${range(9, i => `<path d="M${i * 250 + 40} 760 V440 C${i * 250 + 40} 350 ${i * 250 + 220} 350 ${i * 250 + 220} 440 V760Z" fill="#b8704a" opacity=".55"/>`)}`) },
        { cls: 'mid', k: .7, svg: cut(`${range(6, i => { const x = 120 + i * 360, c = ['#c9693f', '#5b7398', '#8fae8b', '#d99a52', '#7a5a8c', '#c9502e'][i];
        return `<path d="M${x} 520 h260 l30 60 h-320Z" fill="${c}"/>${range(5, k => `<path d="M${x + 10 + k * 56} 520 l-10 60" stroke="#fffaf0" stroke-width="12" opacity=".6"/>`)}<rect x="${x}" y="640" width="260" height="120" fill="#8a5e42"/>
        ${range(3, k => `<path d="M${x + 20 + k * 80} 640 c10 -40 50 -40 60 0Z" fill="${g.pick(['#d9774b', '#f3c96b', '#b8552a', '#8fae6b'])}"/>`)}`; })}
        ${range(8, i => `<g class="lamp"><path d="M${200 + i * 260} 240 V300" stroke="#5a3a28" stroke-width="3"/>${icon('lantern', 1.1, 200 + i * 260, 330)}</g>`)}`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="760" width="2200" height="320" fill="#d9b48a"/>${range(16, i => `<path d="M${i * 150} 770 h90" stroke="#c99d72" stroke-width="6" stroke-linecap="round"/>`)}`) },
      ],
    };
  },
  boutique() {
    const g = mk(71);
    const glasses = range(3, r => range(7, c => { const x = 240 + c * 90 + (r % 2) * 20, y = 300 + r * 130; const t = (r + c) % 3;
      return t === 0 ? `<path d="M${x} ${y} h36 l-6 50 h-24Z" fill="#cfe4ec" stroke="#8fb4c8" stroke-width="3"/>`
        : t === 1 ? `<ellipse cx="${x + 18}" cy="${y + 30}" rx="22" ry="26" fill="#d6ecf2" stroke="#8fb4c8" stroke-width="3"/><rect x="${x + 12}" y="${y - 6}" width="12" height="14" fill="#d6ecf2"/>`
        : `<path d="M${x} ${y + 10} h40 l-10 22 h-20Z M${x + 20} ${y + 32} v18 M${x + 8} ${y + 52} h24" fill="#cfe4ec" stroke="#8fb4c8" stroke-width="3"/>`; }));
    const dust = range(40, () => `<circle cx="${g.R(220, 900).toFixed(0)}" cy="${g.R(290, 680).toFixed(0)}" r="${g.R(8, 20).toFixed(0)}" fill="#a88a68" opacity="${g.R(.25, .5).toFixed(2)}"/>`);
    const sparks = range(10, i => `<path class="spark" d="M0 -16 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4Z" fill="#fffaf0" transform="translate(${260 + (i * 67) % 640} ${310 + (i * 113) % 360})"/>`);
    return {
      w: 2100, ground: '#c9a27a', amb: 'shop',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2100" height="1080" fill="#ead2ae"/>` },
        { cls: 'far', k: .4, svg: cut(`<rect x="160" y="230" width="820" height="480" fill="#8a5e42"/>${range(4, r => `<rect x="180" y="${350 + r * 130}" width="780" height="14" fill="#6b4a36"/>`)}<g>${glasses}</g>
        <defs>${skyDef('cr-sky', '#9cc6dc', '#f6e2bc')}</defs><rect x="1180" y="220" width="560" height="380" rx="10" fill="url(#cr-sky)"/>
        <path d="M1180 560 L1740 380 V600 H1180Z" fill="#e9dcc4"/>${houses(1220, 8, 560, 21, '#fbf4e6', null).replace(/rect x="(\d+)" y="(\d+)"/g, (m, x, y) => `rect x="${x}" y="${+y - (+x - 1220) * .3}"`)}
        <rect x="1180" y="220" width="560" height="380" rx="10" fill="none" stroke="#6b4a36" stroke-width="20"/>`) + `<g class="dust">${dust}</g><g class="sparks">${sparks}</g>` },
        { cls: 'mid', k: .7, svg: '' },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="770" width="2100" height="310" fill="#c9a27a"/><rect x="560" y="600" width="760" height="170" rx="8" fill="#8a5e42"/><rect x="560" y="590" width="760" height="22" rx="6" fill="#a8703f"/>
        ${range(6, i => `<path d="M${600 + i * 120} 650 h60" stroke="#6b4a36" stroke-width="6"/>`)}`) },
      ],
    };
  },
  oasis() {
    return {
      w: 2200, ground: '#e3c08a', amb: 'birds',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('oa-sky', '#e98a5f', '#f6c48a', '#fbe3b8')}</defs><rect width="2200" height="1080" fill="url(#oa-sky)"/>${sun(1650, 420, 90, '#fff1cf')}` },
        { cls: 'far', k: .4, svg: cut(`${dunes(2200, 600, '#e8b874', 5)}${range(5, i => `<path d="M${200 + i * 380} 640 l60 -70 l60 70Z" fill="#f6eddc"/><path d="M${260 + i * 380} 570 V640" stroke="#c9693f" stroke-width="4"/>`)}`) },
        { cls: 'mid', k: .7, svg: cut(`${dunes(2200, 690, '#e3c08a', 8)}<ellipse cx="1100" cy="720" rx="260" ry="34" fill="#7fb0c4"/>${palm(800, 710, 1.1)}${palm(980, 700, .9)}${palm(1360, 715, 1.2)}${palm(1560, 705, .95)}${palm(300, 720, 1.1)}`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="770" width="2200" height="310" fill="#e3c08a"/>${palm(120, 820, 1.5)}${palm(2000, 830, 1.5)}
        <g transform="translate(700 0)"><ellipse cx="0" cy="770" rx="90" ry="22" fill="#a89878"/><rect x="-80" y="700" width="160" height="70" fill="#c9b8a0"/><ellipse cx="0" cy="700" rx="80" ry="18" fill="#5b7398"/><path d="M-70 700 V600 H70 V700 M-70 610 H70" stroke="#6b4a36" stroke-width="10" fill="none"/><path d="M0 610 V680" stroke="#8a7a6c" stroke-width="3"/></g>`) },
      ],
    };
  },
  desertNuit() {
    const g = mk(61);
    return {
      w: 2200, ground: '#6b5a7a', amb: 'wind',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('vt-sky', '#232a4a', '#3f4c6b', '#6b6a8a')}</defs><rect width="2200" height="1080" fill="url(#vt-sky)"/>${stars(2200, 560, 70, 4)}<circle cx="1600" cy="200" r="60" fill="#f6eddc"/><circle cx="1625" cy="185" r="56" fill="#3a4466"/>` },
        { cls: 'far', k: .4, svg: cut(`${dunes(2200, 620, '#4a4a6a', 2)}${range(4, i => `<path d="M${300 + i * 420} 650 l70 -80 l70 80Z" fill="#8a7a6c"/><path d="M${370 + i * 420} 570 V530" stroke="#5a4a40" stroke-width="4"/><path class="flag" d="M${370 + i * 420} 530 l34 10 l-34 10Z" fill="#c9502e"/>`)}`) },
        { cls: 'mid', k: .7, svg: cut(dunes(2200, 720, '#5a5070', 9)) },
        { cls: 'near', k: 1, svg: cut(`<path d="M0 820 C400 760 700 700 1000 690 C1300 700 1700 780 2200 800 V1080 H0Z" fill="#6b5a7a"/>`)
        + `<g class="windS" fill="none" stroke="#e9dcc4" stroke-width="7" stroke-linecap="round" opacity=".85">${range(6, i => `<path class="wnd w${i}" pathLength="1" stroke-dasharray=".35 .65" d="M${300 + i * 260} ${420 + (i % 3) * 70} C${500 + i * 260} ${340 + (i % 3) * 70} ${700 + i * 260} ${520 + (i % 3) * 70} ${560 + i * 260} ${560 + (i % 3) * 70} C${460 + i * 260} ${590 + (i % 3) * 70} ${470 + i * 260} ${470 + (i % 3) * 70} ${600 + i * 260} ${480 + (i % 3) * 70}"/>`)}</g>
        <g class="sand" fill="#e9dcc4">${range(40, () => `<circle cx="${g.R(200, 2000).toFixed(0)}" cy="${g.R(300, 760).toFixed(0)}" r="${g.R(2, 5).toFixed(1)}"/>`)}</g>` },
        { cls: 'dawn', k: 0, svg: `<defs><linearGradient id="vt-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c48a" stop-opacity="0"/><stop offset="1" stop-color="#f29b5f"/></linearGradient></defs><rect width="2200" height="1080" fill="url(#vt-dawn)"/>` },
      ],
    };
  },
  pyramides() {
    return {
      w: 2200, ground: '#c9a06a', amb: 'night',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('py-sky', '#2a3355', '#4a5578', '#8a7d8a')}</defs><rect width="2200" height="1080" fill="url(#py-sky)"/>${stars(2200, 500, 60, 7)}<circle cx="500" cy="200" r="58" fill="#f6eddc"/>` },
        { cls: 'far', k: .4, svg: cut(`${dunes(2200, 650, '#8a7a6a', 3)}<path d="M900 650 L1240 240 L1580 650Z" fill="#c9a06a"/><path d="M1240 240 L1300 650 L1580 650Z" fill="#a8804f"/>
        <path d="M1480 650 L1700 380 L1920 650Z" fill="#bf965f"/><path d="M1700 380 L1740 650 L1920 650Z" fill="#9c7648"/><path d="M640 650 L800 460 L960 650Z" fill="#b48c58"/>`) },
        { cls: 'mid', k: .7, svg: cut(dunes(2200, 730, '#b8925e', 6)) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="780" width="2200" height="300" fill="#c9a06a"/><path class="pile" d="M560 790 C580 740 680 740 700 790Z" fill="#a8804f"/>`) },
      ],
    };
  },
};

/* a page = a backdrop + this book's characters + objects */
export const page = (scene, pups = [], props = '') => ({ ...scene, pups, props });
