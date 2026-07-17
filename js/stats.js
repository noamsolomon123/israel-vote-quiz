/* City stats — Likud vote share vs socioeconomic cluster (2022 / CBS 2021) */
(async function () {
  const V = '4';
  const data = await fetch('data/city-stats.json?v=' + V).then(r => r.json());
  const cities = data.cities;
  const $ = id => document.getElementById(id);

  const TYPE = {
    general: { c: '#4f8ef7', label: 'עיר יהודית כללית' },
    haredi:  { c: '#7c5cff', label: 'עיר חרדית' },
    arab:    { c: '#1f9d55', label: 'עיר ערבית' },
    mixed:   { c: '#f7c948', label: 'מעורבת (ירושלים)' },
  };

  // ---- Pearson correlation among "general" Jewish cities ----
  const gen = cities.filter(c => c.type === 'general');
  function pearson(arr, fx, fy) {
    const n = arr.length, mx = arr.reduce((s, a) => s + fx(a), 0) / n, my = arr.reduce((s, a) => s + fy(a), 0) / n;
    let sxy = 0, sx = 0, sy = 0;
    arr.forEach(a => { const dx = fx(a) - mx, dy = fy(a) - my; sxy += dx * dy; sx += dx * dx; sy += dy * dy; });
    return sxy / Math.sqrt(sx * sy);
  }
  const rGen = pearson(gen, c => c.cluster, c => c.likud);

  // ---- Scatter (SVG) ----
  const W = 720, H = 460, m = { t: 24, r: 20, b: 54, l: 54 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const xMin = 1, xMax = 10, yMin = 0, yMax = 50;
  const sx = v => m.l + ((v - xMin) / (xMax - xMin)) * iw;
  const sy = v => m.t + ih - ((v - yMin) / (yMax - yMin)) * ih;

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="scatter" role="img" aria-label="גרף פיזור">`;
  // grid + axes
  for (let g = 0; g <= 50; g += 10) {
    svg += `<line x1="${m.l}" y1="${sy(g)}" x2="${W - m.r}" y2="${sy(g)}" stroke="#2a3548" stroke-width="1"/>`;
    svg += `<text x="${m.l - 8}" y="${sy(g) + 4}" fill="#9aa7bd" font-size="12" text-anchor="end">${g}%</text>`;
  }
  for (let x = 1; x <= 10; x++) {
    svg += `<text x="${sx(x)}" y="${H - m.b + 20}" fill="#9aa7bd" font-size="12" text-anchor="middle">${x}</text>`;
  }
  svg += `<text x="${m.l + iw / 2}" y="${H - 6}" fill="#cdd6e6" font-size="13" text-anchor="middle" font-weight="700">אשכול חברתי-כלכלי (1 נמוך ← → 10 גבוה)</text>`;
  svg += `<text x="16" y="${m.t + ih / 2}" fill="#cdd6e6" font-size="13" text-anchor="middle" font-weight="700" transform="rotate(-90 16 ${m.t + ih / 2})">אחוז תמיכה בליכוד</text>`;
  // points
  cities.forEach(c => {
    const col = (TYPE[c.type] || TYPE.general).c;
    svg += `<circle cx="${sx(c.cluster)}" cy="${sy(c.likud)}" r="6" fill="${col}" stroke="#0f1420" stroke-width="1.5"><title>${c.name}: ${c.likud}% ליכוד, אשכול ${c.cluster}</title></circle>`;
  });
  svg += `</svg>`;
  $('scatter').innerHTML = svg;

  // ---- Legend ----
  $('legend').innerHTML = Object.values(TYPE).map(t =>
    `<span class="lg"><span class="dot" style="background:${t.c}"></span>${t.label}</span>`).join('');

  // ---- Ranked bars (most Likud → least) ----
  const ranked = [...cities].sort((a, b) => b.likud - a.likud);
  const maxL = Math.max(...cities.map(c => c.likud));
  $('bars').innerHTML = ranked.map(c => {
    const col = (TYPE[c.type] || TYPE.general).c;
    return `<div class="bar-row">
      <span class="bar-city">${c.name} <span class="bar-cl">אשכול ${c.cluster}</span></span>
      <span class="bar-track"><span class="bar-fill" style="width:${(c.likud / maxL) * 100}%;background:${col}"></span></span>
      <span class="bar-val">${c.likud}%</span>
    </div>`;
  }).join('');

  // ---- Interpretation ----
  $('rval').textContent = rGen.toFixed(2);
  $('meta-note').textContent = data.meta.note;
  $('sources').innerHTML =
    `מקורות: <a href="${data.meta.vote_url}" target="_blank" rel="noopener">${data.meta.vote_source}</a> · ` +
    `<a href="${data.meta.socio_url}" target="_blank" rel="noopener">${data.meta.socio_source}</a>`;

  $('statsBackBtn').onclick = () => { location.href = 'index.html'; };
})();
