// Build the HyperFrames composition for one episode.
// Inputs : episode.json (scene, outfits, subtitle chunks, vocab) + assets/words.json (word timestamps)
// Art    : characters + scenes are taken from ../demo-animation-style.html (single source of truth)
// Output : index.html + compositions/talk.html
// Usage  : node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { STAGING } from './staging.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART  = path.resolve(ROOT, '../demo-animation-style.html');
const EP   = JSON.parse(fs.readFileSync(path.join(ROOT, 'episode.json'), 'utf8'));
const W    = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/words.json'), 'utf8'));

/* ---------- seeded random (deterministic art + motion) ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

/* ---------- load art from the demo ---------- */
const src = fs.readFileSync(ART, 'utf8');
const a = src.indexOf('const knit=');
const b = src.lastIndexOf('/* ============================================================', src.indexOf('   TIMELINE'));
const sandbox = { Math: Object.create(Math), TOTAL: 60, document: { querySelectorAll: () => [] } };
sandbox.Math.random = mulberry32(7);
vm.createContext(sandbox);
vm.runInContext(`
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const range=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const rep=d=>Math.ceil(TOTAL/d)+1;
  ${src.slice(a, b)}
  this.leaSVG=leaSVG; this.matSVG=matSVG; this.SCENES=SCENES; this.EMO_TYPES=EMO_TYPES; this.ILLUS=ILLUS; this.bubbleSVG=bubbleSVG; this.GEST_ELBOW=GEST_ELBOW; this.WALK_GEST_KEYS=WALK_GEST_KEYS;`, sandbox);
