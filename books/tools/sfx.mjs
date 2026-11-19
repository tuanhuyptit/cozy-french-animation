// Cozy French Books — sound effects + ambience, all synthesised here (no sample files, nothing to license).
//   renderSfx(events, total, wav, mp3)        — one-shot sounds at the times build.mjs collects
//   renderAmbience(beds, total, wav, mp3)     — quiet background beds per scene (rain, birds, sea, market, wind, night, shop)
// Event kinds: pop · tap · swish · paper · page · whoosh · gust · thud · scribble · ding · tick · chime · card
//              coin · step · sparkle · dig · pin · blip
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const SR = 44100;
let seed = 12345;
const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
const rnd = () => (noise() + 1) / 2;
const buf = s => new Float32Array(Math.ceil(s * SR));
const env = (i, a, d) => { const t = i / SR; return t < a ? t / a : Math.exp(-6.9 * (t - a) / d); };
const lp = (x, f) => { const a = 1 - Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } return x; };
const hp = (x, f) => { const a = 1 - Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] -= y; } return x; };
const glide = (len, f0, f1, a, d, g = 1) => { const x = buf(len); let ph = 0;
  for (let i = 0; i < x.length; i++) { const f = f0 * Math.pow(f1 / f0, i / x.length); ph += 2 * Math.PI * f / SR; x[i] = Math.sin(ph) * env(i, a, d) * g; } return x; };
const noiseBurst = (len, a, d, g = 1) => { const x = buf(len); for (let i = 0; i < x.length; i++) x[i] = noise() * env(i, a, d) * g; return x; };
const bell = (len, f, d, g = 1) => { const x = buf(len);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = g * env(i, 0.003, d) * (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * f * 2.01 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(2 * Math.PI * f * 3.02 * t) * Math.exp(-t * 10)); } return x; };
const add = (a, b, off = 0, g = 1) => { const o = Math.round(off * SR); for (let i = 0; i < b.length && o + i < a.length; i++) if (o + i >= 0) a[o + i] += b[i] * g; return a; };
const norm = (x, peak) => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; };
const sweep = (len, f0, f1, g) => { const x = buf(len); let y = 0, z = 0;
  for (let i = 0; i < x.length; i++) { const p = i / x.length, f = f0 + (f1 - f0) * Math.sin(Math.PI * p), a = 1 - Math.exp(-2 * Math.PI * f / SR);
    y += a * (noise() - y); z += 0.02 * (y - z); x[i] = (y - z) * Math.sin(Math.PI * p); } return norm(x, g); };

const KINDS = {
  pop: () => norm(add(glide(0.09, 950, 420, 0.002, 0.06), lp(noiseBurst(0.01, 0.0005, 0.004), 3000), 0, 0.3), 0.5),
  blip: () => norm(glide(0.08, 700, 1100, 0.004, 0.05), 0.35),
  tap: () => norm(add(glide(0.07, 240, 120, 0.001, 0.04), lp(noiseBurst(0.03, 0.0005, 0.012), 1800), 0, 0.6), 0.5),
  swish: () => norm(lp(hp(noiseBurst(0.22, 0.07, 0.1), 900), 4000), 0.32),
  paper: () => { const x = lp(hp(noiseBurst(0.28, 0.02, 0.16), 600), 3500); for (let i = 0; i < x.length; i++) x[i] *= 0.6 + 0.4 * Math.abs(Math.sin(i / SR * 2 * Math.PI * 23)); return norm(x, 0.34); },
  page: () => { const x = lp(hp(noiseBurst(0.55, 0.12, 0.32), 500), 4200); for (let i = 0; i < x.length; i++) x[i] *= 0.55 + 0.45 * Math.abs(Math.sin(i / SR * 2 * Math.PI * 9)); return norm(add(x, lp(noiseBurst(0.05, 0.001, 0.02), 1200), 0.45, 0.6), 0.42); },
  whoosh: () => sweep(0.45, 300, 2500, 0.32),
  gust: () => sweep(1.8, 200, 1400, 0.4),
  thud: () => norm(add(glide(0.3, 95, 52, 0.002, 0.2), lp(noiseBurst(0.05, 0.001, 0.02), 900), 0, 0.5), 0.6),
  scribble: () => { const x = hp(noiseBurst(0.45, 0.02, 0.38), 2200); for (let i = 0; i < x.length; i++) x[i] *= 0.5 + 0.5 * Math.sin(i / SR * 2 * Math.PI * 17); return norm(lp(x, 7000), 0.24); },
  ding: () => norm(add(bell(0.9, 1318.5, 0.6), bell(0.9, 1975.5, 0.5), 0.07, 0.8), 0.32),
  tick: () => norm(glide(0.03, 1600, 1400, 0.001, 0.015), 0.22),
  chime: () => norm([1046.5, 1318.5, 1568].reduce((x, f, k) => add(x, bell(1.0, f, 0.7), k * 0.12), buf(1.3)), 0.3),
  card: () => norm(add(KINDS.paper(), KINDS.tap(), 0.12, 0.8), 0.4),
  coin: () => norm(add(add(bell(0.5, 2093, 0.25), bell(0.5, 2793, 0.2), 0.04, 0.7), lp(noiseBurst(0.02, 0.0005, 0.006), 5000), 0, 0.4), 0.3),
  step: () => norm(add(glide(0.08, 160, 90, 0.002, 0.05), lp(noiseBurst(0.06, 0.002, 0.03), 1400), 0, 0.8), 0.2),
  sparkle: () => norm([2093, 2637, 3136, 4186].reduce((x, f, k) => add(x, bell(0.6, f, 0.25), k * 0.07), buf(0.9)), 0.2),
  dig: () => norm(add(lp(hp(noiseBurst(0.3, 0.01, 0.18), 300), 2600), glide(0.18, 120, 70, 0.002, 0.1), 0, 0.6), 0.34),
  pin: () => norm(add(glide(0.18, 500, 900, 0.01, 0.12), KINDS.tick(), 0.16, 1), 0.3),
};

