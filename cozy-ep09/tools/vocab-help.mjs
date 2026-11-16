// Helpers for picking vocabulary and writing the cards.
//
//   node tools/vocab-help.mjs candidates [--min B1] [--max C1]
//        words / expressions of the transcript (assets/words.json) whose CEFR level (FLELex) is in range,
//        with the time they are spoken and how often they occur. Needs FLELex (see README).
//   node tools/vocab-help.mjs ipa "garder pour soi" "forcément"
//        IPA from Wiktionary (WikiPron), split into syllables: /ɡaʁ.de puʁ swa/
//   node tools/vocab-help.mjs level "forcément" "accompagnement"
//        CEFR level of lemmas / expressions.
//
// Data: ../data/fra_latn_broad.tsv (WikiPron, CC BY-SA, in the repo)
//       ~/.cache/cozy-french/FleLex_TT_Beacco.tsv + FleLex_CRF.csv (FLELex, CC BY-NC-SA, not in the repo)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IPA_FILE = path.resolve(ROOT, '../data/fra_latn_broad.tsv');
const FLE_DIR = process.env.FLELEX_DIR || path.join(os.homedir(), '.cache/cozy-french');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const [cmd, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const terms = rest.filter((a, i) => !a.startsWith('--') && !(i && rest[i - 1].startsWith('--')));
const low = s => s.toLowerCase().replace(/’/g, "'");

/* ---------- IPA ---------- */
let IPA;
function ipaDict() {
  if (IPA) return IPA;
  IPA = new Map();
  for (const line of fs.readFileSync(IPA_FILE, 'utf8').split('\n')) {
    const [w, p] = line.split('\t'); if (w && p && !IPA.has(w)) IPA.set(w, p.replace(/[ɾr]/g, 'ʁ').split(' '));
  }
  return IPA;
}
const V = new Set(['a', 'e', 'i', 'o', 'u', 'y', 'ɛ', 'ɔ', 'ø', 'œ', 'ə', 'ɑ', 'ɑ̃', 'ɛ̃', 'ɔ̃', 'œ̃']);
const LIQ = new Set(['ʁ', 'l']), OBS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'f', 'v']), GLIDE = new Set(['j', 'w', 'ɥ']);
function syllabify(ph) {               // ph: array of phonemes → "a.kɔ̃.paɲ.mɑ̃"
  const vi = ph.map((p, i) => V.has(p) ? i : -1).filter(i => i >= 0);
  if (vi.length < 2) return ph.join('');
  const cuts = [];
  for (let k = 0; k < vi.length - 1; k++) {
    const a = vi[k], b = vi[k + 1], cl = ph.slice(a + 1, b);   // consonants between two vowels
    let onset = cl.length ? 1 : 0;
    if (cl.length >= 2) {
      const x = cl[cl.length - 2], y = cl[cl.length - 1];
      if ((OBS.has(x) && LIQ.has(y)) || GLIDE.has(y)) onset = 2;
      if (cl.length >= 3 && OBS.has(cl[cl.length - 3]) && LIQ.has(x) && GLIDE.has(y)) onset = 3;
    }
    cuts.push(b - onset);
  }
  return ph.map((p, i) => (cuts.includes(i) ? '.' : '') + p).join('');
}
// function words: Wiktionary's first entry is often a casual or stressed variant
const FIXED = { il: 'il', ils: 'il', elle: 'ɛl', me: 'mə', te: 'tə', se: 'sə', le: 'lə', de: 'də', je: 'ʒə', ne: 'nə', ce: 'sə', que: 'kə', un: 'œ̃', les: 'le', des: 'de', est: 'ɛ', et: 'e', en: 'ɑ̃', on: 'ɔ̃', tu: 'ty', vous: 'vu', nous: 'nu', pour: 'puʁ', soi: 'swa' };
function ipaWord(w) {
  const d = ipaDict(), key = low(w).replace(/[^a-zà-ÿœæç'-]/g, '');
  if (FIXED[key]) return FIXED[key];
  if (d.has(key)) return syllabify(d.get(key));
  const m = key.match(/^(l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu)'(.+)$/);   // élision: l'homme
  if (m && d.has(m[2])) { const pre = { l: 'l', d: 'd', j: 'ʒ', m: 'm', t: 't', s: 's', n: 'n', c: 's', qu: 'k', jusqu: 'ʒysk', lorsqu: 'lɔʁsk', puisqu: 'pɥisk' }[m[1]]; return syllabify([...pre.match(/./gu), ...d.get(m[2])]); }
  return null;
}
function ipa(phrase) {
  const parts = phrase.split(/\s+/).map(w => [w, ipaWord(w)]);
  const miss = parts.filter(p => !p[1]).map(p => p[0]);
  return { ipa: '/' + parts.map(p => p[1] || `?${p[0]}?`).join(' ') + '/', miss };
}

/* ---------- FLELex ---------- */
let FLE;
function fle() {
  if (FLE) return FLE;
  FLE = new Map();
  const add = (w, tag, freqs, level) => {
    const k = low(w); if (!level) { const i = freqs.findIndex(f => f > 0); level = LEVELS[i] || '?'; }
    const prev = FLE.get(k); if (!prev || LEVELS.indexOf(level) < LEVELS.indexOf(prev.level)) FLE.set(k, { level, tag, total: freqs[6] || 0 });
  };
  const beacco = path.join(FLE_DIR, 'FleLex_TT_Beacco.tsv'), crf = path.join(FLE_DIR, 'FleLex_CRF.csv');
  if (!fs.existsSync(beacco)) return null;
  for (const l of fs.readFileSync(beacco, 'utf8').split('\n').slice(1)) { const c = l.split('\t'); if (c[0]) add(c[0], c[1], c.slice(2, 9).map(Number), c[9]?.trim()); }
  if (fs.existsSync(crf)) for (const l of fs.readFileSync(crf, 'utf8').split('\n').slice(1)) {
    const c = l.split('\t'); if (c[0] && c[0].includes(' ') && !FLE.has(low(c[0]))) add(c[0], c[1], c.slice(2, 9).map(Number));   // multiword expressions
  }
  return FLE;
}
// very rough lemma guesses for an inflected form; FLELex only lists lemmas
function lemmas(form) {
  let w = low(form).replace(/^(l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu)'/, '').replace(/[^a-zà-ÿœæç'-]/g, '');
  const out = new Set([w]);
  const add = s => s && s.length > 3 && out.add(s);
  if (/s$|x$/.test(w)) add(w.slice(0, -1));
  if (/es$/.test(w)) add(w.slice(0, -2));
  if (/e$/.test(w)) add(w.slice(0, -1));
  if (/ée?s?$/.test(w)) add(w.replace(/ée?s?$/, 'er'));
  if (/ie?s?$/.test(w)) add(w.replace(/ie?s?$/, 'ir'));
  if (/ue?s?$/.test(w)) { add(w.replace(/ue?s?$/, 'oir')); add(w.replace(/ue?s?$/, 're')); }
  for (const [re, inf] of [[/(ons|ez|ent|ais|ait|aient|ions|iez|erai|eras|era|erons|erez|eront|erais|erait|eraient|ant)$/, ''], [/e$/, ''], [/es$/, '']]) {
    if (re.test(w)) { const st = w.replace(re, inf); ['er', 'ir', 're', 'oir'].forEach(e => add(st + e)); add(st.replace(/iss$/, '') + 'ir'); }
  }
  if (/ment$/.test(w)) add(w);
  return [...out];
}
function level(term) {
  const d = fle(); if (!d) return null;
  const t = low(term).replace(/^(un|une|le|la|les|l')\s*/, '');
  if (d.has(t)) return { lemma: t, ...d.get(t) };
  for (const l of lemmas(t)) if (d.has(l)) return { lemma: l, ...d.get(l) };
  return null;
}

/* ---------- commands ---------- */
if (cmd === 'ipa') {
  for (const t of terms) { const r = ipa(t); console.log(`${t}\t${r.ipa}${r.miss.length ? `\t(missing: ${r.miss.join(', ')} — write by hand)` : ''}`); }
} else if (cmd === 'level') {
  if (!fle()) { console.error(`FLELex not found in ${FLE_DIR} (see README)`); process.exit(1); }
  for (const t of terms) { const r = level(t); console.log(`${t}\t${r ? `${r.level}\t${r.lemma}\t${r.tag}` : '?'}`); }
} else if (cmd === 'candidates') {
  if (!fle()) { console.error(`FLELex not found in ${FLE_DIR} (see README)`); process.exit(1); }
  const lo = LEVELS.indexOf(opt('min', 'B1')), hi = LEVELS.indexOf(opt('max', 'C1'));
  const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/words.json'), 'utf8'));
  const tok = W.map(w => low(w.t).replace(/[^a-zà-ÿœæç'-]/g, ''));
  const found = new Map();
  const hit = (key, info, i, n) => {
    if (!info || LEVELS.indexOf(info.level) < lo || LEVELS.indexOf(info.level) > hi) return;
    const k = info.lemma || key, f = found.get(k) || { ...info, lemma: k, forms: new Set(), at: [] };
    f.forms.add(W.slice(i, i + n).map(w => w.t).join(' ')); f.at.push(W[i].s); found.set(k, f);
  };
  const d = fle();
  for (let i = 0; i < W.length; i++) {
    for (const n of [4, 3, 2]) { if (i + n > tok.length) continue; const k = tok.slice(i, i + n).join(' '); if (d.has(k)) hit(k, { lemma: k, ...d.get(k) }, i, n); }
    if (tok[i].length > 2) hit(tok[i], level(tok[i]), i, 1);
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const rows = [...found.values()].sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || a.at[0] - b.at[0]);
  console.log(`level\tlemma\ttag\ttimes\tfirst at\tforms`);
  for (const r of rows) console.log(`${r.level}\t${r.lemma}\t${r.tag}\t${r.at.length}\t${mmss(r.at[0])}\t${[...r.forms].slice(0, 3).join(' | ')}`);
  console.log(`\n${rows.length} candidates (${opt('min', 'B1')}–${opt('max', 'C1')}). Lemma matching is heuristic: check each one, and look for good expressions FLELex misses.`);
} else {
  console.log('usage: node tools/vocab-help.mjs candidates [--min B1] [--max C1] | ipa "<word or phrase>" … | level "<lemma>" …');
}
