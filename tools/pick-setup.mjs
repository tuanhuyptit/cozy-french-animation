// Pick the staging (sit / walk), scene and outfits of a new episode at random — but never a clash.
//
// Usage (repo root):
//   node tools/pick-setup.mjs cozy-ep07                 → prints the pick
//   node tools/pick-setup.mjs cozy-ep07 --write         → also writes cozy-ep07/work/setup.json (read by assemble.mjs)
//   options: --mode sit|walk   --scene <name>   --lea <outfit>   --mat <outfit>   --seed <n> (another draw)   --walk-chance 0.3
//
// Rules:
//   • the draw is seeded by the episode name, so re-running gives the same answer (add --seed to draw again);
//   • walk happens with --walk-chance (default 30 %) when a walk scene is free;
//   • no scene used by the 3 previous episodes, no outfit worn by the same character in the 2 previous episodes;
//   • outfit ↔ scene colour clashes and outfit ↔ outfit clashes from the table below are never drawn.
// The pick is written into the episode (work/setup.json → episode.json), so a build is always reproducible.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const name = args.find(a => /^cozy-ep\d+$/.test(a));
if (!name) { console.error('usage: node tools/pick-setup.mjs cozy-epNN [--write] [--mode sit|walk] [--scene s] [--lea o] [--mat o] [--seed n]'); process.exit(1); }

// scenes + outfits straight from the demo (single source of truth)
const demo = fs.readFileSync(path.join(REPO, 'demo-animation-style.html'), 'utf8');
const block = (start, end) => demo.slice(demo.indexOf(start), demo.indexOf(end, demo.indexOf(start)));
const SCENES = [...block('const SCENES={', '\n};').matchAll(/^ (\w+):\{label:'[^']*'(, walk:true)?/gm)].map(m => ({ k: m[1], walk: !!m[2] }));
const keys = b => [...b.matchAll(/^  (\w+):\s*\{label:/gm)].map(m => m[1]);
const LEA = keys(block('const OUT_LEA={', '\n};')), MAT = keys(block('const OUT_MAT={', '\n};'));

// clashes: outfit → scenes it must not be drawn in ("only" = the only scenes allowed)
const AVOID = {
  lea: { chemise: ['cuisine', 'parc', 'boulangerie', 'biblio', 'jardin'], cardigan: ['chalet', 'terrasse', 'automne'], lilas: ['lavande', 'quai', 'terrasse', 'promenade'],
         foulard: ['bureau', 'plage', 'corniche'], doudoune: { only: ['chalet', 'village'] } },
  mat: { pull: ['cuisine', 'parc', 'boulangerie', 'biblio', 'jardin'], colroule: ['quai', 'salon', 'biblio', 'promenade', 'village'], blazer: ['quai', 'salon', 'biblio', 'promenade', 'village'],
         velours: ['marche', 'atelier', 'automne'], polo: ['marche', 'atelier', 'automne'], gilet: ['bureau', 'plage', 'corniche'], tablier: { only: ['cuisine', 'boulangerie'] } },
};
const PAIR_AVOID = [['jean', 'denim'], ['pull', 'polo'], ['chemise', 'pull'], ['cardigan', 'velours']];   // [lea, mat]
const okFor = (who, o, scene) => { const r = AVOID[who][o]; return !r || (Array.isArray(r) ? !r.includes(scene) : r.only.includes(scene)); };

// previous episodes (by number, before this one)
const num = +name.slice(7);
const prev = fs.readdirSync(REPO).filter(d => /^cozy-ep\d+$/.test(d) && +d.slice(7) < num).sort((a, b) => b.slice(7) - a.slice(7)).map(d => {
  for (const f of ['episode.json', 'work/setup.json']) { try { return { d, ...JSON.parse(fs.readFileSync(path.join(REPO, d, f), 'utf8')) }; } catch {} }
  return { d };
}).filter(e => e.scene);
const recentScenes = prev.slice(0, 3).map(e => e.scene), recentLea = prev.slice(0, 2).map(e => e.lea), recentMat = prev.slice(0, 2).map(e => e.mat);

// seeded draw
let h = 2166136261; for (const ch of name + ':' + (opt('seed') || '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
let a = h >>> 0; const rand = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = arr => arr[Math.floor(rand() * arr.length)];

const sceneOK = s => !recentScenes.includes(s.k);
let scene = opt('scene');
if (scene && !SCENES.some(s => s.k === scene)) { console.error(`unknown scene ${scene} (have: ${SCENES.map(s => s.k).join(', ')})`); process.exit(1); }
let mode = scene ? (SCENES.find(s => s.k === scene).walk ? 'walk' : 'sit') : opt('mode');
const walkFree = SCENES.filter(s => s.walk && sceneOK(s));
if (!mode) mode = walkFree.length && rand() < +(opt('walk-chance') ?? 0.3) ? 'walk' : 'sit';
if (!scene) {
  let pool = SCENES.filter(s => s.walk === (mode === 'walk') && sceneOK(s));
  if (!pool.length) pool = SCENES.filter(s => s.walk === (mode === 'walk'));   // every scene of that mode used recently: allow repeats
  scene = pick(pool).k;
}
const leaPool = LEA.filter(o => okFor('lea', o, scene) && !recentLea.includes(o));
const lea = opt('lea') || pick(leaPool.length ? leaPool : LEA.filter(o => okFor('lea', o, scene)));
const matPool = MAT.filter(o => okFor('mat', o, scene) && !recentMat.includes(o) && !PAIR_AVOID.some(([l, m]) => l === lea && m === o));
const mat = opt('mat') || pick(matPool.length ? matPool : MAT.filter(o => okFor('mat', o, scene)));

const setup = { scene, lea, mat };
console.log(`${name}: ${mode === 'walk' ? 'walk (đi dạo)' : 'sit (ngồi)'} · scene=${scene} · lea=${lea} · mat=${mat}`);
console.log(`  avoided: scenes ${recentScenes.join(', ') || '–'} · lea ${recentLea.join(', ') || '–'} · mat ${recentMat.join(', ') || '–'}`);
for (const [who, o] of [['lea', lea], ['mat', mat]]) if (!okFor(who, o, scene)) console.warn(`  warning: ${who}=${o} clashes with ${scene}`);
if (args.includes('--write')) {
  const out = path.join(REPO, name, 'work', 'setup.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(setup, null, 2) + '\n');
  console.log(`  → ${path.relative(REPO, out)}`);
} else console.log(JSON.stringify(setup));
