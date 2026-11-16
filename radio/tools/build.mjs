// Build the HyperFrames video of one Cozy French Radio episode (Léa alone, scenes change by segment).
// Usage : node radio/tools/build.mjs radio/epNN        (from the repo root)
// Inputs: radio/epNN/episode.json + assets/words.json (+ assets/voice.mp3)
//   episode.json = { title, lea (outfit), edition, parts:[…], audio, audioEnd, chunks:[{ fr, en, scene? }], vocab:[…] }
//   chunk.fr  — the exact words of words.json, in order; vocab phrases wrapped in [ ]
//   scene     — the ONE scene of the episode (random per episode: radio/tools/pick-setup.mjs); lea = outfit
//   chunk.scene (optional, normally unused) = { scene, part?, mot?, note?, letter? } — switch scene from this chunk on
// Art   : Léa (outfit, mouth, blink, hand gestures, coffee sip) from ../demo-animation-style.html; scenes from radio/scenes.mjs.
//         The CSS motion of scenes.mjs (demo only) is re-made here as seek-safe GSAP tweens (block "scene ambience").
// Output: index.html, compositions/radio.html, assets/music.mp3 (BGM −15 dB, looped, faded), assets/sfx.mp3
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SCENES, PHONES } from '../scenes.mjs';
import { renderSfx } from './sfx.mjs';

const RADIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EPDIR = path.resolve(process.argv[2] || '.');
const EP = JSON.parse(fs.readFileSync(path.join(EPDIR, 'episode.json'), 'utf8'));
const W = JSON.parse(fs.readFileSync(path.join(EPDIR, 'assets/words.json'), 'utf8'));
const EPNAME = path.basename(EPDIR);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

/* ---------- Léa + shared defs from the main channel's demo ---------- */
const src = fs.readFileSync(path.resolve(RADIO, '../demo-animation-style.html'), 'utf8');
const a = src.indexOf('const knit='), b = src.lastIndexOf('/* ============================================================', src.indexOf('   TIMELINE'));
const sandbox = { Math: Object.create(Math), TOTAL: 60, document: { querySelectorAll: () => [] } };
sandbox.Math.random = mulberry32(7);
vm.createContext(sandbox);
vm.runInContext(`const rnd=(a,b)=>a+Math.random()*(b-a);const range=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
  const pick=a=>a[Math.floor(Math.random()*a.length)];const rep=d=>Math.ceil(TOTAL/d)+1;
  ${src.slice(a, b)}
  this.leaSVG=leaSVG; this.OUT_LEA=OUT_LEA; this.GEST_ELBOW=GEST_ELBOW;`, sandbox);
const GEST_RUNTIME = src.slice(src.indexOf('/* GEST-RUNTIME-START'), src.indexOf('/* GEST-RUNTIME-END */'));
const SIP_RUNTIME = src.slice(src.indexOf('/* SIP-RUNTIME-START'), src.indexOf('/* SIP-RUNTIME-END */'));
const DEFS = src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>') + '</defs></svg>'.length);
if (!sandbox.OUT_LEA[EP.lea]) throw new Error(`unknown outfit "${EP.lea}" (have: ${Object.keys(sandbox.OUT_LEA).join(', ')})`);
const leaSVG = phones => { const s = sandbox.leaSVG(EP.lea, false).replace(/<div class="name">[^<]*<\/div>/, ''); return phones ? s.replace('<g class="fx">', PHONES + '<g class="fx">') : s; };

/* ---------- subtitle chunks ↔ word timestamps ---------- */
const norm = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿœæç0-9']/g, '');
let wi = 0; const words = [];
const chunks = EP.chunks.map((c, ci) => {
  const toks = []; let inV = false;
  for (let raw of c.fr.split(/[ \t\n]+/)) {
    const open = raw.startsWith('['), close = raw.endsWith(']'); raw = raw.replace(/[[\]]/g, '');
    if (open) inV = true;
    const w = W[wi++];
    if (!w || norm(w.t) !== norm(raw)) throw new Error(`chunk ${ci}: "${raw}" vs transcript "${w && w.t}"`);
    const tok = { t: raw, s: w.s, e: w.e, v: inV, id: `w${words.length}`, ci };
    toks.push(tok); words.push(tok);
    if (close) inV = false;
  }
  return { ...c, toks, s: toks[0].s, e: toks[toks.length - 1].e };
});
if (wi !== W.length) throw new Error(`episode.json uses ${wi} words, words.json has ${W.length}`);
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.show = Math.max(0, c.s - 0.12); c.hide = n ? Math.min(Math.max(n.s - 0.12, c.show + 0.3), c.e + 1.2) : c.e + 0.6; });

// vocab cards
const vStarts = []; chunks.forEach(c => c.toks.forEach((t, i) => { if (t.v && !(i && c.toks[i - 1].v)) vStarts.push({ s: t.s, ci: c.toks[0].ci }); }));
if (vStarts.length !== EP.vocab.length) throw new Error(`vocab groups ${vStarts.length} != vocab entries ${EP.vocab.length}`);
const RECAP = +(Math.max(EP.audioEnd, chunks.at(-1).hide, vStarts.at(-1).s + 5) + 0.3).toFixed(3);
const RECAP_D = EP.vocab.length > 8 ? 7 : 5, TOTAL = +(RECAP + RECAP_D).toFixed(2);
chunks.at(-1).hide = Math.min(chunks.at(-1).hide, RECAP - 0.1);
const cards = EP.vocab.map((v, i) => { const s = vStarts[i].s - 0.05, n = vStarts[i + 1]; return { ...v, s, d: Math.min(5, (n ? n.s : RECAP) - 0.2 - s), ci: vStarts[i].ci }; });
cards.forEach((c, i) => { if (i && c.s - cards[i - 1].s < 12) console.warn(`warning: vocab "${c.word}" only ${(c.s - cards[i - 1].s).toFixed(1)} s after "${cards[i - 1].word}"`); });

