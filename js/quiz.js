/* Israel Vote Quiz 2026 — engine */
(async function () {
  const V = '7';
  const [questions, polData] = await Promise.all([
    fetch('data/questions.json?v=' + V).then(r => r.json()),
    fetch('data/politicians.json?v=' + V).then(r => r.json()),
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
  const screens = { landing: $('landing'), quiz: $('quiz'), results: $('results'), allq: $('allq') };
  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo(0, 0);
  }

  $('startBtn').onclick = () => { idx = 0; render(); show('quiz'); };
  $('restartBtn').onclick = () => { answers.fill(null); idx = 0; render(); show('quiz'); };

  // ===== All-questions overview screen =====
  const SCALE_HINT = SCALE_LABELS.map(o => o.t).join(' · ');
  $('allqList').innerHTML = questions.map((q, i) => {
    const bg = (polData.topics[q.topic] || {}).bg_he;
    const optsHtml = q.type === 'mc'
      ? `<ul class="allq-choices">${q.choices.map(c => `<li>${c.text_he}</li>`).join('')}</ul>`
      : `<div class="allq-scale">אפשרויות: ${SCALE_HINT}</div>`;
    return `
      <div class="allq-item">
        <div class="allq-top"><span class="allq-num">${i + 1}</span><span class="topic-tag">${q.topic_he}</span></div>
        <div class="allq-q">${q.text_he}</div>
        ${q.explain_he ? `<div class="allq-explain">💡 ${q.explain_he}</div>` : ''}
        ${optsHtml}
        ${bg ? `<div class="allq-bg">📖 ${bg}</div>` : ''}
      </div>`;
  }).join('');
  $('viewAllBtn').onclick = () => { show('allq'); };
  $('allqBackBtn').onclick = () => { show('landing'); };
  $('allqStartBtn').onclick = () => { idx = 0; render(); show('quiz'); };

  // candidates grid on landing — agenda pages readable anytime
  $('candidatesGrid').innerHTML = politicians.map(p => `
    <a class="cand-card" href="agendas/${p.id}.html">
      <span class="avatar" style="background:${p.color}">${p.initials}</span>
      <span class="cand-name">${p.name_he}</span>
      <span class="cand-party">${p.party_he}</span>
    </a>`).join('');

  function render() {
    const q = questions[idx];
    $('progressText').textContent = `${idx + 1} / ${questions.length}`;
    $('progressFill').style.width = `${(idx / questions.length) * 100}%`;
    $('topicTag').textContent = q.topic_he;
    $('questionText').textContent = q.text_he;
    $('explainBox').textContent = q.explain_he ? '💡 ' + q.explain_he : '';
    $('explainBox').style.display = q.explain_he ? '' : 'none';

    // expandable background about the topic
    const bg = (polData.topics[q.topic] || {}).bg_he;
    const bgWrap = $('bgWrap'), bgText = $('bgText'), bgToggle = $('bgToggle');
    if (bg) {
      bgWrap.style.display = '';
      bgText.textContent = bg;
      bgText.style.display = 'none';
      bgToggle.textContent = '📖 קרא עוד על הרקע ›';
      bgToggle.onclick = () => {
        const open = bgText.style.display === 'none';
        bgText.style.display = open ? 'block' : 'none';
        bgToggle.textContent = open ? '📖 הסתר רקע ‹' : '📖 קרא עוד על הרקע ›';
      };
    } else {
      bgWrap.style.display = 'none';
    }

    const wrap = $('answers');
    wrap.innerHTML = '';
    wrap.className = 'answers' + (q.type === 'scale' ? ' scale' : '');
    const opts = q.type === 'scale'
      ? SCALE_LABELS.map(o => ({ text_he: o.t, value: o.v }))
      : q.choices;
    opts.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt.text_he;
      if (answers[idx] && !answers[idx].skipped && answers[idx].value === opt.value && answers[idx].text === opt.text_he) b.classList.add('selected');
      b.onclick = () => {
        answers[idx] = { value: opt.value, text: opt.text_he, weight: currentWeight() };
        [...wrap.children].forEach(c => c.classList.remove('selected'));
        b.classList.add('selected');
        $('skipBtn').classList.remove('selected');
        $('nextBtn').disabled = false;
      };
      wrap.appendChild(b);
    });

    // skip — question excluded from scoring
    const sk = $('skipBtn');
    sk.classList.toggle('selected', !!(answers[idx] && answers[idx].skipped));
    sk.onclick = () => {
      answers[idx] = { skipped: true };
      [...wrap.children].forEach(c => c.classList.remove('selected'));
      sk.classList.add('selected');
      $('nextBtn').disabled = false;
    };

    // importance
    const ib = $('importanceBtns');
    [...ib.children].forEach(b => {
      b.classList.toggle('selected', answers[idx] && !answers[idx].skipped ? +b.dataset.w === answers[idx].weight : b.dataset.w === '1');
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
        if (!a || a.skipped) return;
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

    const skipped = answers.filter(a => a && a.skipped).length;
    const answered = answers.filter(a => a && !a.skipped).length;

    // edge case: nothing answered → no meaningful ranking
    if (answered === 0) {
      $('resultsSub').textContent = '';
      $('winnerCard').innerHTML = `
        <div class="crown">🤔</div>
        <h2>לא ענית על אף שאלה</h2>
        <div class="party">כדי לקבל התאמה, ענה לפחות על שאלה אחת (בלי לדלג).</div>
        <a class="rank-link" href="#" id="goAnswer">חזרה לשאלון ›</a>`;
      $('ranking').innerHTML = '';
      const g = $('goAnswer');
      if (g) g.onclick = e => { e.preventDefault(); idx = 0; render(); show('quiz'); };
      $('progressFill').style.width = '100%';
      show('results');
      return;
    }

    $('resultsSub').textContent = 'דירוג ההתאמה בין הדעות שלך לעמדות המתועדות של המנהיגים:'
      + (skipped ? ` (דילגת על ${skipped} שאלות — הן לא נספרו)` : '');

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
