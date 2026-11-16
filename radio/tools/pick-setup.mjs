// Pick the ONE scene + Léa's outfit of a Cozy French Radio episode at random (like tools/pick-setup.mjs of the main channel).
// Usage : node radio/tools/pick-setup.mjs radio/epNN [--write] [--seed 2] [--scene grenier] [--lea torsade]
//   - scenes: the host scenes of radio/scenes.mjs (kind 'host'); interludes are graphic cards, not whole-episode scenes
//   - scene not used by the 2 previous Radio episodes, outfit not used by the 2 previous ones
//   - outfit must not clash with the scene's colours (AVOID below); doudoune only in winter scenes
//   - the result is fixed by the episode name (rebuild = same pick); --seed n draws again
// --write stores { scene, lea } in radio/epNN/work/setup.json (tools/assemble.mjs copies it into episode.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES } from '../scenes.mjs';

const RADIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const EPDIR = path.resolve(args.find(a => !a.startsWith('--') && !['--seed', '--scene', '--lea'].includes(args[args.indexOf(a) - 1])) || '.');
const NAME = path.basename(EPDIR);

const OUTFITS = ['pull', 'mariniere', 'trench', 'chemise', 'cardigan', 'pois', 'jean', 'lilas', 'foulard', 'doudoune', 'rose', 'tartan', 'torsade', 'vichy', 'fleurs', 'camel'];
// outfit colours that disappear into / fight with each scene's background
const AVOID = {
  studio:   ['pois', 'jean', 'lilas', 'tartan'],              // night booth: dark purple/navy walls
  grenier:  ['pull', 'cardigan', 'camel', 'vichy'],           // sunset attic: orange light, wood
  matin:    ['foulard', 'mariniere', 'torsade'],              // cream façade, blue shutters, light sky
  train:    ['lilas', 'rose', 'vichy', 'fleurs'],             // mauve / purple carriage
  cheminee: ['cardigan', 'vichy', 'pull', 'camel'],           // red-orange firelight
};
const WINTER = ['cheminee'];

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const hash = s => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
const R = mulberry32(hash(NAME + '|' + (opt('seed') || 1)));
const pick = a => a[Math.floor(R() * a.length)];

// previous Radio episodes (by number, before this one)
const num = n => +(n.match(/\d+/) || [0])[0];
const prev = fs.readdirSync(RADIO).filter(d => /^ep\d+$/.test(d) && num(d) < num(NAME)).sort((a, b) => num(a) - num(b)).slice(-2)
  .map(d => { for (const f of ['episode.json', 'work/setup.json']) { const p = path.join(RADIO, d, f); if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j.scene) return { ep: d, scene: j.scene, lea: j.lea }; } } return null; })
  .filter(Boolean);

const HOSTS = Object.keys(SCENES).filter(k => SCENES[k].kind === 'host');
let scene = opt('scene');
if (scene && !SCENES[scene]) throw new Error(`unknown scene "${scene}" (have: ${Object.keys(SCENES).join(', ')})`);
if (!scene) { const pool = HOSTS.filter(s => !prev.some(p => p.scene === s)); scene = pick(pool.length ? pool : HOSTS); }
let lea = opt('lea');
if (lea && !OUTFITS.includes(lea)) throw new Error(`unknown outfit "${lea}" (have: ${OUTFITS.join(', ')})`);
if (!lea) {
  const ok = o => !(AVOID[scene] || []).includes(o) && (o !== 'doudoune' || WINTER.includes(scene)) && !prev.some(p => p.lea === o);
  const pool = OUTFITS.filter(ok); lea = pick(pool.length ? pool : OUTFITS.filter(o => o !== 'doudoune'));
}
console.log(`${NAME}: scene ${scene} (${SCENES[scene].label}), Léa ${lea}${prev.length ? `  — previous: ${prev.map(p => `${p.ep} ${p.scene}/${p.lea}`).join(', ')}` : ''}`);
if (args.includes('--write')) {
  fs.mkdirSync(path.join(EPDIR, 'work'), { recursive: true });
  fs.writeFileSync(path.join(EPDIR, 'work/setup.json'), JSON.stringify({ scene, lea }, null, 2) + '\n');
}