/* ---------- scene segments ---------- */
const PARTS = EP.parts || ['Le thème'];
let part = 0; const segs = [];
chunks.forEach((c, ci) => {
  if (!c.scene && ci) return;
  const sc = c.scene || { scene: EP.scene || 'studio', ...(EP.ctx || {}) };
  const S = SCENES[sc.scene]; if (!S) throw new Error(`chunk ${ci}: unknown scene "${sc.scene}" (have: ${Object.keys(SCENES).join(', ')})`);
  if (sc.part !== undefined) part = sc.part;
  if (part >= PARTS.length) throw new Error(`chunk ${ci}: part ${part} but only ${PARTS.length} parts`);
  segs.push({ ...sc, S, part, ci, s: ci ? +(c.show - 0.15).toFixed(3) : 0 });
});
segs.forEach((g, k) => { g.e = k < segs.length - 1 ? segs[k + 1].s : TOTAL; g.k = k; });
const segAt = t => segs.findLast(g => g.s <= t + 1e-6) || segs[0];
chunks.forEach(c => { c.seg = segAt(c.show + 0.16); });
cards.forEach(c => { const g = segAt(c.s); if (g.S.kind !== 'host') console.warn(`warning: vocab "${c.word}" falls in the ${g.scene} interlude (cards only show well in host scenes)`); c.seg = g; });

/* ---------- Léa's motion plan (one speaker) ---------- */
const DEFAULT_GEST = ['palm', 'up', 'count', 'think', 'beat', 'shrug'];
const flat = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿœæç'\- ]/g, ' ').replace(/\s+/g, ' ').trim();
const AUTO = { wave: ['bonjour', 'bienvenue', 'à bientôt', 'au revoir', 'bonsoir', 'salut'], count: ["d'abord", 'premièrement', 'deux choses', 'trois choses'], shrug: ['je ne sais pas', 'peut-être que', 'pourquoi'], think: ['je me demande', 'pose-toi une question', 'imagine'] };
const gR = mulberry32(21), gests = [];
// 1) actions triggered by what is said
chunks.forEach(c => {
  const txt = ' ' + flat(c.toks.map(t => t.t).join(' ')) + ' ', ok = c.seg.S.gest || [...DEFAULT_GEST, 'wave'];
  for (const [p, list] of Object.entries(AUTO)) {
    if (!ok.includes(p) || !list.some(x => txt.includes(' ' + x + ' '))) continue;
    const t = c.s, d = Math.min(p === 'count' ? 2.8 : 2.1, c.seg.e - t - 0.2);
    if (d > 1.2 && !gests.some(g => t < g.t + g.d + 0.4 && t + d > g.t - 0.4)) gests.push({ p, t, d, b: [], seg: c.seg.k });
    break;
  }
});
// 2) talking gestures: a pose every few seconds, starting on a word, never the same twice in a row
let next = 1.5, last = '';
words.forEach((w, i) => {
  if (w.s < next) return;
  const g = segAt(w.s), ok = (g.S.gest || DEFAULT_GEST).filter(p => p !== 'wave' && p !== 'scratch');
  const blk = gests.find(x => w.s < x.t + x.d + 1.2 && w.s + 3 > x.t); if (blk) { next = blk.t + blk.d + 1.2; return; }
  if (gR() < 0.3) { next = w.s + 2; return; }
  const d = Math.min(1.7 + gR() * 1.4, g.e - w.s - 0.3); if (d < 1.3) return;
  const pool = ok.filter(p => p !== last), p = pool[Math.floor(gR() * pool.length)]; last = p;
  const beats = words.filter(x => x.s > w.s + 0.35 && x.s < w.s + d - 0.4).map(x => +x.s.toFixed(3));
  gests.push({ p, t: w.s, d, b: beats, seg: g.k });
  next = w.s + d + 2 + gR() * 3.5;
});
gests.sort((x, y) => x.t - y.t);
// coffee sips in long pauses (host scenes only, ≥ 50 s apart)
const sips = []; let lastSip = -99;
words.forEach((w, i) => { const n = words[i + 1]; if (!n || n.s - w.e < 1.25 || w.e - lastSip < 50) return;
  const t = w.e + 0.05, g = segAt(t); if (g.S.kind !== 'host' || t + 2.6 > g.e || gests.some(x => t < x.t + x.d && t + 2.6 > x.t)) return;
  sips.push({ t: +t.toFixed(3), seg: g.k }); lastSip = t; });
// nods on « oui / exactement / voilà » + now and then at the start of a sentence
const nods = []; const nR = mulberry32(55); let nextNod = 8;
chunks.forEach(c => { const f0 = flat(c.toks[0].t);
  if (['oui', 'exactement', 'voilà', 'alors'].includes(f0) || (c.s > nextNod && nR() < 0.35)) { nods.push({ t: +(c.s + 0.05).toFixed(3), seg: c.seg.k }); nextNod = c.s + 12 + nR() * 14; } });
