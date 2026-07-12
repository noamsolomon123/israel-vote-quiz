/* Israel Vote Quiz 2026 — engine */
(async function () {
  const [questions, polData] = await Promise.all([
    fetch('data/questions.json').then(r => r.json()),
    fetch('data/politicians.json').then(r => r.json()),
  ]);
  const politicians = polData.politicians;

  const CONF_W = { high: 1, medium: 0.75, low: 0.4 };
  const SCALE_LABELS = [
    { v: -2, t: 'מתנגד/ת בתוקף' },
    { v: -1, t: 'מתנגד/ת' },
    { v: 0,  t: 'ניטרלי/ת' },
    { v: 1,  t: 'מסכים/ה' },
    { v: 2,  t: 'מסכים/ה מאוד' },
  ];

  const answers = new Array(questions.length).fill(null); // {value, weight}
  let idx = 0;

  const $ = id => document.getElementById(id);
  const screens = { landing: $('landing'), quiz: $('quiz'), results: $('results') };
  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);
  }

  $('startBtn').onclick = () => { idx = 0; render(); show('quiz'); };
  $('restartBtn').onclick = () => { answers.fill(null); idx = 0; render(); show('quiz'); };

  function render() {
    const q = questions[idx];
    $('progressText').textContent = `${idx + 1} / ${questions.length}`;
    $('progressFill').style.width = `${(idx / questions.length) * 100}%`;
    $('topicTag').textContent = q.topic_he;
    $('questionText').textContent = q.text_he;

    const wrap = $('answers');
    wrap.innerHTML = '';
    wrap.className = 'answers' + (q.type === 'scale' ? ' scale' : '');
    const opts = q.type === 'scale'
      ? SCALE_LABELS.map(o => ({ text_he: o.t, value: o.v }))
      : q.choices;
    opts.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt.text_he;
      if (answers[idx] && answers[idx].value === opt.value && answers[idx].text === opt.text_he) b.classList.add('selected');
      b.onclick = () => {
        answers[idx] = { value: opt.value, text: opt.text_he, weight: currentWeight() };
        [...wrap.children].forEach(c => c.classList.remove('selected'));
        b.classList.add('selected');
        $('nextBtn').disabled = false;
      };
      wrap.appendChild(b);
    });

    // importance
    const ib = $('importanceBtns');
    [...ib.children].forEach(b => {
      b.classList.toggle('selected', answers[idx] ? +b.dataset.w === answers[idx].weight : b.dataset.w === '1');
      b.onclick = () => {
        [...ib.children].forEach(c => c.classList.remove('selected'));
        b.classList.add('selected');
        if (answers[idx]) answers[idx].weight = +b.dataset.w;
      };
    });

    $('nextBtn').disabled = !answers[idx];
    $('nextBtn').textContent = idx === questions.length - 1 ? 'לתוצאות ✓' : 'הבא ›';
    $('backBtn').style.visibility = idx === 0 ? 'hidden' : 'visible';
  }

  function currentWeight() {
    const sel = [...$('importanceBtns').children].find(b => b.classList.contains('selected'));
    return sel ? +sel.dataset.w : 1;
  }

  $('nextBtn').onclick = () => {
    if (idx < questions.length - 1) { idx++; render(); }
    else finish();
  };
  $('backBtn').onclick = () => { if (idx > 0) { idx--; render(); } };

  function finish() {
    const results = politicians.map(p => {
      let dist = 0, max = 0;
      questions.forEach((q, i) => {
        const a = answers[i];
        if (!a) return;
        const pos = p.positions[q.topic];
        if (!pos) return;
        const pScore = pos.score * (q.reverse ? -1 : 1);
        const cw = CONF_W[pos.confidence] || 0.4;
        const w = a.weight * cw;
        dist += Math.abs(a.value - pScore) * w;
        max += 4 * w;
      });
      const pct = max > 0 ? Math.round((1 - dist / max) * 100) : 0;
      return { p, pct };
    }).sort((a, b) => b.pct - a.pct);

    const win = results[0];
    $('winnerCard').innerHTML = `
      <div class="crown">👑</div>
      <h2>${win.p.name_he}</h2>
      <div class="party">${win.p.party_he}</div>
      <div class="pct">${win.pct}%</div>
      <a class="rank-link" href="agendas/${win.p.id}.html">לצפייה באג'נדה המלאה ›</a>`;

    $('ranking').innerHTML = results.map((r, i) => `
      <a class="rank-row" href="agendas/${r.p.id}.html">
        <span class="rank-num">${i + 1}</span>
        <span class="avatar" style="background:${r.p.color}">${r.p.initials}</span>
        <span class="rank-info">
          <span class="name">${r.p.name_he}</span><br>
          <span class="party">${r.p.party_he} · <span class="rank-link">לאג'נדה המלאה ›</span></span>
        </span>
        <span class="rank-pct" style="color:${r.p.color}">${r.pct}%</span>
        <span class="rank-bar-wrap"><span class="rank-bar" style="width:${r.pct}%;background:${r.p.color}"></span></span>
      </a>`).join('');

    $('progressFill').style.width = '100%';
    show('results');
  }
})();
