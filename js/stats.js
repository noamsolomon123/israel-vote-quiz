/* City stats — vote patterns vs socioeconomic cluster (2022 / CBS 2021) */
(async function () {
  const V = '6';
  const data = await fetch('data/city-stats.json?v=' + V).then(r => r.json());
  const cities = data.cities;
  const parties = data.parties;
  const $ = id => document.getElementById(id);

  const TYPE = {
    general: { c: '#4f8ef7', label: 'עיר יהודית כללית' },
    haredi:  { c: '#7c5cff', label: 'עיר חרדית' },
    arab:    { c: '#1f9d55', label: 'עיר ערבית' },
    mixed:   { c: '#f7c948', label: 'מעורבת (יהודית-ערבית)' },
  };
  const gen = cities.filter(c => c.type === 'general');

  function stat(arr, fx, fy) {
    const n = arr.length, mx = arr.reduce((s, a) => s + fx(a), 0) / n, my = arr.reduce((s, a) => s + fy(a), 0) / n;
    let sxy = 0, sx = 0, sy = 0;
    arr.forEach(a => { const dx = fx(a) - mx, dy = fy(a) - my; sxy += dx * dy; sx += dx * dx; sy += dy * dy; });
    return { r: sxy / Math.sqrt(sx * sy), slope: sxy / sx, intercept: my - (sxy / sx) * mx };
  }
  const avg = (arr, f) => arr.reduce((s, a) => s + f(a), 0) / arr.length;

  // ---- generic scatter builder ----
  function scatter(containerId, yField, yMax, trendColor, labelSet, ariaLabel) {
    const W = 720, H = 460, m = { t: 20, r: 22, b: 56, l: 54 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const sx = v => m.l + ((v - 1) / 9) * iw;
    const sy = v => m.t + ih - (v / yMax) * ih;
    const reg = stat(gen, c => c.cluster, c => c[yField]);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="scatter" role="img" aria-label="${ariaLabel}">`;
    for (let g = 0; g <= yMax; g += yMax / 5) {
      s += `<line x1="${m.l}" y1="${sy(g)}" x2="${W - m.r}" y2="${sy(g)}" stroke="#2a3548"/>`;
      s += `<text x="${m.l - 8}" y="${sy(g) + 4}" fill="#9aa7bd" font-size="12" text-anchor="end">${Math.round(g)}%</text>`;
    }
    for (let x = 1; x <= 10; x++) {
      s += `<line x1="${sx(x)}" y1="${m.t}" x2="${sx(x)}" y2="${m.t + ih}" stroke="#212b40"/>`;
      s += `<text x="${sx(x)}" y="${H - m.b + 20}" fill="#9aa7bd" font-size="12" text-anchor="middle">${x}</text>`;
    }
    s += `<text x="${m.l + iw / 2}" y="${H - 6}" fill="#cdd6e6" font-size="13" text-anchor="middle" font-weight="700">אשכול חברתי-כלכלי (1 נמוך ← → 10 גבוה)</text>`;
    // trend line
    const cl = v => Math.max(0, Math.min(yMax, v));
    s += `<line x1="${sx(1)}" y1="${sy(cl(reg.intercept + reg.slope))}" x2="${sx(10)}" y2="${sy(cl(reg.intercept + reg.slope * 10))}" stroke="${trendColor}" stroke-width="2.5" stroke-dasharray="7 5" opacity="0.85"/>`;
    // points
    cities.forEach(c => {
      const col = (TYPE[c.type] || TYPE.general).c;
      s += `<circle cx="${sx(c.cluster)}" cy="${sy(c[yField])}" r="7" fill="${col}" stroke="#0f1420" stroke-width="1.5"><title>${c.name}: ${c[yField]}% · אשכול ${c.cluster}</title></circle>`;
    });
    // labels
    cities.forEach(c => {
      if (!labelSet[c.name]) return;
      const [dx, dy, anchor] = labelSet[c.name];
      s += `<text x="${sx(c.cluster) + dx}" y="${sy(c[yField]) + dy}" fill="#dfe6f2" font-size="11.5" font-weight="600" text-anchor="${anchor}">${c.name}</text>`;
    });
    s += `</svg>`;
    $(containerId).innerHTML = s;
    return reg;
  }

  const labA = {
    'אילת': [10, 4, 'start'], 'קריית אתא': [-10, -8, 'end'], 'באר שבע': [10, 4, 'start'],
    'תל אביב-יפו': [-10, 4, 'end'], 'גבעתיים': [-10, 4, 'end'], 'הרצליה': [10, 4, 'start'],
    'בני ברק': [10, 4, 'start'], 'אום אל-פחם': [10, 4, 'start'], 'נצרת': [10, 4, 'start'], 'ירושלים': [10, 4, 'start'],
  };
  const labB = {
    'גבעתיים': [-10, 4, 'end'], 'הרצליה': [10, 4, 'start'], 'תל אביב-יפו': [-10, 4, 'end'],
    'באר שבע': [10, 14, 'start'], 'אילת': [10, 4, 'start'], 'בני ברק': [10, 4, 'start'],
    'טבריה': [10, 14, 'start'], 'נס ציונה': [10, -6, 'start'],
  };
  const regA = scatter('scatterLikud', 'likud', 50, '#ff6b8b', labA, 'גרף פיזור: אחוז תמיכה בליכוד לפי עיר מול האשכול החברתי-כלכלי. ככל שהאשכול גבוה יותר, התמיכה בליכוד יורדת.');
  const regB = scatter('scatterLeft', 'center_left', 70, '#4f8ef7', labB, 'גרף פיזור: אחוז תמיכה בגוש המרכז-שמאל לפי עיר מול האשכול החברתי-כלכלי. ככל שהאשכול גבוה יותר, התמיכה במרכז-שמאל עולה.');

  const rLikud = stat(gen, c => c.cluster, c => c.likud).r;
  const rLeft = stat(gen, c => c.cluster, c => c.center_left).r;
  const rBibi = stat(gen, c => c.cluster, c => c.netanyahu_bloc).r;
  const genW = gen.filter(c => c.avg_wage != null);
  const rWageLeft = stat(genW, c => c.avg_wage, c => c.center_left).r;
  const rAcadLeft = stat(gen.filter(c => c.pct_academic != null), c => c.pct_academic, c => c.center_left).r;

  // ---- legends ----
  const typeLegend = Object.values(TYPE).map(t =>
    `<span class="lg"><span class="dot" style="background:${t.c}"></span>${t.label}</span>`).join('');
  $('legendLikud').innerHTML = typeLegend + `<span class="lg"><span class="dash" style="background:#ff6b8b"></span>קו מגמה</span>`;
  $('legendLeft').innerHTML = typeLegend + `<span class="lg"><span class="dash" style="background:#4f8ef7"></span>קו מגמה</span>`;

  // ---- winner per city ----
  const order = [...cities].sort((a, b) => a.cluster - b.cluster || a.name.localeCompare(b.name, 'he'));
  $('winners').innerHTML = order.map(c => {
    const p = parties[c.winner] || { he: c.winner, color: '#888' };
    return `<div class="win-chip" style="border-color:${p.color}">
      <span class="win-city">${c.name}</span>
      <span class="win-cl">אשכול ${c.cluster}</span>
      <span class="win-party" style="background:${p.color}">${p.he} ${c.shares[c.winner]}%</span>
    </div>`;
  }).join('');

  // ---- conclusions ----
  const rich = gen.filter(c => c.cluster >= 8), midlow = gen.filter(c => c.cluster <= 5);
  const conclusions = [
    `<strong>ככל שהעיר עשירה יותר — היא מצביעה יותר מרכז-שמאל.</strong> בין הערים היהודיות הכלליות המתאם בין האשכול הכלכלי לתמיכה בגוש המרכז-שמאל (יש עתיד, המחנה הממלכתי, העבודה, מרצ) חזק מאוד וחיובי: <strong>r = ${rLeft.toFixed(2)}</strong>. בערים העשירות (אשכול 8+) הגוש הזה מקבל ${avg(rich, c => c.center_left).toFixed(0)}% בממוצע, מול ${avg(midlow, c => c.center_left).toFixed(0)}% בלבד בערי אשכול ≤5.`,
    `<strong>ובאותה מידה — עשירות יותר = פחות גוש נתניהו.</strong> המתאם בין האשכול לתמיכה בגוש נתניהו (ליכוד, הציונות הדתית, ש"ס, יהדות התורה) שלילי מאוד: <strong>r = ${rBibi.toFixed(2)}</strong>. בליכוד לבדו: <strong>r = ${rLikud.toFixed(2)}</strong>.</strong>`,
    `<strong>הליכוד חזק בפריפריה ובמעמד-הביניים-נמוך היהודי</strong> (אילת 43.7%, קריית אתא 42.8%, באר שבע 40.3%, אשקלון 39.7%), וחלש בערי גוש דן העשירות (גבעתיים 15.8%, תל אביב 17%).`,
    `<strong>אבל כלכלה לבדה לא מנבאת הצבעה:</strong> הערים החרדיות (בני ברק, בית שמש) והערביות (אום אל-פחם, נצרת) נמוכות באשכול אך אינן מצביעות ליכוד כלל — הן מצביעות למפלגות המגזריות שלהן (יהדות התורה/ש"ס, חד"ש-תע"ל/בל"ד/רע"מ). כאן הזהות הקהילתית גוברת על הכלכלה. לכן הן מוחרגות מקו המגמה.`,
    `<strong>גם שכר והשכלה מתואמים חזק עם הצבעה:</strong> בערים היהודיות הכלליות, ככל שהשכר הממוצע גבוה יותר — התמיכה במרכז-שמאל עולה (r = ${rWageLeft.toFixed(2)}), וכך גם ככל ששיעור האקדמאים גבוה יותר (r = ${rAcadLeft.toFixed(2)}). זהו אותו דפוס: ערי גוש דן העשירות והמשכילות נוטות מרכז-שמאל, וערי הפריפריה נוטות לליכוד.`,
    `<strong>מה זה כן ומה זה לא:</strong> אלה <em>דפוסי הצבעה קבוצתיים</em> ומתאם סטטיסטי — לא סיבתיות, ובוודאי לא "חוכמה" או "איכות" של תושבים. עיר אינה טובה או פחותה מאחרת לפי איך שהיא מצביעה. גם שיעור גיוס נמוך בערים ערביות/חרדיות משקף הסדרי פטור — לא "תרומה" נמוכה.`,
  ];
  $('conclusions').innerHTML = conclusions.map(c => `<li>${c}</li>`).join('');

  // ---- ranked bars (Likud) ----
  const ranked = [...cities].sort((a, b) => b.likud - a.likud);
  const maxL = Math.max(...cities.map(c => c.likud));
  $('bars').innerHTML = ranked.map(c => {
    const col = (TYPE[c.type] || TYPE.general).c;
    return `<div class="bar-row"><span class="bar-city">${c.name} <span class="bar-cl">אשכול ${c.cluster}</span></span>
      <span class="bar-track"><span class="bar-fill" style="width:${(c.likud / maxL) * 100}%;background:${col}"></span></span>
      <span class="bar-val">${c.likud}%</span></div>`;
  }).join('');

  // ---- per-city metrics table ----
  const tRows = [...cities].sort((a, b) => (b.avg_wage || 0) - (a.avg_wage || 0));
  const fmt = (v, suf = '') => v == null ? '—' : v + suf;
  $('metricsTable').innerHTML = `
    <table class="mtab">
      <thead><tr>
        <th>עיר</th><th>אשכול</th><th>שכר ממוצע ₪</th><th>% אקדמאים</th><th>גיוס גברים</th><th>גיוס נשים</th><th>אבטלה</th>
      </tr></thead>
      <tbody>
        ${tRows.map(c => `<tr>
          <td class="mt-city">${c.name}</td>
          <td>${c.cluster}</td>
          <td>${fmt(c.avg_wage != null ? c.avg_wage.toLocaleString('he-IL') : null)}</td>
          <td>${fmt(c.pct_academic, '%')}</td>
          <td>${fmt(c.idf_men, '%')}</td>
          <td>${fmt(c.idf_women, '%')}</td>
          <td>${fmt(c.unemployment, '%')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  $('metricsNote').textContent = data.meta.metrics_note;
  $('metricsSrc').textContent = 'מקור: ' + data.meta.metrics_source;

  $('meta-note').textContent = data.meta.note;
  $('sources').innerHTML =
    `מקורות: <a href="${data.meta.vote_url}" target="_blank" rel="noopener">${data.meta.vote_source}</a> · ` +
    `<a href="${data.meta.socio_url}" target="_blank" rel="noopener">${data.meta.socio_source}</a>`;
  $('statsBackBtn').onclick = () => { location.href = 'index.html'; };
})();
