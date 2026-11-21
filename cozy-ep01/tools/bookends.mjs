// Channel outro (end screen) for The Cozy French. (An intro was tried on 2026-11-21 and dropped by the owner.)
//   outro  = 20 s after the recap, inside talk.html: the world turns into an end-screen page (title, two video slots for
//            YouTube end-screen elements, the logo where the Subscribe element goes) and Léa & Mathieu wave from the corners.
// build.mjs decides the timing (OUTRO = recap end) and wires these in; episode.json "outro": false turns it off.
// ---- outro / end screen (inside talk.html, under the characters) ----
// Video slots match YouTube's end-screen video element (≈ 1/3 width, 16:9); the logo sits where the Subscribe circle goes.
export const OUTRO_CSS = `
    #outro{position:absolute;inset:0;opacity:0}
    #o-page{position:absolute;inset:0;background:#f6eddc}
    #o-page:after{content:'';position:absolute;inset:26px;border:4px dashed #d9c3a3;border-radius:34px}
    #o-title{position:absolute;left:0;right:0;top:62px;text-align:center;font:700 86px 'Playfair Display',serif;color:#b8552a;margin:0}
    #o-sub{position:absolute;left:0;right:0;top:178px;text-align:center;font:700 36px Nunito;color:#3a2e28;margin:0}
    .o-slot{position:absolute;top:262px;width:620px}
    .o-tag{display:inline-block;font:800 26px Nunito;color:#3a2e28;background:#f3c96b;border:4px solid #3a2e28;border-radius:26px;padding:4px 18px;margin:0 0 14px 6px;transform:rotate(-1.5deg)}
    .o-frame{position:relative;width:620px;height:349px;border:5px solid #3a2e28;border-radius:24px;box-shadow:0 12px 0 #0000001a;
      background:repeating-linear-gradient(135deg,#efe0c6 0 22px,#ead9bc 22px 44px)}
    .o-frame:after{content:'';position:absolute;left:50%;top:50%;width:0;height:0;margin:-34px 0 0 -22px;border-style:solid;border-width:34px 0 34px 56px;border-color:transparent transparent transparent #3a2e2833}
    #o-logo{position:absolute;left:855px;top:688px;width:210px;height:210px;filter:drop-shadow(0 8px 0 #0000001c)}
    #o-sub2{position:absolute;left:0;right:0;top:912px;text-align:center;font:700 44px 'Playfair Display',serif;color:#3a2e28}
    #o-sub2 small{display:block;font:700 26px Nunito;color:#6f5f52;margin-top:2px}`;
export const OUTRO_HTML = logo => `
      <div id="outro" data-layout-ignore>
        <div id="o-page"></div>
        <h2 id="o-title">Merci d'avoir écouté !</h2>
        <p id="o-sub">Thanks for listening — à demain !</p>
        <div class="o-slot" id="o-v1" style="left:300px"><span class="o-tag">▶ Prochain épisode</span><div class="o-frame"></div></div>
        <div class="o-slot" id="o-v2" style="left:1000px"><span class="o-tag">▶ À écouter aussi</span><div class="o-frame"></div></div>
        <img id="o-logo" src="${logo}" alt="">
        <div id="o-sub2">Abonnez-vous !<small>A new slow French episode every day</small></div>
      </div>`;
// needs CORNER, gestTL, tl in scope (talk.html runtime); OUT = outro start, RECAP = recap start (the recap covers the swap)
export const outroRuntime = ({ OUT, RECAP, D, walk }) => `
    // ---- outro / end screen (tools/bookends.mjs) ----
    { const OUT=${OUT}, SW=${RECAP}+.3, WAVE='${walk ? 'pouce' : 'wave'}';
      tl.set('#talk-world',{scale:1,x:0,y:0},SW);
      tl.set('#talk-badge',{opacity:0},SW);
      tl.set('#outro',{opacity:1},SW);
      ['lea','mat'].forEach(w=>tl.set('#talk-'+w,{x:CORNER[w].x,y:CORNER[w].y,scale:CORNER[w].s,transformOrigin:'50% 90%'},SW));
      tl.to('#recap',{opacity:0,duration:.5,ease:'power1.in'},OUT);
      tl.fromTo('#o-title',{y:-40,opacity:0},{y:0,opacity:1,duration:.55,ease:'back.out(1.8)'},OUT+.3);
      tl.fromTo('#o-sub',{opacity:0},{opacity:1,duration:.4},OUT+.6);
      tl.fromTo('#o-v1',{y:60,opacity:0,rotation:-2},{y:0,opacity:1,rotation:0,duration:.5,ease:'back.out(1.6)'},OUT+.85);
      tl.fromTo('#o-v2',{y:60,opacity:0,rotation:2},{y:0,opacity:1,rotation:0,duration:.5,ease:'back.out(1.6)'},OUT+1.1);
      tl.fromTo('#o-logo',{scale:2,rotation:-30,opacity:0},{scale:1,rotation:0,opacity:1,duration:.4,ease:'back.out(1.6)'},OUT+1.55);
      tl.fromTo('#o-sub2',{y:24,opacity:0},{y:0,opacity:1,duration:.4,ease:'power2.out'},OUT+1.95);
      tl.fromTo('#o-logo',{rotation:0},{rotation:4,duration:1.6,yoyo:true,repeat:Math.floor((${D}-3)/1.6),ease:'sine.inOut',immediateRender:false},OUT+2.2);
      [['lea',.9],['mat',1.5],['lea',8.5],['mat',9.3],['lea',15.5],['mat',16.1]].forEach(([w,t])=>gestTL(tl,'#talk-'+w,{p:WAVE,t:OUT+t,d:2.4,b:[]}));
    }`;
