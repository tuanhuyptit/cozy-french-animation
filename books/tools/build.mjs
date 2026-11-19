// Build the HyperFrames video of one Cozy French Books episode (Léa alone, reviewing a book).
// Usage : node books/tools/build.mjs books/epNN          (from the repo root)
// Inputs: books/epNN/plan.mjs  { BOOK, SEGS, VOCAB }      — what to show when (see books/README.md)
//         books/epNN/art.mjs   { PAGES }                  — the book's story pages, drawn with books/kit.mjs
//         books/epNN/work/chunks.json + work/en.json      — subtitle lines (tools/chunk.mjs) + English
//         books/epNN/assets/words.json + assets/voice.mp3 — word timings (transcribe + align-script)
// Output: index.html, compositions/books.html, assets/sfx.mp3 (+ hyperframes.json, package.json, meta.json)
// Reusable scene kinds: shelf · nook · carnet · page · chap · fiche (+ vocab cards, journey map, recap).
// Motion is deliberately light: fades, small slides, slow camera drift, idle bobbing. All seek-safe GSAP.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as ART from '../art.mjs';
import { ICON, icon, bubble, MAP, mapStopsX } from '../kit.mjs';
import { renderSfx, renderAmbience } from './sfx.mjs';
import { execFileSync } from 'node:child_process';

const BOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(BOOKS, '..');
const EPDIR = path.resolve(process.argv[2] || '.');
const EPNAME = path.basename(EPDIR);
const { BOOK, SEGS: PLAN, VOCAB } = await import(pathToFileURL(path.join(EPDIR, 'plan.mjs')));
const { PAGES } = await import(pathToFileURL(path.join(EPDIR, 'art.mjs')));
const W = JSON.parse(fs.readFileSync(path.join(EPDIR, 'assets/words.json'), 'utf8'));
const CH = JSON.parse(fs.readFileSync(path.join(EPDIR, 'work/chunks.json'), 'utf8'));
const EN = JSON.parse(fs.readFileSync(path.join(EPDIR, 'work/en.json'), 'utf8'));
if (EN.length !== CH.length) throw new Error(`en.json has ${EN.length} lines, chunks.json ${CH.length}`);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

/* ---------- Léa from the main channel's demo ---------- */
const src = fs.readFileSync(path.join(ROOT, 'demo-animation-style.html'), 'utf8');
const a0 = src.indexOf('const knit='), b0 = src.lastIndexOf('/* ============================================================', src.indexOf('   TIMELINE'));
const sandbox = { Math: Object.create(Math), TOTAL: 60, document: { querySelectorAll: () => [] } };
sandbox.Math.random = mulberry32(7);
vm.createContext(sandbox);
vm.runInContext(`const rnd=(a,b)=>a+Math.random()*(b-a);const range=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');const pick=a=>a[Math.floor(Math.random()*a.length)];const rep=d=>Math.ceil(TOTAL/d)+1;
  ${src.slice(a0, b0)}
  this.leaSVG=leaSVG; this.OUT_LEA=OUT_LEA; this.GEST_ELBOW=GEST_ELBOW;`, sandbox);
const GEST_RUNTIME = src.slice(src.indexOf('/* GEST-RUNTIME-START'), src.indexOf('/* GEST-RUNTIME-END */'));
const DEFS = src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>') + '</defs></svg>'.length)
  .replace('</defs></svg>', `<filter id="cut" x="-5%" y="-10%" width="110%" height="125%"><feDropShadow dx="0" dy="-5" stdDeviation="6" flood-color="#5a3018" flood-opacity=".28"/></filter></defs></svg>`);
if (!sandbox.OUT_LEA[BOOK.lea]) throw new Error(`unknown outfit "${BOOK.lea}"`);
const LEA = sandbox.leaSVG(BOOK.lea, false).replace(/<div class="name">[^<]*<\/div>/, '');

/* ---------- subtitle chunks ↔ words ---------- */
let wi = 0; const words = [];
const vocabAt = new Map(VOCAB.map((v, i) => [v.c, { ...v, i }]));
const chunks = CH.map((c, ci) => {
  const toks = [];
  while (toks.map(t => t.t).join(' ') !== c.fr) {
    const w = W[wi++]; if (!w || toks.map(t => t.t).join(' ').length > c.fr.length) throw new Error(`chunk ${ci} "${c.fr}" does not match words.json`);
    toks.push({ t: w.t, s: w.s, e: w.e, id: `w${words.length + toks.length}`, ci });
  }
  const v = vocabAt.get(ci);
  if (v) { const ph = v.phrase.split(' '); const k = toks.findIndex((t, j) => ph.every((p, n) => toks[j + n] && toks[j + n].t === p));
    if (k < 0) throw new Error(`vocab "${v.word}": "${v.phrase}" not found in chunk ${ci}: ${c.fr}`); ph.forEach((_, n) => toks[k + n].v = true); v.s = toks[k].s; }
  words.push(...toks);
  if (EN[ci].length > 56) console.warn(`warning: English line ${ci} is ${EN[ci].length} chars (max 56)`);
  return { fr: c.fr, en: EN[ci], toks, s: toks[0].s, e: toks.at(-1).e };
});
if (wi !== W.length) throw new Error(`chunks use ${wi} words, words.json has ${W.length}`);
chunks.forEach((c, i) => { const n = chunks[i + 1]; c.show = Math.max(0, c.s - 0.12); c.hide = n ? Math.min(Math.max(n.s - 0.12, c.show + 0.3), c.e + 1.2) : c.e + 0.6; });
const AUDIO_END = +(W.at(-1).e + 0.6).toFixed(3);

// time of a cue: chunk index (start of its first word), or [chunk, 'words in it'] (start of those words), + optional offset
const norm = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿœæç0-9']/g, '');
const T = (cue, dt = 0) => {
  if (typeof cue === 'number') { if (!chunks[cue]) throw new Error(`no chunk ${cue}`); return +(chunks[cue].s + dt).toFixed(3); }
  const [c, ph] = cue, toks = chunks[c].toks, p = ph.split(' ').map(norm);
  const k = toks.findIndex((t, j) => p.every((x, n) => toks[j + n] && norm(toks[j + n].t) === x));
  if (k < 0) throw new Error(`cue "${ph}" not in chunk ${c}: ${chunks[c].fr}`);
  return +(toks[k].s + dt).toFixed(3);
};

/* ---------- segments ---------- */
const cards = VOCAB.map(v => ({ ...v, s: +(vocabAt.get(v.c).s - 0.05).toFixed(3) }));
const RECAP = +(Math.max(AUDIO_END, chunks.at(-1).hide) + 0.4).toFixed(3), RECAP_D = 7, TOTAL = +(RECAP + RECAP_D).toFixed(2);
cards.forEach((c, i) => { const n = cards[i + 1]; c.d = Math.min(5, (n ? n.s : RECAP) - 0.3 - c.s); if (i && c.s - cards[i - 1].s < 15) console.warn(`warning: vocab "${c.word}" only ${(c.s - cards[i - 1].s).toFixed(1)} s after the previous one`); });
const segs = PLAN.map((p, k) => ({ ...p, k, s: k ? +(chunks[p.c].show - 0.15).toFixed(3) : 0 }));
segs.forEach((g, k) => { g.e = k < segs.length - 1 ? segs[k + 1].s : RECAP; g.end = Math.min(TOTAL, g.e + 0.6); });
for (let k = 1; k < segs.length; k++) if (segs[k].s <= segs[k - 1].s) throw new Error(`segment ${k} (${segs[k].kind}) starts before segment ${k - 1}`);
const segAt = t => segs.findLast(g => g.s <= t + 1e-6) || segs[0];
const tc = (g, x, def) => x === undefined ? def : typeof x === 'number' && !Array.isArray(x) && x < 0 ? g.e + x : T(x);   // cue or default

