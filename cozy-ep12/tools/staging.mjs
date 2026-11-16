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
    plan: () => ({}),
    runtime: () => '',
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
