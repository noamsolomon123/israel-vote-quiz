// Generates agendas/<id>.html from data/politicians.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { politicians, topics } = JSON.parse(readFileSync(join(root, 'data', 'politicians.json'), 'utf8'));
mkdirSync(join(root, 'agendas'), { recursive: true });

const CONF_HE = { high: 'מקור מבוסס', medium: 'מקור חלקי', low: 'עמדה לא ברורה' };

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s,)\]]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

for (const p of politicians) {
  const sections = Object.entries(topics).map(([tid, t]) => {
    const pos = p.positions[tid];
    if (!pos) return '';
    return `  <div class="agenda-section">
    <h3>${t.title_he} <span class="conf ${pos.confidence}">${CONF_HE[pos.confidence] || ''}</span></h3>
    <p class="stance">${pos.summary_he}</p>
    <p class="evidence">${linkify(pos.evidence)}</p>
  </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.name_he} — האג'נדה המלאה | בחירות 2026</title>
<link rel="stylesheet" href="../css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;800;900&display=swap" rel="stylesheet">
</head>
<body>
<div class="agenda-body">
  <a class="back-link" href="../index.html">‹ חזרה לשאלון</a>
  <div class="agenda-header">
    <span class="avatar" style="background:${p.color}">${p.initials}</span>
    <div>
      <h1>${p.name_he}</h1>
      <div class="party">${p.party_he}</div>
    </div>
  </div>
  <p class="agenda-bio">${p.bio_he}</p>
${sections}
  <p class="disclaimer">העמדות מבוססות על ציטוטים, הצבעות ומקורות פומביים נכון ליולי 2026. ייתכנו שינויים בעמדות לאורך הקמפיין. כלי חינוכי בלבד.</p>
</div>
</body>
</html>`;
  writeFileSync(join(root, 'agendas', `${p.id}.html`), html);
  console.log(`agendas/${p.id}.html`);
}