// head tilts: a small new angle every sentence or two
const tilts = []; const tR = mulberry32(77);
chunks.forEach((c, i) => { if (i % 2 && tR() < 0.5) return; tilts.push({ t: +c.s.toFixed(3), r: +((tR() < 0.5 ? -1 : 1) * (1 + tR() * 2.5)).toFixed(2), seg: c.seg.k }); });

/* ---------- HTML ---------- */
const f = n => (+n).toFixed(3), esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ctxOf = g => ({ parts: PARTS, part: g.part, edition: EP.edition, ...(g.mot && { mot: g.mot }), ...(g.note && { note: g.note }), ...(g.letter && { letter: g.letter }) });
// ids inside a scene's markup get a per-segment suffix (the same scene can appear several times)
const scoped = (html, k) => { const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) html = html.split(`id="${id}"`).join(`id="${id}_${k}"`).split(`url(#${id})`).join(`url(#${id}_${k})`).split(`href="#${id}"`).join(`href="#${id}_${k}"`);
  return html; };
const LEA_P = leaSVG(true), LEA_N = leaSVG(false);
const tagOf = g => segs.length === 1 ? EP.title : g.S.kind === 'host' ? `${g.part + 1}/${PARTS.length} · ${PARTS[g.part]}` : (g.mot ? g.mot.head : g.letter ? 'Le courrier' : EP.title);
const segHTML = segs.map(g => { const S = g.S, c = ctxOf(g), L = S.lea;
  const art = `<svg class="bg" viewBox="0 0 1920 1080">${scoped(S.bg(c) + '<!--split-->' + S.fg(c), g.k).split('<!--split-->')[0]}</svg>
      <div class="char" id="lea${g.k}" style="left:${L.x}px;top:${L.y}px;transform:scale(${L.s})${L.clip ? `;clip-path:${L.clip}` : ''}">${S.phones ? LEA_P : LEA_N}</div>
      <svg class="fg" viewBox="0 0 1920 1080">${scoped(S.bg(c) + '<!--split-->' + S.fg(c), g.k).split('<!--split-->')[1]}</svg>`;
  return `
    <div id="seg${g.k}" class="clip seg" data-start="${f(g.s)}" data-duration="${f(Math.min(TOTAL, g.e + 0.6) - g.s)}" data-track-index="${10 + (g.k % 2)}">
      ${art}
      ${S.html ? S.html(c) : ''}
      <div class="brandR ${S.brand}"><span class="dot"></span><b>Cozy French</b> <em>Radio</em><small>${esc(tagOf(g))}</small></div>
    </div>`; }).join('');

// subtitles: a card at the bottom in host scenes (box | dark), big kinetic text in interludes (kin)
const ON = { box: ['#3a2e28', '#b8552a'], dark: ['#fffaf0', '#f3c96b'], kin: ['#3a2e28', '#b8552a'], light: ['#fffaf0', '#f3c96b'], hand: ['#5a3d2c', '#b8552a'] };
chunks.forEach(c => { const S = c.seg.S; c.kind = S.sub === 'kin' ? (S.kin?.cls === 'light' ? 'light' : S.kin?.cls === 'hand' ? 'hand' : 'kin') : S.sub; c.on = ON[c.kind]; });
const subFit = c => { const n = c.toks.map(t => t.t).join(' ').length; return n > 46 ? ` style="font-size:${Math.max(38, Math.floor(50 * 46 / n))}px"` : ''; };
const kinFit = c => { const n = c.toks.map(t => t.t).join(' ').length; return n > 60 ? ` style="font-size:${Math.max(48, Math.floor((c.kind === 'hand' ? 76 : 66) * 60 / n))}px"` : ''; };
const wordsHTML = c => c.toks.map(t => `<span class="w${t.v ? ' vocab' : ''}" id="${t.id}">${t.v ? '<i class="ul"></i>' : ''}<b class="tx">${esc(t.t)}</b></span>`).join(' ');
const subsHTML = chunks.map((c, i) => { const K = c.seg.S.kin || { x: 990, y: 250, w: 820 };
  return c.kind === 'box' || c.kind === 'dark' ? `
    <div id="sub${i}" class="clip subWrap ${c.kind}" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3">
      <div class="subBox"><div class="subFr"${subFit(c)}>${wordsHTML(c)}</div><div class="subEn">${esc(c.en)}</div></div></div>` : `
    <div id="sub${i}" class="clip kinWrap ${c.kind}" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3" style="left:${K.x}px;top:${K.y}px;width:${K.w}px">
      <div class="subBox"><div class="kinFr"${kinFit(c)}>${wordsHTML(c)}</div><div class="kinEn">${esc(c.en)}</div></div></div>`; }).join('');
const cardsHTML = cards.map((c, i) => `
    <div id="card${i}" class="clip cardWrap${c.seg.S.sub === 'kin' ? ' low' : ''}" data-start="${f(c.s)}" data-duration="${f(c.d)}" data-track-index="4">
      <div class="card"><span class="tag">${esc(c.tag)}</span><div class="word">${esc(c.word)}</div><div class="ipa">${esc(c.ipa)}</div>
      <div class="mean">${esc(c.mean)}</div><div class="ex">${esc(c.ex)}<i>${esc(c.exEn)}</i></div></div></div>`).join('');
