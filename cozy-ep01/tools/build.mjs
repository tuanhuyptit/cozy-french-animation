// Build the HyperFrames composition for one episode.
// Inputs : episode.json (scene, outfits, subtitle chunks, vocab) + assets/words.json (word timestamps)
// Art    : characters + scenes are taken from ../demo-animation-style.html (single source of truth)
// Output : index.html + compositions/talk.html
// Usage  : node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

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
  this.leaSVG=leaSVG; this.matSVG=matSVG; this.SCENES=SCENES; this.EMO_TYPES=EMO_TYPES; this.ILLUS=ILLUS; this.bubbleSVG=bubbleSVG; this.GEST_ELBOW=GEST_ELBOW;`, sandbox);
// emote runtime (EMO_FACE, EMO_ANIM, emoteTL) is copied verbatim into the video script
const EMO_RUNTIME = src.slice(src.indexOf('/* EMOTE-RUNTIME-START'), src.indexOf('/* EMOTE-RUNTIME-END */'));
const ILLUS_RUNTIME = src.slice(src.indexOf('/* ILLUS-RUNTIME-START'), src.indexOf('/* ILLUS-RUNTIME-END */'));
if (!sandbox.SCENES[EP.scene]) throw new Error(`unknown scene "${EP.scene}" (have: ${Object.keys(sandbox.SCENES).join(', ')})`);
const sceneSVG = sandbox.SCENES[EP.scene].html();
const leaSVG = sandbox.leaSVG(EP.lea).replace(/<div class="name">[^<]*<\/div>/, '');
const matSVG = sandbox.matSVG(EP.mat).replace(/<div class="name">[^<]*<\/div>/, '');

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

// explanation board (bảng ghim gỗ): chunk.board = { mode: 'word'|'sketch', note?, icon?, title?, word?… } opens a segment, chunk.boardEnd closes it
//   word   = the expression pinned on paper (taken from the first vocab card inside the segment unless overridden) + sticky note + optional illustration
//   sketch = role-play: every line of the segment is pinned as a speech bubble (pages of 4)
// segments less than 1.5 s apart share one board session (characters stay in the corners).
const segs = []; let curSeg = null;
chunks.forEach((c, i) => {
  if (c.board) { if (curSeg) throw new Error(`chunk ${i}: board opens before chunk ${curSeg.a}'s board is closed`); curSeg = { ...c.board, a: i }; }
  if (c.boardEnd) { if (!curSeg) throw new Error(`chunk ${i}: boardEnd without board`); curSeg.b = i; segs.push(curSeg); curSeg = null; }
});
if (curSeg) throw new Error(`chunk ${curSeg.a}: board never closed (add "boardEnd": true)`);
segs.forEach(sg => {
  sg.s = chunks[sg.a].show; sg.e = chunks[sg.b].hide;
  if (!['word', 'sketch'].includes(sg.mode)) throw new Error(`chunk ${sg.a}: board.mode must be word or sketch`);
  if (sg.icon && !sandbox.ILLUS[sg.icon]) throw new Error(`chunk ${sg.a}: unknown board icon "${sg.icon}"`);
  if (sg.mode === 'word') {
    const vi = cards.findIndex(cd => cd.s >= sg.s - 0.1 && cd.s <= sg.e);
    const v = vi >= 0 ? EP.vocab[vi] : {};
    for (const k of ['tag', 'word', 'ipa', 'mean', 'ex', 'exEn']) if (sg[k] === undefined) sg[k] = v[k] || '';
    if (!sg.word) throw new Error(`chunk ${sg.a}: word board needs a vocab group inside it or board.word`);
  } else sg.lines = chunks.slice(sg.a, sg.b + 1).reduce((acc, c) => {   // one bubble per sentence: glue a same-speaker chunk that continues an unfinished one
    const text = c.toks.map(t => t.t).join(' '), l = acc[acc.length - 1];
    if (l && l.who === c.who && !/[.?!…"»]$/.test(l.text)) l.text += ' ' + text; else acc.push({ who: c.who, text, s: c.show });
    return acc;
  }, []);
});
const sessions = [];
segs.forEach(sg => { const l = sessions[sessions.length - 1]; if (l && sg.s - l.e < 1.5) { l.e = sg.e; l.segs.push(sg); } else sessions.push({ s: sg.s, e: sg.e, segs: [sg] }); });
cards.forEach(c => { c.hidden = sessions.some(ss => c.s >= ss.s - 0.3 && c.s <= ss.e + 0.3); });
bubs.forEach(b => { const ss = sessions.find(ss => b.t < ss.e + 0.6 && b.t + BUB_D > ss.s - 0.4); if (ss) throw new Error(`chunk ${b.ci}: illustration "${b.type}" overlaps the board at ${ss.s.toFixed(1)}–${ss.e.toFixed(1)}s — move or drop it`); });
if (sessions.length && sessions[sessions.length - 1].e + 0.8 > RECAP_AT) throw new Error('board runs into the recap');

// listener sips coffee now and then (every ~35–70 s each, while the other talks ≥ 4.5 s, not on the board, not during an emote)
const sips = [], sR = mulberry32(33);
['lea', 'mat'].forEach(who => {
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
const subsHTML = chunks.map((c, i) => `
    <div id="sub${i}" class="clip subWrap" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3">
      <div class="subBox"><div class="subFr">${c.toks.map(t => `<span class="w${t.v ? ' vocab' : ''}" id="${t.id}">${t.v ? '<i class="ul"></i>' : ''}<b class="tx">${esc(t.t)}</b></span>`).join(' ')}</div><div class="subEn">${esc(c.en)}</div></div>
    </div>`).join('');
const cardsHTML = cards.map((c, i) => c.hidden ? '' : `
    <div id="card${i}" class="clip cardWrap" data-start="${f(c.s)}" data-duration="${f(c.d)}" data-track-index="4">
      <div class="card"><span class="tag">${esc(c.tag)}</span><div class="word">${esc(c.word)}</div><div class="ipa">${esc(c.ipa)}</div>
      <div class="mean">${esc(c.mean)}</div><div class="ex">${esc(c.ex)}<i>${esc(c.exEn)}</i></div></div>
    </div>`).join('');
const boardRnd = mulberry32(11);
const boardBG = `<svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">
  <rect width="1920" height="1080" fill="#7a4c33"/><rect x="0" y="0" width="1920" height="1080" fill="none" stroke="#5e3825" stroke-width="18"/>
  <rect x="44" y="34" width="1832" height="1012" rx="12" fill="#c9965f"/>
  <g fill="#a87542" opacity=".55">${Array.from({ length: 520 }, () => `<ellipse cx="${(60 + boardRnd() * 1800).toFixed(0)}" cy="${(50 + boardRnd() * 980).toFixed(0)}" rx="${(1.5 + boardRnd() * 3).toFixed(1)}" ry="${(1 + boardRnd() * 2).toFixed(1)}"/>`).join('')}</g>
  <g fill="#e2b77f" opacity=".5">${Array.from({ length: 260 }, () => `<circle cx="${(60 + boardRnd() * 1800).toFixed(0)}" cy="${(50 + boardRnd() * 980).toFixed(0)}" r="${(1 + boardRnd() * 2).toFixed(1)}"/>`).join('')}</g>
  <rect x="44" y="34" width="1832" height="1012" rx="12" fill="none" stroke="#00000030" stroke-width="10"/></svg>`;
const NAME = { lea: 'Léa', mat: 'Mathieu' };
const boardHTML = segs.map((sg, k) => sg.mode === 'word' ? `
      <div class="bseg" id="bseg${k}">
        <div class="bpaper"><i class="pin"></i><span class="tag">${esc(sg.tag)}</span><div class="bword">${esc(sg.word)}</div><div class="bipa">${esc(sg.ipa)}</div>
          <div class="bmean">${esc(sg.mean)}</div>${sg.ex ? `<div class="bex">${esc(sg.ex)}<i>${esc(sg.exEn)}</i></div>` : ''}</div>
        ${sg.icon ? `<div class="bpola"><i class="pin y"></i><svg viewBox="0 0 300 200" width="360" height="240"><g filter="url(#pencil)">${sandbox.ILLUS[sg.icon].svg}</g></svg></div>` : ''}
        ${sg.note ? `<div class="bnote${sg.icon ? '' : ' solo'}"><i class="pin"></i>${esc(sg.note)}</div>` : ''}
      </div>` : `
      <div class="bseg" id="bseg${k}">
        <div class="btitle"><i class="pin"></i>${esc(sg.title || 'En situation')}</div>
        ${sg.lines.map((l, j) => `<div class="bl ${l.who}" id="bseg${k}l${j}" style="top:${196 + (j % 4) * 168}px"><i class="pin"></i><b>${NAME[l.who]}</b>${esc(l.text)}</div>`).join('')}
      </div>`).join('');
const bubsHTML = bubs.map((b, i) => `
    <div id="bub${i}" class="clip bubWrap" data-start="${f(b.t)}" data-duration="${f(BUB_D)}" data-track-index="7">${sandbox.bubbleSVG(b.type, esc(b.label), b.who)}</div>`).join('');
// channel badge (top right): repo brand/logo.png, embedded so the sub-composition needs no asset path
const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, '..', 'brand', 'logo.png')).toString('base64');
// hand gestures while talking. The free (outer) arm takes one of 5 poses drawn in demo-animation-style.html (ARM_UP):
//   beat (fist, ticks on each word) · palm (palm up, slow bob) · up (open hand, wave) · point (towards the other person) · think (hand to chin)
// picked from what is being said: "tu/toi/ton…" → more point, a question → more think; never the same pose twice in a row,
// random length 1.6–3 s, random rests (and sometimes no gesture at all), always starting on a word.
const gR = mulberry32(21), gests = [], lastPose = {};
turns.forEach(t => {
  if (t.e - t.s < 2.2) return;
  const tw = words.filter(w => w.who === t.who && w.s >= t.s && w.s <= t.e);
  let next = t.s + 0.2 + gR() * 0.8;
  tw.forEach(w => {
    if (w.s < next) return;
    if (gR() < 0.25) { next = w.s + 1.5; return; }
    const d = Math.min(1.6 + gR() * 1.4, t.e - w.s - 0.2); if (d < 1.3) return;
    const win = tw.filter(x => x.s >= w.s && x.s < w.s + d), txt = ' ' + win.map(x => x.t.toLowerCase()).join(' ') + ' ';
    const ch = chunks.find(c => c.who === t.who && c.s <= w.s + 0.01 && c.e >= w.s - 0.01);
    let pool = ['beat', 'beat', 'palm', 'palm', 'up', 'point'];
    if (/[ "«](tu|toi|te|ton|ta|tes|t'\S*)[ ,.?!]/.test(txt)) pool.push('point', 'point');
    if (ch && (/\?$/.test(ch.toks[ch.toks.length - 1].t) || ch.emote === 'question')) pool.push('think', 'think', 'think');
    pool = pool.filter(x => x !== lastPose[t.who]);
    const pose = pool[Math.floor(gR() * pool.length)]; lastPose[t.who] = pose;
    const beats = win.filter((x, i, arr) => !i || x.s - arr[i - 1].s >= 0.28).map(x => +x.s.toFixed(3)).filter(s => s > w.s + 0.35 && s < w.s + d - 0.4);
    gests.push({ who: t.who, pose, t: w.s, d, b: beats });
    next = w.s + d + 2.2 + gR() * 3;
  });
});

const talk = `<template>
  <style>
    #talk{position:absolute;inset:0;overflow:hidden;background:#f3e3c8;font-family:Nunito,sans-serif}
    #talk-world{position:absolute;inset:0;transform-origin:50% 60%}
    #talk-scene,#talk-scene svg.bg{position:absolute;inset:0;width:1920px;height:1080px}
    .charBox{position:absolute;top:290px;width:360px;height:480px;transform:scale(1.22);transform-origin:50% 90%}
    .charBox svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
    #talk-lea{left:300px} #talk-mat{left:1235px}
    .nameTag{position:absolute;top:196px;width:fit-content;font:800 30px Nunito;color:#fffaf0;background:#3a2e28;padding:6px 20px;border-radius:30px;opacity:0}
    #name-lea{left:428px} #name-mat{left:1340px}
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
    #board{position:absolute;inset:0;opacity:0}
    .bseg{position:absolute;inset:0;opacity:0}
    .pin{position:absolute;left:50%;top:-14px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#c8463a;box-shadow:0 4px 0 #0003,inset -4px -4px 0 #0002}
    .pin.y{background:#e9b44c}
    .bpaper{position:absolute;left:350px;top:96px;width:700px;background:#fffaf0;padding:34px 44px 38px;box-shadow:0 14px 0 #0000002a;transform:rotate(-1.5deg)}
    .bpaper .tag{display:inline-block;font:800 26px Nunito;letter-spacing:.08em;text-transform:uppercase;background:#f3c96b;color:#3a2e28;padding:4px 14px;border-radius:20px}
    .bword{font:700 76px/1.1 'Playfair Display',serif;color:#b8552a;margin:14px 0 6px}
    .bipa{font:600 32px 'Noto Sans',Nunito,sans-serif;color:#6f5f52}
    .bmean{font:800 40px Nunito;color:#3a2e28;margin-top:18px}
    .bex{font:600 32px/1.35 Nunito;color:#3a2e28;margin-top:20px;padding-top:18px;border-top:3px dashed #e3d4c1}
    .bex i{display:block;font-style:normal;color:#6f5f52;margin-top:6px}
    .bpola{position:absolute;left:1130px;top:80px;background:#fffaf0;padding:22px 22px 54px;box-shadow:0 12px 0 #0000002a;transform:rotate(3deg)}
    .bnote{position:absolute;left:1150px;top:470px;width:360px;min-height:200px;background:#f3c96b;padding:40px 30px 30px;font:800 36px/1.3 Nunito;color:#3a2e28;box-shadow:0 12px 0 #0000002a;transform:rotate(-3deg)}
    .bnote.solo{top:200px}
    .btitle{position:absolute;left:50%;top:70px;transform:translateX(-50%) rotate(-1deg);background:#fffaf0;padding:16px 44px;font:700 46px 'Playfair Display',serif;color:#b8552a;box-shadow:0 10px 0 #0000002a;white-space:nowrap}
    .bl{position:absolute;max-width:900px;padding:16px 32px 18px;border-radius:26px;border:4px solid #3a2e28;font:800 36px/1.25 Nunito;color:#3a2e28;box-shadow:0 10px 0 #00000026;opacity:0}
    .bl b{display:block;font:800 22px Nunito;letter-spacing:.06em;text-transform:uppercase;color:#8a6a55;margin-bottom:2px}
    .bl.lea{left:360px;background:#fde3cf} .bl.mat{right:360px;background:#dbe8f3}
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
      <pattern id="stripes" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f7f3ea"/><rect width="20" height="8" fill="#2d3e66"/></pattern>
      <pattern id="gingham" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fbf4ea"/><rect width="20" height="40" fill="#d9574a" opacity=".45"/><rect width="40" height="20" fill="#d9574a" opacity=".45"/></pattern>
    </defs></svg>
    <div id="talk-world" data-layout-ignore>
      <div id="talk-scene">${sceneSVG}</div>
      <div id="board" data-layout-ignore>${boardBG}${boardHTML}</div>
      <div class="charBox" id="talk-lea">${leaSVG}</div>
      <div class="charBox" id="talk-mat">${matSVG}</div>
    </div>
    <div id="talk-grain" data-layout-ignore></div>
    <div id="names"><div id="name-lea" class="nameTag">Léa</div>
    <div id="name-mat" class="nameTag">Mathieu</div></div>
    <img id="talk-badge" src="${LOGO}" alt="The Cozy French">
    ${cardsHTML}
    ${bubsHTML}
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
    const CARDS=${JSON.stringify(cards.map(c => ({ s: +f(c.s), d: +f(c.d), h: c.hidden ? 1 : 0 })))};
    const SESS=${JSON.stringify(sessions.map(ss => ({ s: +f(ss.s), e: +f(ss.e), segs: ss.segs.map(sg => ({ s: +f(sg.s), e: +f(sg.e), mode: sg.mode, lines: sg.lines ? sg.lines.map(l => +f(l.s)) : undefined })) })))};
    const SUBS=${JSON.stringify(chunks.map(c => ({ s: +f(c.show), d: +f(c.hide - c.show) })))};
    const BUBS=${JSON.stringify(bubs.map(b => ({ type: b.type, who: b.who, t: +f(b.t) })))};
    const GESTS=${JSON.stringify(gests.map(g => ({ who: g.who, p: g.pose, t: +f(g.t), d: +f(g.d), b: g.b })))};
    const SIPS=${JSON.stringify(sips)}, ELB=${JSON.stringify(sandbox.GEST_ELBOW)};
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
      tl.fromTo(c+' .sway',{rotation:0},{rotation:amp,duration:L/(2*k),yoyo:true,repeat:2*k-1,ease:'sine.inOut',immediateRender:false},t.s);
    });
    // ---- hand gestures ----
    GESTS.forEach(g=>{
      const c='#talk-'+g.who, el=c+' .g-'+g.p, lift=g.p==='think'?35:50;
      const h0=g.t+.32, h1=g.t+g.d-.3;
      tl.set(c+' .armRest',{opacity:0},g.t); tl.set(el,{opacity:1},g.t);
      tl.fromTo(el,{rotation:lift},{rotation:0,duration:.32,ease:'back.out(1.5)',immediateRender:false},g.t);
      if(g.p==='up'||g.p==='palm'||g.p==='think'){
        const per={up:.7,palm:1.1,think:1.3}[g.p], amp={up:-12,palm:9,think:-4}[g.p], w=Math.max(1,Math.round((h1-h0)/per));
        tl.fromTo(el+' .fore',{rotation:0},{rotation:amp,duration:(h1-h0)/(2*w),yoyo:true,repeat:2*w-1,ease:'sine.inOut',immediateRender:false},h0);
      } else {
        const amp=g.p==='beat'?12:-7;
        g.b.forEach(bt=>{ if(bt>h0&&bt<h1-.2) tl.fromTo(el+' .fore',{rotation:0},{rotation:amp,duration:.11,yoyo:true,repeat:1,ease:'power2.out',immediateRender:false},bt-.04); });
      }
      tl.to(el,{rotation:lift,duration:.26,ease:'power2.in'},h1);
      tl.set(el,{opacity:0},g.t+g.d-.04); tl.set(c+' .armRest',{opacity:1},g.t+g.d-.04);
    });
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
    const CORNER={lea:{x:-330,y:338},mat:{x:355,y:338}};
    SESS.forEach(ss=>{
      const a=ss.s-.3, b=ss.e-.1;
      tl.fromTo('#board',{opacity:0,scale:1.06},{opacity:1,scale:1,duration:.5,ease:'power2.out',immediateRender:false},a);
      tl.to('#board',{opacity:0,duration:.45,ease:'power2.in'},b);
      tl.to('#names',{opacity:0,duration:.2},a); tl.to('#names',{opacity:1,duration:.3},b+.5);
      ['lea','mat'].forEach(w=>{
        tl.fromTo('#talk-'+w,{x:0,y:0,scale:1.22,transformOrigin:'50% 90%'},{x:CORNER[w].x,y:CORNER[w].y,scale:.7,transformOrigin:'50% 90%',duration:.7,ease:'power2.inOut',immediateRender:false},a);
        tl.to('#talk-'+w,{x:0,y:0,scale:1.22,duration:.7,ease:'power2.inOut'},b);
      });
      ss.segs.forEach((sg,j)=>{
        const k=segK++, el='#bseg'+k, t0=j?sg.s:ss.s+.15, last=j===ss.segs.length-1;
        tl.fromTo(el,{opacity:0},{opacity:1,duration:.3,immediateRender:false},t0);
        tl.to(el,{opacity:0,duration:.3},last?b+.45:ss.segs[j+1].s-.35);
        if(sg.mode==='word'){
          tl.fromTo(el+' .bpaper',{y:-70,rotation:-7},{y:0,rotation:-1.5,duration:.55,ease:'back.out(1.7)',immediateRender:false},t0);
          tl.fromTo(el+' .bpola',{scale:.6,opacity:0,rotation:10},{scale:1,opacity:1,rotation:3,duration:.5,ease:'back.out(2)',immediateRender:false},t0+.6);
          tl.fromTo(el+' .bnote',{scale:.6,opacity:0,rotation:-12},{scale:1,opacity:1,rotation:-3,duration:.5,ease:'back.out(2)',immediateRender:false},t0+1.1);
          tl.fromTo(el+' .bex',{opacity:0,y:12},{opacity:1,y:0,duration:.4,immediateRender:false},t0+1.6);
        } else {
          tl.fromTo(el+' .btitle',{y:-50,opacity:0},{y:0,opacity:1,duration:.45,ease:'back.out(1.7)',immediateRender:false},t0);
          sg.lines.forEach((ls,i)=>{
            const t=Math.max(ls,t0+.3);
            tl.fromTo(el+'l'+i,{opacity:0,y:24,scale:.92},{opacity:1,y:0,scale:1,duration:.35,ease:'back.out(2)',immediateRender:false},t);
            if(i%4===0&&i) for(let p=i-4;p<i;p++) tl.to(el+'l'+p,{opacity:0,y:-16,duration:.25},t-.3);
          });
        }
      });
    });

    // ---- vocab cards ----
    CARDS.forEach((c,i)=>{ if(c.h) return;
      const el='#card'+i+' .card';
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
console.log(`built: ${gests.length} gestures (${['beat','palm','up','point','think'].map(p => p + ' ' + gests.filter(g => g.pose === p).length).join(', ')}), ${sips.length} sips, ${chunks.length} subtitle chunks, ${words.length} words, ${cards.length} cards, ${emotes.length} emotes, ${bubs.length} illustrations, ${turns.length} turns, total ${TOTAL}s`);
