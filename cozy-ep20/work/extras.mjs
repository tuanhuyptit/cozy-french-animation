// en1.src + extras (looked up by text, not index) → en.txt, br.json, vocab.full.json, stories.json
// usage (in cozy-epNN/): node work/extras.mjs && node work/combine.mjs && node tools/assemble.mjs
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const C = JSON.parse(fs.readFileSync(dir + 'chunks3.json', 'utf8'));
const WJ = JSON.parse(fs.readFileSync(dir + '../assets/words.json', 'utf8'));
const EN = fs.readFileSync(dir + 'en1.src', 'utf8').split('\n').filter(Boolean);
if (EN.length !== C.length) throw new Error(`en ${EN.length} != chunks ${C.length}`);
const n = s => s.replace(/[\s ]+/g, ' ').trim();
const FR = C.map(c => n(c.ws.map(k => WJ[k].t).join(' ')));
let cur = 0;
// find chunk index whose text contains s, searching forward from the last hit (or from `from`)
const F = (s, from) => { const st = from ?? cur; const i = FR.findIndex((f, k) => k >= st && f.includes(n(s))); if (i < 0) throw new Error(`not found after ${st}: ${s}`); cur = i; return i; };

// ---------- extras: [text, "e=… r=… i=type:label B={…} BE"] ----------
const X = [
  ['Attends... Tu viens de décrire', 'e=surpris'],
  ['Il me reste un morceau de biscuit', 'e=gene'],
  ['Mathieu ! Termine ton biscuit', 'e=rire'],
  ['des preuves que j\'ai raison', 'e=gene'],
  ['« Un contretemps » ?', 'B=' + JSON.stringify({ mode: 'word', bg: 'liege', note: '= un événement imprévu qui perturbe nos projets', icon: 'temps' })],
  ['parce que j\'ai raté le tram ».', 'BE'],
  ['J\'adore ! Il reconnaît', 'e=rire'],
  ['Une perte, une maladie', 'i=sante:une maladie'],
  ['À condition de nettoyer la tache', 'e=rire'],
  ['et je choisis une musique agréable', 'i=musique:une musique'],
  ['Est-ce que cela change ton humeur', 'e=question'],
  ['j\'ai besoin d\'un mode d\'emploi', 'e=rire'],
  ['je travaillais sur un projet', 'i=travail:un projet'],
  ['et l\'impression de ne jamais en faire assez', 'e=fatigue'],
  ['Pas une nouvelle application', 'e=surpris'],
  ['Dans la première colonne', 'B=' + JSON.stringify({ mode: 'compare', bg: 'craie', title: 'Mes deux colonnes',
    left: { head: 'Je peux agir', sub: 'ça dépend de moi', items: [{ text: 'préparer ma réunion', at: 4 }, { text: 'demander des précisions', at: 5 }, { text: 'respecter mes délais', at: 5 }] },
    right: { head: 'Je ne peux pas', sub: 'ça ne dépend pas de moi', items: [{ text: 'deviner ce que chacun pense', at: 6 }, { text: 'empêcher les imprévus', at: 8 }] } })],
  ['ni empêcher tous les imprévus', 'BE'],
  ['qui ne dure que cinq minutes', 'e=idee'],
  ['Les pieds sur terre, oui', 'B=' + JSON.stringify({ mode: 'idiom', bg: 'carnet', expr: 'garder les pieds sur terre', literal: 'to keep your feet on the earth', meaning: 'to stay realistic', ex: 'Il rêve beaucoup, mais il garde les pieds sur terre.', exEn: 'He dreams a lot, but he stays realistic.', meaningAt: 1 })],
  ['et je prépare aussi d\'autres possibilités', 'BE'],
  ['Jamais ! Enfin', 'e=gene'],
  ['courent des marathons', 'i=sport:des marathons'],
  ['Je suis sûre qu\'il avait du charme', 'e=coeur'],
  ['Donc je peux dire :', 'B=' + JSON.stringify({ mode: 'transform', bg: 'liege', title: 'Le petit mot « encore »', from: 'Je *suis nul* en français.', to: 'Je ne comprends *pas encore* tout.', fromTag: 'avant', toTag: 'mieux', label: '+ encore', en: "I don't understand everything yet.", changeAt: 5 })],
  ['que « Je suis nul en français ».', 'BE'],
  ['ils avaient besoin de sous-titres', 'i=etudes:des sous-titres'],
  ['quand on se sent complètement bloqué', 'e=question'],

  ['Excellente remarque.', 'B=' + JSON.stringify({ mode: 'dodont', bg: 'craie', title: 'Des objectifs réalistes', doHead: 'Petits pas ✓', dontHead: 'Programme gigantesque ✗',
    do: [{ text: 'deux courtes promenades par semaine', at: 3 }, { text: 'un moment régulier pour écouter', at: 5 }], dont: [{ text: 'une nouvelle vie entière', at: 0 }, { text: 'deux heures par jour', at: 7 }] })],
  ['sans ajouter trop de pression', 'BE'],
  ['Puis elle a rencontré une personne', 'B=' + JSON.stringify({ mode: 'timeline', bg: 'carnet', title: 'Mon amie, 38 ans', items: [
    { label: "d'abord", text: 'poser des questions', at: 0 }, { label: 'ensuite', text: 'un cours du soir', at: 3 },
    { label: 'quelques mois', text: 'aider des amis', at: 6 }, { label: "aujourd'hui", text: 'une reconversion', at: 9 }] })],
  ['mais elle avance prudemment', 'BE'],
  ['J\'aime beaucoup cet exemple', 'e=coeur'],
  ['Tu as dû être très déçu', 'e=triste'],
  ['Un ami m\'a appelé', 'i=amis:un ami'],
  ['C\'est une réponse très douce', 'e=coeur'],
  ['Tu sais, j\'aime bien l\'expression', 'B=' + JSON.stringify({ mode: 'idiom', bg: 'liege', expr: 'retrouver son élan', literal: 'to find your run-up again', meaning: 'to get your energy back', icon: 'soleil', ex: 'Après les vacances, j\'ai retrouvé mon élan.', exEn: 'After the holidays, I got my energy back.', meaningAt: 3 })],
  ['pour retrouver son élan. »', 'BE'],
  ['Les autres !', 'e=idee'],
  ['j\'étais un peu découragé', 'e=triste'],
  ['J\'ai appelé ma sœur', 'i=famille:ma sœur'],
  ['Oh non !', 'e=surpris'],
  ['Personne n\'a demandé une deuxième part', 'e=rire'],
  ['Une seule ?', 'e=question'],
  ['« J\'ai enfin pu me reposer. »', 'i=sommeil:me reposer'],
  ['C\'est une belle image', 'e=coeur'],

  ['tes recettes de cuisine ?', 'e=rire'],
  ['et le gratin de pommes de terre', 'i=repas:le gratin'],
  ['Avec plaisir. Commençons par', 'B=' + JSON.stringify({ mode: 'word', bg: 'craie', note: '= remarquer ce qui reste positif dans une situation', icon: 'soleil' })],
  ['pour les petits contretemps.', 'BE'],
  ['Cinquième expression :', 'B=' + JSON.stringify({ mode: 'match', bg: 'carnet', title: 'Relie les expressions !', pairs: [
    ['le bon côté', 'the bright side'], ['prendre du recul', 'to step back'], ['les pieds sur terre', 'to stay realistic'],
    ['reprendre confiance', 'to regain confidence'], ['retrouver son élan', 'get energy back']] })],
  ['et de notre manière de voir la vie', 'BE'],
  ['Première phrase :', 'B=' + JSON.stringify({ mode: 'transform', bg: 'liege', title: 'Plus précis, plus naturel', from: '*Tout va mal.*', to: 'Je traverse *une journée compliquée*.', fromTag: 'trop général', toTag: 'plus juste', label: 'préciser', en: "I'm having a complicated day.", changeAt: 3 })],
  ['une mauvaise matinée en mauvaise vie', 'BE'],
  ['une deuxième chance à l\'examen', 'e=rire'],
  ['acheter une chemise de rechange', 'e=rire'],
  ['Merci d\'avoir passé ce moment avec nous', 'e=coeur'],
];
const extra = Array(C.length).fill('');
cur = 0;
for (const [s, e] of X) { const i = F(s); if (e) extra[i] = (extra[i] + ' ' + e).trim(); }
fs.writeFileSync(dir + 'en.txt', EN.map((e, i) => e + '|' + extra[i]).join('\n') + '\n');

