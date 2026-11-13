// Preview every explanation-board mode without a real episode.
//
// Builds a short fake episode in board-preview/ (git-ignored) with the real cozy-ep01/tools/build.mjs:
// silent audio, made-up word timings, one board per mode with sample content. So what you see is exactly
// what an episode renders — change a board in build.mjs, run this again, look.
//
// Usage (repo root):
//   node tools/board-preview.mjs                       → build, print the timeline (mode, bg, seconds) + board-preview/sfx-samples.mp3
//   node tools/board-preview.mjs --snapshot            → + one PNG per board (near its end) in board-preview/.hyperframes/…
//   node tools/board-preview.mjs --preview             → + open HyperFrames Studio to scrub through it
//   options: --modes match,gender (default all) · --bg liege|craie|carnet (default: rotate) · --scene laverie --lea vichy --mat jacquard
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(REPO, 'cozy-ep01'), DIR = path.join(REPO, 'board-preview');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const flag = k => args.includes('--' + k);

// sample content per mode (French on the board, as in a real episode)
const SAMPLES = {
  word: {},   // takes the vocab card inside the segment
  sketch: {},
  compare: { title: 'Tu ou vous ?', left: { head: 'tu', sub: 'familier', items: ['un ami', 'la famille', 'un enfant'] }, right: { head: 'vous', sub: 'poli', items: ['un inconnu', 'au travail', 'un client'] } },
  steps: { title: 'Faire un bon café', items: ['Moudre le café', "Chauffer l'eau", 'Verser doucement', 'Savourer !'] },
  conjug: { verb: 'parler', tense: 'présent', rows: [['je', 'parl|e'], ['tu', 'parl|es'], ['il / elle', 'parl|e'], ['nous', 'parl|ons'], ['vous', 'parl|ez'], ['ils / elles', 'parl|ent']], note: 'Verbe en -er : régulier !' },
  mindmap: { word: 'le café', icon: 'cafe', items: ['un expresso', 'un crème', 'une tasse', 'le comptoir', 'le serveur'] },
  quiz: { q: 'Comment dit-on « to stand someone up » ?', options: ['poser un lapin', 'poser une question', 'prendre un lapin'], answer: 0, explain: 'Il m’a posé un lapin hier soir.' },
  timeline: { title: 'La journée de Léa', items: [{ label: '7h', text: 'réveil' }, { label: '9h', text: 'au bureau' }, { label: '13h', text: 'déjeuner' }, { label: '19h', text: 'apéro' }] },
  truefalse: { q: 'On dit « bonjour » le soir.', answer: false, explain: 'Le soir, on dit « bonsoir ».' },
  fill: { sentence: 'Je ___ le bus tous les matins.', answer: 'prends', hint: 'verbe prendre', en: 'I take the bus every morning.' },
  mistake: { wrong: 'Je suis allé à la maison de mon ami.', right: 'Je suis allé chez mon ami.', note: 'chez + personne' },
  scale: { title: 'Content… ou ravi ?', low: 'un peu', high: 'très', items: ['content', 'heureux', 'ravi', 'aux anges'] },
  idiom: { expr: 'poser un lapin', literal: 'to put down a rabbit', meaning: 'to stand someone up', icon: 'rendezvous', ex: 'Il m’a posé un lapin hier.', exEn: 'He stood me up yesterday.' },
  order: { sentence: 'Nous allons parler lentement.', en: 'We are going to speak slowly.' },
  gender: { items: ['le problème', 'la plage', { text: "l'eau", g: 'f' }, 'un musée', 'une chaise', 'le silence'] },
  falsefriend: { word: 'la librairie', looks: 'library', means: 'bookshop', fr: 'la bibliothèque', ex: "J'achète mes livres à la librairie du coin.", exEn: 'I buy my books at the local bookshop.' },
  pronounce: { parts: ['beau', 'cou(p)'], ipa: '/bo.ku/', en: 'a lot', tip: 'Le « p » final ne se prononce pas.' },
  register: { items: ['bouffer', 'manger', 'se restaurer'], en: 'to eat' },
  match: { pairs: [['la boulangerie', 'the bakery'], ['la clochette', 'the little bell'], ['une chaise', 'a chair'], ['le quai', 'the platform']] },
};
const LINES = [
  ['lea', 'Alors, on regarde ça ensemble ?', 'So, shall we look at this together?'],
  ['mat', 'Oui, avec plaisir, vas-y.', 'Yes, gladly, go ahead.'],
  ['lea', "C'est une question que nos auditeurs posent souvent.", 'It is a question our listeners often ask.'],
  ['mat', 'Et la réponse est plutôt simple.', 'And the answer is rather simple.'],
  ['lea', 'Il suffit de bien regarder le tableau.', 'You just have to look at the board.'],
  ['mat', 'On prend notre temps, sans stress.', 'We take our time, no stress.'],
  ['lea', 'Voilà, maintenant tout est clair.', "There, now it's all clear."],
];

const BG = ['liege', 'craie', 'carnet'];
const modes = (opt('modes') || Object.keys(SAMPLES).join(',')).split(',');
const bad = modes.filter(m => !SAMPLES[m]); if (bad.length) { console.error(`unknown mode ${bad.join(', ')} (have: ${Object.keys(SAMPLES).join(', ')})`); process.exit(1); }