// fabric patterns (stripes, gingham, pois, check, cord…) live in the demo's hidden <defs>
const PATTERNS = (src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>')).match(/<pattern[\s\S]*?<\/pattern>/g) || []).join('\n      ');
// emote runtime (EMO_FACE, EMO_ANIM, emoteTL) is copied verbatim into the video script
const EMO_RUNTIME = src.slice(src.indexOf('/* EMOTE-RUNTIME-START'), src.indexOf('/* EMOTE-RUNTIME-END */'));
const ILLUS_RUNTIME = src.slice(src.indexOf('/* ILLUS-RUNTIME-START'), src.indexOf('/* ILLUS-RUNTIME-END */'));
const GEST_RUNTIME = src.slice(src.indexOf('/* GEST-RUNTIME-START'), src.indexOf('/* GEST-RUNTIME-END */'));
const WALK_RUNTIME = src.slice(src.indexOf('/* WALK-RUNTIME-START'), src.indexOf('/* WALK-RUNTIME-END */'));
if (!sandbox.SCENES[EP.scene]) throw new Error(`unknown scene "${EP.scene}" (have: ${Object.keys(sandbox.SCENES).join(', ')})`);
// staging (sit at a table / walk side by side) follows the scene; its specific parts live in tools/staging.mjs
const WALK = !!sandbox.SCENES[EP.scene].walk, STAGE = STAGING[WALK ? 'walk' : 'sit'];
const sceneSVG = sandbox.SCENES[EP.scene].html();
const leaSVG = sandbox.leaSVG(EP.lea, WALK).replace(/<div class="name">[^<]*<\/div>/, '');
const matSVG = sandbox.matSVG(EP.mat, WALK).replace(/<div class="name">[^<]*<\/div>/, '');

/* ---------- align subtitle chunks to word timestamps ---------- */
const norm = s => s.toLowerCase().replace(/[^a-zà-ÿœæç']/g, '');
let wi = 0; const words = [];
const chunks = EP.chunks.map((c, ci) => {
  const toks = []; let inVocab = false;
  for (let raw of c.fr.split(/\s+/)) {
    const open = raw.startsWith('['), close = raw.endsWith(']');
    raw = raw.replace(/[\[\]]/g, '');
    if (open) inVocab = true;
    const w = W[wi++];
    if (!w || norm(w.t) !== norm(raw)) throw new Error(`chunk ${ci}: "${raw}" vs transcript "${w && w.t}"`);
    const tok = { t: raw, s: w.s, e: w.e, v: inVocab, id: `w${words.length}` };
    toks.push(tok); words.push({ ...tok, who: c.who });
    if (close) inVocab = false;
  }
  return { ...c, toks, s: toks[0].s, e: toks[toks.length - 1].e };
});
chunks.forEach((c, i) => {
  const next = chunks[i + 1];
  c.show = Math.max(0, c.s - 0.12);
  c.hide = next ? Math.min(Math.max(next.s - 0.12, c.show + 0.3), c.e + 1.2) : c.e + 0.6;
});
// vocab cards: one per bracketed group, in order
const vocabStarts = []; chunks.forEach(c => c.toks.forEach((t, i) => { if (t.v && !(i && c.toks[i - 1].v)) vocabStarts.push(t.s); }));
if (vocabStarts.length !== EP.vocab.length) throw new Error(`vocab groups ${vocabStarts.length} != vocab entries ${EP.vocab.length}`);
vocabStarts.forEach((s, i) => { if (i && s - vocabStarts[i - 1] < 3) console.warn(`warning: vocab ${i - 1} → ${i} only ${(s - vocabStarts[i - 1]).toFixed(1)}s apart (card shows < 3 s); pick another word`); });
const RECAP_AT = Math.max(EP.audioEnd, chunks[chunks.length - 1].hide, vocabStarts[vocabStarts.length - 1] + 4.8) + 0.2;
chunks[chunks.length - 1].hide = RECAP_AT - 0.1;
const cards = EP.vocab.map((v, i) => {
  const s = vocabStarts[i] - 0.05, next = vocabStarts[i + 1];
  const e = next ? Math.min(s + 4.6, next - 0.15) : Math.min(s + 4.6, RECAP_AT - 0.1);
  return { ...v, s, d: e - s };
});
// speaker turns
const turns = [];
chunks.forEach(c => { const l = turns[turns.length - 1]; if (l && l.who === c.who) l.e = c.e; else turns.push({ who: c.who, s: c.s, e: c.e }); });

// emotes: chunk.emote = the speaker's reaction while saying it, chunk.react = the listener's reaction near its end
const EMO_D = 2.6, EMO_OK = Object.keys(sandbox.EMO_TYPES), emotes = [];
chunks.forEach((c, i) => {
  const other = c.who === 'lea' ? 'mat' : 'lea';
  if (c.emote) emotes.push({ who: c.who, type: c.emote, t: c.s + 0.15, ci: i });
  if (c.react) emotes.push({ who: other, type: c.react, t: Math.max(c.s + 0.4, c.e - 0.5), ci: i });
});
emotes.sort((a, b) => a.t - b.t);
const lastEmo = {};
emotes.forEach(e => {
  if (!EMO_OK.includes(e.type)) throw new Error(`chunk ${e.ci}: unknown emote "${e.type}" (have: ${EMO_OK.join(', ')})`);
  if (lastEmo[e.who] !== undefined && e.t < lastEmo[e.who] + EMO_D + 0.3) throw new Error(`chunk ${e.ci}: ${e.who} emote starts before the previous one ends (keep ≥ 3 s apart per character)`);
  if (e.t + EMO_D > RECAP_AT) throw new Error(`chunk ${e.ci}: emote runs into the recap`);
  lastEmo[e.who] = e.t;
});

// illustration bubbles: chunk.illus = type, chunk.label = French caption (optional; default from the library)
const BUB_D = 3.8, bubs = [];
chunks.forEach((c, i) => {
  if (!c.illus) return;
  if (!sandbox.ILLUS[c.illus]) throw new Error(`chunk ${i}: unknown illus "${c.illus}" (have: ${Object.keys(sandbox.ILLUS).join(', ')})`);
  bubs.push({ type: c.illus, label: c.label ?? sandbox.ILLUS[c.illus].fr, who: c.who, t: c.s + 0.1, ci: i });
});
bubs.forEach((b, i) => {
  const clash = cards.find(c => b.t < c.s + c.d + 0.3 && b.t + BUB_D > c.s - 0.3);
  if (clash) throw new Error(`chunk ${b.ci}: illustration "${b.type}" overlaps the vocab card "${clash.word}" (same spot on screen) — move it to another chunk`);
  if (i && b.t < bubs[i - 1].t + BUB_D + 6) throw new Error(`chunk ${b.ci}: illustration only ${(b.t - bubs[i - 1].t).toFixed(1)}s after the previous one (keep ≥ 10 s apart)`);
  if (b.t + BUB_D > RECAP_AT) throw new Error(`chunk ${b.ci}: illustration runs into the recap`);
});

// explanation board: chunk.board = { mode, bg?, … } opens a segment, chunk.boardEnd closes it. Characters shrink to the bottom corners.
//   bg (background + entrance): liege = cork/wood pinboard (fades in) · craie = school chalkboard (drops from the top, chalk lettering)
//                               · carnet = open lined notebook (slides up from below, blue ink + washi tape). Default: EP.boardBg || 'liege'.
//   word    = the expression pinned on paper (taken from the first vocab card inside the segment unless overridden) + sticky note + optional illustration
//   sketch  = role-play: every line of the segment is pinned as a speech bubble (pages of 4)
//   compare = two columns side by side (tu / vous, savoir / connaître): { title, left:{head, sub?, items:[…]}, right:{…} }
//   steps   = numbered steps appearing one by one (recipe, routine, how-to): { title, items:[…] } (≤ 6)
//   conjug  = conjugation table: { verb, tense, rows:[["je","parl|e"], …], note? } — text after "|" is the highlighted ending
//   mindmap = a word in the middle with related words branching out: { word, icon?, items:[…] } (≤ 6)
//   quiz    = question + 2–4 options, the right one lights up: { q, options:[…], answer: index, reveal?: chunk offset, explain? }
// Item = "text" (appears automatically, evenly spread over the segment) or { "text": "…", "at": n } (appears with the n-th chunk of the segment, 0 = first).
// segments less than 1.5 s apart share one board session (characters stay in the corners; the session keeps the first segment's bg).
const BOARD_BG = ['liege', 'craie', 'carnet'], BOARD_MODES = ['word', 'sketch', 'compare', 'steps', 'conjug', 'mindmap', 'quiz'];
const segs = []; let curSeg = null;
chunks.forEach((c, i) => {
  if (c.board) { if (curSeg) throw new Error(`chunk ${i}: board opens before chunk ${curSeg.a}'s board is closed`); curSeg = { ...c.board, a: i }; }
  if (c.boardEnd) { if (!curSeg) throw new Error(`chunk ${i}: boardEnd without board`); curSeg.b = i; segs.push(curSeg); curSeg = null; }
});
if (curSeg) throw new Error(`chunk ${curSeg.a}: board never closed (add "boardEnd": true)`);
const itemText = it => typeof it === 'string' ? it : (it && it.text) || '';
segs.forEach(sg => {
  sg.s = chunks[sg.a].show; sg.e = chunks[sg.b].hide;
  const where = `chunk ${sg.a}`;
  if (!BOARD_MODES.includes(sg.mode)) throw new Error(`${where}: board.mode must be one of ${BOARD_MODES.join(', ')}`);
  sg.bg = sg.bg || EP.boardBg || 'liege';
  if (!BOARD_BG.includes(sg.bg)) throw new Error(`${where}: board.bg must be one of ${BOARD_BG.join(', ')}`);
  if (sg.icon && !sandbox.ILLUS[sg.icon]) throw new Error(`${where}: unknown board icon "${sg.icon}"`);
  const chunkT = n => { if (!(n >= 0 && sg.a + n <= sg.b)) throw new Error(`${where}: "at": ${n} is outside the segment (0–${sg.b - sg.a})`); return chunks[sg.a + n].show + 0.1; };
  // times for a list of items: explicit "at" wins, the others are spread evenly between t0 and t1
  sg.times = (items, t0, t1) => items.map((it, i) => it && typeof it === 'object' && it.at !== undefined ? chunkT(it.at)
    : items.length === 1 ? t0 : t0 + i * (Math.max(t0, t1) - t0) / (items.length - 1));
  const need = (k, test, msg) => { if (!test(sg[k])) throw new Error(`${where}: ${sg.mode} board needs ${msg}`); };
  if (sg.mode === 'word') {
    const vi = cards.findIndex(cd => cd.s >= sg.s - 0.1 && cd.s <= sg.e);
    const v = vi >= 0 ? EP.vocab[vi] : {};
    for (const k of ['tag', 'word', 'ipa', 'mean', 'ex', 'exEn']) if (sg[k] === undefined) sg[k] = v[k] || '';
    if (!sg.word) throw new Error(`${where}: word board needs a vocab group inside it or board.word`);
  } else if (sg.mode === 'sketch') sg.lines = chunks.slice(sg.a, sg.b + 1).reduce((acc, c) => {   // one bubble per sentence: glue a same-speaker chunk that continues an unfinished one
    const text = c.toks.map(t => t.t).join(' '), l = acc[acc.length - 1];
    if (l && l.who === c.who && !/[.?!…"»]$/.test(l.text)) l.text += ' ' + text; else acc.push({ who: c.who, text, s: c.show });
    return acc;
  }, []);
  else if (sg.mode === 'compare') { need('left', x => x && x.head, 'left.head'); need('right', x => x && x.head, 'right.head'); }
  else if (sg.mode === 'steps') { need('items', x => Array.isArray(x) && x.length >= 2 && x.length <= 6, '2–6 items'); }
  else if (sg.mode === 'conjug') { need('verb', Boolean, 'verb'); need('rows', x => Array.isArray(x) && x.length >= 2 && x.length <= 8 && x.every(r => Array.isArray(r) && (r.length === 2 || r.length === 3)), 'rows: [["je","parl|e"], …] (2–8)'); }
  else if (sg.mode === 'mindmap') { need('word', Boolean, 'word'); need('items', x => Array.isArray(x) && x.length >= 2 && x.length <= 6, '2–6 items'); }
  else if (sg.mode === 'quiz') {
    need('q', Boolean, 'q (the question)'); need('options', x => Array.isArray(x) && x.length >= 2 && x.length <= 4, '2–4 options');
    need('answer', x => Number.isInteger(x) && x >= 0 && x < sg.options.length, 'answer (index of the right option, 0 = first)');
  }
});
const sessions = [];
segs.forEach(sg => { const l = sessions[sessions.length - 1]; if (l && sg.s - l.e < 1.5) { l.e = sg.e; l.segs.push(sg); } else sessions.push({ s: sg.s, e: sg.e, bg: sg.bg, segs: [sg] }); });
// when each segment's content starts (after the background has come in) + what appears when
const BG_IN_D = { liege: 0.15, craie: 0.6, carnet: 0.55 };
sessions.forEach(ss => ss.segs.forEach((sg, j) => {
  sg.t0 = j ? sg.s : ss.s + BG_IN_D[ss.bg];
  const t0 = sg.t0, end = Math.max(t0 + 1.5, sg.e - 1.4), rv = sg.rv = [];   // rv: [element suffix, time, effect]
  if (sg.mode === 'compare') {
    rv.push(['t', t0, 'drop'], ['L', t0 + 0.35, 'pop'], ['vs', t0 + 0.6, 'stamp'], ['R', t0 + 0.8, 'pop']);
    const L = sg.left.items || [], R = sg.right.items || [], seq = [];
    for (let i = 0; i < Math.max(L.length, R.length); i++) { if (L[i] !== undefined) seq.push(['L' + i, L[i]]); if (R[i] !== undefined) seq.push(['R' + i, R[i]]); }
    sg.times(seq.map(x => x[1]), t0 + 1.4, end).forEach((t, i) => rv.push([seq[i][0], t, 'slide']));
  } else if (sg.mode === 'steps') {
    rv.push(['t', t0, 'drop']);
    sg.times(sg.items, t0 + 0.7, end).forEach((t, i) => { rv.push(['i' + i, t, 'slide']); if (i) rv.push(['i' + (i - 1), t, 'dim']); });
  } else if (sg.mode === 'conjug') {
    rv.push(['h', t0, 'drop']);
    const ts = sg.times(sg.rows.map(r => r[2] !== undefined ? { at: r[2] } : ''), t0 + 0.7, Math.min(end, t0 + 0.7 + 0.45 * sg.rows.length));
    ts.forEach((t, i) => rv.push(['c' + i, t, 'pop']));
    if (sg.note) rv.push(['n', Math.max(...ts) + 0.8, 'pop']);
  } else if (sg.mode === 'mindmap') {
    rv.push(['c', t0, 'pop']);
    sg.times(sg.items, t0 + 0.8, end).forEach((t, i) => rv.push(['l' + i, t, 'draw'], ['n' + i, t + 0.3, 'pop']));
  } else if (sg.mode === 'quiz') {
    rv.push(['q', t0, 'drop']);
    sg.options.forEach((o, i) => rv.push(['o' + i, t0 + 0.6 + i * 0.3, 'pop']));
    const minR = t0 + 0.6 + sg.options.length * 0.3 + 1;
    const R = sg.reveal !== undefined ? Math.max(minR, sg.times([{ at: sg.reveal }])[0]) : Math.max(minR, chunks[sg.b].show + 0.2);
    if (R > sg.e - 0.5) console.warn(`warning: chunk ${sg.a}: quiz answer shows only ${(sg.e - R).toFixed(1)} s before the board closes — add "reveal" or lengthen the segment`);
    sg.options.forEach((o, i) => rv.push(i === sg.answer ? ['ok' + i, R, 'fade'] : ['o' + i, R, 'dim']));
    rv.push(['tick', R + 0.1, 'stamp']);
    if (sg.explain) rv.push(['x', R + 0.6, 'pop']);
  }
}));
cards.forEach(c => { c.hidden = sessions.some(ss => c.s >= ss.s - 0.3 && c.s <= ss.e + 0.3); });
bubs.forEach(b => { const ss = sessions.find(ss => b.t < ss.e + 0.6 && b.t + BUB_D > ss.s - 0.4); if (ss) throw new Error(`chunk ${b.ci}: illustration "${b.type}" overlaps the board at ${ss.s.toFixed(1)}–${ss.e.toFixed(1)}s — move or drop it`); });
if (sessions.length && sessions[sessions.length - 1].e + 0.8 > RECAP_AT) throw new Error('board runs into the recap');

// listener sips coffee now and then (every ~35–70 s each, while the other talks ≥ 4.5 s, not on the board, not during an emote)
const sips = [], sR = mulberry32(33);
if (STAGE.sips) ['lea', 'mat'].forEach(who => {
  let next = 15 + sR() * 25;
  turns.filter(t => t.who !== who && t.e - t.s >= 4.5).forEach(t => {
    const st = t.s + 0.8;
    if (st < next || st + 2.6 > t.e) return;
    if (emotes.some(e => e.who === who && e.t < st + 2.8 && e.t + EMO_D > st - 0.3)) return;
    if (sessions.some(ss => st < ss.e + 0.8 && st + 2.6 > ss.s - 0.5)) return;
    sips.push({ who, t: +st.toFixed(3) }); next = st + 35 + sR() * 35;
  });
});

const END = Math.max(EP.audioEnd, chunks[chunks.length - 1].hide);
const RECAP = RECAP_AT, RECAP_D = cards.length > 8 ? 7 : 5, TOTAL = +(RECAP + RECAP_D).toFixed(2);
const f = n => (+n).toFixed(3);

/* ---------- talk.html ---------- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// long lines: shrink the French line so it stays on one line (box fits ~48 chars at 50px)
const subFit = c => { const n = c.toks.map(t => t.t).join(' ').length; return n > 48 ? ` style="font-size:${Math.max(40, Math.floor(50 * 48 / n))}px"` : ''; };
const subsHTML = chunks.map((c, i) => `
    <div id="sub${i}" class="clip subWrap" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3">
      <div class="subBox"><div class="subFr"${subFit(c)}>${c.toks.map(t => `<span class="w${t.v ? ' vocab' : ''}" id="${t.id}">${t.v ? '<i class="ul"></i>' : ''}<b class="tx">${esc(t.t)}</b></span>`).join(' ')}</div><div class="subEn">${esc(c.en)}</div></div>
    </div>`).join('');
const cardsHTML = () => cards.map((c, i) => c.hidden ? '' : `
    <div id="card${i}" class="clip cardWrap" data-start="${f(c.s)}" data-duration="${f(c.d + (WALK && !c.fade ? 0.6 : 0))}" data-track-index="4">
      <div class="card"><span class="tag">${esc(c.tag)}</span><div class="word">${esc(c.word)}</div><div class="ipa">${esc(c.ipa)}</div>
      <div class="mean">${esc(c.mean)}</div><div class="ex">${esc(c.ex)}<i>${esc(c.exEn)}</i></div></div>
    </div>`).join('');
// board backgrounds (only the ones this episode uses are emitted)
const boardRnd = mulberry32(11), BR = (a, b, d = 0) => (a + boardRnd() * (b - a)).toFixed(d);
const BOARD_SVG = {
  liege: () => `
  <rect width="1920" height="1080" fill="#7a4c33"/><rect x="0" y="0" width="1920" height="1080" fill="none" stroke="#5e3825" stroke-width="18"/>
  <rect x="44" y="34" width="1832" height="1012" rx="12" fill="#c9965f"/>
  <g fill="#a87542" opacity=".55">${Array.from({ length: 520 }, () => `<ellipse cx="${BR(60, 1860)}" cy="${BR(50, 1030)}" rx="${BR(1.5, 4.5, 1)}" ry="${BR(1, 3, 1)}"/>`).join('')}</g>
  <g fill="#e2b77f" opacity=".5">${Array.from({ length: 260 }, () => `<circle cx="${BR(60, 1860)}" cy="${BR(50, 1030)}" r="${BR(1, 3, 1)}"/>`).join('')}</g>
  <rect x="44" y="34" width="1832" height="1012" rx="12" fill="none" stroke="#00000030" stroke-width="10"/>`,
  craie: () => `
  <rect width="1920" height="1080" fill="#e9dcc3"/>
  <rect x="26" y="20" width="1868" height="1040" rx="14" fill="#8a5a3c"/><rect x="26" y="20" width="1868" height="1040" rx="14" fill="none" stroke="#6e4630" stroke-width="6"/>
  <rect x="54" y="46" width="1812" height="988" rx="6" fill="#2f4a3e"/>
  <g fill="#ffffff">${Array.from({ length: 34 }, () => `<ellipse cx="${BR(120, 1800)}" cy="${BR(90, 990)}" rx="${BR(80, 260)}" ry="${BR(20, 70)}" opacity="${BR(0.012, 0.03, 3)}" transform="rotate(${BR(-12, 12)} 960 540)"/>`).join('')}</g>
  <g stroke="#ffffff" stroke-width="3" fill="none" opacity=".07" stroke-linecap="round">${Array.from({ length: 10 }, () => { const x = +BR(120, 1600), y = +BR(110, 980); return `<path d="M${x} ${y} q40 -18 80 0 t80 0 t80 0"/>`; }).join('')}</g>
  <rect x="54" y="46" width="1812" height="988" rx="6" fill="none" stroke="#00000040" stroke-width="10"/>
  <rect x="300" y="1022" width="1320" height="22" rx="6" fill="#6e4630"/><rect x="760" y="1012" width="70" height="14" rx="6" fill="#f4f1e8"/><rect x="860" y="1014" width="44" height="12" rx="5" fill="#f3c96b"/><rect x="1100" y="1008" width="110" height="20" rx="4" fill="#b98d6a"/><rect x="1104" y="1002" width="102" height="8" rx="3" fill="#3a2e28"/>`,
  carnet: () => `
  <rect width="1920" height="1080" fill="#b98d6a"/>${Array.from({ length: 14 }, (_, i) => `<path d="M0 ${40 + i * 80} C600 ${30 + i * 80} 1300 ${55 + i * 80} 1920 ${40 + i * 80}" stroke="#a57a59" stroke-width="4" fill="none"/>`).join('')}
  <rect x="96" y="40" width="1740" height="1030" rx="10" fill="#00000026" transform="translate(10 12)"/>
  <rect x="96" y="40" width="1740" height="1030" rx="10" fill="#fffdf6"/>
  <g stroke="#9cb9d8" stroke-width="2.5">${Array.from({ length: 17 }, (_, i) => `<line x1="96" y1="${150 + i * 54}" x2="1836" y2="${150 + i * 54}"/>`).join('')}</g>
  <line x1="300" y1="40" x2="300" y2="1070" stroke="#e08a8a" stroke-width="3"/>
  <g>${Array.from({ length: 30 }, (_, i) => `<circle cx="${140 + i * 57}" cy="70" r="11" fill="#b98d6a"/><path d="M${140 + i * 57} 70 v-48" stroke="#8a8f96" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>
  <circle cx="1560" cy="740" r="70" fill="none" stroke="#b98d6a" stroke-width="10" opacity=".22"/>`,
};
const usedBG = [...new Set(sessions.map(ss => ss.bg))];
const boardBG = usedBG.map(bg => `<div class="bbg" id="bbg-${bg}"><svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${BOARD_SVG[bg]()}</svg></div>`).join('');
const NAME = { lea: 'Léa', mat: 'Mathieu' }, LETTERS = 'ABCD';
const ending = s => { const [a, b] = String(s).split('|'); return esc(a) + (b !== undefined ? `<em>${esc(b)}</em>` : ''); };
const MODE_HTML = {
  word: (sg, k) => `
        <div class="bpaper pc"><i class="pin"></i><span class="tag">${esc(sg.tag)}</span><div class="bword">${esc(sg.word)}</div><div class="bipa">${esc(sg.ipa)}</div>
          <div class="bmean">${esc(sg.mean)}</div>${sg.ex ? `<div class="bex">${esc(sg.ex)}<i>${esc(sg.exEn)}</i></div>` : ''}</div>
        ${sg.icon ? `<div class="bpola pc"><i class="pin y"></i><svg viewBox="0 0 300 200" width="360" height="240"><g filter="url(#pencil)">${sandbox.ILLUS[sg.icon].svg}</g></svg></div>` : ''}
        ${sg.note ? `<div class="bnote pc${sg.icon ? '' : ' solo'}"><i class="pin"></i>${esc(sg.note)}</div>` : ''}`,
  sketch: (sg, k) => `
        <div class="btitle pc"><i class="pin"></i>${esc(sg.title || 'En situation')}</div>
        ${sg.lines.map((l, j) => `<div class="bl pc ${l.who}" id="bseg${k}l${j}" style="top:${196 + (j % 4) * 168}px"><i class="pin"></i><b>${NAME[l.who]}</b>${esc(l.text)}</div>`).join('')}`,
  compare: (sg, k) => {
    const col = (side, c) => `<div class="bcol ${side}"><div class="bch pc rv" id="bs${k}_${side}"><i class="pin"></i><div class="bchh">${esc(c.head)}</div>${c.sub ? `<div class="bchs">${esc(c.sub)}</div>` : ''}</div>
          ${(c.items || []).map((it, i) => `<div class="bci rv" id="bs${k}_${side}${i}">${esc(itemText(it))}</div>`).join('')}</div>`;
    return `
        ${sg.title ? `<div class="btitle pc rv" id="bs${k}_t"><i class="pin"></i>${esc(sg.title)}</div>` : ''}
        ${col('L', sg.left)}<div class="bvs rv" id="bs${k}_vs">${esc(sg.vs || 'VS')}</div>${col('R', sg.right)}`;
  },
  steps: (sg, k) => `
        ${sg.title ? `<div class="btitle pc rv" id="bs${k}_t"><i class="pin"></i>${esc(sg.title)}</div>` : ''}
        <div class="bsteps${sg.items.length > 4 ? ' many' : ''}">${sg.items.map((it, i) => `<div class="bstep pc rv" id="bs${k}_i${i}"><b>${i + 1}</b><span>${esc(itemText(it))}</span></div>`).join('')}</div>`,
  conjug: (sg, k) => {
    const half = Math.ceil(sg.rows.length / 2);
    return `
        <div class="bcjh pc rv" id="bs${k}_h"><i class="pin"></i><span class="bcjv">${esc(sg.verb)}</span>${sg.tense ? `<span class="tag">${esc(sg.tense)}</span>` : ''}</div>
        <div class="bcjg" style="grid-template-rows:repeat(${half},auto)">${sg.rows.map((r, i) => `<div class="bcjc pc rv" id="bs${k}_c${i}"><span class="bcjp">${esc(r[0])}</span> ${ending(r[1])}</div>`).join('')}</div>
        ${sg.note ? `<div class="bnote pc bcjn rv" id="bs${k}_n"><i class="pin"></i>${esc(sg.note)}</div>` : ''}`;
  },
  mindmap: (sg, k) => {
    const n = sg.items.length, CX = 960, CY = 430;
    const pos = sg.items.map((_, i) => { const a = (-90 + 180 / n + i * 360 / n) * Math.PI / 180; return [Math.round(CX + 480 * Math.cos(a)), Math.round(CY + 255 * Math.sin(a))]; });
    return `
        <svg class="bmml" viewBox="0 0 1920 1080" width="1920" height="1080">${pos.map(([x, y], i) => `<line class="rv" id="bs${k}_l${i}" x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`).join('')}</svg>
        <div class="bmmc pc rv" id="bs${k}_c">${sg.icon ? `<svg viewBox="0 0 300 200" width="150" height="100"><g filter="url(#pencil)">${sandbox.ILLUS[sg.icon].svg}</g></svg>` : ''}<div>${esc(sg.word)}</div></div>
        ${pos.map(([x, y], i) => `<div class="bmmn rv" id="bs${k}_n${i}" style="left:${x}px;top:${y}px"><div class="pc">${esc(itemText(sg.items[i]))}</div></div>`).join('')}`;
  },
  quiz: (sg, k) => `
        <div class="bq pc rv" id="bs${k}_q"><i class="pin"></i><b>?</b>${esc(sg.q)}</div>
        <div class="bopts${sg.options.length > 2 ? '' : ' two'}">${sg.options.map((o, i) => `<div class="bo pc rv" id="bs${k}_o${i}"><i class="okl rv" id="bs${k}_ok${i}"></i><b class="lt">${LETTERS[i]}</b><span>${esc(itemText(o))}</span>${i === sg.answer ? `<span class="btick rv" id="bs${k}_tick">✓</span>` : ''}</div>`).join('')}</div>
        ${sg.explain ? `<div class="bnote pc bqx rv" id="bs${k}_x"><i class="pin"></i>${esc(sg.explain)}</div>` : ''}`,
};
const boardHTML = segs.map((sg, k) => `
      <div class="bseg th-${(sessions.find(ss => ss.segs.includes(sg)) || sg).bg} m-${sg.mode}" id="bseg${k}">${MODE_HTML[sg.mode](sg, k)}
      </div>`).join('');
const bubsHTML = () => bubs.map((b, i) => `
    <div id="bub${i}" class="clip bubWrap" data-start="${f(b.t)}" data-duration="${f(BUB_D)}" data-track-index="7"${WALK ? ` style="left:${640 + (b.dir < 0 ? 460 : -460)}px"` : ''}>${sandbox.bubbleSVG(b.type, esc(b.label), WALK ? b.side : b.who)}</div>`).join('');
// channel badge (top right): repo brand/logo.png, embedded so the sub-composition needs no asset path
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, '..', 'brand', 'logo.png')).toString('base64');
// hand gestures while talking. The free (outer) arm takes one of 9 poses drawn in demo-animation-style.html (ARM_UP),
// animated by gestTL (GEST-RUNTIME block of the demo, copied verbatim into the video):
//   beat (fist, ticks on each word) · palm (palm up, slow bob) · up (open hand, wave) · point (towards the other person) · think (hand to chin)
//   wave (hello / goodbye) · shrug (« je sais pas », « bof ») · count (fingers 1→2→3: « d'abord », « deux choses ») · scratch (scratches head: « euh », « comment dire »)
// 1) actions triggered by what is said (or forced with chunk.act) are placed first, on the trigger word;
// 2) the random talking gestures fill the rest: "tu/toi/ton…" → more point, a question → more think; never the same pose twice in a row,
//    random length 1.6–3 s, random rests (and sometimes no gesture at all), always starting on a word.
// Head nods (nodTL): the speaker nods on « oui / exactement / voilà… », the listener nods now and then (or on chunk.act = "nod").
const POSES = ['beat', 'palm', 'up', 'point', 'think', 'wave', 'shrug', 'count', 'scratch', ...(WALK ? sandbox.WALK_GEST_KEYS : [])];
const ACT_OK = [...POSES, 'nod', 'none'];
const flat = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿœæç'\- ]/g, ' ').replace(/\s+/g, ' ').trim();
const AUTO_ACT = {
  wave: ['bonjour', 'salut', 'coucou', 'bonsoir', 'au revoir', 'à bientôt', 'à demain', 'à la prochaine', 'bienvenue', 'ciao', 'bisous', 'bonne soirée', 'bonne journée', 'bonne semaine'],
  count: ["d'abord", 'premièrement', 'deuxièmement', 'troisièmement', 'en premier', 'premier point', 'deux choses', 'trois choses', 'plusieurs choses', 'primo'],
  shrug: ['je sais pas', 'je ne sais pas', 'sais pas trop', "j'en sais rien", 'aucune idée', 'bof', 'ça dépend', 'peut-être', 'qui sait', "je m'en fiche", 'pourquoi pas'],
  scratch: ['euh', 'hmm', 'bah', 'comment dire', 'je me demande', 'bonne question', "j'hésite", 'voyons voir'],
};
Object.assign(AUTO_ACT, STAGE.autoActs);
const AUTO_GAP = { wave: 20, count: 30, shrug: 30, scratch: 30 }, ACT_D = { wave: 2.0, shrug: 1.8, count: 2.8, scratch: 1.9 };
const NOD_START = ['oui', 'exactement', 'voilà', 'tout à fait', "d'accord", 'carrément', 'absolument', 'bien sûr', "c'est vrai", 'effectivement', 'évidemment', 'ah oui', 'mais oui', 'ouais'];
function findPhrase(c, list) {                 // → index of the token where the first listed phrase starts
  let str = ' '; const starts = [];
  c.toks.forEach((t, i) => { starts.push([str.length, i]); str += flat(t.t) + ' '; });
  for (const p of list) { const k = str.indexOf(' ' + p + ' '); if (k >= 0) { let ti = 0; for (const [o, i] of starts) if (o <= k + 1) ti = i; return ti; } }
  return -1;
}
const turnOf = (who, t) => turns.find(x => x.who === who && x.s <= t + 0.01 && x.e >= t - 0.01);
const gR = mulberry32(21), gests = [], lastPose = {}, lastAuto = {};
chunks.forEach((c, ci) => {
  if (c.act !== undefined && !ACT_OK.includes(c.act)) throw new Error(`chunk ${ci}: unknown act "${c.act}" (have: ${ACT_OK.join(', ')})`);
  if (c.act === 'none' || c.act === 'nod') return;
  let pose = c.act, ti = 0;
  if (!pose) for (const p of Object.keys(AUTO_ACT)) { const i = findPhrase(c, AUTO_ACT[p]); if (i >= 0) { pose = p; ti = i; break; } }
  if (!pose) return;
  const t0 = c.toks[ti].s, key = c.who + pose, tn = turnOf(c.who, t0);
  if (!c.act && lastAuto[key] !== undefined && t0 - lastAuto[key] < (AUTO_GAP[pose] ?? 25)) return;
  const d = Math.min(ACT_D[pose] || 2.2, (tn ? tn.e : c.e) - t0 + 0.4);
  if (d < (c.act ? 1.0 : 1.2)) return;
  if (gests.some(g => g.who === c.who && t0 < g.t + g.d + 0.3 && t0 + d > g.t - 0.3)) return;
  const tw = words.filter(w => w.who === c.who && w.s > t0 + 0.35 && w.s < t0 + d - 0.4);
  gests.push({ who: c.who, pose, t: t0, d, b: tw.map(w => +w.s.toFixed(3)), auto: true });
  lastAuto[key] = t0;
});
const fixed = gests.slice();
turns.forEach(t => {
  if (t.e - t.s < 2.2) return;
  const tw = words.filter(w => w.who === t.who && w.s >= t.s && w.s <= t.e);
  let next = t.s + 0.2 + gR() * 0.8;
  tw.forEach(w => {
    if (w.s < next) return;
    const blk = fixed.find(g => g.who === t.who && w.s < g.t + g.d + 1.5 && w.s + 3.2 > g.t);
    if (blk) { next = blk.t + blk.d + 1.5; return; }
    if (gR() < 0.25) { next = w.s + 1.5; return; }
    const d = Math.min(1.6 + gR() * 1.4, t.e - w.s - 0.2); if (d < 1.3) return;
    const win = tw.filter(x => x.s >= w.s && x.s < w.s + d), txt = ' ' + win.map(x => x.t.toLowerCase()).join(' ') + ' ';
    const ch = chunks.find(c => c.who === t.who && c.s <= w.s + 0.01 && c.e >= w.s - 0.01);
    let pool = STAGE.talkPool(txt, !!(ch && (/\?$/.test(ch.toks[ch.toks.length - 1].t) || ch.emote === 'question')));
    pool = pool.filter(x => x !== lastPose[t.who]);
    const pose = pool[Math.floor(gR() * pool.length)]; lastPose[t.who] = pose;
    const beats = win.filter((x, i, arr) => !i || x.s - arr[i - 1].s >= 0.28).map(x => +x.s.toFixed(3)).filter(s => s > w.s + 0.35 && s < w.s + d - 0.4);
    gests.push({ who: t.who, pose, t: w.s, d, b: beats });
    next = w.s + d + 2.2 + gR() * 3;
  });
});
gests.sort((x, y) => x.t - y.t);

// head nods
const nods = [], nR = mulberry32(55);
const addNod = (who, t) => { if (t + 0.8 < RECAP_AT && !nods.some(n => n.who === who && Math.abs(n.t - t) < 4)) nods.push({ who, t: +t.toFixed(3) }); };
chunks.forEach((c, i) => {
  const other = c.who === 'lea' ? 'mat' : 'lea';
  if (c.act === 'nod') addNod(other, c.s + 0.3);
  else if (findPhrase(c, NOD_START) === 0) addNod(c.who, c.s + 0.02);
});
['lea', 'mat'].forEach(who => {
  let next = 6 + nR() * 10;
  turns.filter(t => t.who !== who && t.e - t.s >= 5).forEach(t => {
    words.filter(w => w.who === t.who && w.s > t.s + 1.2 && w.s < t.e - 1).forEach(w => {
      if (w.s < next) return;
      if (sips.some(sp => sp.who === who && w.s < sp.t + 2.6 && w.s + 1 > sp.t - 0.3)) return;
      if (emotes.some(e => e.who === who && w.s < e.t + EMO_D && w.s + 1 > e.t)) return;
      addNod(who, w.s); next = w.s + 14 + nR() * 14;
    });
  });
});
nods.sort((x, y) => x.t - y.t);

// staging-specific timing (walk: head turns, listener hand in pocket, camera pans + which side cards/bubbles drop on)
const STAGE_DATA = STAGE.plan({ chunks, turns, gests, cards, bubs, sessions, emotes, EMO_D, BUB_D, mulberry32 });

const NAMES = `<div id="names"><div id="name-lea" class="nameTag">Léa</div><div id="name-mat" class="nameTag">Mathieu</div></div>`;
const talk = `<template>
  <style>
    #talk{position:absolute;inset:0;overflow:hidden;background:#f3e3c8;font-family:Nunito,sans-serif}
    #talk-world{position:absolute;inset:0;transform-origin:50% 60%}
    #talk-scene,#talk-scene svg.bg{position:absolute;inset:0;width:1920px;height:1080px}
    .charBox svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
    #talk-pair{position:absolute;inset:0}
    .nameTag{position:absolute;top:196px;width:fit-content;font:800 30px Nunito;color:#fffaf0;background:#3a2e28;padding:6px 20px;border-radius:30px;opacity:0}
    ${STAGE.css}
    #talk-grain{position:absolute;inset:0;pointer-events:none;opacity:.22;mix-blend-mode:multiply;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
    .subWrap{position:absolute;left:0;right:0;bottom:64px;display:flex;justify-content:center}
    .subBox{max-width:1400px;background:#fffaf0f2;border-radius:28px;padding:22px 44px;box-shadow:0 10px 0 #00000014;text-align:center}
    .subFr{font:800 50px/1.25 Nunito;color:#a89684}
    .subFr .w{display:inline-block;position:relative}
    .subFr .ul{position:absolute;left:0;right:0;bottom:4px;height:12px;background:#f3c96b;border-radius:6px;transform-origin:left center}
    .subFr .tx{position:relative;font-weight:inherit}
    .subEn{font:600 30px Nunito;color:#7a6a5c;margin-top:8px}
    .cardWrap{position:absolute;left:690px;top:64px;width:540px}
    .bubWrap{position:absolute;left:640px;top:56px;width:640px;height:420px}
    .card{background:#fffaf0;border-radius:30px;padding:28px 34px;box-shadow:0 14px 0 #0000001a;border:4px solid #3a2e28}
    .card .tag{display:inline-block;font:800 26px Nunito;letter-spacing:.08em;text-transform:uppercase;background:#f3c96b;color:#3a2e28;padding:4px 14px;border-radius:20px}
    .card .word{font:700 58px 'Playfair Display',serif;color:#b8552a;margin:12px 0 2px}
    .card .ipa{font:600 28px 'Noto Sans',Nunito,sans-serif;color:#6f5f52}
    .card .mean{font:800 34px Nunito;color:#3a2e28;margin-top:14px}
    .card .ex{font:600 28px/1.35 Nunito;color:#3a2e28;margin-top:14px;padding-top:14px;border-top:3px dashed #e3d4c1}
    .card .ex i{color:#6f5f52;display:block;font-style:normal;margin-top:4px}
    #board{position:absolute;inset:0}
    .bbg{position:absolute;inset:0;opacity:0}
    .bseg{position:absolute;inset:0;opacity:0;color:var(--ink);
      --paper:#fffaf0;--ink:#3a2e28;--acc:#b8552a;--acc2:#3f6b8a;--mut:#6f5f52;--line:#e3d4c1;--tag:#f3c96b;--note:#f3c96b;--lea:#fde3cf;--mat:#dbe8f3;--ok:#e1f0d6;--okc:#4f8a4a;--sh:0 14px 0 #0000002a;--bc:#3a2e28}
    .bseg.th-craie{--paper:#ffffff0d;--ink:#f4f1e8;--acc:#f6d77a;--acc2:#a9d3ea;--mut:#c9d8cf;--line:#ffffff55;--tag:#ffffff22;--note:#ffffff12;--lea:#ffffff10;--mat:#ffffff10;--ok:#9fd38a33;--okc:#c3eeb0;--sh:none;--bc:#f4f1e8bb;filter:url(#chalk)}
    .bseg.th-carnet{--paper:#fffdf8;--ink:#26324f;--acc:#c8443a;--acc2:#2f5f9e;--mut:#5b6b8c;--line:#26324f33;--tag:#f7e26b;--note:#f7e26b;--lea:#ffe6d6;--mat:#dfeaf7;--ok:#e3f2d8;--okc:#3f7f3a;--sh:0 6px 0 #26324f1f;--bc:#26324f}
    .pc{background:var(--paper);box-shadow:var(--sh)}
    .th-craie .pc{border:3px dashed var(--bc);border-radius:18px}
    .th-carnet .pc{border:3px solid var(--bc);border-radius:10px}
    .rv{opacity:0} .bmml line.rv{opacity:1}
    .pin{position:absolute;left:50%;top:-14px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#c8463a;box-shadow:0 4px 0 #0003,inset -4px -4px 0 #0002;z-index:2}
    .pin.y{background:#e9b44c}
    .th-craie .pin{display:none}
    .th-carnet .pin{width:120px;height:32px;margin-left:-60px;top:-18px;border-radius:3px;background:#f3c96bb8;box-shadow:none;transform:rotate(-3deg)}
    .th-carnet .pin.y{background:#a9d3eab8}
    .tag{display:inline-block;font:800 26px Nunito;letter-spacing:.08em;text-transform:uppercase;background:var(--tag);color:var(--ink);padding:4px 14px;border-radius:20px}
    .bpaper{position:absolute;left:350px;top:96px;width:700px;padding:34px 44px 38px;transform:rotate(-1.5deg)}
    .bword{font:700 76px/1.1 'Playfair Display',serif;color:var(--acc);margin:14px 0 6px}
    .bipa{font:600 32px 'Noto Sans',Nunito,sans-serif;color:var(--mut)}
    .bmean{font:800 40px Nunito;color:var(--ink);margin-top:18px}
    .bex{font:600 32px/1.35 Nunito;color:var(--ink);margin-top:20px;padding-top:18px;border-top:3px dashed var(--line)}
    .bex i{display:block;font-style:normal;color:var(--mut);margin-top:6px}
    .bpola{position:absolute;left:1130px;top:80px;padding:22px 22px 54px;transform:rotate(3deg)}
    .th-craie .bpola{background:#fffaf0;filter:none}
    .bnote{position:absolute;left:1150px;top:470px;width:360px;min-height:200px;background:var(--note);padding:40px 30px 30px;font:800 36px/1.3 Nunito;color:var(--ink);transform:rotate(-3deg)}
    .bnote.solo{top:200px}
    .btitle{position:absolute;left:50%;top:70px;transform:translateX(-50%) rotate(-1deg);padding:16px 44px;font:700 46px 'Playfair Display',serif;color:var(--acc);white-space:nowrap}
    .bl{position:absolute;max-width:900px;padding:16px 32px 18px;border-radius:26px;border:4px solid var(--bc);font:800 36px/1.25 Nunito;color:var(--ink);opacity:0}
    .bl b{display:block;font:800 22px Nunito;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin-bottom:2px}
    .bl.lea{left:360px;background:var(--lea)} .bl.mat{right:360px;background:var(--mat)}
    /* compare */
    .bcol{position:absolute;top:200px;width:540px;display:flex;flex-direction:column;gap:16px}
    .bcol.L{left:370px} .bcol.R{left:1010px}
    .bch{position:relative;padding:22px 30px 18px;text-align:center;border-radius:18px}
    .bchh{font:700 64px/1.05 'Playfair Display',serif;color:var(--acc)} .bcol.R .bchh{color:var(--acc2)}
    .bchs{font:800 26px Nunito;color:var(--mut);margin-top:6px;letter-spacing:.04em}
    .bci{font:800 34px/1.25 Nunito;color:var(--ink);padding:6px 10px 6px 50px;position:relative}
    .bci::before{content:"";position:absolute;left:12px;top:20px;width:18px;height:18px;border-radius:50%;background:var(--acc)}
    .bcol.R .bci::before{background:var(--acc2)}
    .bvs{position:absolute;left:910px;top:232px;width:100px;height:100px;border-radius:50%;background:var(--tag);color:var(--ink);font:800 38px/100px Nunito;text-align:center;box-shadow:var(--sh)}
    /* steps */
    .bsteps{position:absolute;left:420px;top:190px;width:1080px;display:flex;flex-direction:column;gap:18px}
    .bstep{display:flex;align-items:center;gap:26px;padding:16px 30px;border-radius:18px;font:800 38px/1.2 Nunito;color:var(--ink)}
    .bstep b{flex:none;width:64px;height:64px;border-radius:50%;background:var(--acc);color:#fffaf0;font:800 36px/64px Nunito;text-align:center}
    .th-craie .bstep b{background:none;border:3px solid var(--acc);color:var(--acc);line-height:58px}
    .bsteps.many{gap:12px} .bsteps.many .bstep{padding:10px 26px;font-size:32px} .bsteps.many .bstep b{width:54px;height:54px;line-height:54px;font-size:30px}
    /* conjugation */
    .bcjh{position:absolute;left:50%;top:72px;transform:translateX(-50%) rotate(-1deg);padding:18px 46px;display:flex;align-items:center;gap:26px;white-space:nowrap}
    .bcjv{font:700 60px 'Playfair Display',serif;color:var(--acc)}
    .bcjg{position:absolute;left:400px;top:230px;width:1120px;display:grid;grid-auto-flow:column;grid-template-columns:1fr 1fr;gap:18px 34px}
    .bcjc{padding:16px 30px;border-radius:16px;font:800 42px Nunito;color:var(--ink)}
    .bcjp{color:var(--mut);font-weight:700}
    .bcjc em{font-style:normal;color:var(--acc);border-bottom:6px solid var(--tag)}
    .bcjn{left:1240px;top:560px;width:330px;min-height:0;font-size:30px;padding:34px 26px 24px}
    /* mind map */
    .bmml{position:absolute;inset:0} .bmml line{stroke:var(--ink);stroke-width:6;stroke-linecap:round;opacity:.85}
    .bmmc{position:absolute;left:960px;top:430px;width:300px;height:300px;margin:-150px 0 0 -150px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font:700 50px/1.1 'Playfair Display',serif;color:var(--acc);border:5px solid var(--bc)}
    .bmmn{position:absolute;width:0;height:0}
    .th-craie .bmmc,.th-craie .bmmn>div{background:#34503f;border-radius:50%} .th-craie .bmmn>div{border-radius:40px}
    .th-liege .bmmn>div,.th-liege .bmmc{background:#fffaf0}
    .bmmn>div{position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;padding:14px 28px;border-radius:40px;border:4px solid var(--bc);font:800 36px Nunito;color:var(--ink)}
    /* quiz */
    .bq{position:absolute;left:50%;top:80px;transform:translateX(-50%) rotate(-1deg);width:1180px;padding:28px 40px 28px 120px;font:800 44px/1.25 Nunito;color:var(--ink);border-radius:20px}
    .bq b{position:absolute;left:30px;top:50%;margin-top:-36px;width:72px;height:72px;border-radius:50%;background:var(--acc);color:#fffaf0;font:700 54px/72px 'Playfair Display',serif;text-align:center}
    .th-craie .bq b{background:none;border:3px solid var(--acc);color:var(--acc)}
    .bopts{position:absolute;left:370px;top:300px;width:1180px;display:grid;grid-template-columns:1fr 1fr;gap:22px 30px}
    .bopts.two{top:330px}
    .bo{position:relative;display:flex;align-items:center;gap:22px;padding:22px 30px;border-radius:20px;font:800 38px/1.2 Nunito;color:var(--ink);min-height:96px}
    .bo .lt{position:relative;z-index:1;flex:none;width:58px;height:58px;border-radius:14px;background:var(--tag);font:800 32px/58px Nunito;text-align:center;color:var(--ink)}
    .bo span{position:relative;z-index:1}
    .okl{position:absolute;inset:-4px;border-radius:20px;background:var(--ok);border:5px solid var(--okc)}
    .btick{position:absolute!important;right:22px;top:50%;margin-top:-34px;width:68px;height:68px;border-radius:50%;background:var(--okc);color:#fffaf0;font:800 44px/68px Nunito;text-align:center}
    .bqx{left:50%;top:610px;width:auto;max-width:1100px;min-height:0;transform:translateX(-50%) rotate(-1.5deg);font-size:32px;padding:30px 36px 24px}
    #talk-badge{position:absolute;right:40px;top:34px;width:132px;height:132px;filter:drop-shadow(0 4px 8px #0004)}
    .cntBox{position:relative;width:18px;height:36px} .cnt{position:absolute;left:0;top:0}
    #recap{position:absolute;inset:0;background:#f6eddc;display:flex;flex-direction:column;align-items:center;justify-content:center}
    #recap h2{font:700 72px 'Playfair Display',serif;color:#3a2e28;margin:0 0 40px;opacity:0}
    #recap .grid{display:grid;grid-template-columns:repeat(2,640px);gap:28px}
    #recap .it{background:#fffaf0;border:4px solid #3a2e28;border-radius:24px;padding:22px 30px;font:800 36px Nunito;color:#d9774b;opacity:0}
    #recap .it small{display:block;font:600 26px Nunito;color:#3a2e28;margin-top:4px}
    #recap.many h2{font-size:60px;margin-bottom:30px}
    #recap.many .grid{grid-template-columns:repeat(3,540px);gap:20px}
    #recap.many .it{padding:14px 24px;font-size:30px;border-radius:20px}
    #recap.many .it small{font-size:22px}
  </style>
  <div id="talk" data-composition-id="talk" data-width="1920" data-height="1080">
    <svg width="0" height="0" style="position:absolute"><defs>
      <filter id="pencil" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="w"/>
        <feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="9" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .22  0 0 0 0 .15  0 0 0 0 .1  0 0 0 .7 -.2" result="nc"/>
        <feComposite in="nc" in2="d" operator="in" result="nm"/>
        <feMerge><feMergeNode in="d"/><feMergeNode in="nm"/></feMerge>
      </filter>
      ${PATTERNS}
      <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.8 1.15" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="8" result="w"/>
        <feDisplacementMap in="c" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs></svg>
    <div id="talk-world" data-layout-ignore>
      <div id="talk-scene">${sceneSVG}</div>
      <div id="board" data-layout-ignore>${boardBG}${boardHTML}</div>
      <div id="talk-pair" data-layout-ignore><div class="charBox" id="talk-lea">${leaSVG}</div>
      <div class="charBox" id="talk-mat">${matSVG}</div>${WALK ? NAMES : ''}</div>
    </div>
    <div id="talk-grain" data-layout-ignore></div>
    ${WALK ? '' : NAMES}
    <img id="talk-badge" src="${LOGO}" alt="The Cozy French">
    ${cardsHTML()}
    ${bubsHTML()}
    ${subsHTML}
    <div id="recap" class="clip${cards.length > 8 ? ' many' : ''}" data-start="${f(RECAP)}" data-duration="${f(RECAP_D)}" data-track-index="6">
      <h2 id="recap-title">Aujourd'hui, on a appris…</h2>
      <div class="grid">${cards.map((c, i) => `<div class="it" id="recap-it${i}">${esc(c.word)}<small>${esc(c.mean)}</small></div>`).join('')}</div>
    </div>
  </div>
  <script>
  (function(){
    const TOTAL=${TOTAL}, RECAP=${f(RECAP)};
    const WORDS=${JSON.stringify(words.map(w => ({ id: w.id, s: +f(w.s), e: +f(w.e), v: w.v, who: w.who, n: w.t.length })))};
    const TURNS=${JSON.stringify(turns.map(t => ({ who: t.who, s: +f(t.s), e: +f(t.e) })))};
    const WALK=${WALK}, SWAY=${STAGE.sway};
    const CARDS=${JSON.stringify(cards.map(c => ({ s: +f(c.s), d: +f(c.d), h: c.hidden ? 1 : 0, dir: c.dir || 0, fade: c.fade ? 1 : 0 })))};
    const SESS=${JSON.stringify(sessions.map(ss => ({ s: +f(ss.s), e: +f(ss.e), bg: ss.bg, segs: ss.segs.map(sg => ({ s: +f(sg.s), e: +f(sg.e), t0: +f(sg.t0), mode: sg.mode, lines: sg.lines ? sg.lines.map(l => +f(l.s)) : undefined, rv: sg.rv.map(([id, t, fx]) => [id, +f(t), fx]) })) })))};
    const SUBS=${JSON.stringify(chunks.map(c => ({ s: +f(c.show), d: +f(c.hide - c.show) })))};
    const BUBS=${JSON.stringify(bubs.map(b => ({ type: b.type, who: WALK ? b.side : b.who, t: +f(b.t) })))};
    const GESTS=${JSON.stringify(gests.map(g => ({ who: g.who, p: g.pose, t: +f(g.t), d: +f(g.d), b: g.b })))};
    const SIPS=${JSON.stringify(sips)}, ELB=${JSON.stringify(sandbox.GEST_ELBOW)}, NODS=${JSON.stringify(nods)};
    const EMOTES=${JSON.stringify(emotes.map(e => ({ who: e.who, type: e.type, t: +f(e.t) })))};
    function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
    const R=mulberry32(42), rnd=(a,b)=>a+R()*(b-a), rep=d=>Math.ceil(TOTAL/d)+1;
    const q=s=>Array.from(document.querySelectorAll(s));
    const tl=gsap.timeline({paused:true});

    // ---- scene ambience (${EP.scene}) ----
    q('#talk-scene .star').forEach(s=>tl.fromTo(s,{opacity:1},{opacity:.2,duration:rnd(.6,1.4),yoyo:true,repeat:rep(.6),ease:'sine.inOut'},rnd(0,2)));
    q('#talk-scene .drop').forEach(d=>tl.fromTo(d,{y:-60},{y:470,duration:rnd(.8,1.3),ease:'none',repeat:rep(.8)},rnd(0,1.2)));
    q('#talk-scene .glow,#lampglow,#glow,#sunglow,#beam').forEach(g=>tl.fromTo(g,{opacity:.6},{opacity:.4,duration:2.2,yoyo:true,repeat:rep(2.2),ease:'sine.inOut'},0));
    q('#talk-scene .curtain').forEach(c=>tl.fromTo(c,{skewX:0},{skewX:1.2,transformOrigin:'50% 0%',duration:3,yoyo:true,repeat:rep(3),ease:'sine.inOut'},0));
    q('#leaves,#canopy').forEach(l=>tl.fromTo(l,{rotation:0},{rotation:2,transformOrigin:'50% 100%',duration:2.2,yoyo:true,repeat:rep(2.2),ease:'sine.inOut'},0));
    q('#clouds').forEach(c=>tl.fromTo(c,{x:0},{x:-400,duration:TOTAL,ease:'none'},0));
    q('#talk-scene .leaf').forEach(l=>tl.fromTo(l,{y:-30,x:0,rotation:0},{y:rnd(650,800),x:rnd(-180,180),rotation:rnd(-400,400),duration:rnd(5,8),ease:'sine.inOut',repeat:rep(5)},rnd(0,6)));
    q('#talk-scene .mote').forEach(m=>tl.fromTo(m,{y:0,opacity:0},{y:rnd(-80,-160),opacity:.9,duration:rnd(4,6),yoyo:true,repeat:rep(4),ease:'sine.inOut'},rnd(0,3)));
    q('#talk-scene .bulbg').forEach(b=>tl.fromTo(b,{opacity:.25},{opacity:.08,duration:rnd(.8,1.6),yoyo:true,repeat:rep(.8)},rnd(0,2)));
    q('#talk-scene .bird').forEach((b,i)=>tl.fromTo(b,{x:0,y:0},{x:2300,y:-80,duration:16,ease:'none',repeat:rep(16)},i*.5));
    q('#talk-scene .snow').forEach(s=>tl.fromTo(s,{y:0,x:0},{y:rnd(380,420),x:rnd(-40,40),duration:rnd(4,7),ease:'none',repeat:rep(4)},rnd(0,4)));
    q('#talk-scene .flame').forEach((fl,i)=>tl.fromTo(fl,{scaleY:1,scaleX:1},{scaleY:rnd(.75,.9),scaleX:rnd(1.05,1.12),transformOrigin:'50% 100%',duration:rnd(.25,.4),yoyo:true,repeat:rep(.25),ease:'sine.inOut'},i*.1));
    q('#hillsfar').forEach(h=>tl.fromTo(h,{x:0},{x:-800,duration:24,ease:'none',repeat:rep(24)},0));
    q('#hills').forEach(h=>tl.fromTo(h,{x:0},{x:-800,duration:9,ease:'none',repeat:rep(9)},0));
    q('#poles').forEach(p=>tl.fromTo(p,{x:0},{x:-600,duration:1.6,ease:'none',repeat:rep(1.6)},0));
    q('#talk-scene .ripple').forEach(r=>tl.fromTo(r,{scaleX:1,opacity:.6},{scaleX:rnd(1.3,1.8),opacity:.15,transformOrigin:'50% 50%',duration:rnd(1.2,2.2),yoyo:true,repeat:rep(1.2),ease:'sine.inOut'},rnd(0,2)));
    q('#talk-scene .flag').forEach(fl=>tl.fromTo(fl,{rotation:-6},{rotation:6,transformOrigin:'50% 0%',duration:rnd(.9,1.4),yoyo:true,repeat:rep(.9),ease:'sine.inOut'},rnd(0,1)));
    q('#talk-scene .wave').forEach(w=>tl.fromTo(w,{x:0,opacity:.9},{x:rnd(-30,-60),opacity:.3,duration:rnd(1.6,2.6),yoyo:true,repeat:rep(1.6),ease:'sine.inOut'},rnd(0,2)));
    q('#talk-scene .boat').forEach(b=>{ tl.fromTo(b,{rotation:-3,y:0},{rotation:3,y:-6,transformOrigin:'50% 100%',duration:1.8,yoyo:true,repeat:rep(1.8),ease:'sine.inOut'},0); tl.fromTo(b,{x:0},{x:-260,duration:TOTAL,ease:'none'},0); });
    q('#talk-scene .lav').forEach(l=>tl.fromTo(l,{rotation:-5},{rotation:5,transformOrigin:'50% 100%',duration:rnd(1.4,2),yoyo:true,repeat:rep(1.4),ease:'sine.inOut'},rnd(0,1)));
    q('#talk-scene .firefly').forEach(fl=>{ tl.fromTo(fl,{x:0,y:0},{x:rnd(-60,60),y:rnd(-50,30),duration:rnd(2.5,4),yoyo:true,repeat:rep(2.5),ease:'sine.inOut'},rnd(0,2)); tl.fromTo(fl,{opacity:.1},{opacity:1,duration:rnd(.5,1),yoyo:true,repeat:rep(.5),ease:'sine.inOut'},rnd(0,2)); });
    q('#talk-scene .clockhand').forEach((h,i)=>tl.fromTo(h,{rotation:i?0:120},{rotation:i?360:150,transformOrigin:'50% 100%',duration:i?60:TOTAL,ease:'none',repeat:i?rep(60):0},0));
    q('#talk-scene [data-roll]').forEach(el=>{ const [w,v]=el.dataset.roll.split(',').map(Number); tl.fromTo(el,{x:0},{x:-w,duration:w/v,ease:'none',repeat:rep(w/v)},0); });

    // ---- characters idle ----
    ['#talk-lea','#talk-mat'].forEach((c,i)=>{
      tl.fromTo(c+' .breath',{y:0},{y:-3,duration:1.6,yoyo:true,repeat:rep(1.6),ease:'sine.inOut'},i*.5);
      for(let b=1.5+i;b<TOTAL;b+=3.3+i*.7) tl.fromTo(c+' .eye',{scaleY:1},{scaleY:.1,transformOrigin:'50% 50%',duration:.07,yoyo:true,repeat:1,immediateRender:false},b);
      q(c+' .steam').forEach((s,j)=>tl.fromTo(s,{y:0,opacity:0},{y:-40,opacity:.8,duration:2.2,repeat:rep(2.2),ease:'sine.out'},i*.7+j*1.1));
    });
    tl.fromTo('#talk-world',{scale:1},{scale:1.05,duration:RECAP,ease:'none'},0);

    // ---- who is speaking ----
    tl.set(['#talk-lea .head','#talk-mat .head'],{rotation:0,transformOrigin:'50% 95%'},0);
    tl.set('.nameTag',{opacity:0,y:0},0);
    // SVG pivots are set once here and never passed again (re-passing svgOrigin makes GSAP shift x/y to compensate → drift)
    tl.set(['#talk-lea .sway','#talk-mat .sway'],{svgOrigin:'180 431'},0);
    tl.set(['#talk-lea .gest','#talk-mat .gest'],{svgOrigin:'257 286'},0);
    Object.keys(ELB).forEach(p=>tl.set(['#talk-lea .g-'+p+' .fore','#talk-mat .g-'+p+' .fore'],{svgOrigin:ELB[p].join(' ')},0));
    tl.set(['#talk-lea .cupTilt','#talk-mat .cupTilt'],{svgOrigin:'234 384'},0);
    TURNS.forEach(t=>{
      const c='#talk-'+t.who, n='#name-'+t.who;
      tl.to(n,{opacity:1,y:-6,duration:.25},t.s-.2);
      tl.to(c+' .head',{rotation:3,duration:.5,ease:'sine.out'},t.s-.2);
      tl.to(n,{opacity:0,y:0,duration:.25},t.e+.15);
      tl.to(c+' .head',{rotation:0,duration:.5},t.e+.15);
      // gentle body sway while talking (pivot at the seat)
      const L=Math.max(t.e-t.s,1), k=Math.max(1,Math.round(L/1.8)), amp=(R()<.5?-1:1)*rnd(1.1,1.8);
      if(SWAY) tl.fromTo(c+' .sway',{rotation:0},{rotation:amp,duration:L/(2*k),yoyo:true,repeat:2*k-1,ease:'sine.inOut',immediateRender:false},t.s);
    });
    // ---- hand gestures + nods (gestTL / nodTL from the demo's GEST-RUNTIME) ----
    ${GEST_RUNTIME}
    GESTS.forEach(g=>gestTL(tl,'#talk-'+g.who,{p:g.p,t:g.t,d:g.d,b:g.b}));
    NODS.forEach(n=>nodTL(tl,'#talk-'+n.who,n.t));
    ${WALK ? `// ---- walking (WALK-RUNTIME from the demo + tools/staging.mjs) ----
    ${WALK_RUNTIME}${STAGE.runtime(STAGE_DATA, f)}` : ''}
    // ---- listener sips coffee (.cupGrp moves, .cupTilt tilts) ----
    SIPS.forEach(sp=>{
      const c='#talk-'+sp.who, t=sp.t;
      tl.set(c+' .armHold',{opacity:0},t); tl.set(c+' .armSip',{opacity:1},t);
      tl.to(c+' .steamGrp',{opacity:0,duration:.2},t); tl.to(c+' .steamGrp',{opacity:1,duration:.6},t+2.3);
      tl.fromTo(c+' .cupGrp',{x:0,y:0},{x:-14,y:-150,duration:.4,ease:'power2.inOut',immediateRender:false},t);
      tl.fromTo(c+' .cupTilt',{rotation:0},{rotation:-18,duration:.4,ease:'power2.inOut',immediateRender:false},t);
      tl.to(c+' .cupTilt',{rotation:-28,duration:.6,yoyo:true,repeat:1,ease:'sine.inOut'},t+.45);
      tl.to(c+' .cupGrp',{x:0,y:0,duration:.4,ease:'power2.inOut'},t+1.75);
      tl.to(c+' .cupTilt',{rotation:0,duration:.4,ease:'power2.inOut'},t+1.75);
      tl.set(c+' .armSip',{opacity:0},t+2.15); tl.set(c+' .armHold',{opacity:1},t+2.15);
    });

    // ---- mouths + word highlight ----
    tl.set('.subFr .ul',{scaleX:0},0);
    WORDS.forEach(w=>{
      const m='#talk-'+w.who+' .mouth', len=Math.min(w.e-w.s, .08*w.n+.08);
      const flaps=Math.max(1,Math.round(len/.2)), fd=len/flaps/2;
      for(let k=0;k<flaps;k++) tl.fromTo(m,{scaleY:1},{scaleY:2.4+R()*1.8,transformOrigin:'50% 0%',duration:fd,yoyo:true,repeat:1,ease:'sine.inOut',immediateRender:false},w.s+k*fd*2);
      tl.to('#'+w.id,{color:w.v?'#b8552a':'#3a2e28',duration:.1},w.s);
      if(w.v) tl.to('#'+w.id+' .ul',{scaleX:1,duration:.35,ease:'power2.out'},w.s);
    });
    SUBS.forEach((s,i)=>tl.fromTo('#sub'+i+' .subBox',{y:26,opacity:0},{y:0,opacity:1,duration:.25,ease:'back.out(2)'},s.s));

    // ---- emotes ----
    ${EMO_RUNTIME}
    EMOTES.forEach(e=>emoteTL(tl,'#talk-'+e.who,e.type,e.t,${EMO_D}));

    // ---- illustration bubbles ----
    ${ILLUS_RUNTIME}
    BUBS.forEach((b,i)=>bubbleTL(tl,'#bub'+i,b.type,b.who,b.t,${BUB_D}));

    // ---- explanation board ----
    let segK=0;
    const CORNER=${JSON.stringify(STAGE.corner)}, BASE=${STAGE.base};
    // background entrance / exit: liege fades in, craie drops from the top, carnet slides up from below
    const BG_IN={liege:[{opacity:0,scale:1.06,y:0,rotation:0},{opacity:1,scale:1,duration:.5,ease:'power2.out'}],
      craie:[{opacity:1,y:-1120,scale:1,rotation:0},{y:0,duration:.75,ease:'back.out(1.1)'}],
      carnet:[{opacity:1,y:1120,rotation:5,scale:1},{y:0,rotation:0,duration:.7,ease:'power3.out'}]};
    const BG_OUT={liege:{opacity:0,duration:.45,ease:'power2.in'},craie:{y:-1120,duration:.5,ease:'power2.in'},carnet:{y:1120,rotation:-4,duration:.5,ease:'power2.in'}};
    // reveal effects for the new board modes (each element starts hidden via .rv)
    const FX={
      pop:(e,t)=>tl.fromTo(e,{opacity:0,scale:.6},{opacity:1,scale:1,duration:.38,ease:'back.out(2.2)',immediateRender:false},t),
      drop:(e,t)=>tl.fromTo(e,{opacity:0,y:-50},{opacity:1,y:0,duration:.45,ease:'back.out(1.7)',immediateRender:false},t),
      slide:(e,t)=>tl.fromTo(e,{opacity:0,x:-46},{opacity:1,x:0,duration:.42,ease:'power2.out',immediateRender:false},t),
      stamp:(e,t)=>tl.fromTo(e,{opacity:0,scale:2.2,rotation:-20},{opacity:1,scale:1,rotation:0,duration:.35,ease:'back.out(1.6)',immediateRender:false},t),
      draw:(e,t)=>tl.fromTo(e,{strokeDashoffset:1},{strokeDashoffset:0,duration:.45,ease:'power2.out',immediateRender:false},t),
      fade:(e,t)=>tl.fromTo(e,{opacity:0},{opacity:1,duration:.3,immediateRender:false},t),
      dim:(e,t)=>tl.fromTo(e,{opacity:1},{opacity:.42,duration:.35,immediateRender:false},t),
    };
    SESS.forEach(ss=>{
      const a=ss.s-.3, b=ss.e-.1, bg='#bbg-'+ss.bg, I=BG_IN[ss.bg];
      tl.fromTo(bg,I[0],{...I[1],opacity:1,immediateRender:false},a);
      tl.fromTo(bg,{opacity:1,y:0,rotation:0,scale:1},{...BG_OUT[ss.bg],immediateRender:false},b);
      tl.set(bg,{opacity:0,y:0,rotation:0},b+.55);
      tl.to('#names',{opacity:0,duration:.2},a); tl.to('#names',{opacity:1,duration:.3},b+.5);
      ['lea','mat'].forEach(w=>{
        tl.fromTo('#talk-'+w,{x:0,y:0,scale:BASE,transformOrigin:'50% 90%'},{x:CORNER[w].x,y:CORNER[w].y,scale:CORNER[w].s,transformOrigin:'50% 90%',duration:.7,ease:'power2.inOut',immediateRender:false},a);
        tl.to('#talk-'+w,{x:0,y:0,scale:BASE,duration:.7,ease:'power2.inOut'},b);
      });
      ss.segs.forEach((sg,j)=>{
        const k=segK++, el='#bseg'+k, t0=sg.t0, last=j===ss.segs.length-1;
        tl.fromTo(el,{opacity:0},{opacity:1,duration:.3,immediateRender:false},t0);
        tl.to(el,{opacity:0,duration:.3},last?b+.45:ss.segs[j+1].s-.35);
        if(sg.mode==='word'){
          tl.fromTo(el+' .bpaper',{y:-70,rotation:-7},{y:0,rotation:-1.5,duration:.55,ease:'back.out(1.7)',immediateRender:false},t0);
          tl.fromTo(el+' .bpola',{scale:.6,opacity:0,rotation:10},{scale:1,opacity:1,rotation:3,duration:.5,ease:'back.out(2)',immediateRender:false},t0+.6);
          tl.fromTo(el+' .bnote',{scale:.6,opacity:0,rotation:-12},{scale:1,opacity:1,rotation:-3,duration:.5,ease:'back.out(2)',immediateRender:false},t0+1.1);
          tl.fromTo(el+' .bex',{opacity:0,y:12},{opacity:1,y:0,duration:.4,immediateRender:false},t0+1.6);
        } else if(sg.mode==='sketch'){
          tl.fromTo(el+' .btitle',{y:-50,opacity:0},{y:0,opacity:1,duration:.45,ease:'back.out(1.7)',immediateRender:false},t0);
          sg.lines.forEach((ls,i)=>{
            const t=Math.max(ls,t0+.3);
            tl.fromTo(el+'l'+i,{opacity:0,y:24,scale:.92},{opacity:1,y:0,scale:1,duration:.35,ease:'back.out(2)',immediateRender:false},t);
            if(i%4===0&&i) for(let p=i-4;p<i;p++) tl.to(el+'l'+p,{opacity:0,y:-16,duration:.25},t-.3);
          });
        } else sg.rv.forEach(([id,t,fx])=>FX[fx]('#bs'+k+'_'+id,t));
      });
    });

    // ---- vocab cards ----
    CARDS.forEach((c,i)=>{ if(c.h) return;
      const el='#card'+i+' .card';
      if(WALK){ walkCardTL(tl,el,c.s-.1,c.s+c.d,c.dir,c.fade); tl.fromTo('#card'+i+' .ex',{opacity:0,y:10},{opacity:1,y:0,duration:.4},c.s+.7); return; }
      tl.fromTo(el,{y:-80,opacity:0,rotation:3},{y:0,opacity:1,rotation:-1.5,duration:.5,ease:'back.out(1.7)'},c.s);
      tl.fromTo('#card'+i+' .ex',{opacity:0,y:10},{opacity:1,y:0,duration:.4},c.s+.5);
      tl.to(el,{y:-50,opacity:0,duration:.3,ease:'power2.in'},c.s+c.d-.35);
    });

    // ---- recap ----
    tl.fromTo('#recap',{opacity:0},{opacity:1,duration:.5},RECAP);
    tl.fromTo('#recap-title',{y:30,opacity:0},{y:0,opacity:1,duration:.6,ease:'back.out(2)'},RECAP+.2);
    q('#recap .it').forEach((it,i)=>tl.fromTo(it,{y:30,opacity:0},{y:0,opacity:1,duration:.4,ease:'back.out(2)'},RECAP+.7+i*Math.min(.35,${(RECAP_D - 2) / Math.max(1, cards.length)})));

    window.__timelines=window.__timelines||{};
    window.__timelines["talk"]=tl;
  })();
  </script>
</template>
`;
fs.writeFileSync(path.join(ROOT, 'compositions/talk.html'), talk);

/* ---------- index.html ---------- */
const index = `<!doctype html>
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
      <div id="talk" data-composition-id="talk" data-composition-src="compositions/talk.html"
           data-start="0" data-duration="${TOTAL}" data-track-index="1" data-track-kind="graphics"
           data-width="1920" data-height="1080"></div>
      <audio id="voice" src="${EP.audio}" data-start="0" data-duration="${f(EP.audioEnd)}" data-track-index="2" data-volume="1" data-fade-out="0.3"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), index);
console.log(`built (${WALK ? 'walk' : 'sit'}): ${gests.length} gestures (${POSES.map(p => p + ' ' + gests.filter(g => g.pose === p).length).join(', ')}), ${nods.length} nods, ${sips.length} sips, ${chunks.length} subtitle chunks, ${words.length} words, ${cards.length} cards, ${emotes.length} emotes, ${bubs.length} illustrations, ${turns.length} turns, total ${TOTAL}s`);
