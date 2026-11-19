// Sound effects for an episode: small sounds synthesised here (no sample files, nothing to license),
// mixed into one track at the times build.mjs collects (boards, vocab cards, bubbles, recap).
// Output: assets/sfx.wav → assets/sfx.mp3 (ffmpeg), placed under the voice as one <audio>.
//
// Kinds: pop · rise · tap · swish · paper · whoosh · thud · stamp · scribble · ding · buzz · tick · chime · card
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const SR = 44100;
let seed = 12345;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
const buf = s => new Float32Array(Math.ceil(s * SR));
// amplitude envelope: linear attack a, exponential decay to ~-60 dB over d (seconds)
const env = (i, a, d) => { const t = i / SR; return t < a ? t / a : Math.exp(-6.9 * (t - a) / d); };
const lp = (x, f) => { const a = 1 - Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } return x; };
const hp = (x, f) => { const a = 1 - Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] -= y; } return x; };
// sine with an exponential pitch glide f0 → f1 over the whole buffer
const glide = (len, f0, f1, a, d, g = 1) => { const x = buf(len); let ph = 0;
  for (let i = 0; i < x.length; i++) { const f = f0 * Math.pow(f1 / f0, i / x.length); ph += 2 * Math.PI * f / SR; x[i] = Math.sin(ph) * env(i, a, d) * g; } return x; };
const noiseBurst = (len, a, d, g = 1) => { const x = buf(len); for (let i = 0; i < x.length; i++) x[i] = noise() * env(i, a, d) * g; return x; };
const bell = (len, f, d, g = 1) => { const x = buf(len);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = g * env(i, 0.003, d) * (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(2 * Math.PI * f * 3.02 * t) * Math.exp(-t * 10)); } return x; };
const add = (a, b, off = 0, g = 1) => { const o = Math.round(off * SR); for (let i = 0; i < b.length && o + i < a.length; i++) a[o + i] += b[i] * g; return a; };
const norm = (x, peak) => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; };

const KINDS = {
  pop: () => norm(add(glide(0.09, 950, 420, 0.002, 0.06), lp(noiseBurst(0.01, 0.0005, 0.004), 3000), 0, 0.3), 0.55),
  rise: () => norm(glide(0.12, 480, 820, 0.006, 0.08), 0.4),
  tap: () => norm(add(glide(0.07, 240, 120, 0.001, 0.04), lp(noiseBurst(0.03, 0.0005, 0.012), 1800), 0, 0.6), 0.55),
  swish: () => norm(lp(hp(noiseBurst(0.2, 0.07, 0.09), 900), 4000), 0.3),
  paper: () => { const x = lp(hp(noiseBurst(0.28, 0.02, 0.16), 600), 3500); for (let i = 0; i < x.length; i++) x[i] *= 0.6 + 0.4 * Math.abs(Math.sin(i / SR * 2 * Math.PI * 23)); return norm(x, 0.3); },
  whoosh: () => { const x = buf(0.45); let y = 0, z = 0;
    for (let i = 0; i < x.length; i++) { const p = i / x.length, f = 300 + 2200 * Math.sin(Math.PI * p), a = 1 - Math.exp(-2 * Math.PI * f / SR);
      y += a * (noise() - y); z += 0.02 * (y - z); x[i] = (y - z) * Math.sin(Math.PI * p); } return norm(x, 0.32); },
  thud: () => norm(add(glide(0.3, 95, 52, 0.002, 0.2), lp(noiseBurst(0.05, 0.001, 0.02), 900), 0, 0.5), 0.75),
  stamp: () => norm(add(add(glide(0.14, 160, 70, 0.001, 0.08), lp(noiseBurst(0.04, 0.0005, 0.015), 2500), 0, 0.7), glide(0.06, 600, 300, 0.001, 0.03), 0, 0.2), 0.65),
  scribble: () => { const x = hp(noiseBurst(0.36, 0.02, 0.3), 2200); for (let i = 0; i < x.length; i++) x[i] *= 0.5 + 0.5 * Math.sin(i / SR * 2 * Math.PI * 21); return norm(lp(x, 7000), 0.22); },
  ding: () => norm(add(bell(0.9, 1318.5, 0.6), bell(0.9, 1975.5, 0.5), 0.07, 0.8), 0.32),
  buzz: () => { const x = buf(0.32); [[330, 0], [247, 0.15]].forEach(([f, o]) => { const t = glide(0.14, f, f * 0.97, 0.005, 0.1);
      for (let i = 0; i < t.length; i++) t[i] = Math.sign(t[i]) * Math.pow(Math.abs(t[i]), 0.6); add(x, t, o); }); return norm(lp(x, 1400), 0.22); },
  tick: () => norm(glide(0.03, 1600, 1400, 0.001, 0.015), 0.22),
  chime: () => norm([1046.5, 1318.5, 1568].reduce((x, f, k) => add(x, bell(1.0, f, 0.7), k * 0.12), buf(1.3)), 0.3),
  card: () => norm(add(KINDS.paper(), KINDS.tap(), 0.12, 0.8), 0.4),
};

// events: [{ t, k }] (seconds, kind). Same-kind events closer than 70 ms are merged; at most 3 sounds start within 120 ms.
export function renderSfx(events, total, wavPath, mp3Path, gain = 1) {
  const cache = {}, out = buf(total + 1.5);
  const ev = events.filter(e => KINDS[e.k] && e.t >= 0 && e.t < total).sort((a, b) => a.t - b.t);
  const kept = [];
  for (const e of ev) {
    if (kept.some(k => k.k === e.k && e.t - k.t < 0.07)) continue;
    if (kept.filter(k => e.t - k.t < 0.12).length >= 3) continue;
    kept.push(e);
  }
  for (const e of kept) add(out, cache[e.k] ||= KINDS[e.k](), e.t, gain);
  // soft limiter so stacked sounds never clip
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.2) / 1.2;
  const pcm = Buffer.alloc(44 + out.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + out.length * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(out.length * 2, 40);
  for (let i = 0; i < out.length; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(out[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(wavPath, pcm);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-ac', '1', '-q:a', '6', mp3Path]);
  fs.rmSync(wavPath);
  return kept.length;
}
export const SFX_KINDS = Object.keys(KINDS);
