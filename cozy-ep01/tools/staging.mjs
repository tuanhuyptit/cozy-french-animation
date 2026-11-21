// Staging = how the two characters are placed and move. One build engine (build.mjs) + one block per staging here,
// so each staging can be changed without touching the other. The staging comes from the scene:
//   sit  = Léa & Mathieu at a table (every "table" scene)
//   walk = they walk side by side in the middle, the background scrolls (scenes with walk:true in the demo, e.g. promenade)
// Art + seek-safe motion for both live in ../demo-animation-style.html (GEST-RUNTIME, WALK-RUNTIME blocks).
//
// Each block gives build.mjs:
//   css          layout of the characters + name tags
//   base, corner where the characters shrink to while an explanation board is up (x/y offset + scale)
//   sway, sips   body sway while talking / coffee sips while listening (sit only)
//   talkPool     random talking gestures (txt = words in the window, isQ = the sentence is a question)
//   autoActs     extra gestures triggered by phrases (on top of the shared wave / count / shrug / scratch)
//   plan(ctx)    staging-specific timing (walk: head turns, camera pans, listener hand-in-pocket); returns data for runtime()
//   runtime(d)   JS inserted into the composition script
const TU = /[ "«](tu|toi|te|ton|ta|tes|t'\S*)[ ,.?!]/;

export const STAGING = {
  sit: {
    css: `
    .charBox{position:absolute;top:290px;width:360px;height:480px;transform:scale(1.22);transform-origin:50% 90%}
    #talk-lea{left:300px} #talk-mat{left:1235px}
    #name-lea{left:428px} #name-mat{left:1340px}`,
    base: 1.22, corner: { lea: { x: -330, y: 338, s: 0.7 }, mat: { x: 355, y: 338, s: 0.7 } },
    sway: true, sips: true,
    talkPool(txt, isQ) {
      const p = ['beat', 'beat', 'palm', 'palm', 'up', 'point'];
      if (TU.test(txt)) p.push('point', 'point');
      if (isQ) p.push('think', 'think', 'think');
      return p;
    },
    autoActs: {},
    // camera: the whole world (#talk-world = scene + board + characters + name tags) is moved like a camera.
    // Shots: W wide · M two-shot (×1.16) · lean towards the speaker (×1.42) · close on the speaker (×1.9, head + shoulders). Changes only on a subtitle start,
    // close/lean shots start on a speaker change and pull out when the other person answers.
    // Always wide: first 5 s, explanation boards, recap. No close/lean while a vocab card / bubble / listener emote is up.
    // Every hold drifts slowly (+2.5 % zoom) so the frame is never frozen. episode.json "camera": false → old slow push.
    plan({ chunks, turns, cards, bubs, sessions, emotes, EMO_D, BUB_D, RECAP, mulberry32, camera }) {
      if (camera === false) return {};
      const W = 1920, H = 1080, MOVE = 1.1;
      const pose = (s, fx, fy, sx, sy) => ({ s, x: Math.min(0, Math.max(W - s * W, sx - s * fx)), y: Math.min(0, Math.max(H - s * H, sy - s * fy)) });
      const SHOT = {
        W: { s: 1, x: 0, y: 0 },
        M: pose(1.16, 960, 470, 960, 500),
        leanlea: pose(1.42, 640, 400, 860, 460), leanmat: pose(1.42, 1270, 400, 1060, 460),
        closelea: pose(1.9, 497, 335, 800, 330), closemat: pose(1.9, 1388, 335, 1120, 330),   // head + shoulders, face on the thirds line
      };
      const drift = p => { const s2 = p.s * 1.025, cx = (W / 2 - p.x) / p.s, cy = (H * 0.45 - p.y) / p.s;
        return { s: s2, x: Math.min(0, Math.max(W - s2 * W, W / 2 - s2 * cx)), y: Math.min(0, Math.max(H - s2 * H, H * 0.45 - s2 * cy)) }; };
      const R = mulberry32(31);
      // forced-wide windows → free intervals between them
      const wide = [[0, 5], ...sessions.map(ss => [ss.s - 0.5 - MOVE, ss.e + 0.8]), [RECAP - 0.6 - MOVE, 1e9]].sort((a, b) => a[0] - b[0]);
      const busy = [...cards.filter(c => !c.hidden).map(c => [c.s - 1.2, c.s + c.d + 0.3, null]),
        ...bubs.map(b => [b.t - 1.2, b.t + BUB_D + 0.3, null]), ...emotes.map(e => [e.t - 0.6, e.t + EMO_D, e.who])];
      const closeOK = (a, b, who) => !busy.some(([s, e, w]) => s < b && e > a && (w === null || w !== who));
      const starts = chunks.map(c => c.s);
      const shots = [];                               // { t: move start, k: shot }
      let free = 0;
      wide.forEach(([ws, we]) => {
        const A = free, B = ws; free = Math.max(free, we);
        if (B - A < 12) return;
        // 1) close / lean shots first: a speaker change opening a turn of ≥ 7 s, cut short before a card/bubble/listener emote
        const closes = []; let lastEnd = A + 4;
        turns.forEach(t => {
          if (t.s < lastEnd + 10 || t.s > B - 8) return;
          let end = Math.min(t.e, t.s + 18, B - 2);
          const hit = busy.filter(([s, e, w]) => s < end + MOVE && e > t.s - 0.2 && (w === null || w !== t.who)).map(x => x[0]);
          if (hit.length) end = Math.min(end, Math.min(...hit) - MOVE);
          if (end - t.s < 7 || R() > 0.7) return;
          const nextStart = starts.find(p => p >= end - 0.05 && p <= B) ?? end;   // pull out on the next subtitle (usually the answer)
          closes.push({ s: t.s, e: Math.min(nextStart, B - 2), k: (R() < 0.75 ? 'close' : 'lean') + t.who }); lastEnd = nextStart;
        });
        // 2) fill everything else with wide ↔ two-shot, changing on a subtitle start every 10–22 s
        let lastTwo = 'W';
        const fill = (a, b, first) => {
          let cur = first, curT = a, hold = 10 + R() * 12;
          if (first !== 'W' || a > A) shots.push({ t: a - 0.15, k: first });
          for (const p of starts) {
            if (p < a + 6 || p > b - 6 || p - curT < hold) continue;
            cur = cur === 'W' ? 'M' : 'W'; shots.push({ t: p - 0.15, k: cur }); curT = p; hold = 10 + R() * 12;
          }
          lastTwo = cur;
        };
        let pos = A, first = 'W';
        closes.forEach(c => { if (c.s - pos > 0.5) fill(pos, c.s, first); shots.push({ t: c.s - 0.15, k: c.k }); pos = c.e; first = lastTwo === 'W' ? 'M' : 'W'; });
        if (B - pos > 7) fill(pos, B, first); else if (closes.length || first !== 'W') shots.push({ t: Math.min(pos, B) - 0.15, k: 'W' });
        if (shots.length && shots[shots.length - 1].k !== 'W') shots.push({ t: B, k: 'W' });
      });
      // keyframes: a move (MOVE s, power2.inOut) then a slow drift until the next move
      const keys = []; let from = SHOT.W, t0 = 0;
      const all = [{ t: 0, k: 'W' }, ...shots];
      all.forEach((sh, i) => {
        const to = SHOT[sh.k], nextT = i + 1 < all.length ? all[i + 1].t : RECAP;   // last drift stops when the recap covers the frame
        const mv = i ? Math.min(MOVE, nextT - sh.t) : 0;
        if (mv) keys.push({ t: sh.t, d: mv, a: from, b: to, e: 'power2.inOut' });
        const dr = drift(to), dd = nextT - sh.t - mv;
        if (dd > 0.2) { keys.push({ t: sh.t + mv, d: dd, a: to, b: dr, e: 'sine.inOut' }); from = dr; } else from = to;
      });
      return { cam: keys, camShots: shots };
    },
    runtime: (d, f) => !d.cam ? '' : `
    // ---- camera (tools/staging.mjs sit.plan) ----
    const CAM=${JSON.stringify(d.cam.map(k => [+f(k.t), +f(k.d), +k.a.s.toFixed(4), +k.a.x.toFixed(1), +k.a.y.toFixed(1), +k.b.s.toFixed(4), +k.b.x.toFixed(1), +k.b.y.toFixed(1), k.e]))};
    tl.set('#talk-world',{transformOrigin:'0 0',x:0,y:0,scale:1},0);
    CAM.forEach(([t,d,s0,x0,y0,s1,x1,y1,e])=>tl.fromTo('#talk-world',{scale:s0,x:x0,y:y0},{scale:s1,x:x1,y:y1,duration:d,ease:e,immediateRender:false},t));`,
  },

  walk: {
    // pair centred, Léa (behind, z above so her forward gestures are not hidden by Mathieu) + Mathieu in front.
    // Name tags live inside #talk-pair so they follow the camera pans.
    css: `
    .charBox{position:absolute;top:221px;width:360px;height:480px;transform:scale(1.05);transform-origin:50% 90%}
    #talk-lea{left:620px;z-index:2} #talk-mat{left:940px;z-index:1}
    #talk-scene svg.bg{overflow:visible}
    .nameTag{top:188px} #name-lea{left:768px} #name-mat{left:1056px}`,
    base: 1.05, corner: { lea: { x: -650, y: 300, s: 0.55 }, mat: { x: 650, y: 300, s: 0.55 } },
    sway: false, sips: false,
    talkPool(txt, isQ) {
      const p = ['explain', 'explain', 'pince', 'bof', 'regarde', 'pouce', 'coeur', 'menton'];
      if (TU.test(txt)) p.push('explain', 'pince');
      if (isQ) p.push('menton', 'menton', 'menton');
      return p;
    },
    autoActs: {
      regarde: ['regarde', 'regardez', 'là-bas', 'tiens', 'tu vois'],
      pouce: ['génial', 'super', 'parfait', 'excellent', 'trop bien', 'bravo', 'top', 'cool'],
      coeur: ["j'adore", 'merci', 'pour moi', 'franchement', 'sincèrement', 'moi je'],
      grand: ['énorme', 'incroyable', 'immense', 'gigantesque', 'plein de monde', 'tellement de'],
      pince: ['exactement', 'précisément', 'justement', "c'est ça", 'surtout'],
      menton: ['je me demande', 'je réfléchis', 'bonne question'],
    },
    // ctx: { chunks, turns, gests, cards, bubs, sessions, emotes, EMO_D, BUB_D, mulberry32 }
    plan({ turns, gests, cards, bubs, emotes, EMO_D, BUB_D, mulberry32 }) {
      // 1) Mathieu walks in front and watches the road; he turns his head back to Léa only while he talks
      //    (his turns closer than 1.5 s are merged so the head does not flip back and forth)
      const looks = [];
      turns.filter(t => t.who === 'mat').forEach(t => { const l = looks[looks.length - 1]; if (l && t.s - l.e < 1.5) l.e = t.e; else looks.push({ s: t.s, e: t.e }); });
      gests.forEach(g => { if (g.who === 'mat' && (g.pose === 'rire' || g.pose === 'menton') && looks.some(l => g.t >= l.s - 0.3 && g.t <= l.e + 0.3)) g.pose += 'T'; });
      // 2) listener puts a hand in the pocket now and then (instead of the coffee sip)
      const pR = mulberry32(77);
      ['lea', 'mat'].forEach(who => {
        let next = 8 + pR() * 12;
        turns.filter(t => t.who !== who && t.e - t.s >= 5).forEach(t => {
          const st = t.s + 0.6, d = Math.min(4 + pR() * 2, t.e - st - 0.4);
          if (st < next || d < 2) return;
          if (emotes.some(e => e.who === who && e.t < st + d && e.t + EMO_D > st)) return;
          gests.push({ who, pose: 'poche', t: +st.toFixed(3), d: +d.toFixed(3), b: [] }); next = st + 25 + pR() * 25;
        });
      });
      gests.sort((x, y) => x.t - y.t);
      // 3) camera pans: each vocab card / illustration bubble drops on the far side while the pair slides the other way.
      //    Items less than 2.5 s apart share one pan (same side); sides alternate between pans.
      const items = [...cards.filter(c => !c.hidden).map(c => ({ kind: 'card', ref: c, s: c.s, e: c.s + c.d })),
        ...bubs.map(b => ({ kind: 'bub', ref: b, s: b.t, e: b.t + BUB_D }))].sort((x, y) => x.s - y.s);
      const pans = [];
      items.forEach(it => { const p = pans[pans.length - 1]; if (p && it.s - p.e < 2.5) { p.e = Math.max(p.e, it.e); p.items.push(it); } else pans.push({ s: it.s, e: it.e, items: [it] }); });
      pans.forEach((p, k) => {
        p.dir = k % 2 ? 1 : -1;                       // -1: pair slides left, item on the right
        p.items.forEach((it, j) => { it.ref.dir = p.dir; it.ref.fade = j < p.items.length - 1; it.ref.side = p.dir < 0 ? 'lea' : 'mat'; });
      });
      return { looks, pans: pans.map(p => ({ s: p.s - 0.15, e: p.e, dir: p.dir })) };
    },
    runtime: (d, f) => `
    const LOOKS=${JSON.stringify(d.looks.map(l => ({ s: +f(l.s), e: +f(l.e) })))}, PANS=${JSON.stringify(d.pans.map(p => ({ s: +f(p.s), e: +f(p.e), dir: p.dir })))};
    ['#talk-lea','#talk-mat'].forEach((c,i)=>{ walkSetup(tl,c); walkTL(tl,c,i*.21,TOTAL); });
    LOOKS.forEach(l=>walkLookTL(tl,'#talk-mat',l.s,l.e));
    PANS.forEach(p=>walkPanTL(tl,'#talk-pair',p.s,p.e,p.dir));`,
  },
};