// ---------- vocab: [chunk text, first word, last word, entry] ----------
const V = [
  ['j\'ai renversé mon café', 'renversé', 'renversé', { tag: 'verbe', word: 'renverser', ipa: '/ʁɑ̃.vɛʁ.se/', mean: 'to spill, to knock over', ex: 'Attention, tu vas renverser ton verre !', exEn: "Careful, you're going to spill your glass!" }],
  ['je déclare forfait', 'déclare', 'forfait', { tag: 'expression', word: 'déclarer forfait', ipa: '/de.kla.ʁe fɔʁ.fɛ/', mean: 'to give up, to throw in the towel', ex: 'Après trois kilomètres, j\'ai déclaré forfait.', exEn: 'After three kilometres, I gave up.' }],
  ['Un contretemps, c\'est', 'Un', 'contretemps', { tag: 'nom masculin', word: 'un contretemps', ipa: '/œ̃ kɔ̃.tʁə.tɑ̃/', mean: 'a setback, a hitch', ex: 'Désolé, j\'ai eu un contretemps au travail.', exEn: 'Sorry, something came up at work.' }],
  ['les petites contrariétés quotidiennes', 'contrariétés', 'contrariétés', { tag: 'nom féminin', word: 'une contrariété', ipa: '/yn kɔ̃.tʁa.ʁje.te/', mean: 'an annoyance, a small upset', ex: 'Une petite contrariété ne doit pas gâcher ta soirée.', exEn: "A small annoyance shouldn't spoil your evening." }],
  ['j\'ai besoin d\'un mode d\'emploi', 'mode', 'd\'emploi', { tag: 'nom masculin', word: 'un mode d\'emploi', ipa: '/œ̃ mɔd dɑ̃.plwa/', mean: 'instructions, a user manual', ex: 'J\'ai perdu le mode d\'emploi de la machine.', exEn: 'I lost the instructions for the machine.' }],
  ['mais je garde les pieds sur terre', 'garde', 'terre', { tag: 'expression', word: 'garder les pieds sur terre', ipa: '/ɡaʁ.de le pje syʁ tɛʁ/', mean: 'to stay realistic, down to earth', ex: 'Même avec le succès, elle garde les pieds sur terre.', exEn: 'Even with success, she stays down to earth.' }],
  ['n\'a pas abouti.', 'abouti', 'abouti', { tag: 'verbe', word: 'aboutir', ipa: '/a.bu.tiʁ/', mean: 'to succeed, to come to something', ex: 'Après deux ans, notre projet a enfin abouti.', exEn: 'After two years, our project finally came together.' }],
  ['« Je ne suis pas d\'humeur', 'suis', 'd\'humeur', { tag: 'expression', word: 'ne pas être d\'humeur à', ipa: '/nə pa ɛtʁ dy.mœʁ a/', mean: 'not to be in the mood for', ex: 'Ce soir, je ne suis pas d\'humeur à sortir.', exEn: "Tonight, I'm not in the mood to go out." }],
  ['Oui. « Retrouver son élan »', 'Retrouver', 'élan', { tag: 'expression', word: 'retrouver son élan', ipa: '/ʁə.tʁu.ve sɔ̃.n‿e.lɑ̃/', mean: 'to get your energy / momentum back', ex: 'Avec le printemps, j\'ai retrouvé mon élan.', exEn: 'With spring, I got my energy back.' }],
  ['Il avait confondu le sel et le sucre', 'confondu', 'confondu', { tag: 'verbe', word: 'confondre', ipa: '/kɔ̃.fɔ̃dʁ/', mean: 'to mix up, to confuse', ex: 'On me confond souvent avec ma sœur.', exEn: 'People often mix me up with my sister.' }],
  ['sans faire semblant que', 'faire', 'semblant', { tag: 'expression', word: 'faire semblant (de)', ipa: '/fɛʁ sɑ̃.blɑ̃/', mean: 'to pretend', ex: 'Il fait semblant de dormir.', exEn: "He's pretending to be asleep." }],
  ['mais j\'essaie de voir le bon côté des choses', 'voir', 'choses', { tag: 'expression', word: 'voir le bon côté des choses', ipa: '/vwaʁ lə bɔ̃ ko.te de ʃoz/', mean: 'to look on the bright side', ex: 'Il pleut, mais vois le bon côté : on reste au chaud.', exEn: "It's raining, but look on the bright side: we stay warm." }],
  ['elle a commencé à reprendre confiance', 'reprendre', 'confiance', { tag: 'expression', word: 'reprendre confiance', ipa: '/ʁə.pʁɑ̃dʁ kɔ̃.fjɑ̃s/', mean: 'to regain confidence', ex: 'Grâce à son coach, il a repris confiance.', exEn: 'Thanks to his coach, he regained confidence.' }],
  ['ce n\'est pas sourire coûte que coûte', 'coûte', 'coûte', { tag: 'expression', word: 'coûte que coûte', ipa: '/kut kə kut/', mean: 'no matter what, at all costs', ex: 'Je veux finir ce livre coûte que coûte.', exEn: 'I want to finish this book no matter what.' }, 3],
  ['acheter une chemise de rechange', 'de', 'rechange', { tag: 'expression', word: 'de rechange', ipa: '/də ʁə.ʃɑ̃ʒ/', mean: 'spare', ex: 'Prends des chaussettes de rechange pour la randonnée.', exEn: 'Take spare socks for the hike.' }],
];
const BR = [];
cur = 0;
for (const [s, a, b, v, len] of V) { F(s); BR.push(len ? [s, a, b, len] : [s, a, b]); }
fs.writeFileSync(dir + 'br.json', JSON.stringify(BR, null, 1));
fs.writeFileSync(dir + 'vocab.full.json', JSON.stringify(V.map(x => x[3]), null, 1));

