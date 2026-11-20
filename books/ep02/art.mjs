// EP02 · The Moon and Sixpence (L'Envoûté) — story pages = shared backdrops (../scenes.mjs) + this book's cast and objects.
// pups: { name (used by plan.mjs beats as `who`), x, y (feet, near-layer px, keep y ≤ 800), s?, flip?, hidden? }
import { pup, PROP } from '../kit.mjs';
import { SCENES as S, page } from '../scenes.mjs';

// the book's cast (PERSON options: suit / bowler / bun / beret / glasses were added for this book, reusable)
const BRUSH = '<path d="M44 -106 L72 -150" stroke="#7a5038" stroke-width="5" stroke-linecap="round"/><path d="M72 -150 l5 -9" stroke="#c9502e" stroke-width="7" stroke-linecap="round"/>';
const STRICK_LDN = { suit: true, robe: '#3a3a48', legs: '#2a2a38', trim: '#22222c', tie: '#8a3f3f', hair: '#a8532e', head: 'bowler', headC: '#2a2220' };
const STRICK = { robe: '#8a6a50', trim: '#5a3a28', hair: '#a8532e', beard: '#b0532e', prop: BRUSH };
const AMY = { robe: '#5b7398', trim: '#3f5f6b', head: 'bun', hair: '#6b4530' };
const AMY_WORK = { ...AMY, robe: '#6b6a7a', trim: '#4a4a58' };
const NARRATOR = { suit: true, robe: '#7a6450', legs: '#3a3a48', trim: '#4a3a30', tie: '#5b7398', hair: '#3a2620' };
const DIRK = { suit: true, robe: '#8fae8b', legs: '#5a4a40', trim: '#5f7f5a', tie: '#c9502e', hair: '#d9b26a', glasses: true };
const BLANCHE = { robe: '#e8907e', trim: '#b8604e', head: 'bun', hair: '#3a2620' };
const KID = (robe, hair) => ({ robe, trim: '#5a3a28', hair });
const WALKER = { suit: true, robe: '#5a6a7a', legs: '#2f3854', trim: '#3a4a5a', tie: '#c9a24a', hair: '#3a2620' };
const HERMIT = { robe: '#7a6a50', trim: '#5a4a38', hair: '#5a4636', beard: '#5a4636' };

const coin = (x, y) => PROP.icon('coin', 'sixpence', x, y, 80);
// Strickland lying ill: head on the pillow of the atelier({bed:true}) bed, red beard, eyes closed
const SICK = `<div class="prop sick" style="left:1170px;top:560px"><svg viewBox="-60 -60 120 120" width="120" height="120" filter="url(#pencil)"><circle cx="0" cy="0" r="30" fill="#e3b08e"/><path d="M-30 -4 C-34 -40 26 -44 32 -14 C20 -24 -10 -26 -30 -4Z" fill="#a8532e"/><path d="M-16 14 C-12 44 18 48 28 18 C16 26 -4 24 -16 14Z" fill="#b0532e"/><path d="M4 -2 q6 4 12 0" stroke="#2a1e18" stroke-width="3" fill="none" stroke-linecap="round"/></svg></div>`;

export const PAGES = {
  // the opening image: a coin on the ground, the moon above
  lune: page(S.rueNuit(), [pup(WALKER, 1000, 790, { name: 'walker' })], coin(1210, 740)),
  // Walden: the cabin by the pond
  walden: page(S.etang(), [pup(HERMIT, 1180, 790, { name: 'hermit', flip: true })]),
  // London: the comfortable family life
  londres: page(S.salon(), [
    pup(STRICK_LDN, 760, 790, { name: 'strick' }),
    pup(AMY, 1300, 790, { name: 'amy', flip: true }),
    pup(KID('#c9693f', '#6b4530'), 1460, 790, { name: 'kid1', s: .62, flip: true }),
    pup(KID('#8fae8b', '#a8532e'), 1580, 790, { name: 'kid2', s: .56, flip: true }),
  ], PROP.icon('letter', 'letter', 950, 520, 90)),
  // the city office (finance)
  finance: page(S.bureau(), [pup(STRICK_LDN, 1300, 790, { name: 'strick', flip: true })], PROP.icon('coins', 'coins', 820, 470, 90)),
  // the street at night: he leaves
  depart: page(S.rueNuit(), [pup({ ...STRICK_LDN, prop: '<rect x="34" y="-110" width="44" height="34" rx="6" fill="#6b4a36"/>' }, 700, 790, { name: 'strick' })], ''),
  // Paris: the attic studio, the narrator visits
  paris: page(S.atelier(), [pup(STRICK, 980, 790, { name: 'strick', flip: true }), pup(NARRATOR, 1500, 790, { name: 'narrator', flip: true, hidden: true })]),
  // the letter read in London
  lettre: page(S.salon(), [pup(AMY, 1160, 790, { name: 'amy', flip: true })], PROP.icon('letter', 'letter', 950, 520, 90)),
  // Mrs Strickland at the typewriter
  dactylo: page(S.bureau(), [pup(AMY_WORK, 980, 790, { name: 'amy' })], PROP.icon('typewriter', 'typewriter', 1000, 470, 130)),
  // Dirk's studio: Dirk alone with his paintings
  dirk: page(S.atelier(), [pup(DIRK, 1100, 790, { name: 'dirk', s: .92, flip: true }), pup(BLANCHE, 1400, 790, { name: 'blanche', flip: true, hidden: true })]),
  // Dirk's studio with a bed: Strickland ill, Blanche looks after him
  malade: page(S.atelier({ bed: true }), [pup(DIRK, 900, 790, { name: 'dirk', s: .92 }), pup(BLANCHE, 1640, 790, { name: 'blanche', flip: true })], SICK),
  // after: Strickland and Blanche in the studio, Dirk leaves
  atelierB: page(S.atelier(), [pup(STRICK, 980, 790, { name: 'strick', flip: true }), pup(BLANCHE, 1360, 790, { name: 'blanche', flip: true }), pup(DIRK, 1700, 790, { name: 'dirk', s: .92 })]),
};