/* ---------- HTML pieces ---------- */
const f = n => (+n).toFixed(3), esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const coverSVG = (w, h, id) => ART.COVER({ title: BOOK.title, author: BOOK.author }, w, h, id);
const pupHTML = (p, j) => `<div class="pup pup-${p.name || 'x' + j}" style="left:${p.x - 150}px;top:${p.y - 300}px;transform:scale(${p.s || 1})"><svg viewBox="-150 -300 300 300" width="300" height="300" overflow="visible"${p.flip ? ' style="transform:scaleX(-1)"' : ''}>${p.svg}</svg></div>`;
let js = [];            // timeline code, one string per line
const sfx = [];         // { t, k }
const J = s => js.push(s);

function nookHTML(g) {
  const qs = (g.q || []).map((q, j) => `<div class="qCard" id="s${g.k}q${j}"><div class="tape"></div><div class="qt">${esc(q.text)}</div></div>`).join('');
  return `<svg viewBox="0 0 1920 1080" class="full">${ART.NOOK_BG()}</svg>
    <div class="lea" style="left:776px;top:330px;transform:scale(1.22)">${LEA}</div>
    <svg viewBox="0 0 1920 1080" class="full">${ART.NOOK_FG()}</svg>
    <div class="chip">Cozy French <em>Books</em><small>${esc(BOOK.title)} · ${esc(BOOK.author)}</small></div>
    ${g.book ? `<div class="bookCard" id="s${g.k}bk"><span class="tagL">Le livre du jour</span>${coverSVG(380, 540, 'cvn' + g.k)}<span class="yr">${BOOK.year} · ${esc(BOOK.genre)}</span></div>` : ''}${qs}`;
}
function carnetHTML(g) {
  const col = (side, c) => !c ? '' : `<div class="col ${side}">${c.head ? `<div class="chead" id="s${g.k}${side}h">${esc(c.head)}</div>` : ''}${c.items.map((it, j) => `<div class="it ${it.style || ''}" id="s${g.k}${side}${j}">${it.icon ? `<svg class="ic" viewBox="-36 -36 72 72" width="64" height="64">${ICON[it.icon]}</svg>` : it.style === 'check' ? '<span class="box"><i></i></span>' : ''}<div>${it.label ? `<span class="lab">${esc(it.label)}</span>` : ''}<div class="hw">${esc(it.text)}</div></div></div>`).join('')}</div>`;
  return `<svg viewBox="0 0 1920 1080" class="full">${ART.CARNET()}</svg>
    <div class="ct">${esc(g.title)}</div>${col('L', g.left)}${col('R', g.right)}
    <div class="pola"><div class="photo"><div class="lea" style="left:-34px;top:-14px;transform:scale(.86)">${LEA}</div></div><span>Léa · carnet de lecture</span></div>`;
}
function pageHTML(g) {
  const P = PAGES[g.page]; if (!P) throw new Error(`segment ${g.k}: unknown page "${g.page}" (have ${Object.keys(PAGES).join(', ')})`);
  const layer = L => { let body = ['far', 'mid', 'near'].includes(L.cls) ? `<g filter="url(#cut)">${L.svg}</g>` : L.svg;
    if (L.lift) body = (L.cls === 'near' ? `<rect y="${1080 - L.lift - 20}" width="${P.w}" height="${L.lift + 20}" fill="${P.ground}"/>` : '') + `<g transform="translate(0 -${L.lift})">${body}</g>`;
    return `<div class="pl L-${L.cls}" data-k="${L.k}" style="width:${P.w}px"><svg viewBox="0 0 ${P.w} 1080" width="${P.w}" height="1080">${body}</svg>${L.cls === 'near' ? P.pups.map(pupHTML).join('') + P.props : ''}</div>`; };
  const over = (g.beats || []).map((b, j) => {
    const id = `s${g.k}b${j}`, pos = `left:${b.x ?? 0}px;top:${b.y ?? 0}px`;
    if (b.tag) return `<div class="tag" id="${id}" style="${pos}">${esc(b.tag)}${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</div>`;
    if (b.bubble) return `<div class="bub" id="${id}" style="${pos}">${bubble(b.bubble, b.flip)}</div>`;
    if (b.say) return `<div class="say${b.flip ? ' l' : ''}" id="${id}" style="${pos}">${esc(b.say)}</div>`;
    if (b.note) return `<div class="note" id="${id}">${esc(b.note)}</div>`;
    if (b.signs) return `<div class="post" id="${id}" style="${pos}"><div class="pole"></div>${b.signs.map((s, n) => `<div class="sign sg${n % 2}" style="top:${20 + n * 80}px"><span>${esc(s)}</span></div>`).join('')}</div>`;
    return '';
  }).join('');
  return `<div class="spread">${P.layers.map(layer).join('')}</div>${over}<div class="pageEdge"></div>`;
}
function chapHTML(g) {
  return `<svg viewBox="0 0 1920 1080" class="full"><rect width="1920" height="1080" fill="#7a5038"/><g filter="url(#pencil)"><rect x="210" y="60" width="1500" height="960" rx="14" fill="#fbf4e6"/>${ART.range(16, i => `<path d="M240 ${150 + i * 48} H1680" stroke="#ecdcc0" stroke-width="2"/>`)}</g></svg>
    <div class="ribbon"></div><div class="chN">Chapitre ${esc(g.n)}</div><div class="chT">${esc(g.title)}</div><div class="chS">${esc(g.sub || '')}</div>
    <svg class="chI" viewBox="-40 -40 80 80" width="150" height="150"><g filter="url(#pencil)">${ICON[g.icon] || ''}</g></svg>`;
}
function ficheHTML(g) {
  return `<svg viewBox="0 0 1920 1080" class="full"><rect width="1920" height="1080" fill="#5b7398"/><g filter="url(#pencil)">${ART.range(8, i => `<path d="M0 ${i * 150 + 40} C600 ${i * 150 + 20} 1300 ${i * 150 + 70} 1920 ${i * 150 + 30}" stroke="#506a8c" stroke-width="6" fill="none"/>`)}
    <rect x="150" y="70" width="1620" height="740" rx="20" fill="#fbf4e6"/></g></svg>
    <div class="fcover">${coverSVG(380, 540, 'cvf')}</div>
    <div class="fhead">Fiche de lecture</div><div class="ftitle">${esc(BOOK.title)} <small>${esc(BOOK.author)} · ${BOOK.year}</small></div>
    <div class="frows">${g.rows.map((r, j) => `<div class="frow" id="s${g.k}r${j}"><b>${esc(r.label)}</b><span>${esc(r.text)}</span></div>`).join('')}
    <div class="frow cups" id="s${g.k}cups"><b>Note de Léa</b><span>${ART.range(5, i => `<svg viewBox="-32 -32 64 64" width="52" height="52" class="cup${i < g.rating ? ' on' : ''}">${ICON.tea}</svg>`)}</span></div></div>`;
}
function shelfHTML() {
  return `<svg viewBox="0 0 1920 1080" class="full">${ART.SHELF()}</svg><div class="shDim"></div>
    <div class="spine"><svg viewBox="0 0 70 300" width="70" height="300"><g filter="url(#pencil)"><rect width="70" height="300" rx="5" fill="#e2733f"/><circle cx="35" cy="44" r="16" fill="#fff1cf"/></g><text x="44" y="90" transform="rotate(90 44 90)" font-family="Playfair Display" font-weight="700" font-size="24" fill="#fffaf0">${esc(BOOK.title)}</text></svg></div>
    <div class="opCover">${coverSVG(380, 540, 'cvo')}</div>
    <div class="opTitle"><div class="o1">Cozy French</div><div class="o2">Books</div><div class="o3">Lire en français, grandir un peu</div><div class="o4">Épisode ${BOOK.ep} · ${esc(BOOK.title)}</div></div>`;
}
const KIND = { shelf: shelfHTML, nook: nookHTML, carnet: carnetHTML, page: pageHTML, chap: chapHTML, fiche: ficheHTML };
const segHTML = segs.map(g => { if (!KIND[g.kind]) throw new Error(`segment ${g.k}: unknown kind "${g.kind}"`);
  return `<div id="seg${g.k}" class="clip seg ${g.kind}" data-start="${f(g.s)}" data-duration="${f(g.end - g.s)}" data-track-index="${10 + (g.k % 2)}">${KIND[g.kind](g)}</div>`; }).join('\n');

