// Cozy French Books — shared backdrop library. Every episode re-uses these and only adds its own
// characters (pups) and objects (props) in books/epNN/art.mjs:  page(SCENES.marche(), pups, props).
// Before drawing a new place, look here first; a new place that could serve another book belongs here, not in epNN/.
//
// A backdrop = { w, ground, amb, layers: [{ cls: sky|far|mid|near|fore|<overlay>, k, lift?, svg }] }
//   k = drift speed of the slow camera move · lift = px the layer is raised (feet must stay above y ≈ 800)
//   amb = ambience bed in tools/sfx.mjs (rain · birds · sea · market · wind · night · shop)
// Classes the build animates if present: .cloud .birds .wave .tuft .shHead .lamp .flag .twk .wnd .sand .spark .smoke .fire .lampGlowP .moonG
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
// rueNuit       city street at night, terraced houses, gas lamps, big moon   ep02 (Londres; {moon:false})
// salon         bourgeois living room, fireplace, mirror, window, armchair   ep02 (la maison Strickland)
// bureau        office / work room, ledgers shelf, clock, arched windows      ep02 (la finance, la dactylographie)
// atelier       painter's attic studio, skylight on Paris roofs, easel        ep02 (Paris; {bed:true} = chez Dirk)
// etang         pond in the woods, wooden cabin with smoking chimney          ep02 (Walden)
import { PAGE_ALCHIMISTE_1, PAGE_ALCHIMISTE_2 } from './art.mjs';
import { skyDef, sun, hills, dunes, sea, palm, houses, stars, tufts, range, mk, icon } from './kit.mjs';

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
  rueNuit({ moon = true } = {}) {
    const g = mk(33);
    const terrace = (x0, n, y, cols) => range(n, i => { const x = x0 + i * 230, h = 300 + (i % 3) * 30, c = cols[i % cols.length];
      return `<rect x="${x}" y="${y - h}" width="220" height="${h}" fill="${c}"/><rect x="${x}" y="${y - h - 16}" width="220" height="16" fill="#5a3a30"/>
      <rect x="${x + 150}" y="${y - h - 70}" width="34" height="58" fill="#6b4a40"/>${range(3, k => `<rect x="${x + 152 + k * 11}" y="${y - h - 84}" width="8" height="16" fill="#c9693f"/>`)}
      ${range(2, r => range(2, k => `<rect x="${x + 30 + k * 100}" y="${y - h + 40 + r * 110}" width="60" height="80" fill="${g.r() < .55 ? '#f3c96b' : '#3f4c6b'}"/><path d="M${x + 60 + k * 100} ${y - h + 40 + r * 110} v80 M${x + 30 + k * 100} ${y - h + 80 + r * 110} h60" stroke="#5a3a30" stroke-width="4"/>`))}
      <rect x="${x + 80}" y="${y - 96}" width="60" height="96" rx="30" fill="#2f3a55"/><rect x="${x + 70}" y="${y - 10}" width="80" height="10" fill="#8a8278"/>`; });
    return {
      w: 2200, ground: '#6b6a7a', amb: 'night',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('rn-sky', '#1f2744', '#34405f', '#5a6080')}</defs><rect width="2200" height="1080" fill="url(#rn-sky)"/>${stars(2200, 420, 60, 3)}
        ${moon ? `<circle class="moonG" cx="1480" cy="210" r="150" fill="#f6eddc" opacity=".12"/><circle cx="1480" cy="210" r="92" fill="#f6eddc"/><circle cx="1450" cy="190" r="16" fill="#e3d6bf"/><circle cx="1510" cy="240" r="12" fill="#e3d6bf"/><circle cx="1500" cy="170" r="8" fill="#e3d6bf"/>` : ''}
        <g fill="#4a5578" opacity=".7" filter="url(#pencil)"><path class="cloud" d="M300 260 c20 -40 80 -40 100 -8 c30 -24 80 -6 80 26 c30 0 40 40 8 46 H300 c-34 -8 -34 -56 0 -64Z"/></g>` },
        { cls: 'far', k: .4, svg: cut(range(14, i => { const x = i * 170 - 40, h = 140 + (i * 53) % 90; return `<rect x="${x}" y="${560 - h}" width="160" height="${h + 40}" fill="#2f3854"/><rect x="${x + 110}" y="${560 - h - 40}" width="24" height="40" fill="#2f3854"/>${i % 2 ? `<rect x="${x + 30}" y="${600 - h}" width="22" height="28" fill="#c9a24a" opacity=".7"/>` : ''}`; })) },
        { cls: 'mid', k: .7, svg: cut(terrace(-20, 10, 770, ['#8a5a48', '#9c6a52', '#7a4e40'])) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="770" width="2200" height="310" fill="#6b6a7a"/>${range(30, i => `<path d="M${i * 80} 790 h56 M${i * 80 + 40} 830 h56" stroke="#5a5968" stroke-width="5" stroke-linecap="round"/>`)}
        ${[560, 1700].map(x => `<path d="M${x} 790 V420" stroke="#2a2a38" stroke-width="12"/><path d="M${x - 30} 790 h60" stroke="#2a2a38" stroke-width="14"/><path d="M${x - 28} 420 L${x - 20} 360 H${x + 20} L${x + 28} 420Z" fill="#f3c96b" stroke="#2a2a38" stroke-width="6"/><path d="M${x - 34} 360 L${x} 336 L${x + 34} 360Z" fill="#2a2a38"/>`).join('')}`)
        + [560, 1700].map(x => `<circle class="lampGlowP" cx="${x}" cy="392" r="90" fill="#f3c96b" opacity=".18"/>`).join('') },
      ],
    };
  },
  salon() {
    return {
      w: 2100, ground: '#7a5038', amb: 'shop',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2100" height="1080" fill="#e3cfae"/>${cut(`${range(22, i => `<rect x="${i * 100}" y="0" width="44" height="560" fill="#d8c09a" opacity=".6"/>`)}<rect x="0" y="560" width="2100" height="22" fill="#8a5e42"/><rect x="0" y="582" width="2100" height="200" fill="#b98a62"/>${range(12, i => `<rect x="${30 + i * 180}" y="610" width="140" height="140" rx="6" fill="none" stroke="#a5764e" stroke-width="5"/>`)}`)}` },
        { cls: 'far', k: .4, svg: cut(`<defs>${skyDef('sl-sky', '#8a98ae', '#c9cdd2')}</defs>
        <rect x="1220" y="180" width="420" height="400" fill="url(#sl-sky)"/>${range(6, i => `<rect x="${1230 + i * 70}" y="${430 - (i % 3) * 30}" width="60" height="${150 + (i % 3) * 30}" fill="#7a7a88"/><rect x="${1270 + i * 70}" y="${400 - (i % 3) * 30}" width="12" height="30" fill="#7a7a88"/>`)}
        <rect x="1220" y="180" width="420" height="400" fill="none" stroke="#fbf4e6" stroke-width="18"/><path d="M1430 180 V580 M1220 380 H1640" stroke="#fbf4e6" stroke-width="10"/>
        <path d="M1170 150 h70 c-10 160 -10 300 20 450 h-90Z M1620 150 h70 v450 h-90 c30 -150 30 -290 20 -450Z" fill="#8a3f3f"/><rect x="1150" y="140" width="560" height="20" rx="8" fill="#6b4a36"/>
        <rect x="280" y="420" width="420" height="360" fill="#e9dcc4"/><rect x="250" y="400" width="480" height="34" rx="6" fill="#fbf4e6"/><rect x="360" y="530" width="260" height="250" rx="120" fill="#3a2e28"/>
        <path class="fire" d="M420 770 C410 700 450 690 460 640 C480 690 520 700 500 770Z M480 770 C480 720 520 710 530 680 C550 720 560 740 540 770Z" fill="#e2733f"/><path d="M450 770 C450 730 470 720 476 700 C490 730 500 750 490 770Z" fill="#f3c96b"/>
        <rect x="370" y="180" width="240" height="200" rx="100" fill="#c9cdd2" stroke="#c9a24a" stroke-width="14"/><path d="M420 240 l40 -30 M440 280 l70 -60" stroke="#fffaf0" stroke-width="6" opacity=".6"/>
        <rect x="300" y="350" width="40" height="50" rx="6" fill="#c9a24a"/><circle cx="320" cy="368" r="12" fill="#fffaf0"/><path d="M640 400 V340 M652 400 V330" stroke="#fffaf0" stroke-width="10"/><path d="M640 334 c-6 -10 6 -14 0 -22 M652 324 c-6 -10 6 -14 0 -22" stroke="#f3c96b" stroke-width="5" fill="none"/>`) },
        { cls: 'mid', k: .7, svg: cut(`<rect x="0" y="770" width="2100" height="310" fill="#7a5038"/>${range(14, i => `<path d="M${i * 160} 770 L${i * 160 - 90} 1080" stroke="#6b4530" stroke-width="5"/>`)}<ellipse cx="1050" cy="880" rx="640" ry="90" fill="#8a3f3f"/><ellipse cx="1050" cy="880" rx="560" ry="70" fill="none" stroke="#c9a24a" stroke-width="6"/>`) },
        { cls: 'near', k: 1, svg: cut(`<ellipse cx="1000" cy="610" rx="180" ry="26" fill="#6b4a36"/><path d="M1000 630 V770 M940 790 L1000 760 L1060 790" stroke="#5a3a28" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="M1060 600 V520" stroke="#c9a24a" stroke-width="8"/><path d="M1020 520 L1036 460 H1084 L1100 520Z" fill="#f3c96b" stroke="#c9a24a" stroke-width="5"/>
        <path d="M1560 790 V620 C1560 520 1620 480 1720 480 C1820 480 1880 520 1880 620 V790Z" fill="#5b7398"/><rect x="1540" y="640" width="360" height="90" rx="30" fill="#6f87ab"/><path d="M1570 790 v16 M1870 790 v16" stroke="#3a2e28" stroke-width="12"/>`) },
      ],
    };
  },
  bureau() {
    return {
      w: 2100, ground: '#8a6a50', amb: 'shop',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2100" height="1080" fill="#e6dfcc"/>${cut(`<rect x="0" y="600" width="2100" height="180" fill="#9c7a5a"/><rect x="0" y="590" width="2100" height="16" fill="#6b4a36"/>`)}` },
        { cls: 'far', k: .4, svg: cut(`<defs>${skyDef('bu-sky', '#a3b2c2', '#dfe2e0')}</defs>${[1100, 1560].map(x => `<rect x="${x}" y="150" width="300" height="420" rx="150" fill="url(#bu-sky)"/>${range(4, i => `<rect x="${x + 10 + i * 70}" y="${380 + (i % 2) * 40}" width="58" height="200" fill="#8a8e9c"/>`)}<path d="M${x + 150} 160 V570 M${x} 360 H${x + 300}" stroke="#fbf4e6" stroke-width="10"/><rect x="${x}" y="150" width="300" height="420" rx="150" fill="none" stroke="#fbf4e6" stroke-width="16"/>`).join('')}
        <rect x="160" y="190" width="700" height="400" fill="#8a5e42"/>${range(3, r => `<rect x="175" y="${300 + r * 110}" width="670" height="12" fill="#6b4a36"/>${range(15, k => `<rect x="${185 + k * 44}" y="${222 + r * 110}" width="34" height="78" fill="${['#5b7398', '#8a3f3f', '#5f7f45', '#c9a24a'][(k + r) % 4]}"/>`)}`)}
        <circle cx="980" cy="260" r="54" fill="#fffaf0" stroke="#6b4a36" stroke-width="8"/><path d="M980 230 V260 L1004 272" stroke="#3a2e28" stroke-width="5" fill="none" stroke-linecap="round"/>`) },
        { cls: 'mid', k: .7, svg: cut(`<rect x="0" y="770" width="2100" height="310" fill="#8a6a50"/>${range(12, i => `<path d="M${i * 190} 770 V1080" stroke="#7a5a42" stroke-width="5"/>`)}`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="480" y="600" width="720" height="26" rx="6" fill="#6b4a36"/><rect x="500" y="626" width="200" height="160" fill="#7a5038"/><path d="M1170 626 V790" stroke="#5a3a28" stroke-width="20"/>
        <rect x="560" y="570" width="140" height="30" fill="#fffaf0"/><rect x="570" y="556" width="140" height="16" fill="#f3e6cf"/><path d="M760 600 V520" stroke="#3a6a4a" stroke-width="8"/><path d="M720 530 Q760 490 800 530Z" fill="#3a6a4a"/>`) },
      ],
    };
  },
  atelier({ bed = false } = {}) {
    const g = mk(44);
    return {
      w: 2200, ground: '#a8805a', amb: 'shop',
      layers: [
        { cls: 'sky', k: .1, svg: `<rect width="2200" height="1080" fill="#e8d9bf"/>${cut(`<path d="M0 0 H2200 V110 L0 260Z" fill="#c9b08a"/>${range(6, i => `<path d="M${i * 400} ${260 - i * 27} L${i * 400 + 60} 0" stroke="#8a5e42" stroke-width="22"/>`)}`)}` },
        { cls: 'far', k: .4, svg: cut(`<defs>${skyDef('at-sky', '#8fbad6', '#d6e6ec')}</defs><path d="M1100 200 L1720 120 V520 H1100Z" fill="url(#at-sky)"/>
        ${range(8, i => { const x = 1110 + i * 78, h = 90 + (i % 3) * 40; return `<rect x="${x}" y="${520 - h}" width="70" height="${h}" fill="#e9dcc4"/><path d="M${x - 4} ${520 - h} l39 -26 l39 26Z" fill="#7a8a9c"/><rect x="${x + 44}" y="${494 - h}" width="12" height="22" fill="#c9693f"/><rect x="${x + 14}" y="${540 - h}" width="12" height="18" fill="#5b7398" opacity=".7"/>`; })}
        <path d="M1100 200 L1720 120 V520 H1100Z" fill="none" stroke="#6b4a36" stroke-width="18"/><path d="M1410 160 V520 M1100 360 L1720 320" stroke="#6b4a36" stroke-width="9"/>
        ${[[180, 260, 200, 150, '#5f8f5a', '#e2733f'], [440, 300, 150, 190, '#c9502e', '#f3c96b'], [180, 450, 160, 120, '#5b7398', '#e8907e']].map(([x, y, w, h, a, b]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fffaf0" stroke="#8a5e42" stroke-width="10"/><path d="M${x + 14} ${y + h - 20} C${x + w * .3} ${y + h * .3} ${x + w * .6} ${y + h * .8} ${x + w - 14} ${y + 20}" stroke="${a}" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="${x + w * .7}" cy="${y + h * .35}" r="${Math.min(w, h) * .14}" fill="${b}"/>`).join('')}
        <rect x="660" y="430" width="300" height="14" fill="#8a5e42"/>${range(6, i => `<rect x="${672 + i * 48}" y="${388 + (i % 2) * 8}" width="30" height="${42 - (i % 2) * 8}" rx="5" fill="${['#c9502e', '#f3c96b', '#5b7398', '#5f8f5a', '#e8907e', '#7a5a8c'][i]}"/>`)}`) },
        { cls: 'mid', k: .7, svg: cut(`<rect x="0" y="770" width="2200" height="310" fill="#a8805a"/>${range(14, i => `<path d="M${i * 170} 770 L${i * 170 - 80} 1080" stroke="#97704c" stroke-width="5"/>`)}${range(18, () => `<circle cx="${g.R(100, 2100).toFixed(0)}" cy="${g.R(800, 1060).toFixed(0)}" r="${g.R(4, 10).toFixed(0)}" fill="${g.pick(['#c9502e', '#f3c96b', '#5b7398', '#5f8f5a'])}" opacity=".55"/>`)}`) },
        { cls: 'near', k: 1, svg: cut(`<path d="M600 790 L700 340 M820 790 L720 340 M710 360 V790" stroke="#7a5038" stroke-width="14" stroke-linecap="round"/><rect x="590" y="580" width="250" height="16" fill="#7a5038"/>
        <g class="canvas"><rect x="580" y="350" width="270" height="230" fill="#fffaf0" stroke="#a8906c" stroke-width="6"/><path d="M600 540 C660 420 740 520 830 400" stroke="#5f8f5a" stroke-width="22" fill="none" stroke-linecap="round"/><circle cx="780" cy="420" r="30" fill="#e2733f"/><path d="M610 560 h220" stroke="#c9693f" stroke-width="18"/></g>
        ${range(4, i => `<rect x="${1840 + i * 18}" y="${540 + i * 8}" width="200" height="250" fill="${['#fffaf0', '#e9dcc4', '#d8c7a6', '#fbf4e6'][i]}" stroke="#8a5e42" stroke-width="6" transform="rotate(${-6 + i * 3} ${1940 + i * 18} 790)"/>`)}
        ${bed ? `<rect x="1150" y="640" width="560" height="90" rx="14" fill="#8fa3b8"/><path d="M1160 720 C1300 650 1500 660 1700 690 V740 H1160Z" fill="#c9693f"/><rect x="1150" y="610" width="130" height="50" rx="20" fill="#fbf4e6"/><path d="M1140 790 V560 M1720 790 V620 M1140 740 H1720" stroke="#3a3a48" stroke-width="12" stroke-linecap="round"/>`
        : `<rect x="1300" y="660" width="120" height="16" rx="6" fill="#7a5038"/><path d="M1310 676 L1300 790 M1410 676 L1420 790" stroke="#5a3a28" stroke-width="12"/><rect x="1500" y="540" width="80" height="250" rx="10" fill="#3a3a48"/><path d="M1540 540 V300" stroke="#3a3a48" stroke-width="16"/>`}`) },
      ],
    };
  },
  etang() {
    return {
      w: 2200, ground: '#7aa463', amb: 'birds',
      layers: [
        { cls: 'sky', k: .1, svg: `<defs>${skyDef('et-sky', '#a9cfe0', '#e2efe6', '#f4f0dc')}</defs><rect width="2200" height="1080" fill="url(#et-sky)"/>${sun(1650, 220, 64)}
        <g fill="#fffaf0" opacity=".9" filter="url(#pencil)"><path class="cloud" d="M420 200 c20 -50 90 -50 110 -10 c30 -30 90 -10 90 30 c40 0 50 50 10 60 H420 c-40 -10 -40 -70 0 -80Z"/></g>
        <g class="birds" fill="none" stroke="#5a6a5a" stroke-width="4" stroke-linecap="round"><path d="M900 240 q12 -12 24 0 q12 -12 24 0"/><path d="M980 200 q9 -9 18 0 q9 -9 18 0"/></g>` },
        { cls: 'far', k: .4, svg: cut(`${hills(2200, 540, 30, '#9cbf8a', 17)}${range(26, i => { const x = i * 88 - 20, h = 130 + (i * 37) % 80; return `<path d="M${x} 600 L${x + 40} ${600 - h} L${x + 80} 600Z" fill="${i % 2 ? '#5f8f5a' : '#4f7f4a'}"/>`; })}`) },
        { cls: 'mid', k: .7, svg: cut(`<rect x="0" y="640" width="2200" height="440" fill="#8fb47a"/><ellipse cx="760" cy="720" rx="620" ry="70" fill="#7fb0c4"/>${range(8, i => `<path class="wave" d="M${300 + i * 110} ${700 + (i % 3) * 18} q20 -8 40 0 q20 8 40 0" stroke="#a8cad8" stroke-width="5" fill="none" stroke-linecap="round"/>`)}
        ${range(9, i => `<path d="M${150 + i * 26} 760 q-6 -50 4 -90" stroke="#5f7f45" stroke-width="6" fill="none" stroke-linecap="round"/>`)}`) },
        { cls: 'near', k: 1, svg: cut(`<rect x="0" y="770" width="2200" height="310" fill="#7aa463"/>
        <g transform="translate(1500 0)"><rect x="-170" y="560" width="340" height="230" fill="#a8703f"/>${range(6, i => `<path d="M-170 ${590 + i * 36} H170" stroke="#8a5e42" stroke-width="5"/>`)}<path d="M-200 570 L0 430 L200 570Z" fill="#6b4530"/><rect x="80" y="420" width="40" height="110" fill="#8a7a6c"/>
        <path class="smoke" d="M100 410 c-20 -30 20 -50 0 -80 c-20 -30 20 -50 0 -80" stroke="#e9e4da" stroke-width="12" fill="none" stroke-linecap="round" opacity=".8"/>
        <rect x="-30" y="680" width="60" height="110" fill="#5a3a28"/><rect x="-140" y="620" width="70" height="60" fill="#f3e6cf" stroke="#6b4530" stroke-width="6"/><rect x="70" y="620" width="70" height="60" fill="#f3e6cf" stroke="#6b4530" stroke-width="6"/></g>
        <path d="M900 1080 C1000 950 1300 860 1500 790" stroke="#d9c49a" stroke-width="60" fill="none"/>
        <g transform="translate(2050 790)"><path d="M0 0 V-260" stroke="#7a5038" stroke-width="30"/><circle cx="0" cy="-300" r="110" fill="#5f8f5a"/><circle cx="-70" cy="-240" r="70" fill="#6f9f62"/></g>`) + tufts(2200, 30, 9) },
      ],
    };
  },
};

/* a page = a backdrop + this book's characters + objects */
export const page = (scene, pups = [], props = '') => ({ ...scene, pups, props });