// fake word timings: 0.42 s per word, 0.5 s between chunks
const words = [], chunks = []; let t = 0.5;
const say = (who, fr, en, extra = {}) => {
  for (const w of fr.split(/\s+/)) { words.push({ s: +t.toFixed(2), e: +(t + 0.38).toFixed(2), t: w.replace(/[\[\]]/g, '') }); t += 0.42; }
  t += 0.5; chunks.push({ who, fr, en, ...extra });
};
say('lea', 'Bonjour à tous, voici tous nos tableaux.', 'Hello everyone, here are all our boards.');
const vocab = [], plan = [];
modes.forEach((m, k) => {
  const bg = opt('bg') || BG[k % 3], s = t;
  LINES.forEach(([who, fr, en], i) => {
    let text = fr; const extra = {};
    if (i === 0) extra.board = { mode: m, bg, ...SAMPLES[m] };
    if (i === LINES.length - 1) extra.boardEnd = true;
    if (m === 'word' && i === 1) { text = 'Oui, on va [éviter] les pièges.'; vocab.push({ tag: 'verbe', word: 'éviter', ipa: '/e.vi.te/', mean: 'to avoid', ex: "J'évite le café le soir.", exEn: 'I avoid coffee in the evening.' }); }
    say(who, text, en, extra);
  });
  plan.push({ mode: m, bg, s, e: t });
  say(k % 2 ? 'lea' : 'mat', 'Très bien, on continue.', 'Very good, let us go on.');   // gap → next board is a new session
});
if (!vocab.length) { say('mat', 'Un dernier mot : [éviter].', 'One last word: to avoid.'); vocab.push({ tag: 'verbe', word: 'éviter', ipa: '/e.vi.te/', mean: 'to avoid', ex: "J'évite le café le soir.", exEn: 'I avoid coffee in the evening.' }); }
const audioEnd = +(t + 0.5).toFixed(2);

// project skeleton (same files as tools/new-episode.mjs) — tools are copied fresh every run so build.mjs edits show up
fs.mkdirSync(path.join(DIR, 'assets'), { recursive: true }); fs.mkdirSync(path.join(DIR, 'compositions'), { recursive: true });
fs.rmSync(path.join(DIR, 'tools'), { recursive: true, force: true }); fs.mkdirSync(path.join(DIR, 'tools'));
for (const f of fs.readdirSync(path.join(TEMPLATE, 'tools'))) fs.copyFileSync(path.join(TEMPLATE, 'tools', f), path.join(DIR, 'tools', f));
for (const f of ['AGENTS.md', 'CLAUDE.md', 'hyperframes.json']) fs.copyFileSync(path.join(TEMPLATE, f), path.join(DIR, f));
const pkg = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'package.json'), 'utf8')); pkg.name = 'board-preview';
fs.writeFileSync(path.join(DIR, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(path.join(DIR, 'meta.json'), JSON.stringify({ id: 'board-preview', name: 'board-preview' }, null, 2) + '\n');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', String(audioEnd), '-q:a', '9', path.join(DIR, 'assets/voice.mp3')]);
fs.writeFileSync(path.join(DIR, 'assets/words.json'), JSON.stringify(words));
fs.writeFileSync(path.join(DIR, 'episode.json'), JSON.stringify({
  scene: opt('scene') || 'cafe', lea: opt('lea') || 'pull', mat: opt('mat') || 'denim', decor: [],
  audio: 'assets/voice.mp3', audioEnd, chunks, vocab }, null, 1));

execFileSync(process.execPath, [path.join(DIR, 'tools/build.mjs')], { cwd: DIR, stdio: 'inherit' });
// every sound effect once, 1.2 s apart → board-preview/sfx-samples.mp3 (to listen to the set on its own)
const { renderSfx, SFX_KINDS } = await import(path.join(DIR, 'tools/sfx.mjs'));
renderSfx(SFX_KINDS.map((k, i) => ({ t: 0.3 + i * 1.2, k })), 0.3 + SFX_KINDS.length * 1.2 + 0.5, path.join(DIR, 'sfx-samples.wav'), path.join(DIR, 'sfx-samples.mp3'));
console.log(`sound effects: ${SFX_KINDS.join(' · ')} → board-preview/sfx-samples.mp3`);
console.log('\nboards (mode · bg · start–end s · snapshot at):');
for (const p of plan) console.log(`  ${p.mode.padEnd(12)} ${p.bg.padEnd(7)} ${p.s.toFixed(1).padStart(6)}–${p.e.toFixed(1).padEnd(6)} @ ${(p.e - 0.4).toFixed(1)}`);
const npx = a => execFileSync('npx', ['--yes', `hyperframes@${pkg.scripts.render.match(/hyperframes@([\d.]+)/)[1]}`, ...a], { cwd: DIR, stdio: 'inherit' });
if (flag('snapshot')) npx(['snapshot', '--at', plan.map(p => (p.e - 0.4).toFixed(2)).join(',')]);
if (flag('preview')) npx(['preview', '--background']);
