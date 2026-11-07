// Create a new episode project next to cozy-ep01 and transcribe its voice.
//
// Usage:
//   node tools/new-episode.mjs <voice.mp3> [--name cozy-ep07] [--start s] [--duration s] [--threshold hz] [--no-transcribe]
//
// Copies the template files from cozy-ep01 (tools, HyperFrames config, agent notes) into a fresh folder,
// picks a random staging/scene/outfits (tools/pick-setup.mjs → work/setup.json), then runs <folder>/tools/transcribe.mjs on the voice. Prints the scenes/outfits used by earlier
// episodes so the next one can pick something different.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(REPO, 'cozy-ep01');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const flag = k => args.includes('--' + k);
const voice = args.find((a, i) => !a.startsWith('--') && !(i && args[i - 1].startsWith('--') && !['--no-transcribe'].includes(args[i - 1])));
if (!voice || !fs.existsSync(voice)) { console.error('usage: node tools/new-episode.mjs <voice.mp3> [--name cozy-epNN] [--start s] [--duration s] [--threshold hz]'); process.exit(1); }

const eps = fs.readdirSync(REPO).filter(d => /^cozy-ep\d+$/.test(d)).sort();
const nextNum = Math.max(0, ...eps.map(d => +d.slice(7))) + 1;
const name = opt('name') || `cozy-ep${String(nextNum).padStart(2, '0')}`;
const dir = path.join(REPO, name);
if (fs.existsSync(dir)) { console.error(`${name} already exists`); process.exit(1); }

fs.mkdirSync(path.join(dir, 'tools'), { recursive: true });
fs.mkdirSync(path.join(dir, 'compositions'), { recursive: true });
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
for (const f of ['AGENTS.md', 'CLAUDE.md', 'hyperframes.json']) fs.copyFileSync(path.join(TEMPLATE, f), path.join(dir, f));
for (const f of fs.readdirSync(path.join(TEMPLATE, 'tools'))) fs.copyFileSync(path.join(TEMPLATE, 'tools', f), path.join(dir, 'tools', f));
const pkg = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'package.json'), 'utf8')); pkg.name = name;
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ id: name, name, createdAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`created ${name}/`);

console.log('\nEarlier episodes (pick a different scene / outfits):');
for (const d of eps) {
  try { const e = JSON.parse(fs.readFileSync(path.join(REPO, d, 'episode.json'), 'utf8')); console.log(`  ${d}: scene=${e.scene} lea=${e.lea} mat=${e.mat} vocab=${e.vocab.map(v => v.word).join(', ')}`); }
  catch { console.log(`  ${d}: (no episode.json)`); }
}

// random staging / scene / outfits for this episode (no clash, no repeat of the last episodes) → work/setup.json
console.log('');
execFileSync(process.execPath, [path.join(REPO, 'tools/pick-setup.mjs'), name, '--write'], { stdio: 'inherit' });

if (!flag('no-transcribe')) {
  const pass = ['start', 'duration', 'threshold', 'model'].flatMap(k => opt(k) !== undefined ? ['--' + k, opt(k)] : []);
  console.log('\ntranscribing (whisper medium: roughly 1/4 to 1/2 of the audio length)…');
  execFileSync(process.execPath, [path.join(dir, 'tools/transcribe.mjs'), path.resolve(voice), ...pass], { stdio: 'inherit', cwd: dir });
}