function writeTrack(out, wavPath, mp3Path) {
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.2) / 1.2;
  const pcm = Buffer.alloc(44 + out.length * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + out.length * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(out.length * 2, 40);
  for (let i = 0; i < out.length; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(out[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(wavPath, pcm);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-ac', '1', '-q:a', '6', mp3Path]);
  fs.rmSync(wavPath);
}

// events: [{ t, k }]. Same-kind events closer than 70 ms are merged; at most 3 sounds start within 120 ms.
export function renderSfx(events, total, wavPath, mp3Path) {
  const cache = {}, out = buf(total + 2);
  const kept = [];
  for (const e of events.filter(e => KINDS[e.k] && e.t >= 0 && e.t < total).sort((a, b) => a.t - b.t)) {
    if (kept.some(k => k.k === e.k && e.t - k.t < 0.07)) continue;
    if (kept.filter(k => e.t - k.t < 0.12).length >= 3) continue;
    kept.push(e);
  }
  for (const e of kept) add(out, cache[e.k] ||= KINDS[e.k](), e.t, e.g ?? 1);
  writeTrack(out, wavPath, mp3Path);
  return kept.length;
}

/* ---------- ambience beds ---------- */
// one generator per bed: fills x (a slice of the track) in place
const BEDS = {
  rain: x => { let y = 0, z = 0; for (let i = 0; i < x.length; i++) { y += 0.25 * (noise() - y); z += 0.004 * (y - z); x[i] += (y - z) * 0.5; }
    for (let t = 0; t < x.length / SR; t += 0.02 + rnd() * 0.12) add(x, lp(noiseBurst(0.012, 0.0005, 0.004, 0.5 + rnd()), 2500 + rnd() * 3000), t, 0.35); },
  birds: x => { let y = 0; for (let i = 0; i < x.length; i++) { y += 0.01 * (noise() - y); x[i] += y * 0.6; }
    for (let t = 0.5 + rnd(); t < x.length / SR; t += 1.6 + rnd() * 3.5) { const f = 2600 + rnd() * 1600, n = 2 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) add(x, glide(0.09, f, f * (1.2 + rnd() * .3), 0.005, 0.06), t + k * 0.12, 0.12); } },
  sea: x => { let y = 0; for (let i = 0; i < x.length; i++) { y += 0.06 * (noise() - y); const t = i / SR; x[i] += y * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 6.5)) * 1.1; } },
  market: x => { let y = 0, z = 0; for (let i = 0; i < x.length; i++) { y += 0.05 * (noise() - y); z += 0.0004 * (Math.abs(y) - z); x[i] += y * (0.6 + 2 * z); }
    for (let t = 0.3; t < x.length / SR; t += 0.4 + rnd() * 1.2) add(x, KINDS.step(), t, 0.4);
    for (let t = 1 + rnd() * 3; t < x.length / SR; t += 4 + rnd() * 6) add(x, bell(0.4, 1800 + rnd() * 800, 0.2), t, 0.05); },
  wind: x => { let y = 0, z = 0; for (let i = 0; i < x.length; i++) { const t = i / SR, f = 250 + 450 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 4.2)), a = 1 - Math.exp(-2 * Math.PI * f / SR);
    y += a * (noise() - y); z += 0.01 * (y - z); x[i] += (y - z) * (0.7 + 0.3 * Math.sin(2 * Math.PI * t / 2.7)) * 1.6; } },
  night: x => { let y = 0; for (let i = 0; i < x.length; i++) { y += 0.01 * (noise() - y); x[i] += y * 0.5; }
    for (let t = 0.2; t < x.length / SR; t += 0.9 + rnd() * 0.8) for (let k = 0; k < 3; k++) add(x, glide(0.025, 4400, 4300, 0.002, 0.012), t + k * 0.05, 0.05); },
  shop: x => { let y = 0; for (let i = 0; i < x.length; i++) { y += 0.008 * (noise() - y); x[i] += y * 0.7; }
    for (let t = 2 + rnd() * 3; t < x.length / SR; t += 5 + rnd() * 7) add(x, bell(0.5, 2600 + rnd() * 900, 0.22), t, 0.05); },
};
// beds: [{ s, e, k, g? }] — each bed fades in/out over 0.8 s; g = gain (default 0.08)
export function renderAmbience(beds, total, wavPath, mp3Path) {
  const out = buf(total + 2);
  for (const b of beds) { if (!BEDS[b.k] || b.e <= b.s) continue;
    const x = buf(b.e - b.s + 0.8); BEDS[b.k](x); norm(x, 1); const g = b.g ?? 0.08, F = 0.8 * SR;
    for (let i = 0; i < x.length; i++) x[i] *= g * Math.min(1, i / F, (x.length - i) / F);
    add(out, x, b.s - 0.4); }
  writeTrack(out, wavPath, mp3Path);
  return beds.length;
}
export const SFX_KINDS = Object.keys(KINDS), AMBIENCE = Object.keys(BEDS);
