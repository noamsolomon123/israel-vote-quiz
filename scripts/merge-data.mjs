// Merges data/_group*.json into data/politicians.json with topics meta + colors
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');

const META = {
  netanyahu: { color: '#2f6fdb', initials: 'בנ' },
  bennett:   { color: '#0fb5a5', initials: 'נב' },
  eisenkot:  { color: '#f0a33c', initials: 'גא' },
  golan:     { color: '#e2526b', initials: 'יג' },
  gantz:     { color: '#3752a3', initials: 'בג' },
  lieberman: { color: '#6b8bb5', initials: 'אל' },
  bengvir:   { color: '#c98f1e', initials: 'אב' },
  smotrich:  { color: '#e0742e', initials: 'בס' },
  deri:      { color: '#16a085', initials: 'אד' },
  goldknopf: { color: '#444f66', initials: 'יג' },
  abbas:     { color: '#1f7a3d', initials: 'מע' },
  jointlist: { color: '#b22222', initials: 'יג' }
};

const topics = {
  T1:  { title_he: 'סיום המלחמה ועסקת חטופים' },
  T2:  { title_he: 'שליטה והתיישבות בעזה' },
  T3:  { title_he: 'עידוד הגירה מעזה' },
  T4:  { title_he: 'מדינה פלסטינית' },
  T5:  { title_he: 'ריבונות והתנחלויות ביהודה ושומרון' },
  T6:  { title_he: 'הרפורמה המשפטית' },
  T7:  { title_he: 'גיוס חרדים' },
  T8:  { title_he: 'דת ומדינה — שבת ונישואים' },
  T9:  { title_he: 'שוק חופשי מול מדינת רווחה' },
  T10: { title_he: 'יוקר המחיה ודיור' },
  T11: { title_he: 'החברה הערבית' },
  T12: { title_he: 'עונש מוות למחבלים' },
  T13: { title_he: 'איראן' },
  T14: { title_he: 'המשך כהונת נתניהו' },
  T15: { title_he: 'זכויות להט"ב' },
  T16: { title_he: 'חוק השבות — סעיף הנכד' }
};

const ORDER = ['netanyahu','bennett','eisenkot','golan','gantz','lieberman','bengvir','smotrich','deri','goldknopf','abbas','jointlist'];

const all = [];
for (const g of ['_group1.json','_group2.json','_group3.json','_group4.json']) {
  const j = JSON.parse(readFileSync(join(dataDir, g), 'utf8'));
  all.push(...j.politicians);
}

const politicians = ORDER.map(id => {
  const p = all.find(x => x.id === id);
  if (!p) throw new Error(`missing ${id}`);
  for (const t of Object.keys(topics)) {
    if (!p.positions[t]) throw new Error(`${id} missing ${t}`);
    if (![-2,-1,0,1,2].includes(p.positions[t].score)) throw new Error(`${id} ${t} bad score`);
  }
  return { ...p, ...META[id] };
});

writeFileSync(join(dataDir, 'politicians.json'), JSON.stringify({ topics, politicians }, null, 1));
for (const g of ['_group1.json','_group2.json','_group3.json','_group4.json']) unlinkSync(join(dataDir, g));
console.log(`politicians.json: ${politicians.length} politicians, ${Object.keys(topics).length} topics`);
