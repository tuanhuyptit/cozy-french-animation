// EP01 · L'Alchimiste — story pages = shared backdrops (../scenes.mjs) + this book's characters and objects.
// pups: { name (used by plan.mjs beats as `who`), x, y (feet, near-layer px, keep y ≤ 800), s?, flip?, hidden? }
import { SANTIAGO, PILGRIM, SHEEP } from '../art.mjs';
import { PERSON, pup, pupSvg, BOAT, PROP } from '../kit.mjs';
import { SCENES as S, page } from '../scenes.mjs';

// the book's cast
const SANT = (x, y, extra = {}) => pupSvg(SANTIAGO, x, y, { name: 'santiago', ...extra });
const FATHER = { robe: '#6b4a36', trim: '#3a2e28', hair: '#8a8278', beard: '#b4aca0', old: true };
const KING = { robe: '#f3eee2', trim: '#c9a77c', hair: '#e9e4da', beard: '#eeeae2', old: true, head: 'crown', prop: '<rect x="-30" y="-160" width="40" height="34" rx="6" fill="#e8b35c" transform="translate(-30 0)"/>' };
const MERCHANT = { robe: '#5b7398', trim: '#3f5f6b', head: 'fez', headC: '#c9502e', beard: '#4a3a30' };
const FATIMA = { robe: '#c9693f', trim: '#8a3f20', head: 'scarf', headC: '#5b7398', prop: '<path d="M30 -150 c-10 -30 30 -30 20 0 l6 40 h-32Z" fill="#d99a52"/>' };
const ALCHEMIST = { robe: '#2e2a3a', trim: '#1a1820', head: 'hood', headC: '#3a3348', beard: '#5a5560' };
const FLOCK = sheep => `<g class="flock">${sheep.map(([x, y, f, s], i) => `<g transform="translate(${x} ${y}) scale(${f * s} ${s})">${SHEEP(i)}</g>`).join('')}</g>`;

export const PAGES = {
  andalousie: page(S.campagne(), [SANT(1180, 790)]),
  tresor: page(S.campagne({ flock: false, dusk: true }), [SANT(560, 790, { flip: true })], PROP.chest(330, 700) + PROP.hole(340, 770)),
  camino: page(S.chemin(), [pupSvg(PILGRIM, 760, 790, { name: 'pilgrim', s: 1.4 })]),
  maison: page(S.interieur(), [pup(FATHER, 400, 790, { name: 'father' }), SANT(1260, 790, { flip: true })], PROP.coins(420, 560)),
  tarifa: page(S.placeMer({ flock: FLOCK([[1450, 800, 1, .8], [1580, 790, -1, .85], [1700, 805, 1, .75]]) }),
    [pup(KING, 540, 790, { name: 'king' }), SANT(780, 790, { flip: true })]),
  detroit: page(S.mer(), [{ name: 'boat', x: 980, y: 800, svg: BOAT([[SANTIAGO, 80, .62], [PERSON({ robe: '#5b7398', head: 'turban', headC: '#e9dcc4' }), -100]]) }]),
  tanger: page(S.marche(), [
    pup({ robe: '#7a5a8c', head: 'turban', headC: '#f3e6cf' }, 300, 780, { s: .85 }),
    pup({ robe: '#c9502e', head: 'scarf', headC: '#f3c96b' }, 1700, 785, { s: .85, flip: true }),
    pup({ robe: '#5b7398', head: 'fez', headC: '#c9502e' }, 1900, 790, { s: .9 }),
    pup({ robe: '#4a3a30', head: 'hood', headC: '#5a4636' }, 800, 790, { name: 'thief' }),
    SANT(1040, 790, { flip: true }),
  ], PROP.pouch(1000, 640)),
  cristal: page(S.boutique(), [
    pup(MERCHANT, 900, 600, { name: 'merchant' }),
    SANT(460, 790),
    pup({ robe: '#8fae8b', head: 'turban', headC: '#fffaf0' }, 1500, 790, { name: 'client1', hidden: true, flip: true, s: .95 }),
    pup({ robe: '#c9693f', head: 'scarf', headC: '#f3c96b' }, 1660, 790, { name: 'client2', hidden: true, flip: true, s: .9 }),
  ], PROP.tea(1000, 500) + PROP.jar(600, 470) + PROP.stones(1180, 520)),
  oasis: page(S.oasis(), [pup(FATIMA, 860, 785, { name: 'fatima' }), SANT(1080, 790, { flip: true }), pup(ALCHEMIST, 1640, 790, { name: 'alchemist', hidden: true, flip: true })]),
  vent: page(S.desertNuit(), [SANT(1000, 700)]),
  pyramides: page(S.pyramides(), [
    SANT(800, 790, { flip: true }),
    pup({ robe: '#3a3348', head: 'turban', headC: '#5a5070' }, 250, 790, { name: 'man1', hidden: true }),
    pup({ robe: '#4a3a30', head: 'hood', headC: '#3a2e28', beard: '#2a2220' }, 400, 795, { name: 'man2', hidden: true }),
  ]),
};