/* ---------- timeline: per segment ---------- */
const lr = mulberry32(21);
const pageSegs = segs.filter(g => g.kind === 'page');
const mapStart = segs.find(g => (g.beats || []).some(b => b.map !== undefined));
const STOPX = mapStopsX(BOOK.map.stops.length);
let mapOn = false;
segs.forEach((g, i) => {
  const S = g.s, E = g.e, P = `#seg${g.k}`, prev = segs[i - 1];
  // entrance
  const IN = { nook: `{opacity:0},{opacity:1,duration:.5}`, carnet: `{opacity:0,y:60},{opacity:1,y:0,duration:.55,ease:'power2.out'}`, page: `{opacity:0,scale:1.03},{opacity:1,scale:1,duration:.6,ease:'power1.out'}`,
    chap: `{opacity:0,x:80},{opacity:1,x:0,duration:.55,ease:'power2.out'}`, fiche: `{opacity:0,y:40},{opacity:1,y:0,duration:.55,ease:'power2.out'}`, shelf: `{opacity:1},{opacity:1,duration:.01}` }[g.kind];
  if (i) J(`ft('${P}',${IN},${f(S)});`);
  if (i) sfx.push({ t: S, k: { nook: 'swish', chap: 'page', page: 'page', carnet: 'paper', fiche: 'paper' }[g.kind] });
  if (g.kind === 'chap') sfx.push({ t: S + .7, k: 'chime' }, { t: S + 2.3, k: 'thud' });
  // the map: visible on story pages from its first appearance on
  const showMap = g.kind === 'page' && mapStart && g.k >= mapStart.k;
  if (showMap && !mapOn) { J(`ft('#map',{opacity:0},{opacity:1,duration:.4},${f(S + .3)});`); mapOn = true; }
  if (!showMap && mapOn) { J(`tl.to('#map',{opacity:0,duration:.3},${f(S)});`); mapOn = false; }

  if (g.kind === 'shelf') {
    J(`ft('${P} .spine',{x:0,y:0,scale:1},{x:-14,y:-8,scale:1.12,rotation:-3,duration:.6,ease:'power2.out'},.35);`);
    J(`ft('${P} .shDim',{opacity:0},{opacity:1,duration:.6},.9); ft('${P} .spine',{opacity:1},{opacity:0,duration:.25},1.05);`);
    J(`ft('${P} .opCover',{opacity:0,scale:.4,rotation:-12,x:500},{opacity:1,scale:1,rotation:-4,x:0,duration:.7,ease:'back.out(1.4)'},1.05);`);
    J(`['.o1','.o2','.o3','.o4'].forEach((s,i)=>ft('${P} '+s,{opacity:0,y:30},{opacity:1,y:0,duration:.45,ease:'back.out(1.6)'},1.5+i*.35));`);
    sfx.push({ t: .35, k: 'swish' }, { t: 1.05, k: 'card' }, { t: 1.5, k: 'blip' }, { t: 1.85, k: 'blip' }, { t: 2.2, k: 'tick' }, { t: 2.55, k: 'pop' });
  }
  if (g.kind === 'nook' || g.kind === 'carnet') {
    const L = `${P} .lea`;
    J(`tl.set('${L} .head',{rotation:0,transformOrigin:'50% 95%'},0); tl.set('${L} .gest',{svgOrigin:'257 286',opacity:0},0);`);
    J(`Object.keys(ELB).forEach(p=>{ if(q('${L} .g-'+p+' .fore').length) tl.set('${L} .g-'+p+' .fore',{svgOrigin:ELB[p].join(' ')},0); });`);
    J(`loop('${L} .breath',{y:0},{y:-3,ease:'sine.inOut',yoyo:true},1.6,${f(S)},${f(g.end)});`);
    J(`loop('${L} .head',{rotation:-1.5},{rotation:2,ease:'sine.inOut',yoyo:true},2.7,${f(S)},${f(g.end)});`);
    for (let t = S + 1 + lr() * 2; t < g.end; t += 2.8 + lr() * 2.6) J(`ft('${L} .eye',{scaleY:1},{scaleY:.1,transformOrigin:'50% 50%',duration:.07,yoyo:true,repeat:1},${f(t)});`);
  }
  if (g.kind === 'nook') {
    J(`q('${P} .drop').forEach((d,j)=>{const dd=.55+(j%5)*.08; loop(d,{y:-60,opacity:0},{y:90,opacity:.9},dd,${f(S)}-(j%7)*.1,${f(g.end)});});`);
    J(`loop('${P} .lampGlow',{opacity:.85},{opacity:1,ease:'sine.inOut',yoyo:true},2.2,${f(S)},${f(g.end)}); loop('${P} .steamT',{y:0,opacity:.7},{y:-26,opacity:0},2.4,${f(S)},${f(g.end)});`);
    J(`loop('${P} .catB',{scaleY:1,transformOrigin:'50% 100%'},{scaleY:1.04,ease:'sine.inOut',yoyo:true},1.6,${f(S)},${f(g.end)});`);
    if (g.book) { const a = tc(g, g.book.c), b = tc(g, g.book.until, Math.min(a + 6, E - .3));
      J(`ft('#s${g.k}bk',{opacity:0,y:-60,rotation:8},{opacity:1,y:0,rotation:3,duration:.6,ease:'back.out(1.6)'},${f(a)}); tl.to('#s${g.k}bk',{opacity:0,y:-40,duration:.4},${f(b)});`); sfx.push({ t: a, k: 'card' }); }
    (g.q || []).forEach((q, j) => { const a = tc(g, q.c) - .15, nx = g.q[j + 1], b = q.until !== undefined ? tc(g, q.until) : nx ? tc(g, nx.c) - .4 : E - .3;
      J(`ft('#s${g.k}q${j}',{opacity:0,y:-40},{opacity:1,y:0,duration:.45,ease:'back.out(1.6)'},${f(a)}); tl.to('#s${g.k}q${j}',{opacity:0,duration:.35},${f(b)});`); sfx.push({ t: a, k: 'paper' }); });
    // hand gestures while talking, a pose every few seconds, never the same twice in a row
    const ws = words.filter(w => w.s > S + .8 && w.e < E - 1); let next = S + 1.2, last = '';
    ws.forEach(w => { if (w.s < next) return; if (lr() < .3) { next = w.s + 2; return; }
      const d = Math.min(1.7 + lr() * 1.4, E - w.s - .5); if (d < 1.3) return;
      const pool = ['palm', 'up', 'count', 'think', 'beat', 'shrug'].filter(p => p !== last), p = pool[Math.floor(lr() * pool.length)]; last = p;
      const b = ws.filter(x => x.s > w.s + .35 && x.s < w.s + d - .4).map(x => +x.s.toFixed(2));
      J(`gestTL(tl,'${P} .lea',${JSON.stringify({ p, t: +w.s.toFixed(3), d: +d.toFixed(2), b })});`); next = w.s + d + 2 + lr() * 3.5; });
  }
  if (g.kind === 'carnet') {
    const all = [...(g.left?.items || []).map((it, j) => ['L', j, it]), ...(g.right?.items || []).map((it, j) => ['R', j, it])];
    ['L', 'R'].forEach(sd => { const c = g[sd === 'L' ? 'left' : 'right']; if (c?.head) J(`ft('#s${g.k}${sd}h',{opacity:0,y:-10},{opacity:1,y:0,duration:.4},${f(tc(g, c.headAt, S + .5))});`); });
    all.forEach(([sd, j, it]) => { const t = tc(g, it.c, S + .6 + j * .4), id = `#s${g.k}${sd}${j}`;
      J(`ft('${id}',{opacity:0},{opacity:1,duration:.25},${f(t)}); ft('${id} .hw',{opacity:0,x:-24},{opacity:1,x:0,duration:.6,ease:'power2.out'},${f(t + .1)});`);
      if (it.style === 'check') J(`ft('${id} .box i',{scale:0},{scale:1,duration:.3,ease:'back.out(3)'},${f(t + 1.2)});`);
      if (it.icon) J(`ft('${id} .ic',{scale:.3,opacity:0},{scale:1,opacity:1,duration:.4,ease:'back.out(2)'},${f(t)});`);
      sfx.push({ t, k: 'scribble' }); });
    J(`ft('${P} .pola',{opacity:0,scale:.7,rotation:-6},{opacity:1,scale:1,rotation:4,duration:.5,ease:'back.out(1.8)'},${f(S + .7)});`);
  }
  if (g.kind === 'chap') {
    J(`ft('${P} .ribbon',{height:0},{height:240,duration:.5,ease:'power2.out'},${f(S + .4)}); ft('${P} .chN',{opacity:0},{opacity:1,duration:.4},${f(S + .5)});`);
    J(`ft('${P} .chT',{opacity:0,y:30},{opacity:1,y:0,duration:.7,ease:'back.out(1.6)'},${f(S + .7)}); ft('${P} .chS',{opacity:0},{opacity:1,duration:.5},${f(S + 1.5)});`);
    J(`ft('${P} .chI',{opacity:0,y:-80,rotation:-30},{opacity:1,y:0,rotation:0,duration:.6,ease:'bounce.out'},${f(S + 1.9)});`);
  }
  if (g.kind === 'fiche') {
    J(`ft('${P} .fcover',{opacity:0,x:-60,rotation:-8},{opacity:1,x:0,rotation:-3,duration:.6,ease:'back.out(1.5)'},${f(S + .3)});`);
    g.rows.forEach((r, j) => { const t = tc(g, r.c, S + .8 + j * .5); J(`ft('#s${g.k}r${j}',{opacity:0,x:30},{opacity:1,x:0,duration:.4,ease:'power2.out'},${f(t)});`); sfx.push({ t, k: 'tap' }); });
    const t = tc(g, g.ratingAt, E - 4); J(`ft('#s${g.k}cups',{opacity:0},{opacity:1,duration:.3},${f(t)}); q('#s${g.k}cups .cup').forEach((c,j)=>ft(c,{scale:.3,opacity:0},{scale:1,opacity:c.classList.contains('on')?1:.3,duration:.35,ease:'back.out(2)'},${f(t)}+.2+j*.18));`);
    for (let j = 0; j < 5; j++) sfx.push({ t: t + .2 + j * .18, k: j < g.rating ? 'blip' : 'tick' });
  }
  if (g.kind === 'page') {
    const Pg = PAGES[g.page], D = E + .6 - S;
    J(`q('${P} .pl').forEach(el=>ft(el,{x:0},{x:-70*(+el.dataset.k),duration:${f(D)},ease:'none'},${f(S)}));`);
    Pg.pups.forEach(p => { if (p.hidden) J(`tl.set('${P} .pup-${p.name}',{opacity:0},${f(S)});`); });
    J(`loop('${P} .pBody',{y:0},{y:-3,ease:'sine.inOut',yoyo:true},1.7,${f(S)},${f(g.end)}); loop('${P} .sBob',{y:0},{y:2,ease:'sine.inOut',yoyo:true},1.8,${f(S)},${f(g.end)});`);
    J(`q('${P} .shHead').forEach((h,j)=>loop(h,{rotation:0,transformOrigin:'10% 80%'},{rotation:20,ease:'sine.inOut',yoyo:true},1.5+(j%3)*.3,${f(S)}+j*.4,${f(g.end)}));`);
    J(`loop('${P} .tuft',{skewX:-4},{skewX:4,ease:'sine.inOut',yoyo:true},1.6,${f(S)},${f(g.end)}); loop('${P} .wave',{x:-12},{x:12,ease:'sine.inOut',yoyo:true},1.8,${f(S)},${f(g.end)});`);
    J(`loop('${P} .rock',{rotation:-2,svgOrigin:'0 -40'},{rotation:2,ease:'sine.inOut',yoyo:true},1.6,${f(S)},${f(g.end)}); loop('${P} .lamp',{rotation:-3,transformOrigin:'50% 0%'},{rotation:3,ease:'sine.inOut',yoyo:true},2.2,${f(S)},${f(g.end)});`);
    J(`loop('${P} .twk',{opacity:.3},{opacity:1,ease:'sine.inOut',yoyo:true},1.3,${f(S)},${f(g.end)}); loop('${P} .flag',{scaleX:1,transformOrigin:'0% 50%'},{scaleX:.7,ease:'sine.inOut',yoyo:true},.6,${f(S)},${f(g.end)});`);
    J(`loop('${P} .birds',{x:0,y:0},{x:-40,y:8,ease:'sine.inOut',yoyo:true},3,${f(S)},${f(g.end)}); loop('${P} .cloud',{x:0},{x:50,ease:'sine.inOut',yoyo:true},10,${f(S)},${f(g.end)});`);
    J(`st('${P} .dawn,${P} .L-dawn',{opacity:0},${f(S)}); st('${P} .chest,${P} .hole,${P} .tea,${P} .jar,${P} .stones,${P} .client1,${P} .jc,${P} .sparks',{opacity:0},${f(S)});`);
    (g.beats || []).forEach((b, j) => {
      const id = `#s${g.k}b${j}`, t = tc(g, b.c, S + .5), u = b.until !== undefined ? tc(g, b.until) : E - .2;
      const tgt = b.who ? `${P} .pup-${b.who}` : b.sel ? b.sel.split(',').map(s => `${P} ${s.trim()}`).join(',') : null;
      if (b.tag || b.say) { J(`ft('${id}',{opacity:0,y:20,scale:.9},{opacity:1,y:0,scale:1,duration:.4,ease:'back.out(2)'},${f(t)}); tl.to('${id}',{opacity:0,duration:.3},${f(u)});`); sfx.push({ t, k: 'pop' }); }
      if (b.bubble) { J(`ft('${id}',{opacity:0,scale:.5,transformOrigin:'85% 95%'},{opacity:1,scale:1,duration:.45,ease:'back.out(2)'},${f(t)}); tl.to('${id}',{opacity:0,scale:.8,duration:.3},${f(u)});`); sfx.push({ t, k: 'pop' }); }
      if (b.note) { J(`ft('${id}',{opacity:0,rotation:-8,y:-30},{opacity:1,rotation:-2,y:0,duration:.5,ease:'back.out(1.6)'},${f(t)}); tl.to('${id}',{opacity:0,duration:.3},${f(u)});`); sfx.push({ t, k: 'paper' }); }
      if (b.signs) { const cs = b.at || []; J(`ft('${id}',{opacity:0,y:30},{opacity:1,y:0,duration:.4},${f(t - .3)});`);
        b.signs.forEach((_, n) => { const tt = cs[n] !== undefined ? T(cs[n]) : t + n * .8; J(`ft('${id} .sign:nth-of-type(${n + 2})',{opacity:0,scale:.3},{opacity:1,scale:1,duration:.4,ease:'back.out(2.2)'},${f(tt)});`); sfx.push({ t: tt, k: 'pop' }); });
        J(`tl.to('${id}',{opacity:0,duration:.4},${f(u)});`); }
      if (b.show) { J(`ft('${tgt}',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.45,ease:'back.out(2)'},${f(t)});`); sfx.push({ t, k: /coins|chest|stones/.test(tgt) ? 'coin' : 'pop' }); }
      if (b.fadeIn) J(`ft('${tgt}',{opacity:0},{opacity:${b.to ?? 1},duration:${b.dur ?? 1.5}},${f(t)});`);
      if (b.hide) { J(`tl.to('${tgt}',{opacity:0,duration:${b.dur ?? .4}},${f(t)});`); if ((b.dur ?? .4) > .1) sfx.push({ t, k: 'swish' }); }
      if (b.seq) { J(`q('${tgt}').forEach((el,n)=>ft(el,{opacity:0,y:-30},{opacity:1,y:0,duration:.3,ease:'bounce.out'},${f(t)}+n*${b.step ?? .6}));`); for (let n = 0; n < (b.n ?? 5); n++) sfx.push({ t: t + .25 + n * (b.step ?? .6), k: 'coin' }); }
      if (b.walk) { const [dx, dy = 0, sc] = b.walk, dur = b.dur ?? 3;
        if (b.who) for (let x = t + .1; x < t + dur; x += .4) sfx.push({ t: x, k: 'step', g: sc ? Math.max(.3, 1 - (x - t) / dur * .7) : 1 }); else sfx.push({ t, k: 'whoosh' }, { t: t + dur, k: 'coin' });
        J(`tl.to('${tgt}',{x:'+=${dx}',y:'+=${dy}'${sc ? `,scale:${sc}` : ''},duration:${dur},ease:'none'},${f(t)});`);
        J(`loop('${tgt} .sLegF,${tgt} .pLegF',{rotation:-16,transformOrigin:'50% 0%'},{rotation:16,ease:'sine.inOut',yoyo:true},.4,${f(t)},${f(t + dur)}); loop('${tgt} .sLegB,${tgt} .pLegB',{rotation:16,transformOrigin:'50% 0%'},{rotation:-16,ease:'sine.inOut',yoyo:true},.4,${f(t)},${f(t + dur)});`);
        J(`st('${tgt} .sLegF,${tgt} .pLegF,${tgt} .sLegB,${tgt} .pLegB',{rotation:0},${f(t + dur + .02)}); loop('${tgt} > svg',{y:0},{y:-6,ease:'sine.inOut',yoyo:true},.2,${f(t)},${f(t + dur)});`); }
      if (typeof b.flip === 'number') J(`tl.to('${tgt} > svg',{scaleX:${b.flip},duration:.25,ease:'power2.inOut'},${f(t)});`);
      if (b.dig) for (let x = t + .2; x < u; x += .9) sfx.push({ t: x, k: 'dig' });
      if (b.dig) J(`loop('${tgt} .sArm,${tgt} .pArm',{rotation:0,transformOrigin:'0% 0%'},{rotation:28,ease:'power1.inOut',yoyo:true},.45,${f(t)},${f(u)});`);
      if (b.glow) sfx.push({ t, k: 'sparkle' });
      if (b.glow) J(`loop('${tgt}',{scale:1,transformOrigin:'50% 50%'},{scale:1.12,ease:'sine.inOut',yoyo:true},.6,${f(t)},${f(u)});`);
      if (b.wind) for (let x = t; x < u; x += 2.6) sfx.push({ t: x, k: 'gust' });
      if (b.wind) J(`q('${P} .wnd').forEach((w,n)=>loop(w,{strokeDashoffset:1},{strokeDashoffset:0},1.4,${f(t)}+n*.2,${f(u)})); q('${P} .sand circle').forEach((s,n)=>loop(s,{x:0,opacity:0},{x:180,opacity:1},1.2+(n%4)*.2,${f(t)}+(n%9)*.12,${f(u)}));`);
      if (b.map !== undefined) sfx.push({ t, k: 'pin' });
      if (b.map !== undefined) { const n = BOOK.map.stops.length, frac = n > 1 ? b.map / (n - 1) : 0;
        J(`tl.to('#map .mapPin',{x:${STOPX[b.map]},duration:1.2,ease:'power2.inOut'},${f(t)}); tl.to('#map .mapRoute',{strokeDashoffset:${(1 - frac).toFixed(3)},duration:1.2,ease:'power2.inOut'},${f(t)});`); }
      if (b.ret) sfx.push({ t, k: 'whoosh' }, { t: t + 1.9, k: 'pin' });
      if (b.ret) J(`tl.to('#map .mapReturn',{strokeDashoffset:0,duration:2,ease:'power2.inOut'},${f(t)}); tl.to('#map .mapPin',{x:${STOPX[0]},duration:2,ease:'power2.inOut'},${f(t)});`);
      if (b.pan) sfx.push({ t, k: 'whoosh' });
      if (b.pan) J(`q('${P} .pl').forEach(el=>tl.to(el,{x:'-='+(${b.pan}*(+el.dataset.k)),duration:${b.dur ?? 3},ease:'power2.inOut'},${f(t)}));`);
    });
  }
});
if (mapOn) J(`tl.to('#map',{opacity:0,duration:.3},${f(RECAP)});`);

