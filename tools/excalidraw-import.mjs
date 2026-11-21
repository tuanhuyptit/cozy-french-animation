// One-off importer: Excalidraw libraries (libraries.excalidraw.com, MIT) → data/excalidraw/items.json
// Each library item becomes one SVG drawn with rough.js (same engine + seed Excalidraw uses), so it keeps its sketchy look.
//   { "<lib>#<n>": { name, w, h, svg } }   — names for the useful ones live in data/excalidraw/names.json ({ "name": "<lib>#<n>" })
// Usage: node tools/excalidraw-import.mjs <dir with .excalidrawlib files> [--sheet out.svg]
import fs from 'node:fs';
import path from 'node:path';
import rough from '../cozy-ep01/tools/rough.esm.js';

const DIR = process.argv[2], sheetAt = process.argv.indexOf('--sheet');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data/excalidraw');
fs.mkdirSync(OUT, { recursive: true });
const gen = rough.generator();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const col = c => !c || c === 'transparent' ? 'none' : c === '#000000' || c === '#1e1e1e' ? '#3a2e28' : c;

function el2svg(e) {
  const o = { seed: e.seed || 1, roughness: e.roughness ?? 1, strokeWidth: e.strokeWidth || 1, stroke: col(e.strokeColor), fill: col(e.backgroundColor) === 'none' ? undefined : col(e.backgroundColor),
    fillStyle: e.fillStyle === 'cross-hatch' ? 'cross-hatch' : e.fillStyle === 'solid' ? 'solid' : 'hachure', hachureGap: (e.strokeWidth || 1) * 4, fillWeight: (e.strokeWidth || 1) / 2,
    disableMultiStroke: e.strokeStyle && e.strokeStyle !== 'solid', strokeLineDash: e.strokeStyle === 'dashed' ? [8, 8] : e.strokeStyle === 'dotted' ? [1.5, 6] : undefined };
  const w = e.width, h = e.height;
  let shapes = [], extra = '';
  if (e.type === 'rectangle') shapes = [gen.rectangle(0, 0, w, h, o)];
  else if (e.type === 'ellipse') shapes = [gen.ellipse(w / 2, h / 2, w, h, o)];
  else if (e.type === 'diamond') shapes = [gen.polygon([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]], o)];
  else if (e.type === 'line' || e.type === 'arrow') {
    const pts = e.points || []; const closed = pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 8;
    shapes = [closed && o.fill ? gen.polygon(pts, o) : (e.roundness || e.strokeSharpness === 'round') && pts.length > 2 ? gen.curve(pts, o) : gen.linearPath(pts, o)];
  } else if (e.type === 'draw' || e.type === 'freedraw') {
    const pts = e.points || []; if (pts.length > 1) extra = `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')}" fill="none" stroke="${col(e.strokeColor)}" stroke-width="${(e.strokeWidth || 1) * 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (e.type === 'text') {
    const fs2 = e.fontSize || 20, lines = String(e.text || '').split('\n');
    extra = lines.map((l, i) => `<text x="${e.textAlign === 'center' ? w / 2 : e.textAlign === 'right' ? w : 0}" y="${fs2 * (i + 0.85)}" font-family="Caveat, cursive" font-weight="700" font-size="${fs2 * 1.1}" fill="${col(e.strokeColor)}" text-anchor="${e.textAlign === 'center' ? 'middle' : e.textAlign === 'right' ? 'end' : 'start'}">${esc(l)}</text>`).join('');
  } else return '';
  const paths = shapes.flatMap(s => gen.toPaths(s)).map(p => `<path d="${p.d.replace(/(\d+\.\d{2})\d+/g, '$1')}" fill="${p.fill || 'none'}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"${o.strokeLineDash && p.fill === 'none' && p.stroke !== 'none' ? ` stroke-dasharray="${o.strokeLineDash.join(' ')}"` : ''}/>`).join('');
  const tr = `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)})${e.angle ? ` rotate(${(e.angle * 180 / Math.PI).toFixed(1)} ${w / 2} ${h / 2})` : ''}`;
  return `<g transform="${tr}"${e.opacity !== undefined && e.opacity < 100 ? ` opacity="${e.opacity / 100}"` : ''}>${paths}${extra}</g>`;
}
function bbox(els) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  els.forEach(e => { const pts = e.points ? e.points.map(p => [e.x + p[0], e.y + p[1]]) : [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); });
  return [x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12];
}
const items = {};
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.excalidrawlib') && !f.includes('storytelling')).sort()) {   // storytelling = strangers at a laptop: the channel only has Léa & Mathieu
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')), lib = f.replace('.excalidrawlib', '').replace(/^[^_]+_/, '');
  (j.libraryItems || j.library || []).forEach((it, n) => {
    const els = (it.elements || it).filter(e => !e.isDeleted && e.type !== 'image' && !(e.type === 'text' && lib === 'awesome-icons'));   // English captions under awesome-icons dropped
    if (!els.length) return;
    const [x, y, w, h] = bbox(els);
    items[`${lib}#${n}`] = { name: it.name || '', w: +w.toFixed(0), h: +h.toFixed(0), svg: `<g transform="translate(${(-x).toFixed(1)} ${(-y).toFixed(1)})">${els.map(el2svg).join('')}</g>` };
  });
}
fs.writeFileSync(path.join(OUT, 'items.json'), JSON.stringify(items));
console.log(Object.keys(items).length, 'items', (fs.statSync(path.join(OUT, 'items.json')).size / 1024).toFixed(0) + ' KB');
if (sheetAt > 0) {   // contact sheet to pick + name the useful ones
  const keys = Object.keys(items), C = 10, S = 200;
  const cells = keys.map((k, i) => { const it = items[k], s = Math.min(150 / it.w, 130 / it.h);
    return `<g transform="translate(${(i % C) * S} ${Math.floor(i / C) * S})"><rect width="${S - 6}" height="${S - 6}" fill="#fffaf0" stroke="#ddd"/><g transform="translate(${(S - it.w * s) / 2} ${12 + (140 - it.h * s) / 2}) scale(${s})">${it.svg}</g><text x="6" y="${S - 14}" font-size="15" font-family="sans-serif">${esc(k)} ${esc(it.name).slice(0, 12)}</text></g>`; }).join('');
  fs.writeFileSync(process.argv[sheetAt + 1], `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${C * S} ${Math.ceil(keys.length / C) * S}" width="${C * S}" height="${Math.ceil(keys.length / C) * S}"><rect width="100%" height="100%" fill="#eee"/>${cells}</svg>`);
}
