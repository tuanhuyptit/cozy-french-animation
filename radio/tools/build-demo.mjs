// Builds radio/radio-demo.html — a gallery of every Cozy French Radio scene with Léa in it.
// Usage: node radio/tools/build-demo.mjs
// Léa (all outfits) + pencil filter + fabric patterns are read from ../demo-animation-style.html,
// exactly like cozy-epNN/tools/build.mjs does for the main channel.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { SCENES, PHONES, SCENE_CSS } from '../scenes.mjs';

const RADIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.resolve(RADIO, '../demo-animation-style.html'), 'utf8');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
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
  this.leaSVG=leaSVG; this.OUT_LEA=OUT_LEA; this.GEST_ELBOW=GEST_ELBOW;`, sandbox);
// hand-gesture runtime of the main channel (gsap only, deterministic) — copied verbatim into the demo
const GEST_RUNTIME = src.slice(src.indexOf('/* GEST-RUNTIME-START'), src.indexOf('/* GEST-RUNTIME-END */'));
const DEFS = src.slice(src.indexOf('<svg width="0" height="0"'), src.indexOf('</defs></svg>') + '</defs></svg>'.length);
const OUTFITS = Object.keys(sandbox.OUT_LEA);
const lea = (outfit, phones) => {
  let s = sandbox.leaSVG(outfit, false).replace(/<div class="name">[^<]*<\/div>/, '');
  return phones ? s.replace('<g class="fx">', PHONES + '<g class="fx">') : s;
};
const LEA = {};
for (const o of OUTFITS) LEA[o] = { p: lea(o, true), n: lea(o, false) };

const LINES = {
  studio: [["Bonsoir, ici Léa, et vous écoutez Cozy French Radio.", "Good evening, this is Léa, and you're listening to Cozy French Radio.", ["Bonsoir,"]],
           ["Ce soir, on parle d'une chose difficile : apprendre à dire non.", "Tonight, we talk about something hard: learning to say no.", ["difficile"]]],
  grenier: [["Prenez votre thé, installez-vous confortablement…", "Grab your tea, get comfortable…", ["installez-vous"]],
            ["Moi, pendant des années, j'ai dit oui à tout le monde.", "For years, I said yes to everyone.", ["pendant"]]],
  matin: [["Bonjour ! Aujourd'hui, on parle de petites habitudes.", "Good morning! Today, we talk about small habits.", ["habitudes."]],
          ["Un café, cinq minutes de calme, et la journée commence bien.", "A coffee, five quiet minutes, and the day starts well.", ["calme,"]]],
  train: [["Je vous parle depuis le train, entre Paris et Lyon.", "I'm talking to you from the train, between Paris and Lyon.", ["depuis"]],
          ["Parfois, changer de paysage aide à changer d'idée.", "Sometimes, a change of scenery helps you change your mind.", ["paysage"]]],
  cheminee: [["Il neige dehors, alors restons au chaud ensemble.", "It's snowing outside, so let's stay warm together.", ["chaud"]],
             ["Ce soir, je voudrais vous parler de la patience.", "Tonight, I'd like to talk to you about patience.", ["patience."]]],
  tsf: [["Bienvenue dans la deuxième partie : le mot du jour.", "Welcome to the second part: the word of the day.", ["deuxième"]],
        ["Restez avec moi, on continue tout de suite.", "Stay with me, we'll carry on right away.", ["Restez"]]],
  polaroid: [["J'ai enfin osé dire non à mon chef.", "I finally dared to say no to my boss.", ["osé"]],
             ["Oser, c'est faire quelque chose malgré la peur.", "To dare is to do something despite fear.", ["malgré"]]],
  lettre: [["Je n'arrive pas à refuser quand mes amis me demandent un service.", "I can't refuse when my friends ask me for a favour.", ["refuser"]],
           ["Merci pour vos émissions, elles me donnent du courage.", "Thank you for your shows, they give me courage.", ["courage."]]],
  metro: [["Prochaine station : le courrier des auditeurs.", "Next stop: the listeners' mail.", ["Prochaine"]],
          ["Avancer, même lentement, c'est toujours avancer.", "Moving forward, even slowly, is still moving forward.", ["lentement,"]]],
  journal: [["Dire non sans culpabiliser : c'est possible !", "Saying no without feeling guilty: it's possible!", ["culpabiliser"]],
            ["Ce soir, Léa vous explique comment poser ses limites.", "Tonight, Léa explains how to set your boundaries.", ["limites."]]],
  carnet: [["Oser dire non, c'est aussi se dire oui à soi-même.", "Daring to say no is also saying yes to yourself.", ["Oser"]],
           ["Et vous, quand avez-vous osé dire non pour la dernière fois ?", "And you, when did you last dare to say no?", ["osé"]]],
};

const frame = (id, S) => `
<section id="s-${id}"><h2><span>${S.kind === 'host' ? 'Cảnh dẫn' : 'Cảnh chuyển'}</span>${S.label} <code>${id}</code></h2>
<div class="wrap"><div class="frame">
 <svg class="bg" viewBox="0 0 1920 1080">${S.bg()}</svg>
 <div class="char" id="lea-${id}" data-gest="${(S.gest || []).join(',')}" data-phones="${S.phones ? 1 : 0}" data-outfit="${S.outfit}" style="left:${S.lea.x}px;top:${S.lea.y}px;transform:scale(${S.lea.s})${S.lea.clip ? `;clip-path:${S.lea.clip}` : ''}">${LEA[S.outfit][S.phones ? 'p' : 'n']}</div>
 <svg class="fg" viewBox="0 0 1920 1080">${S.fg()}</svg>
 ${S.html ? S.html() : ''}
 <div class="brandR ${S.brand}"><span class="dot"></span><b>Cozy French</b> <em>Radio</em><small>${S.tag}</small></div>
 <div class="${S.sub === 'kin' ? 'kin ' + (S.kin?.cls || '') : 'subR ' + S.sub}"${S.kin ? ` style="left:${S.kin.x}px;top:${S.kin.y}px;width:${S.kin.w}px"` : ''}><div class="fr" data-k="${id}"></div><div class="en"></div></div>
 <div class="grain"></div>
