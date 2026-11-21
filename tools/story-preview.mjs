// Try story cutaways (episode.json "stories", engine in cozy-ep01/tools/story.mjs) on a real stretch of an episode
// without building the whole 20 minutes: cuts the voice + chunks, builds with the real cozy-ep01/tools/build.mjs.
//
// Usage (repo root):
//   node tools/story-preview.mjs [preset] [--snapshot] [--preview]
//   presets: intro (ep17 first 2 min, the "hook" density) · guitar (ep17 Mathieu's guitar story)
// Chunk numbers in the presets are the episode's own (as in its episode.json); the tool shifts them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(REPO, 'cozy-ep01'), DIR = path.join(REPO, 'story-preview');
const args = process.argv.slice(2), flag = k => args.includes('--' + k);

const PRESETS = {
  intro: { ep: 'cozy-ep17', c: [0, 64], stories: [
    { c: [1, 5], place: 'papier', beats: [
      { c: 1, w: 'Bienvenue', do: 'title', text: 'The Cozy French', sub: 'votre petit rendez-vous du français', y: 300 },
      { c: 4, w: 'conversations', do: 'icons', y: 620, items: [{ icon: 'amis', label: 'conversations', c: 4, w: 'conversations' }, { icon: 'cafe', label: 'chaleureuses', c: 5, w: 'chaleureuses' }] },
    ] },
    { c: [10, 13], place: 'papier', beats: [
      { c: 10, do: 'icons', y: 380, items: [{ icon: 'famille', label: 'à la maison', c: 10, w: 'Que' }, { icon: 'voiture', label: 'dans les transports', c: 11, w: 'transports' }, { icon: 'cafe', label: 'votre café', c: 12, w: 'café' }] },
      { c: 13, w: 'installez', do: 'text', text: 'Installez-vous confortablement…', y: 650, size: 58, color: '#b8552a' },
    ] },
    { c: [19, 20], place: 'chambre', cast: [{ id: 'm', who: 'mat', x: 760 }], beats: [
      { c: 19, w: 'lundi', do: 'calendar', labels: ['LUN', 'MAR', 'MER', 'JEU', 'VEN'], d: 2.4, x: 1650, y: 330 },
      { c: 19, w: 'lundi', do: 'face', on: 'm', face: 'star' }, { c: 19, w: 'lundi', do: 'bob', on: 'm', d: 2.6 },
      { c: 19, w: 'discipliné', do: 'stamp', text: 'Discipliné !', x: 1150, y: 260, color: '#6f8e6b' },
      { c: 20, w: 'vendredi', do: 'face', on: 'm', face: 'tired' }, { c: 20, w: 'vendredi', do: 'droop', on: 'm' }, { c: 20, w: 'vendredi', do: 'zzz', on: 'm', d: 2.5 },
    ] },
    { c: [23, 27], place: 'papier', beats: [
      { c: 23, do: 'list', title: 'Le lundi, je veux…', x: 680, y: 400, items: [
        { text: 'travailler efficacement', icon: 'travail', c: 24, w: 'travailler' }, { text: 'faire du sport', icon: 'sport', c: 24, w: 'sport' },
        { text: 'lire davantage', icon: 'lecture', c: 25, w: 'lire' }, { text: 'prendre soin de moi', icon: 'sante', c: 25, w: 'soin' }] },
      { c: 26, w: 'jours', do: 'battery', from: 100, to: 6, d: 3.4, x: 1460, y: 380, label: "l'enthousiasme" },
    ] },
    { c: [37, 48], place: 'bureau', cast: [{ id: 'm', who: 'mat', x: 640 }], beats: [
      { c: 37, w: 'semaines', do: 'calendar', labels: ['Sem. 1', 'Sem. 2'], d: 1, x: 1660, y: 250 },
      { c: 38, w: 'documents', do: 'pile', n: 8, d: 3.2, x: 1380, y: 600 },
      { c: 40, w: 'soir', do: 'sky', d: 3, n: 3 },
      { c: 41, w: 'rentre', do: 'face', on: 'm', face: 'tired' },
      { c: 42, w: 'petite', do: 'whisper', on: 'm', text: '« Tu as travaillé toute la journée… »', until: { c: 44 } },
      { c: 44, do: 'whisper', on: 'm', text: '« Fais ça demain. »', until: { c: 45 } },
      { c: 45, w: 'demain', do: 'face', on: 'm', face: 'wow' },
      { c: 45, w: 'demain', do: 'pile', n: 5, d: 1.4, x: 1380, y: 472 },
      { c: 47, w: 'argument', do: 'dream', icons: ['sommeil', 'telephone'], label: 'un nouvel argument !', x: 1250, y: 260 },
      { c: 48, w: 'créative', do: 'face', on: 'm', face: 'sad' },
    ] },
    { c: [51, 59], place: 'papier', beats: [
      { c: 51, w: 'discipline', do: 'title', text: 'La discipline mentale', y: 260, id: 't' },
      { c: 53, w: 'habitudes', do: 'icons', y: 580, id: 'i', items: [{ icon: 'b:calendar', label: 'nos habitudes', c: 53, w: 'habitudes' }, { icon: 'b:search', label: 'notre attention', c: 54, w: 'attention' }, { icon: 'b:question', label: 'nos décisions', c: 54, w: 'décisions' }] },
      { c: 57, w: 'travailler', do: 'hide', ids: ['i'] },
      { c: 57, w: 'travailler', do: 'text', text: 'travailler sans arrêt ?', y: 480, size: 60 },
      { c: 58, w: 'machines', do: 'text', text: 'devenir des machines ?', y: 570, size: 60 },
      { c: 59, w: 'Absolument', do: 'stamp', text: 'Absolument pas !', x: 960, y: 690 },
    ] },
  ], drop: [12, 24] },   // chunks whose illustration bubble falls inside a story
  map: { ep: 'cozy-ep17', c: [26, 36], stories: [
    { c: [28, 31], place: 'carte', beats: [
      { c: 28, w: 'beaucoup', do: 'map', title: 'beaucoup de personnes…', x: 900, y: 400, route: false, pins: [
        { city: 'Paris', c: 28, w: 'beaucoup' }, { city: 'Lille', c: 28, w: 'personnes' }, { city: 'Bordeaux', c: 29, w: 'connaissent' }, { city: 'Lyon', c: 29, w: 'cette' }, { city: 'Marseille', c: 29, w: 'situation' }] },
      { c: 30, w: 'programme', do: 'note', text: 'Un beau programme !', x: 1500, y: 300 },
      { c: 31, w: 'mal', do: 'stamp', text: 'Pas facile…', x: 1500, y: 520 },
    ] },
  ], drop: [] },
  guitar: { ep: 'cozy-ep17', c: [178, 216], stories: [
    { c: [184, 187], place: 'chambre', tag: 'Souvenir|Mathieu, étudiant', cast: [{ id: 'm', who: 'mat', x: 860, outfit: '#8fae8b' }], beats: [
      { c: 185, w: 'guitare', do: 'hold', on: 'm', prop: 'guitar' },
      { c: 186, w: 'tellement', do: 'face', on: 'm', face: 'star' }, { c: 186, w: 'tellement', do: 'burst', on: 'm' },
      { c: 186, w: 'tellement', do: 'bob', on: 'm', d: 4 }, { c: 186, w: 'tellement', do: 'work', on: 'm', d: 4 },
      { c: 187, w: 'tous', do: 'sky', d: 3.6, n: 4 },
      { c: 187, w: 'tous', do: 'calendar', labels: ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'], d: 3.6, x: 1730, y: 320 },
    ] },
    { c: [192, 204], place: 'chambre', tag: 'Souvenir|Mathieu, étudiant', cast: [{ id: 'm', who: 'mat', x: 860, outfit: '#8fae8b', face: 'flat' }], beats: [
      { c: 192, do: 'hold', on: 'm', prop: 'guitar' },
      { c: 192, w: 'relation', do: 'heart', label: '« C\'est compliqué »', x: 1180, y: 330, until: { c: 196 } },
      { c: 193, w: 'trois', do: 'icons', y: 300, items: [{ icon: 'Do', label: 'accord 1' }, { icon: 'Sol', label: 'accord 2' }, { icon: 'Ré', label: 'accord 3' }], until: { c: 197 } },
      { c: 196, do: 'calendar', labels: ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4'], d: 1.6, x: 1730, y: 320 },
      { c: 198, w: 'répéter', do: 'work', on: 'm', d: 3.6 }, { c: 198, w: 'répéter', do: 'count', labels: ['×1', '×2', '×5', '×10', '×50', '×99'], d: 3.6, x: 460, y: 300 },
      { c: 198, w: 'mêmes', do: 'face', on: 'm', face: 'tired' }, { c: 198, w: 'mêmes', do: 'band', on: 'm' }, { c: 198, w: 'mêmes', do: 'droop', on: 'm' },
      { c: 200, w: 'moins', do: 'stamp', text: 'En vrai', x: 600, y: 520 },
      { c: 201, w: 'imaginé', do: 'dream', icon: 'musique', label: 'Dans ma tête…', x: 1320, y: 290 },
    ] },
  ], drop: [185, 188, 193] },
};
const name = args.find(a => !a.startsWith('--')) || 'intro', PR = PRESETS[name];
if (!PR) { console.error(`unknown preset ${name} (have: ${Object.keys(PRESETS).join(', ')})`); process.exit(1); }
const SRC = path.join(REPO, PR.ep), [C0, C1] = PR.c;

const EP = JSON.parse(fs.readFileSync(path.join(SRC, 'episode.json'), 'utf8'));
const W = JSON.parse(fs.readFileSync(path.join(SRC, 'assets/words.json'), 'utf8'));
let wi = 0, vi = 0; const span = [];
EP.chunks.forEach(c => { const n = c.fr.replace(/[\[\]]/g, '').split(/[ \t\n]+/).length, nv = (c.fr.match(/\[/g) || []).length; span.push({ w0: wi, n, v0: vi, nv }); wi += n; vi += nv; });
const first = span[C0], last = span[C1];
const T0 = Math.max(0, +(W[first.w0].s - 0.4).toFixed(2)), T1 = +(W[last.w0 + last.n - 1].e + 0.6).toFixed(2);
const words = W.slice(first.w0, last.w0 + last.n).map(w => ({ ...w, s: +(w.s - T0).toFixed(2), e: +(w.e - T0).toFixed(2) }));
const chunks = EP.chunks.slice(C0, C1 + 1).map((c, k) => { const o = { ...c }; if (PR.drop.includes(C0 + k)) { delete o.illus; delete o.label; delete o.emote; delete o.react; } return o; });
const shift = o => JSON.parse(JSON.stringify(o), (k, v) => (k === 'c' && typeof v === 'number') ? v - C0 : (k === 'c' && Array.isArray(v)) ? v.map(x => x - C0) : v);

fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIR, 'assets'), { recursive: true }); fs.mkdirSync(path.join(DIR, 'compositions')); fs.mkdirSync(path.join(DIR, 'tools'));
for (const f of fs.readdirSync(path.join(TEMPLATE, 'tools'))) fs.copyFileSync(path.join(TEMPLATE, 'tools', f), path.join(DIR, 'tools', f));
for (const f of ['AGENTS.md', 'CLAUDE.md', 'hyperframes.json', 'package.json']) fs.copyFileSync(path.join(TEMPLATE, f), path.join(DIR, f));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(T0), '-to', String(T1), '-i', path.join(SRC, 'assets/voice.mp3'), '-q:a', '4', path.join(DIR, 'assets/voice.mp3')]);
fs.writeFileSync(path.join(DIR, 'assets/words.json'), JSON.stringify(words));
fs.writeFileSync(path.join(DIR, 'episode.json'), JSON.stringify({
  scene: EP.scene, lea: EP.lea, mat: EP.mat, decor: EP.decor, audio: 'assets/voice.mp3', audioEnd: +(T1 - T0).toFixed(2),
  outro: false, chunks, vocab: EP.vocab.slice(first.v0, last.v0 + last.nv), stories: shift(PR.stories),
}, null, 1));
execFileSync(process.execPath, [path.join(DIR, 'tools/build.mjs')], { cwd: DIR, stdio: 'inherit' });
console.log(`story preview "${name}": ${PR.ep} ${T0}–${T1}s (${(T1 - T0).toFixed(1)} s), ${PR.stories.length} stories`);

const pkg = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'package.json'), 'utf8'));
const npx = a => execFileSync('npx', ['--yes', `hyperframes@${pkg.scripts.render.match(/hyperframes@([\d.]+)/)[1]}`, ...a], { cwd: DIR, stdio: 'inherit' });
if (flag('snapshot')) {
  // one frame 2 s into each story, one in the middle, one near its end
  const ws = JSON.parse(fs.readFileSync(path.join(DIR, 'episode.json'), 'utf8')).stories;
  let w2 = 0; const st = chunks.map(c => { const n = c.fr.replace(/[\[\]]/g, '').split(/[ \t\n]+/).length, s = words[w2].s, e = words[w2 + n - 1].e; w2 += n; return { s, e }; });
  npx(['snapshot', '--at', ws.flatMap(s => [st[s.c[0]].s + 2.2, (st[s.c[0]].s + st[s.c[1]].e) / 2, st[s.c[1]].e - 0.3]).map(x => x.toFixed(2)).join(',')]);
}
if (flag('preview')) npx(['preview', '--background', '--no-open']);