/* lip sync (nook + carnet Léa) + karaoke */
words.forEach(w => { const g = segAt(w.s), len = Math.min(w.e - w.s, .08 * w.t.length + .08), flaps = Math.max(1, Math.round(len / .2)), fd = len / flaps / 2;
  if (g.kind === 'nook' || g.kind === 'carnet') for (let k = 0; k < flaps; k++) J(`ft('#seg${g.k} .mouth',{scaleY:1},{scaleY:${(2.4 + lr() * 1.8).toFixed(2)},transformOrigin:'50% 0%',duration:${fd.toFixed(3)},yoyo:true,repeat:1,ease:'sine.inOut'},${f(w.s + k * fd * 2)});`);
  J(`tl.to('#${w.id}',{color:'${w.v ? '#b8552a' : '#3a2e28'}',duration:.1},${f(w.s)});${w.v ? `tl.to('#${w.id} .ul',{scaleX:1,duration:.35,ease:'power2.out'},${f(w.s)});` : ''}`); });
chunks.forEach((c, i) => J(`ft('#sub${i} .subBox',{y:26,opacity:0},{y:0,opacity:1,duration:.25,ease:'back.out(2)'},${f(c.show)});`));
cards.forEach((c, i) => { J(`ft('#card${i} .card',{y:-80,opacity:0,rotation:3},{y:0,opacity:1,rotation:-1.5,duration:.5,ease:'back.out(1.7)'},${f(c.s)}); ft('#card${i} .ex',{opacity:0,y:10},{opacity:1,y:0,duration:.4},${f(c.s + .5)}); tl.to('#card${i} .card',{y:-50,opacity:0,duration:.3,ease:'power2.in'},${f(c.s + c.d - .35)});`); sfx.push({ t: c.s, k: 'card' }); });
J(`ft('#recap',{opacity:0},{opacity:1,duration:.5},${RECAP}); ft('#recap-title',{y:30,opacity:0},{y:0,opacity:1,duration:.6,ease:'back.out(2)'},${RECAP + .2});`);
J(`q('#recap .it').forEach((it,i)=>ft(it,{y:30,opacity:0},{y:0,opacity:1,duration:.4,ease:'back.out(2)'},${RECAP + .7}+i*.25)); ft('#recap-sig',{opacity:0},{opacity:1,duration:.6},${(TOTAL - 1.8).toFixed(2)});`);
sfx.push({ t: RECAP + .2, k: 'chime' }); cards.forEach((c, i) => sfx.push({ t: RECAP + .7 + i * .25, k: 'tick' }));