</div></div>
<p class="info">Trang phục mặc định: <b>${S.outfit}</b>${S.phones ? ' · có tai nghe' : ''} · phụ đề kiểu <b>${S.sub}</b></p></section>`;

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cozy French Radio — cảnh</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Nunito:wght@500;700;800&family=Caveat:wght@600&display=swap" rel="stylesheet">
<style>
:root{--ink:#3a2e28;--terra:#d9774b;--butter:#f3c96b;--paper:#fffaf0;--muted:#8a7a6c}
*{box-sizing:border-box} body{margin:0;background:#1e1a17;color:#efe4d6;font-family:Nunito,system-ui,sans-serif}
header{max-width:1240px;margin:0 auto;padding:40px 16px 0} h1{font:700 42px 'Playfair Display';margin:0 0 8px;color:#fffaf0} h1 em{color:var(--terra)}
header p{color:#c9bcae;font-size:17px;max-width:820px;line-height:1.5}
nav{position:sticky;top:0;z-index:5;background:#1e1a17f2;padding:12px 16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;border-bottom:1px solid #3a302a}
nav a,nav select{font:800 14px Nunito;border:0;border-radius:20px;padding:8px 14px;background:#f6eddc;color:#3a2e28;text-decoration:none;cursor:pointer}
nav label{display:flex;gap:6px;align-items:center;font:800 14px Nunito;color:#cbbfb3}
section{max-width:1240px;margin:0 auto;padding:28px 16px 18px}
h2{font:700 30px 'Playfair Display';margin:0 0 12px;color:#fffaf0} h2 span{color:var(--butter);font:800 14px Nunito;letter-spacing:.1em;text-transform:uppercase;margin-right:12px;vertical-align:middle}
h2 code{font:700 15px ui-monospace,monospace;color:#a89888;margin-left:8px}
.info{color:#a89888;font-size:15px;margin:10px 0 0}
.wrap{position:relative;width:100%;aspect-ratio:16/9;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px #0008}
.frame{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden;background:#f3e3c8}
.frame svg.bg,.frame svg.fg{position:absolute;inset:0;width:1920px;height:1080px}
.grain{position:absolute;inset:0;pointer-events:none;opacity:.2;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .15  0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.char{position:absolute;width:360px;height:480px;transform-origin:0 0}
.char svg{position:absolute;inset:0;width:360px;height:480px;overflow:visible}
.char .eye,.char .mouth,.char .head,.char .breath{transform-box:fill-box}
.char .eye{transform-origin:center;animation:blink 4.2s infinite}
.char .mouth{transform-origin:center;animation:talk 1.3s infinite}
.char .breath{animation:breath 3.6s ease-in-out infinite}
.char .head{transform-origin:50% 100%;animation:nod 5s ease-in-out infinite}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes talk{0%,100%{transform:scaleY(1)}10%{transform:scaleY(3.2)}22%{transform:scaleY(1.4)}34%{transform:scaleY(3.8)}46%{transform:scaleY(1)}58%{transform:scaleY(2.6)}70%{transform:scaleY(4)}84%{transform:scaleY(1.6)}}
@keyframes breath{50%{transform:translateY(2px)}}
@keyframes nod{0%,100%{transform:rotate(0)}30%{transform:rotate(-2deg)}60%{transform:rotate(1.5deg)}}
${SCENE_CSS}
.brandR{position:absolute;left:48px;top:40px;background:#2a2220e6;color:#fffaf0;border-radius:22px;padding:14px 26px 12px;font:700 34px 'Playfair Display'}
.brandR em{color:var(--butter);font-style:italic} .brandR small{display:block;font:800 20px Nunito;color:#c9bcae;letter-spacing:.04em;margin-top:2px}
.brandR .dot{display:inline-block;width:16px;height:16px;border-radius:50%;background:#e8664f;margin-right:10px;vertical-align:middle;animation:dot 1.6s infinite} @keyframes dot{50%{opacity:.3}}
.brandR.light{background:#fffaf0e8;color:var(--ink)} .brandR.light em{color:var(--terra)} .brandR.light small{color:var(--muted)}
.brandR.flat{background:none;color:var(--ink);left:180px} .brandR.flat em{color:var(--terra)} .brandR.flat small{color:var(--muted)}
.subR{position:absolute;left:50%;bottom:60px;transform:translateX(-50%);width:1300px;background:#fffaf0f2;border-radius:28px;padding:24px 44px;text-align:center;box-shadow:0 10px 0 #00000022}
.subR .fr{font:800 48px Nunito;line-height:1.25;color:#c4b5a6} .subR .en{font:600 26px Nunito;color:var(--muted);margin-top:8px}
.subR.dark{bottom:40px;width:1100px;background:#3a2e28d9} .subR.dark .fr{color:#8d7f72} .subR.dark .w.on{color:#fffaf0} .subR.dark .en{color:#e4d5c3}
.w{display:inline-block;position:relative;transition:color .12s} .w.on{color:var(--ink)} .w.vocab.on{color:var(--terra)!important}
.w.vocab::after{content:"";position:absolute;left:0;right:0;bottom:4px;height:10px;background:var(--butter);z-index:-1;border-radius:6px;transform:scaleX(0);transform-origin:left;transition:transform .35s}
.w.vocab.on::after{transform:scaleX(1)}
.kin{position:absolute;left:990px;top:250px;width:820px}
.kin .fr{font:700 66px/1.18 'Playfair Display';color:#cdbfae} .kin .w.on{color:var(--ink)} .kin .en{font:700 28px Nunito;color:var(--muted);margin-top:22px}
.kin.hand .fr{font:600 76px/1.08 Caveat;color:#c9b8a4} .kin.hand .w.vocab::after{bottom:10px}
.kin.light .fr{color:#9c8676} .kin.light .w.on{color:#fffaf0} .kin.light .en{color:#e6d3bd}
.mot{position:absolute;left:960px;top:150px;color:var(--ink)} .mot span{display:inline-block;font:800 20px Nunito;letter-spacing:.12em;text-transform:uppercase;background:var(--ink);color:var(--butter);padding:6px 16px;border-radius:20px}
.mot b{display:block;font:700 150px/1 'Playfair Display';color:#b8552a;margin-top:18px} .mot i{display:block;font:700 30px Nunito;font-style:normal;color:var(--muted);margin-top:10px}
.letterhead{position:absolute;left:940px;top:170px;font:600 58px Caveat;color:#8a5e42} .sign{position:absolute;left:1430px;top:790px;font:600 46px Caveat;color:#8a5e42}
.note{position:absolute;right:90px;top:60px;width:330px;background:var(--butter);padding:22px 28px;transform:rotate(3deg);box-shadow:0 10px 0 #0000001c;color:var(--ink)}
.note span{font:800 18px Nunito;letter-spacing:.1em;text-transform:uppercase} .note b{display:block;font:700 56px 'Playfair Display';color:#b8552a} .note i{font-style:normal;font-weight:700;font-size:22px}
</style></head><body>
${DEFS}
<header><h1>Cozy French <em>Radio</em> — thư viện cảnh</h1>
<p>${Object.keys(SCENES).length} cảnh, Léa dùng đúng rig của kênh chính. Cảnh dẫn dùng cho phần "Le thème" và đổi luân phiên giữa các tập; cảnh chuyển (Carnet) chen vào lúc đổi phần và "Le mot du jour". Chuyển động ở đây là bản mô phỏng.</p></header>
<nav>${Object.entries(SCENES).map(([id, S]) => `<a href="#s-${id}">${S.label}</a>`).join('')}
 <label>Trang phục Léa <select id="outfit"><option value="">mặc định từng cảnh</option>${OUTFITS.map(o => `<option>${o}</option>`).join('')}</select></label></nav>
${Object.entries(SCENES).map(([id, S]) => frame(id, S)).join('')}
<div style="height:60px"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
const GEST_ELBOW=${JSON.stringify(sandbox.GEST_ELBOW)};
${GEST_RUNTIME}
/* demo loop: Léa's free arm cycles through the scene's gestures (default list below), like the main channel */
const DEFAULT_GEST=['palm','up','count','think','beat','shrug','wave'];
function animateHands(el){
  if(el._tl) el._tl.kill();
  const c='#'+el.id, list=el.dataset.gest?el.dataset.gest.split(','):DEFAULT_GEST, tl=gsap.timeline({repeat:-1});
  tl.set(c+' .gest',{svgOrigin:'257 286',opacity:0},0); Object.keys(GEST_ELBOW).forEach(k=>tl.set(c+' .g-'+k+' .fore',{svgOrigin:GEST_ELBOW[k].join(' ')},0));
  let t=.8,i=0; while(t<26){ const p=list[i%list.length], d=p==='count'?3:2.4, b=[]; for(let x=t+.5;x<t+d-.4;x+=.38) b.push(x);
    gestTL(tl,c,{p,t,d,b}); t+=d+1.5; i++; }
  tl.set({},{},28); el._tl=tl;
}
document.querySelectorAll('.char').forEach(animateHands);
const LEA=${JSON.stringify(LEA)}, LINES=${JSON.stringify(LINES)};
function fit(){document.querySelectorAll('.wrap').forEach(w=>{w.querySelector('.frame').style.transform='scale('+(w.clientWidth/1920)+')'})}
addEventListener('resize',fit);fit();
document.getElementById('outfit').onchange=e=>document.querySelectorAll('.char').forEach(c=>{const o=e.target.value||c.dataset.outfit;c.innerHTML=LEA[o][c.dataset.phones==='1'?'p':'n'];animateHands(c)});
document.querySelectorAll('[data-k]').forEach(el=>{const L=LINES[el.dataset.k],en=el.parentNode.querySelector('.en');let li=0;
 function play(){const [fr,tr,voc]=L[li%L.length];el.innerHTML=fr.split(' ').map(w=>'<span class="w'+(voc.includes(w)?' vocab':'')+'">'+w+'</span>').join(' ');en.textContent=tr;
  const ws=[...el.querySelectorAll('.w')];ws.forEach((w,i)=>setTimeout(()=>w.classList.add('on'),400+i*320));setTimeout(()=>{li++;play()},400+ws.length*320+1800)}
 play()});
</script></body></html>`;
fs.writeFileSync(path.join(RADIO, 'radio-demo.html'), html);
console.log(`radio-demo.html: ${Object.keys(SCENES).length} scenes, ${OUTFITS.length} outfits, ${(html.length / 1024).toFixed(0)} KB`);
