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
  this.leaSVG=leaSVG; this.matSVG=matSVG; this.SCENES=SCENES;`, sandbox);
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
const RECAP_AT = Math.max(EP.audioEnd, chunks[chunks.length - 1].hide, vocabStarts[vocabStarts.length - 1] + 4.8) + 0.2;
chunks[chunks.length - 1].hide = RECAP_AT - 0.1;
const cards = EP.vocab.map((v, i) => {
  const s = vocabStarts[i] - 0.05, next = vocabStarts[i + 1];
  const e = next ? Math.min(s + 4.6, next - 0.15) : RECAP_AT - 0.1;
  return { ...v, s, d: e - s };
});
// speaker turns
const turns = [];
chunks.forEach(c => { const l = turns[turns.length - 1]; if (l && l.who === c.who) l.e = c.e; else turns.push({ who: c.who, s: c.s, e: c.e }); });

const END = Math.max(EP.audioEnd, chunks[chunks.length - 1].hide);
const RECAP = RECAP_AT, RECAP_D = 5, TOTAL = +(RECAP + RECAP_D).toFixed(2);
const f = n => (+n).toFixed(3);

/* ---------- talk.html ---------- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const subsHTML = chunks.map((c, i) => `
    <div id="sub${i}" class="clip subWrap" data-start="${f(c.show)}" data-duration="${f(c.hide - c.show)}" data-track-index="3">
      <div class="subBox"><div class="subFr">${c.toks.map(t => `<span class="w${t.v ? ' vocab' : ''}" id="${t.id}">${t.v ? '<i class="ul"></i>' : ''}<b class="tx">${esc(t.t)}</b></span>`).join(' ')}</div><div class="subEn">${esc(c.en)}</div></div>
    </div>`).join('');
const cardsHTML = cards.map((c, i) => `
    <div id="card${i}" class="clip cardWrap" data-start="${f(c.s)}" data-duration="${f(c.d)}" data-track-index="4">
      <div class="card"><span class="tag">${esc(c.tag)}</span><div class="word">${esc(c.word)}</div><div class="ipa">${esc(c.ipa)}</div>
      <div class="mean">${esc(c.mean)}</div><div class="ex">${esc(c.ex)}<i>${esc(c.exEn)}</i></div></div>
    </div>`).join('');
const cntHTML = [0, ...cards.map(c => c.s)].map((s, i, arr) =>
  `<span id="cnt${i}" class="clip cnt" data-start="${f(s)}" data-duration="${f((arr[i + 1] ?? RECAP) - s)}" data-track-index="5">${i}</span>`).join('');

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
    .card{background:#fffaf0;border-radius:30px;padding:28px 34px;box-shadow:0 14px 0 #0000001a;border:4px solid #3a2e28}
    .card .tag{display:inline-block;font:800 26px Nunito;letter-spacing:.08em;text-transform:uppercase;background:#f3c96b;color:#3a2e28;padding:4px 14px;border-radius:20px}
    .card .word{font:700 58px 'Playfair Display',serif;color:#b8552a;margin:12px 0 2px}
    .card .ipa{font:600 28px 'Noto Sans',Nunito,sans-serif;color:#6f5f52}
    .card .mean{font:800 34px Nunito;color:#3a2e28;margin-top:14px}
    .card .ex{font:600 28px/1.35 Nunito;color:#3a2e28;margin-top:14px;padding-top:14px;border-top:3px dashed #e3d4c1}
    .card .ex i{color:#6f5f52;display:block;font-style:normal;margin-top:4px}
    #talk-brand{position:absolute;left:48px;top:40px;background:#fffaf0e8;border-radius:22px;padding:12px 24px 10px}
    #talk-logo{font:700 38px 'Playfair Display',serif;color:#3a2e28}
    #talk-logo span{color:#b8552a}
    #talk-count{font:800 28px Nunito;color:#6f5f52;display:flex;gap:6px}
    .cntBox{position:relative;width:18px;height:36px} .cnt{position:absolute;left:0;top:0}
    #recap{position:absolute;inset:0;background:#f6eddc;display:flex;flex-direction:column;align-items:center;justify-content:center}
    #recap h2{font:700 72px 'Playfair Display',serif;color:#3a2e28;margin:0 0 40px;opacity:0}
    #recap .grid{display:grid;grid-template-columns:repeat(2,640px);gap:28px}
    #recap .it{background:#fffaf0;border:4px solid #3a2e28;border-radius:24px;padding:22px 30px;font:800 36px Nunito;color:#d9774b;opacity:0}
    #recap .it small{display:block;font:600 26px Nunito;color:#3a2e28;margin-top:4px}
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
      <div class="charBox" id="talk-lea">${leaSVG}</div>
      <div class="charBox" id="talk-mat">${matSVG}</div>
    </div>
    <div id="talk-grain" data-layout-ignore></div>
    <div id="name-lea" class="nameTag">Léa</div>
    <div id="name-mat" class="nameTag">Mathieu</div>
    <div id="talk-brand"><div id="talk-logo">The Cozy <span>French</span></div>
      <div id="talk-count">Mots clés : <span class="cntBox">${cntHTML}</span> / ${cards.length}</div></div>
    ${cardsHTML}
    ${subsHTML}
    <div id="recap" class="clip" data-start="${f(RECAP)}" data-duration="${f(RECAP_D)}" data-track-index="6">
      <h2 id="recap-title">Aujourd'hui, on a appris…</h2>
      <div class="grid">${cards.map((c, i) => `<div class="it" id="recap-it${i}">${esc(c.word)}<small>${esc(c.mean)}</small></div>`).join('')}</div>
    </div>
  </div>
  <script>
  (function(){
    const TOTAL=${TOTAL}, RECAP=${f(RECAP)};
    const WORDS=${JSON.stringify(words.map(w => ({ id: w.id, s: +f(w.s), e: +f(w.e), v: w.v, who: w.who, n: w.t.length })))};
    const TURNS=${JSON.stringify(turns.map(t => ({ who: t.who, s: +f(t.s), e: +f(t.e) })))};
    const CARDS=${JSON.stringify(cards.map(c => ({ s: +f(c.s), d: +f(c.d) })))};
    const SUBS=${JSON.stringify(chunks.map(c => ({ s: +f(c.show), d: +f(c.hide - c.show) })))};
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
    TURNS.forEach(t=>{
      const c='#talk-'+t.who, n='#name-'+t.who;
      tl.to(n,{opacity:1,y:-6,duration:.25},t.s-.2);
      tl.to(c+' .head',{rotation:3,duration:.5,ease:'sine.out'},t.s-.2);
      tl.to(n,{opacity:0,y:0,duration:.25},t.e+.15);
      tl.to(c+' .head',{rotation:0,duration:.5},t.e+.15);
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

    // ---- vocab cards ----
    CARDS.forEach((c,i)=>{
      const el='#card'+i+' .card';
      tl.fromTo(el,{y:-80,opacity:0,rotation:3},{y:0,opacity:1,rotation:-1.5,duration:.5,ease:'back.out(1.7)'},c.s);
      tl.fromTo('#card'+i+' .ex',{opacity:0,y:10},{opacity:1,y:0,duration:.4},c.s+.5);
      tl.to(el,{y:-50,opacity:0,duration:.3,ease:'power2.in'},c.s+c.d-.35);
    });

    // ---- recap ----
    tl.fromTo('#recap',{opacity:0},{opacity:1,duration:.5},RECAP);
    tl.fromTo('#recap-title',{y:30,opacity:0},{y:0,opacity:1,duration:.6,ease:'back.out(2)'},RECAP+.2);
    q('#recap .it').forEach((it,i)=>tl.fromTo(it,{y:30,opacity:0},{y:0,opacity:1,duration:.4,ease:'back.out(2)'},RECAP+.7+i*.35));

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
console.log(`built: ${chunks.length} subtitle chunks, ${words.length} words, ${cards.length} cards, ${turns.length} turns, total ${TOTAL}s`);