const CAVEAT = 'data:font/woff2;base64,' + fs.readFileSync(path.join(RADIO, 'assets/fonts/caveat-600-latin.woff2')).toString('base64');

const comp = `<template>
  <style>
    @font-face{font-family:'Caveat';font-weight:600;src:url(${CAVEAT}) format('woff2')}
    #radio{position:absolute;inset:0;overflow:hidden;background:#1e1a17;font-family:Nunito,sans-serif}
    .seg{position:absolute;inset:0;overflow:hidden;background:#f3e3c8}
    .seg svg.bg,.seg svg.fg{position:absolute;inset:0;width:1920px;height:1080px}
    .char{position:absolute;width:360px;height:480px;transform-origin:0 0}
    .char svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
    #radio-grain{position:absolute;inset:0;pointer-events:none;opacity:.2;mix-blend-mode:multiply;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
    .brandR{position:absolute;left:48px;top:40px;background:#2a2220e6;color:#fffaf0;border-radius:22px;padding:14px 26px 12px;font:700 34px 'Playfair Display',serif}
    .brandR em{color:#f3c96b;font-style:italic} .brandR small{display:block;font:800 20px Nunito;color:#c9bcae;letter-spacing:.04em;margin-top:2px}
    .brandR .dot{display:inline-block;width:16px;height:16px;border-radius:50%;background:#e8664f;margin-right:10px;vertical-align:middle}
    .brandR.light{background:#fffaf0e8;color:#3a2e28} .brandR.light em{color:#b8552a} .brandR.light small{color:#8a7a6c}
    .brandR.flat{background:none;color:#3a2e28;left:180px} .brandR.flat em{color:#b8552a} .brandR.flat small{color:#8a7a6c}
    .subWrap{position:absolute;left:0;right:0;bottom:60px;display:flex;justify-content:center}
    .subWrap .subBox{max-width:1400px;background:#fffaf0f2;border-radius:28px;padding:22px 44px;box-shadow:0 10px 0 #00000022;text-align:center}
    .subWrap.dark{bottom:40px} .subWrap.dark .subBox{max-width:1200px;background:#3a2e28e0}
    .subFr{font:800 50px/1.25 Nunito;color:#b0a090;white-space:nowrap} .dark .subFr{color:#8d7f72}
    .subEn{font:600 30px Nunito;color:#7a6a5c;margin-top:8px} .dark .subEn{color:#e4d5c3}
    .w{display:inline-block;position:relative} .w .tx{position:relative;font-weight:inherit}
    .w .ul{position:absolute;left:0;right:0;bottom:4px;height:12px;background:#f3c96b;border-radius:6px;transform-origin:left center}
    .dark .w .ul,.light .w .ul{background:#d9774b99}
    .kinWrap{position:absolute}
    .kinFr{font:700 66px/1.18 'Playfair Display',serif;color:#cdbfae}
    .kinEn{font:700 30px Nunito;color:#8a7a6c;margin-top:22px}
    .kinWrap.light .kinFr{color:#8fa6c8} .kinWrap.light .kinEn{color:#dfe7f3}
    .kinWrap.hand .kinFr{font:600 76px/1.08 Caveat,'Playfair Display',cursive;color:#c9b8a4} .kinWrap.hand .w .ul{bottom:10px}
    .cardWrap{position:absolute;left:1320px;top:60px;width:540px} .cardWrap.low{left:110px;top:560px;width:620px}
    .card{background:#fffaf0;border-radius:30px;padding:26px 32px;box-shadow:0 14px 0 #0000002a;border:4px solid #3a2e28}
    .card .tag{display:inline-block;font:800 24px Nunito;letter-spacing:.08em;text-transform:uppercase;background:#f3c96b;color:#3a2e28;padding:4px 14px;border-radius:20px}
    .card .word{font:700 54px/1.1 'Playfair Display',serif;color:#b8552a;margin:12px 0 4px}
    .card .ipa{font:600 28px 'Noto Sans',Nunito,sans-serif;color:#6f5f52}
    .card .mean{font:800 32px Nunito;color:#3a2e28;margin-top:12px}
    .card .ex{font:600 27px/1.35 Nunito;color:#3a2e28;margin-top:12px;padding-top:12px;border-top:3px dashed #e3d4c1}
    .card .ex i{color:#6f5f52;display:block;font-style:normal;margin-top:4px}
    .mot{position:absolute;left:960px;top:150px;color:#3a2e28} .mot span{display:inline-block;font:800 20px Nunito;letter-spacing:.12em;text-transform:uppercase;background:#3a2e28;color:#f3c96b;padding:6px 16px;border-radius:20px}
    .mot b{display:block;font:700 150px/1 'Playfair Display',serif;color:#b8552a;margin-top:18px} .mot i{display:block;font:700 30px Nunito;font-style:normal;color:#8a7a6c;margin-top:10px}
    .mot.phrase b{font-size:96px;max-width:900px} .mot.phrase2 b{font-size:66px;line-height:1.1;max-width:880px}
    .letterhead{position:absolute;left:1000px;top:170px;font:600 58px Caveat,cursive;color:#8a5e42} .sign{position:absolute;left:1380px;top:790px;font:600 46px Caveat,cursive;color:#8a5e42}
    .note{position:absolute;right:90px;top:60px;width:330px;background:#f3c96b;padding:22px 28px;transform:rotate(3deg);box-shadow:0 10px 0 #0000001c;color:#3a2e28}
    .note span{font:800 18px Nunito;letter-spacing:.1em;text-transform:uppercase} .note b{display:block;font:700 56px 'Playfair Display',serif;color:#b8552a} .note i{font-style:normal;font-weight:700;font-size:22px}
    #recap{position:absolute;inset:0;background:#f6eddc;display:flex;flex-direction:column;align-items:center;justify-content:center}
    #recap h2{font:700 72px 'Playfair Display',serif;color:#3a2e28;margin:0 0 40px}
    #recap .grid{display:grid;grid-template-columns:repeat(2,640px);gap:28px}
    #recap .it{background:#fffaf0;border:4px solid #3a2e28;border-radius:24px;padding:22px 30px;font:800 36px Nunito;color:#d9774b}
    #recap .it small{display:block;font:600 26px Nunito;color:#3a2e28;margin-top:4px}
    #recap.many h2{font-size:60px;margin-bottom:30px} #recap.many .grid{grid-template-columns:repeat(3,560px);gap:18px}
    #recap.many .it{padding:12px 22px;font-size:30px;border-radius:20px} #recap.many .it small{font-size:22px}
    #recap .sig{margin-top:36px;font:700 30px 'Playfair Display',serif;color:#8a7a6c}
  </style>
  <div id="radio" data-composition-id="radio" data-width="1920" data-height="1080">
    ${DEFS}
    ${segHTML}
    <div id="radio-grain"></div>
    ${subsHTML}
    ${cardsHTML}
    <div id="recap" class="clip${cards.length > 8 ? ' many' : ''}" data-start="${f(RECAP)}" data-duration="${f(RECAP_D)}" data-track-index="6">
      <h2 id="recap-title">Aujourd'hui, on a appris…</h2>
      <div class="grid">${cards.map((c, i) => `<div class="it" id="recap-it${i}">${esc(c.word)}<small>${esc(c.mean)}</small></div>`).join('')}</div>
      <div class="sig" id="recap-sig">À bientôt sur Cozy French Radio ♡</div>
    </div>
  </div>
  <script>
  (function(){
    const tl=gsap.timeline({paused:true});
    const TOTAL=${TOTAL}, R=(()=>{let a=99;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}})();
    const rnd=(a,b)=>a+R()*(b-a);
    const SEGS=${JSON.stringify(segs.map(g => ({ k: g.k, s: g.s, e: Math.min(TOTAL, g.e + 0.6), host: g.S.kind === 'host', id: g.scene })))};
    const WORDS=${JSON.stringify(words.map(w => ({ id: w.id, s: +w.s.toFixed(3), e: +w.e.toFixed(3), n: w.t.length, v: w.v ? 1 : 0, k: chunks[w.ci].seg.k, c: chunks[w.ci].on })))};
    const SUBS=${JSON.stringify(chunks.map(c => ({ s: +c.show.toFixed(3), kin: c.kind !== 'box' && c.kind !== 'dark' })))};
    const GESTS=${JSON.stringify(gests.map(g => ({ p: g.p, t: +g.t.toFixed(3), d: +g.d.toFixed(3), b: g.b, k: g.seg })))};
    const SIPS=${JSON.stringify(sips.map(x => ({ t: x.t, k: x.seg })))}, NODS=${JSON.stringify(nods.map(x => ({ t: x.t, k: x.seg })))}, TILTS=${JSON.stringify(tilts.map(x => ({ t: x.t, r: x.r, k: x.seg })))};
    const CARDS=${JSON.stringify(cards.map(c => ({ s: +c.s.toFixed(3), d: +c.d.toFixed(3) })))};
    const ELB=${JSON.stringify(sandbox.GEST_ELBOW)};
    const q=s=>Array.from(document.querySelectorAll(s));
    const n=(d,len)=>Math.ceil(len/d)+1;
    const sv=(el,k)=>{ const v=parseFloat(el.style&&el.style[k]); return isNaN(v)?null:v; };
    const pxOrigin=el=>{ const m=(el.getAttribute('style')||'').match(/transform-origin:\\s*([\\d.]+)px\\s+([\\d.]+)px/); return m?m[1]+' '+m[2]:null; };

    // ---- segment entrances: each segment fades in over the previous one ----
    SEGS.forEach((g,i)=>{ if(!i) return;
      tl.fromTo('#seg'+g.k,{opacity:0},{opacity:1,duration:.5,ease:'power1.out',immediateRender:false},g.s);
      if(!g.host) tl.fromTo('#seg'+g.k+' .char',{y:30},{y:0,duration:.6,ease:'back.out(1.6)',immediateRender:false},g.s);
    });

    // ---- scene ambience: the CSS motion of radio/scenes.mjs as finite, seek-safe gsap loops per segment ----
    SEGS.forEach(g=>{
      const P='#seg'+g.k+' ', S=g.s, L=g.e-g.s;
      // looping tween: period d, phase from the element's animation-delay, inside the segment only
      const loop=(el,d,from,to,ph=0)=>{ const off=((ph%d)+d)%d; tl.fromTo(el,from,{...to,duration:d,ease:to.ease||'none',repeat:n(d,L+off),immediateRender:false},Math.max(0,S-off)); };
      const yoyo=(el,d,from,to,ph=0)=>{ const off=((ph%(2*d))+2*d)%(2*d); tl.fromTo(el,from,{...to,duration:d,ease:'sine.inOut',yoyo:true,repeat:n(d,L+off),immediateRender:false},Math.max(0,S-off)); };
      const dl=el=>-(sv(el,'animationDelay')||0);
      q(P+'.rain').forEach(el=>loop(el,sv(el,'animationDuration')||.8,{x:0,y:-40},{x:-10,y:60},dl(el)));
      q(P+'.onlamp').forEach(el=>yoyo(el,1.5,{opacity:1},{opacity:.7}));
      q(P+'.onglow').forEach(el=>yoyo(el,1.5,{opacity:1},{opacity:.6}));
      q(P+'.lampLight').forEach(el=>yoyo(el,3,{opacity:1},{opacity:.85}));
      q(P+'.needle').forEach(el=>{ tl.set(el,{transformOrigin:'50% 100%'},0); const k=[-34,12,-8,26,-14,-34], d=1.1, s=gsap.timeline({repeat:n(d,L)});
        k.slice(1).forEach((r,i)=>s.fromTo(el,{rotation:k[i]},{rotation:r,duration:d/5,ease:'sine.inOut',immediateRender:false})); tl.add(s,S); });
      q(P+'.steam2 path').forEach((el,i)=>{ tl.set(el,{opacity:0},0); const s=gsap.timeline({repeat:n(3,L)}); s.fromTo(el,{y:10,opacity:0},{y:-10,opacity:.8,duration:1.2,ease:'sine.out',immediateRender:false}).to(el,{y:-30,opacity:0,duration:1.8,ease:'sine.in'}); tl.add(s,S+i*1.4); });
      q(P+'.vinyl').forEach(el=>loop(el,2.4,{rotation:0},{rotation:360,transformOrigin:'50% 50%'}));
      q(P+'.disc').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'600 500'},0); loop(el,9,{rotation:0},{rotation:360}); });
      q(P+'.sway2').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'960 0'},0); yoyo(el,2.5,{rotation:0},{rotation:2}); });
      q(P+'.sway3').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'0 0'},0); yoyo(el,2,{rotation:0},{rotation:-3},dl(el)); });
      q(P+'.mote').forEach(el=>{ const d=sv(el,'animationDuration')||9; tl.set(el,{opacity:0},0); const s=gsap.timeline({repeat:n(d,L)});
        s.fromTo(el,{x:0,y:0,opacity:0},{x:18,y:-36,opacity:.9,duration:d*.3,ease:'none',immediateRender:false}).to(el,{x:60,y:-120,opacity:0,duration:d*.7,ease:'none'}); tl.add(s,S+((-dl(el))%d)*.3); });
      q(P+'.breathe').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'0 0'},0); yoyo(el,1.7,{scaleX:1,scaleY:1},{scaleX:1.03,scaleY:1.05}); });
      q(P+'.zz text').forEach((el,i)=>{ tl.set(el,{opacity:0},0); const s=gsap.timeline({repeat:n(3.4,L)}); s.fromTo(el,{y:10,opacity:0},{y:-7,opacity:1,duration:1.7,ease:'sine.out',immediateRender:false}).to(el,{y:-24,opacity:0,duration:1.7,ease:'sine.in'}); tl.add(s,S+i*1.7); });
      q(P+'.bar').forEach(el=>yoyo(el,sv(el,'animationDuration')||.8,{scaleY:.12,transformOrigin:'50% 50%'},{scaleY:1},dl(el)));
      q(P+'.bird').forEach(el=>loop(el,sv(el,'animationDuration')||12,{x:-100},{x:2050},dl(el)));
      q(P+'.cloud2').forEach(el=>loop(el,sv(el,'animationDuration')||60,{x:-700},{x:1300},dl(el)));
      q(P+'.sun').forEach(el=>yoyo(el,3,{opacity:1},{opacity:.8}));
      [['s1',1200,40],['s2',1000,16],['s3',900,6],['s4',800,2.2]].forEach(([c,w,d])=>q(P+'.scroll.'+c).forEach(el=>loop(el,d,{x:880},{x:880-w})));
      q(P+'.snow').forEach(el=>loop(el,sv(el,'animationDuration')||6,{x:0,y:-60},{x:20,y:440},dl(el)));
      q(P+'.flame').forEach(el=>{ const d=el.classList.contains('f3')?.5:el.classList.contains('f2')?.7:.9; yoyo(el,d,{scaleX:1,scaleY:1,skewX:0,transformOrigin:'50% 100%'},{scaleX:.92,scaleY:1.12,skewX:4}); });
      q(P+'.fireGlow').forEach(el=>yoyo(el,1.6,{opacity:1},{opacity:.7}));
      q(P+'.grille').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'540 700'},0); yoyo(el,.5,{scale:1},{scale:1.015}); });
      q(P+'.knob').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'0 0'},0); yoyo(el,2,{rotation:0},{rotation:25},dl(el)); });
      q(P+'.tune').forEach(el=>yoyo(el,6,{x:-12},{x:12}));
      q(P+'.twinkle path').forEach((el,i)=>yoyo(el,1.05,{scale:1,rotation:0,opacity:1,transformOrigin:'50% 50%'},{scale:.55,rotation:30,opacity:.5},i*.7));
      q(P+'.squig').forEach(el=>{ tl.set(el,{attr:{'stroke-dasharray':'30 14'}},0); loop(el,1.4,{strokeDashoffset:0},{strokeDashoffset:-88}); });
      q(P+'.floaty').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'0 0'},0); yoyo(el,3,{y:0,rotation:0},{y:-6,rotation:-.3}); });
      q(P+'.stampmark').forEach(el=>{ tl.set(el,{svgOrigin:pxOrigin(el)||'0 0'},0); yoyo(el,2.5,{rotation:0},{rotation:-4}); });
      q(P+'.bulb').forEach((el,i)=>yoyo(el,1.2,{opacity:1},{opacity:.75},i*.8));
      q(P+'.rame').forEach(el=>tl.fromTo(el,{x:0},{x:+el.dataset.dx||0,duration:3.2,ease:'power2.inOut',immediateRender:false},S+.8));
      q(P+'.press circle+circle').forEach(el=>loop(el,1.6,{scale:.4,opacity:1,transformOrigin:'50% 50%'},{scale:1.6,opacity:0,ease:'power1.out'}));
      q(P+'.prog').forEach(el=>{ const L0=el.getTotalLength?el.getTotalLength():800; tl.fromTo(el,{attr:{'stroke-dasharray':L0,'stroke-dashoffset':L0}},{attr:{'stroke-dashoffset':0},duration:1.4,ease:'power2.out',immediateRender:false},S+.3); });
      // interlude extras pop in
      q(P+'.note, '+P+'.mot, '+P+'.letterhead, '+P+'.sign').forEach((el,i)=>tl.fromTo(el,{opacity:0,y:-30},{opacity:1,y:0,duration:.5,ease:'back.out(1.8)',immediateRender:false},S+.35+i*.25));
    });

    // ---- Léa: breathing, blinking, head tilt, body sway (each segment has its own Léa) ----
    SEGS.forEach(g=>{
      const c='#lea'+g.k, L=g.e-g.s;
      tl.set(c+' .head',{rotation:0,transformOrigin:'50% 95%'},0);
      tl.set(c+' .sway',{svgOrigin:'180 431'},0);
      tl.set(c+' .gest',{svgOrigin:'257 286'},0);
      Object.keys(ELB).forEach(p=>{ if(q(c+' .g-'+p+' .fore').length) tl.set(c+' .g-'+p+' .fore',{svgOrigin:ELB[p].join(' ')},0); });
      if(q(c+' .cupTilt').length) tl.set(c+' .cupTilt',{svgOrigin:'234 384'},0);
      tl.fromTo(c+' .breath',{y:0},{y:-3,duration:1.6,yoyo:true,repeat:n(1.6,L),ease:'sine.inOut',immediateRender:false},g.s);
      for(let t=g.s+1.2+R()*2;t<g.e;t+=2.8+R()*2.6) tl.fromTo(c+' .eye',{scaleY:1},{scaleY:.1,transformOrigin:'50% 50%',duration:.07,yoyo:true,repeat:1,immediateRender:false},t);
      tl.fromTo(c+' .sway',{rotation:-1},{rotation:1.2,duration:3.1,yoyo:true,repeat:n(3.1,L),ease:'sine.inOut',immediateRender:false},g.s);
      q(c+' .steam').forEach((s,j)=>tl.fromTo(s,{y:0,opacity:0},{y:-40,opacity:.8,duration:2.2,repeat:n(2.2,L),ease:'sine.out',immediateRender:false},g.s+j*1.1));
    });
    TILTS.forEach(h=>tl.to('#lea'+h.k+' .head',{rotation:h.r,duration:.6,ease:'sine.inOut'},h.t-.1));

    // ---- hand gestures, nods, coffee sips (runtimes copied from the demo) ----
    ${GEST_RUNTIME}
    GESTS.forEach(g=>gestTL(tl,'#lea'+g.k,{p:g.p,t:g.t,d:g.d,b:g.b}));
    NODS.forEach(x=>nodTL(tl,'#lea'+x.k,x.t));
    ${SIP_RUNTIME}
    SIPS.forEach(x=>sipTL(tl,'#lea'+x.k,x.t));

    // ---- mouth + karaoke ----
    tl.set('.w .ul',{scaleX:0},0);
    WORDS.forEach(w=>{
      const m='#lea'+w.k+' .mouth', len=Math.min(w.e-w.s,.08*w.n+.08), flaps=Math.max(1,Math.round(len/.2)), fd=len/flaps/2;
      for(let k=0;k<flaps;k++) tl.fromTo(m,{scaleY:1},{scaleY:2.4+R()*1.8,transformOrigin:'50% 0%',duration:fd,yoyo:true,repeat:1,ease:'sine.inOut',immediateRender:false},w.s+k*fd*2);
      tl.to('#'+w.id,{color:w.v?w.c[1]:w.c[0],duration:.1},w.s);
      if(w.v) tl.to('#'+w.id+' .ul',{scaleX:1,duration:.35,ease:'power2.out'},w.s);
    });
    SUBS.forEach((s,i)=>s.kin
      ? tl.fromTo('#sub'+i+' .subBox',{y:24,opacity:0},{y:0,opacity:1,duration:.3,ease:'power2.out'},s.s)
      : tl.fromTo('#sub'+i+' .subBox',{y:26,opacity:0},{y:0,opacity:1,duration:.25,ease:'back.out(2)'},s.s));

    // ---- vocab cards ----
    CARDS.forEach((c,i)=>{ const el='#card'+i+' .card';
      tl.fromTo(el,{y:-80,opacity:0,rotation:3},{y:0,opacity:1,rotation:-1.5,duration:.5,ease:'back.out(1.7)'},c.s);
      tl.fromTo('#card'+i+' .ex',{opacity:0,y:10},{opacity:1,y:0,duration:.4},c.s+.5);
      tl.to(el,{y:-50,opacity:0,duration:.3,ease:'power2.in'},c.s+c.d-.35); });

    // ---- recap ----
    tl.fromTo('#recap',{opacity:0},{opacity:1,duration:.5},${RECAP});
    tl.fromTo('#recap-title',{y:30,opacity:0},{y:0,opacity:1,duration:.6,ease:'back.out(2)'},${RECAP}+.2);
    q('#recap .it').forEach((it,i)=>tl.fromTo(it,{y:30,opacity:0},{y:0,opacity:1,duration:.4,ease:'back.out(2)'},${RECAP}+.7+i*${Math.min(0.35, (RECAP_D - 2.5) / Math.max(1, cards.length)).toFixed(3)}));
    tl.fromTo('#recap-sig',{opacity:0},{opacity:1,duration:.6},${(RECAP + RECAP_D - 1.6).toFixed(2)});
    tl.set({}, {}, TOTAL);

    window.__timelines=window.__timelines||{};
    window.__timelines["radio"]=tl;
  })();
  </script>
</template>
`;
fs.mkdirSync(path.join(EPDIR, 'compositions'), { recursive: true });
fs.writeFileSync(path.join(EPDIR, 'compositions/radio.html'), comp);