/* ---------- composition ---------- */
const wordsHTML = c => c.toks.map(t => `<span class="w${t.v ? ' vocab' : ''}" id="${t.id}">${t.v ? '<i class="ul"></i>' : ''}<b class="tx">${esc(t.t)}</b></span>`).join(' ');
const subsHTML = chunks.map((c, i) => `<div id="sub${i}" class="clip subWrap" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3"><div class="subBox"><div class="subWho">Léa</div><div class="subFr">${wordsHTML(c)}</div><div class="subEn">${esc(c.en)}</div></div></div>`).join('\n');
const cardsHTML = cards.map((c, i) => `<div id="card${i}" class="clip cardWrap" data-start="${f(c.s)}" data-duration="${f(c.d)}" data-track-index="4"><div class="card"><div class="rib"></div><span class="tag">${esc(c.tag)}</span><div class="word">${esc(c.word)}</div><div class="ipa">${esc(c.ipa)}</div><div class="mean">${esc(c.mean)}</div><div class="ex">${esc(c.ex)}<i>${esc(c.exEn)}</i></div></div></div>`).join('\n');
const CAVEAT = 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'radio/assets/fonts/caveat-600-latin.woff2')).toString('base64');
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'brand/logo.png')).toString('base64');

const comp = `<template>
  <style>
    @font-face{font-family:'Caveat';font-weight:600;src:url(${CAVEAT}) format('woff2')}
    #books{position:absolute;inset:0;overflow:hidden;background:#2a221c;font-family:Nunito,sans-serif;color:#3a2e28}
    .seg{position:absolute;inset:0;overflow:hidden;background:#2a221c}
    .full{position:absolute;inset:0;width:1920px;height:1080px}
    .lea{position:absolute;width:360px;height:480px;transform-origin:0 0}
    .lea svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible} .lea .gest{opacity:0}
    .grain{position:absolute;inset:0;pointer-events:none;opacity:.18;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
    .logo{position:absolute;right:40px;top:30px;width:120px;height:120px;border-radius:50%}
    /* shelf */
    .shDim{position:absolute;inset:0;background:#1a120cc8;opacity:0}
    .spine{position:absolute;left:925px;top:340px} .opCover{position:absolute;left:330px;top:230px;opacity:0;border-radius:10px;box-shadow:0 24px 40px #0008}
    .opTitle{position:absolute;left:830px;top:300px;color:#fffaf0} .opTitle>div{opacity:0}
    .o1{font:700 112px/1 'Playfair Display',serif} .o2{font:italic 700 140px/1 'Playfair Display',serif;color:#f3c96b;margin:-6px 0 0 120px}
    .o3{font:800 30px Nunito;letter-spacing:.06em;color:#e9d9c4;margin-top:26px} .o4{display:inline-block;font:800 24px Nunito;background:#fffaf0;color:#3a2e28;padding:8px 20px;border-radius:24px;margin-top:22px}
    /* nook */
    .chip{position:absolute;left:48px;top:40px;background:#fffaf0e8;border-radius:22px;padding:12px 26px 10px;font:700 34px 'Playfair Display',serif}
    .chip em{color:#b8552a;font-style:italic} .chip small{display:block;font:800 19px Nunito;color:#8a7a6c;letter-spacing:.04em}
    .bookCard{position:absolute;left:1330px;top:150px;opacity:0;border-radius:10px;box-shadow:0 20px 34px #0006}
    .bookCard .tagL{position:absolute;left:-20px;top:-34px;font:800 20px Nunito;letter-spacing:.12em;text-transform:uppercase;background:#3a2e28;color:#f3c96b;padding:7px 16px;border-radius:20px;transform:rotate(-4deg)}
    .bookCard .yr{position:absolute;right:-24px;bottom:40px;font:600 34px Caveat;background:#f3c96b;padding:4px 16px;border-radius:8px;transform:rotate(5deg)}
    .qCard{position:absolute;left:470px;top:90px;width:980px;padding:28px 50px 32px;background:#e9d2a8;border-radius:6px;box-shadow:0 14px 0 #0000001f;opacity:0;transform:rotate(-1.5deg);text-align:center}
    .qCard .tape{position:absolute;left:50%;top:-20px;width:150px;height:40px;margin-left:-75px;background:#f3c96bd0;transform:rotate(3deg)}
    .qCard .qt{font:600 66px/1.05 Caveat}
    /* carnet */
    .ct{position:absolute;left:300px;top:112px;font:600 48px Caveat;color:#5b7398;transform:rotate(-1.2deg)}
    .col{position:absolute;display:flex;flex-direction:column;gap:22px;transform:rotate(-1.2deg)} .col.L{left:300px;top:200px;width:620px} .col.R{left:1040px;top:150px;width:660px}
    .chead{font:900 20px Nunito;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6c;border-bottom:3px solid #e8907e;padding-bottom:6px;opacity:0}
    .it{display:flex;gap:16px;align-items:flex-start;opacity:0} .it .ic{flex:none;margin-top:2px}
    .lab{display:inline-block;font:900 17px Nunito;letter-spacing:.12em;text-transform:uppercase;color:#fffaf0;background:#d9774b;padding:5px 12px;border-radius:14px;margin-bottom:6px}
    .hw{font:600 48px/1.05 Caveat;color:#3a2e28}
    .it.accent .hw{color:#b8552a} .it.big .hw{font-size:68px} .it.thought .hw{color:#8a7a6c;font-style:italic} .it.small .hw{font-size:40px}
    .box{flex:none;width:40px;height:40px;border:4px solid #3a2e28;border-radius:8px;margin-top:8px;position:relative} .box i{position:absolute;left:6px;top:-6px;width:16px;height:28px;border:solid #5f8f5a;border-width:0 7px 7px 0;transform:rotate(40deg) scale(0)}
    .pola{position:absolute;left:1390px;top:470px;width:300px;padding:16px 16px 0;background:#fffaf0;box-shadow:0 12px 24px #0004;transform:rotate(4deg);opacity:0}
    .pola .photo{position:relative;width:268px;height:250px;overflow:hidden;background:#e9d6bb} .pola>span{display:block;font:600 30px Caveat;text-align:center;padding:6px 0 10px}
    /* pages */
    .spread{position:absolute;inset:0;overflow:hidden;background:#f7efdc}
    .pl{position:absolute;left:0;top:0;height:1080px} .pl>svg{position:absolute;left:0;top:0}
    .pup{position:absolute;width:300px;height:300px;transform-origin:50% 100%} .pup>svg{overflow:visible}
    .prop{position:absolute}
    .gutter{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#0000 0,#0000 46%,#3a24101c 49%,#3a241038 50%,#3a24101c 51%,#0000 54%)}
    .pageEdge{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 14px #f4e9d2,inset 0 0 0 16px #d9c7a4,inset 0 0 60px #6b4a3640}
    .tag{position:absolute;font:600 46px/1 Caveat;background:#fffaf0;padding:10px 20px 12px;border-radius:10px;box-shadow:0 8px 0 #0000001a;opacity:0}
    .tag small{display:block;font:800 17px Nunito;letter-spacing:.08em;text-transform:uppercase;color:#8a7a6c;margin-top:4px}
    .bub{position:absolute;opacity:0} .bub svg{display:block}
    .say{position:absolute;max-width:520px;font:600 44px/1.05 Caveat;background:#fffaf0;border:4px solid #3a2e28;border-radius:26px;padding:14px 26px;opacity:0}
    .say::after{content:"";position:absolute;left:40px;bottom:-26px;border:14px solid transparent;border-top:16px solid #3a2e28} .say.l::after{left:auto;right:40px}
    .note{position:absolute;left:760px;top:60px;width:540px;font:600 50px/1.02 Caveat;color:#b8552a;background:#fffaf0ee;padding:16px 26px;border-radius:12px;box-shadow:0 10px 0 #0000001a;opacity:0;text-align:center}
    .post{position:absolute;width:420px;height:340px;opacity:0} .post .pole{position:absolute;left:199px;top:0;width:22px;height:340px;background:#7a5038;border-radius:6px}
    .sign{position:absolute;width:220px;padding:12px 10px;background:#c9a06a;border:4px solid #7a5038;border-radius:6px;font:600 34px/1 Caveat;color:#3a2418;text-align:center;opacity:0}
    .sign.sg0{left:224px;transform:rotate(-5deg)} .sign.sg1{right:224px;transform:rotate(5deg)}
    /* chapter + fiche */
    .ribbon{position:absolute;left:1440px;top:0;width:90px;height:0;background:#c9502e;border-radius:0 0 8px 8px}
    .chN{position:absolute;left:0;right:0;top:170px;text-align:center;font:900 30px Nunito;letter-spacing:.3em;text-transform:uppercase;color:#8a7a6c;opacity:0}
    .chT{position:absolute;left:0;right:0;top:215px;text-align:center;font:italic 700 160px/1.05 'Playfair Display',serif;color:#b8552a;opacity:0}
    .chS{position:absolute;left:0;right:0;top:415px;text-align:center;font:600 54px Caveat;opacity:0}
    .chI{position:absolute;left:885px;top:500px;opacity:0}
    .fcover{position:absolute;left:250px;top:150px;transform:rotate(-3deg);border-radius:10px;box-shadow:0 18px 30px #0005}
    .fhead{position:absolute;left:760px;top:120px;font:900 22px Nunito;letter-spacing:.2em;text-transform:uppercase;color:#d9774b}
    .ftitle{position:absolute;left:760px;top:150px;font:700 68px 'Playfair Display',serif} .ftitle small{font:700 30px Nunito;color:#8a7a6c;margin-left:12px}
    .frows{position:absolute;left:760px;top:260px;width:920px;display:flex;flex-direction:column;gap:14px}
    .frow{display:flex;gap:22px;align-items:baseline;border-bottom:3px dashed #e6dccd;padding-bottom:12px;opacity:0} .frow b{flex:none;width:250px;font:900 22px Nunito;letter-spacing:.1em;text-transform:uppercase;color:#8a7a6c}
    .frow span{font:700 32px/1.25 Nunito} .frow.cups span{display:flex;gap:10px}
    /* map */
    #map{position:absolute;left:30px;top:22px;opacity:0;transform:scale(.78);transform-origin:0 0}
    /* subtitles: same as The Cozy French — fixed box, fixed size, one line */
    .subWrap{position:absolute;left:0;right:0;bottom:64px;display:flex;justify-content:center}
    .subBox{--fs:44px;position:relative;box-sizing:border-box;width:1500px;background:#fffdf7;border:5px solid #3a2e28;border-radius:26px;padding:30px 46px 22px;box-shadow:0 9px 0 #3a2e28;text-align:center}
    .subWho{position:absolute;left:30px;top:-25px;font:800 26px/1 Nunito;color:#3a2e28;background:#f3c96b;border:4px solid #3a2e28;border-radius:30px;padding:6px 20px}
    .subFr{font:800 var(--fs)/1.3 Nunito;color:#b3a698;white-space:nowrap}
    .subFr .w{display:inline-block;position:relative} .subFr .tx{position:relative;font-weight:inherit}
    .subFr .ul{position:absolute;left:0;right:0;bottom:4px;height:10px;background:#d9774b55;border-radius:6px;transform-origin:left center;transform:scaleX(0)}
    .subEn{font:800 var(--fs)/1.3 Nunito;color:#5d7fa0;margin-top:10px;padding-top:10px;border-top:3px dashed #e6dccd;white-space:nowrap}
    /* vocab cards (bookmark) */
    .cardWrap{position:absolute;left:1330px;top:170px;width:520px}
    .card{position:relative;background:#fffaf0;border-radius:8px 8px 28px 28px;padding:30px 32px 24px;box-shadow:0 14px 0 #0000002a;border:4px solid #3a2e28}
    .card .rib{position:absolute;left:36px;top:-170px;width:44px;height:180px;background:#c9502e;border-radius:0 0 6px 6px}
    .card .tag{display:inline-block;font:800 22px Nunito;letter-spacing:.08em;text-transform:uppercase;background:#f3c96b;padding:4px 14px;border-radius:20px;margin-left:70px}
    .card .word{font:700 54px/1.1 'Playfair Display',serif;color:#b8552a;margin:12px 0 4px} .card .ipa{font:600 28px 'Noto Sans',Nunito,sans-serif;color:#6f5f52}
    .card .mean{font:800 32px Nunito;margin-top:12px} .card .ex{font:600 27px/1.35 Nunito;margin-top:12px;padding-top:12px;border-top:3px dashed #e3d4c1} .card .ex i{color:#6f5f52;display:block;font-style:normal;margin-top:4px}
    /* recap */
    #recap{position:absolute;inset:0;background:#f6eddc;display:flex;flex-direction:column;align-items:center;justify-content:center}
    #recap h2{font:700 66px 'Playfair Display',serif;margin:0 0 34px} #recap .grid{display:grid;grid-template-columns:repeat(3,560px);gap:18px}
    #recap .it2{background:#fffaf0;border:4px solid #3a2e28;border-radius:20px;padding:12px 22px;font:800 30px Nunito;color:#d9774b} #recap .it2 small{display:block;font:600 22px Nunito;color:#3a2e28;margin-top:2px}
    #recap .sig{margin-top:30px;font:700 30px 'Playfair Display',serif;color:#8a7a6c}
  </style>
  <div id="books" data-composition-id="books" data-width="1920" data-height="1080">
    ${DEFS}
    ${segHTML}
    <div id="map" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="5">${MAP(BOOK.map.stops, BOOK.map.title)}</div>
    <img class="logo" src="${LOGO}" alt="">
    <div class="grain"></div>
    ${subsHTML}
    ${cardsHTML}
    <div id="recap" class="clip" data-start="${f(RECAP)}" data-duration="${f(RECAP_D)}" data-track-index="6">
      <h2 id="recap-title">Aujourd'hui, on a appris…</h2>
      <div class="grid">${cards.map(c => `<div class="it2">${esc(c.word)}<small>${esc(c.mean)}</small></div>`).join('')}</div>
      <div class="sig" id="recap-sig">À bientôt sur Cozy French Books ♡</div>
    </div>
  </div>
  <script>
  (function(){
    const tl=gsap.timeline({paused:true});
    const q=s=>Array.from(document.querySelectorAll(s));
    const ft=(el,a,b,t)=>{ if(typeof el==='string'&&!q(el).length) return; tl.fromTo(el,a,{...b,immediateRender:false},t); };
    const loop=(el,a,b,d,t0,t1)=>{ if(typeof el==='string'&&!q(el).length) return; t0=Math.max(0,t0); const n=Math.max(1,Math.ceil((t1-t0)/d)); tl.fromTo(el,a,{...b,duration:d,repeat:n-1,ease:b.ease||'none',immediateRender:false},t0); };
    const st=(el,v,t)=>{ if(typeof el==='string'&&!q(el).length) return; tl.set(el,v,t); };
    const ELB=${JSON.stringify(sandbox.GEST_ELBOW)};
    ${GEST_RUNTIME}
    ${js.join('\n    ')}
    tl.set({}, {}, ${TOTAL});
    window.__timelines=window.__timelines||{};
    window.__timelines["books"]=tl;
  })();
  </script>
</template>
`;
fs.mkdirSync(path.join(EPDIR, 'compositions'), { recursive: true });
fs.writeFileSync(path.join(EPDIR, 'compositions/books.html'), comp);