// ---------- stories: c / beat c given as text; resolved to chunk numbers ----------
const S = [
  { c: ['Bienvenue dans The Cozy French', 'grâce à des conversations'], place: 'papier', beats: [
    { c: 'Bienvenue dans', w: 'Bienvenue', do: 'title', text: 'The Cozy French', sub: 'notre petit coin chaleureux', y: 300, mark: 'Cozy' },
    { c: 'grâce à des conversations', w: 'conversations', do: 'icons', y: 620, items: [{ icon: 'amis', label: 'des conversations' }, { icon: 'cafe', label: 'de tous les jours' }] },
  ] },
  { c: ['Que vous soyez dans le bus', 'faites comme chez vous'], place: 'papier', beats: [
    { c: 'Que vous soyez dans le bus', w: 'bus', do: 'draw', icon: 'voiture', x: 480, y: 380, size: 300, label: 'dans le bus' },
    { c: 'à la maison ou en promenade', w: 'maison', do: 'draw', icon: 'x:home', x: 960, y: 380, size: 220, label: 'à la maison' },
    { c: 'à la maison ou en promenade', w: 'promenade', do: 'draw', icon: 'nature', x: 1440, y: 380, size: 300, label: 'en promenade' },
    { c: 'faites comme chez vous', w: 'faites', do: 'write', text: 'Faites comme chez vous…', x: 960, y: 660, size: 84, color: '#b8552a' },
  ] },
  { c: ['Ce matin, j\'ai renversé', 'Une matinée absolument magnifique'], place: 'papier', beats: [
    { c: 'Ce matin, j\'ai renversé', do: 'list', title: 'Ce matin…', x: 400, y: 400, items: [
      { text: 'café renversé', icon: 'cafe', c: 'Ce matin, j\'ai renversé', w: 'renversé' },
      { text: 'tram raté', icon: 'voiture', c: 'j\'ai raté mon tram', w: 'raté' },
      { text: 'parapluie oublié', icon: 'pluie', c: 'j\'ai raté mon tram', w: 'oublié' }] },
    { c: 'Une matinée absolument magnifique', w: 'magnifique', do: 'stamp', text: 'Magnifique !', x: 1450, y: 380, color: '#b8552a' },
    { c: 'Une matinée absolument magnifique', w: 'magnifique', do: 'draw', icon: 'x:e-cry', x: 1450, y: 620, size: 150 },
  ] },
  { c: ['Parce qu\'après avoir raté le tram', 'que je n\'avais pas vu depuis longtemps'], place: 'rue', cast: [{ id: 'm', who: 'mat', x: 1250 }], beats: [
    { c: 'Parce qu\'après avoir raté le tram', w: 'raté', do: 'face', on: 'm', face: 'flat' },
    { c: 'je suis entré dans une boulangerie', w: 'boulangerie', do: 'circle', x: 240, y: 460, rx: 230, ry: 70 },
    { c: 'La boulangère m\'a offert', w: 'offert', do: 'face', on: 'm', face: 'happy' },
    { c: 'La boulangère m\'a offert', w: 'biscuit', do: 'say', on: 'm', text: 'Un petit biscuit !', until: { c: 'Et puis, j\'ai croisé' } },
    { c: 'Et puis, j\'ai croisé', w: 'voisin', do: 'face', on: 'm', face: 'star' },
    { c: 'Et puis, j\'ai croisé', w: 'voisin', do: 'burst', on: 'm', icons: ['♥', '★', '♥'] },
  ] },
  { c: ['« The Power of Positivity »', 'nous surprendre ou nous donner de l\'espoir'], place: 'papier', beats: [
    { c: '« The Power of Positivity »', w: 'Power', do: 'title', text: 'The Power of Positivity', sub: 'le pouvoir de la pensée positive', y: 240, id: 't', mark: 'Positivity' },
    { c: 'on va apprendre à sourire', w: 'sourire', do: 'text', text: 'sourire quand le tram part sans nous ?', y: 500, size: 56, id: 'q' },
    { c: 'Pas du tout !', w: 'Pas', do: 'stamp', text: 'Pas du tout !', x: 960, y: 690, id: 's' },
    { c: 'Nous allons parler d\'une attitude', w: 'attitude', do: 'hide', ids: ['q', 's'] },
    { c: 'reconnaître les difficultés', w: 'reconnaître', do: 'icons', y: 560, items: [
      { icon: 'b:search', label: 'les difficultés', c: 'reconnaître les difficultés', w: 'difficultés' },
      { icon: 'b:heart', label: 'ce qui peut aider', c: 'sans oublier ce qui peut', w: 'aider' },
      { icon: 'soleil', label: 'l\'espoir', c: 'nous surprendre ou nous donner', w: 'espoir' }] },
  ] },
  { c: ['Parce que si être positif', 'je déclare forfait'], place: 'papier', beats: [
    { c: 'Parce que si être positif', w: 'positif', do: 'draw', icon: 'x:e-joy', x: 380, y: 380, size: 200, label: 'joyeux tout le temps ?' },
    { c: 'signifie être joyeux tout le temps', w: 'temps', do: 'battery', from: 100, to: 5, d: 2.6, x: 1500, y: 280, label: 'mon énergie' },
    { c: 'je déclare forfait', w: 'lundi', do: 'calendar', labels: ['LUNDI'], d: .6, x: 1700, y: 560 },
    { c: 'je déclare forfait', w: 'forfait', do: 'stamp', text: 'Forfait !', x: 400, y: 640, color: '#9a4a3a' },
  ] },
  { c: ['Nous allons discuter de nos pensées', 'sur plusieurs expressions utiles'], place: 'papier', beats: [
    { c: 'Nous allons discuter de nos pensées', do: 'list', title: 'Aujourd\'hui…', x: 760, y: 380, items: [
      { text: 'nos pensées', icon: 'b:question', c: 'Nous allons discuter de nos pensées', w: 'pensées' },
      { text: 'nos petits moments heureux', icon: 'b:heart', c: 'de nos petits moments heureux', w: 'heureux' },
      { text: 'nos objectifs', icon: 'x:target', c: 'de nos objectifs', w: 'objectifs' },
      { text: 'les périodes moins faciles', icon: 'pluie', c: 'de traverser les périodes', w: 'périodes' }] },
    { c: 'Avec nos histoires habituelles', w: 'histoires', do: 'note', text: 'des histoires, des plaisanteries…', x: 1450, y: 300 },
    { c: 'sur plusieurs expressions utiles', w: 'expressions', do: 'stamp', text: 'expressions utiles', x: 1450, y: 600, color: '#6f8e6b' },
  ] },
  { c: ['En général, je prends mon téléphone', 'je me sens encore plus fatigué'], place: 'chambre', cast: [{ id: 'm', who: 'mat', x: 320 }], beats: [
    { c: 'En général, je prends mon téléphone', w: 'téléphone', do: 'hold', on: 'm', prop: 'phone' },
    { c: 'Je regarde les messages', w: 'messages', do: 'icons', y: 260, items: [
      { icon: 'x:mail', label: 'les messages', c: 'Je regarde les messages', w: 'messages' },
      { icon: 'x:letter', label: 'les nouvelles', c: 'Je regarde les messages', w: 'nouvelles' },
      { icon: 'b:heart', label: 'des vies parfaites', c: 'qui semblent avoir des vies', w: 'parfaites' }] },
    { c: 'Dix minutes plus tard', w: 'minutes', do: 'battery', from: 80, to: 8, d: 2.2, x: 1000, y: 540, label: 'mon énergie' },
    { c: 'je me sens encore plus fatigué', w: 'fatigué', do: 'face', on: 'm', face: 'tired' },
    { c: 'je me sens encore plus fatigué', w: 'fatigué', do: 'droop', on: 'm' },
  ] },
  { c: ['Le soir, je repassais dans ma tête', 'si j\'allais faire une erreur'], place: 'chambre', cast: [{ id: 'l', who: 'lea', x: 640 }], beats: [
    { c: 'Le soir, je repassais dans ma tête', w: 'soir', do: 'sky', d: 2.5, n: 2 },
    { c: 'Le soir, je repassais dans ma tête', w: 'tête', do: 'face', on: 'l', face: 'flat' },
    { c: 'Je me demandais si j\'avais oublié', w: 'oublié', do: 'dream', icons: ['travail', 'b:question'], label: 'J\'ai oublié quelque chose ?', x: 1150, y: 280 },
    { c: 'si un collègue était mécontent', w: 'mécontent', do: 'face', on: 'l', face: 'sad' },
    { c: 'si j\'allais faire une erreur', w: 'erreur', do: 'stamp', text: 'Une erreur ?', x: 1300, y: 560, color: '#9a4a3a' },
  ] },
  { c: ['j\'ai voulu apprendre à dessiner', 'à une pomme de terre avec quatre pattes'], place: 'papier', beats: [
    { c: 'j\'ai voulu apprendre à dessiner', w: 'dessiner', do: 'draw', icon: 'x:pencil', x: 420, y: 380, size: 200, label: 'apprendre à dessiner' },
    { c: 'Je regardais des artistes incroyables', w: 'incroyables', do: 'icons', y: 300, items: [{ icon: '★', label: 'incroyable' }, { icon: '★', label: 'parfait' }] },
    { c: 'j\'avais envie de tout arrêter', w: 'arrêter', do: 'draw', icon: 'x:e-sad', x: 1500, y: 380, size: 160 },
    { c: 'Mon premier chien ressemblait', w: 'chien', do: 'write', text: 'mon premier chien…', x: 520, y: 560, size: 76, color: '#3a2e28' },
    { c: 'à une pomme de terre', w: 'pomme', do: 'stamp', text: 'une pomme de terre ?', x: 1350, y: 640, color: '#b8552a' },
  ] },
  { c: ['Dimanche soir, je suis capable', 'Lundi matin, je négocie avec mon réveil'], place: 'papier', beats: [
    { c: 'Dimanche soir, je suis capable', w: 'Dimanche', do: 'vs', left: { icon: 'b:calendar', label: 'Dimanche soir : une nouvelle vie !' },
      right: { icon: 'x:alarm', label: 'Lundi matin : négocier avec le réveil', c: 'Lundi matin, je négocie', w: 'Lundi' }, y: 420 },
  ] },
  { c: ['J\'espérais organiser une petite exposition', 'mais l\'événement a finalement été annulé'], place: 'papier', beats: [
    { c: 'J\'espérais organiser une petite exposition', w: 'exposition', do: 'title', text: 'Petite exposition de photos', y: 260, mark: 'photos' },
    { c: 'Nous avions trouvé un lieu', do: 'list', x: 760, y: 520, items: [
      { text: 'un lieu', icon: 'x:home', c: 'Nous avions trouvé un lieu', w: 'lieu' },
      { text: 'une sélection', icon: 'b:search', c: 'préparé une sélection', w: 'sélection' }] },
    { c: 'mais l\'événement a finalement été annulé', w: 'annulé', do: 'stamp', text: 'ANNULÉ', x: 1350, y: 520, color: '#9a4a3a' },
  ] },
  { c: ['Nous avons marché, parlé de tout', 'j\'ai repris mon appareil'], place: 'rue', cast: [{ id: 'm', who: 'mat', x: 300, face: 'flat' }], beats: [
    { c: 'Nous avons marché, parlé de tout', w: 'marché', do: 'walk', on: 'm', to: 900, d: 3 },
    { c: 'à remarquer la lumière sur les arbres', w: 'lumière', do: 'face', on: 'm', face: 'wow' },
    { c: 'à remarquer la lumière sur les arbres', w: 'lumière', do: 'draw', icon: 'soleil', x: 1500, y: 260, size: 260 },
    { c: 'j\'ai repris mon appareil', w: 'repris', do: 'face', on: 'm', face: 'happy' },
    { c: 'j\'ai repris mon appareil', w: 'appareil', do: 'burst', on: 'm' },
  ] },
  { c: ['que son fils avait voulu', 'Il avait confondu le sel et le sucre'], place: 'cuisine', beats: [
    { c: 'préparer un gâteau tout seul', w: 'gâteau', do: 'draw', icon: 'repas', x: 420, y: 360, size: 300, label: 'un gâteau tout seul' },
    { c: 'Il avait confondu le sel et le sucre', w: 'sel', do: 'vs', left: { icon: 'S', label: 'le sel' }, right: { icon: 'S', label: 'le sucre', c: 'Il avait confondu le sel et le sucre', w: 'sucre' }, mid: '?', x: 1540, y: 420 },
  ] },
  { c: ['Ça peut être une bonne conversation', 'ou une tâche enfin terminée'], place: 'papier', beats: [
    { c: 'Ça peut être une bonne conversation', do: 'list', title: 'Une chose qui s\'est bien passée', x: 960, y: 380, items: [
      { text: 'une bonne conversation', icon: 'amis', c: 'Ça peut être une bonne conversation', w: 'conversation' },
      { text: 'un repas que j\'ai aimé', icon: 'repas', c: 'un repas que j\'ai aimé', w: 'repas' },
      { text: 'une tâche enfin terminée', icon: 'x:yes', c: 'ou une tâche enfin terminée', w: 'tâche' }] },
  ] },
  { c: ['une tasse de café décider', 'pour douze heures'], place: 'papier', beats: [
    { c: 'une tasse de café décider', w: 'tasse', do: 'draw', icon: 'cafe', x: 620, y: 400, size: 320, label: 'une tasse de café' },
    { c: 'une tasse de café décider', w: 'humeur', do: 'arrow', from: [820, 400], to: [1180, 400], bend: -.2 },
    { c: 'pour douze heures', w: 'douze', do: 'clock', d: 2, x: 1400, y: 400 },
  ] },
];
let sc = 0; const res = (s, from) => F(s, from);
const out = S.map(st => {
  const c0 = res(st.c[0], sc), c1 = res(st.c[1], c0); sc = c1 + 1;
  const fix = o => { const r = { ...o }; if (typeof r.c === 'string') r.c = res(r.c, c0);
    if (r.until && typeof r.until.c === 'string') r.until = { ...r.until, c: res(r.until.c, c0) };
    if (r.items) r.items = r.items.map(it => typeof it.c === 'string' ? { ...it, c: res(it.c, c0) } : it);
    if (r.right && typeof r.right.c === 'string') r.right = { ...r.right, c: res(r.right.c, c0) };
    return r; };
  return { ...st, c: [c0, c1], beats: st.beats.map(fix) };
});
fs.writeFileSync(dir + 'stories.json', JSON.stringify(out, null, 1));
console.log('extras', X.length, 'vocab', V.length, 'stories', out.length, out.map(s => s.c.join('-')).join(' '));