/* ---------- audio: background music (required, −15 dB, looped, faded) + sound effects ---------- */
const MUSIC_SRC = path.join(RADIO, 'assets/music/meditation-impromptu-03.mp3'), MUSIC = path.join(EPDIR, 'assets/music.mp3');
const musicKey = `${TOTAL}|${EP.musicDb ?? -15}`, musicStamp = path.join(EPDIR, 'assets/.music-key');
if (!fs.existsSync(MUSIC) || (fs.existsSync(musicStamp) ? fs.readFileSync(musicStamp, 'utf8') : '') !== musicKey) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', MUSIC_SRC, '-vn', '-t', String(TOTAL),
    '-af', `volume=${EP.musicDb ?? -15}dB,afade=t=in:d=3,afade=t=out:st=${(TOTAL - 4).toFixed(2)}:d=4`, '-c:a', 'libmp3lame', '-q:a', '4', MUSIC]);
  fs.writeFileSync(musicStamp, musicKey);
}
const sfxEv = [];
segs.forEach((g, k) => { if (!k) return; sfxEv.push({ t: g.s, k: g.S.kind === 'host' ? 'swish' : g.scene === 'lettre' ? 'paper' : 'whoosh' }); });
cards.forEach(c => sfxEv.push({ t: c.s, k: 'card' }));
sfxEv.push({ t: RECAP + 0.2, k: 'chime' });
cards.forEach((c, i) => sfxEv.push({ t: RECAP + 0.7 + i * Math.min(0.35, (RECAP_D - 2.5) / Math.max(1, cards.length)), k: 'tick' }));
const sfxN = renderSfx(sfxEv, TOTAL, path.join(EPDIR, 'assets/sfx.wav'), path.join(EPDIR, 'assets/sfx.mp3'), 1);