/* ---------- sound effects ---------- */
const sfxN = renderSfx(sfx.filter(x => x.t < TOTAL), TOTAL, path.join(EPDIR, 'assets/sfx.wav'), path.join(EPDIR, 'assets/sfx.mp3'));
// ambience: rain in the reading nook, each page's own bed (art.mjs `amb`), nothing on carnet / chapter / fiche
const beds = segs.map(g => ({ s: g.s, e: g.e, k: g.kind === 'nook' ? 'rain' : g.kind === 'page' ? PAGES[g.page].amb : null, g: g.kind === 'nook' ? .05 : .08 })).filter(b => b.k);
renderAmbience(beds, TOTAL, path.join(EPDIR, 'assets/ambience.wav'), path.join(EPDIR, 'assets/ambience.mp3'));
// background music (optional): BOOK.music = { src: 'path from the repo root', db: -18, credit: '…' } — looped, faded
if (BOOK.music) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', path.join(ROOT, BOOK.music.src), '-vn', '-t', String(TOTAL),
  '-af', `volume=${BOOK.music.db ?? -18}dB,afade=t=in:d=3,afade=t=out:st=${(TOTAL - 4).toFixed(2)}:d=4`, '-c:a', 'libmp3lame', '-q:a', '4', path.join(EPDIR, 'assets/music.mp3')]);