/* ---------- index.html + project files ---------- */
fs.writeFileSync(path.join(EPDIR, 'index.html'), `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #000; }
      body { font-family: "Nunito", sans-serif; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="radio" data-composition-id="radio" data-composition-src="compositions/radio.html"
           data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics"
           data-width="1920" data-height="1080"></div>
      <audio id="voice" src="${EP.audio}" data-start="0" data-duration="${f(EP.audioEnd)}" data-track-index="2" data-volume="1"></audio>
      <audio id="music" src="assets/music.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="3" data-volume="1"></audio>
      <audio id="sfx" src="assets/sfx.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="5" data-volume="${EP.sfxVolume ?? 0.3}"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
const put = (name, obj) => { const p = path.join(EPDIR, name); if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); };
put('meta.json', { id: `radio-${EPNAME}`, name: `radio-${EPNAME}`, createdAt: new Date(0).toISOString() });
put('hyperframes.json', { $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', assets: 'assets' }, media: { autoProxy: true }, authoringSkill: 'hyperframes' });
put('package.json', { name: `radio-${EPNAME}`, private: true, type: 'module', scripts: { dev: 'npx --yes hyperframes@0.9.16 preview', check: 'npx --yes hyperframes@0.9.16 check', render: 'npx --yes hyperframes@0.9.16 render' } });

const count = o => Object.entries(o.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {})).map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`built ${EPNAME}: ${segs.length} segments (${count(segs.map(g => g.scene))}), ${chunks.length} subtitles, ${words.length} words, ${cards.length} cards, ${gests.length} gestures (${count(gests.map(g => g.p))}), ${nods.length} nods, ${sips.length} sips, ${sfxN} sounds, total ${TOTAL}s`);
console.log('segments: ' + segs.map(g => `${Math.floor(g.s / 60)}:${String(Math.floor(g.s % 60)).padStart(2, '0')} ${g.scene}`).join(' · '));