/* ---------- index.html + project files ---------- */
fs.writeFileSync(path.join(EPDIR, 'index.html'), `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>* { margin: 0; padding: 0; box-sizing: border-box; } html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #000; } body { font-family: "Nunito", sans-serif; }</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="books" data-composition-id="books" data-composition-src="compositions/books.html" data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
      <audio id="voice" src="assets/voice.mp3" data-start="0" data-duration="${f(AUDIO_END)}" data-track-index="2" data-volume="1"></audio>
      <audio id="sfx" src="assets/sfx.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="5" data-volume="${BOOK.sfxVolume ?? 0.5}"></audio>
      <audio id="ambience" src="assets/ambience.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="6" data-volume="${BOOK.ambienceVolume ?? 0.6}"></audio>${BOOK.music ? `
      <audio id="music" src="assets/music.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="3" data-volume="1"></audio>` : ''}
    </div>
    <script>window.__timelines = window.__timelines || {}; window.__timelines["main"] = gsap.timeline({ paused: true });</script>
  </body>
</html>
`);
const put = (name, obj) => { const p = path.join(EPDIR, name); if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n'); };
put('meta.json', { id: `books-${EPNAME}`, name: `books-${EPNAME}`, createdAt: new Date(0).toISOString() });
put('hyperframes.json', { $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', assets: 'assets' }, media: { autoProxy: true }, authoringSkill: 'hyperframes' });
put('package.json', { name: `books-${EPNAME}`, private: true, type: 'module', scripts: { dev: 'npx --yes hyperframes@0.9.16 preview', check: 'npx --yes hyperframes@0.9.16 check', render: 'npx --yes hyperframes@0.9.16 render' } });

// episode.json: same shape as the other channels, so tools/youtube-seo.mjs makes outline, vocab block and .srt captions
fs.writeFileSync(path.join(EPDIR, 'episode.json'), JSON.stringify({ title: BOOK.title, audio: 'assets/voice.mp3', audioEnd: AUDIO_END,
  chunks: chunks.map(c => ({ fr: c.toks.map((t, i) => (t.v && !(i && c.toks[i - 1].v) ? '[' : '') + t.t + (t.v && !(c.toks[i + 1] && c.toks[i + 1].v) ? ']' : '')).join(' '), en: c.en })),
  vocab: VOCAB.map(({ c, phrase, ...v }) => v) }, null, 1));
const mm = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
console.log(`built ${EPNAME}: ${segs.length} segments, ${chunks.length} subtitles, ${words.length} words, ${cards.length} cards, ${sfxN} sounds, ${js.length} timeline lines, ${(comp.length / 1024 / 1024).toFixed(1)} MB, total ${TOTAL}s`);
console.log(segs.map(g => `${mm(g.s)} ${g.kind}${g.page ? ':' + g.page : ''}`).join(' · '));
