# Israel Vote Quiz 2026 — Design Spec

Date: 2026-07-12

## Goal
Hebrew/RTL static site on GitHub Pages. User answers ~30 political questions, gets ranked match (%) against all 12 party leaders running in the October 2026 Knesset election. Each politician has a full agenda page with sourced positions.

## Politicians (12)
Netanyahu (Likud), Bennett (Beyachad, incl. Lapid/Yesh Atid), Eisenkot (Yashar), Golan (The Democrats), Gantz (Blue & White), Lieberman (Yisrael Beytenu), Ben Gvir (Otzma Yehudit), Smotrich (Religious Zionism), Deri (Shas), Goldknopf (UTJ), Abbas (Ra'am), Jabareen (Joint List).

## Quiz
- ~30 questions, mix: agree/disagree statements (1–5 scale) + multiple choice.
- Per-question importance weight: לא חשוב (x0.5) / חשוב (x1) / חשוב מאוד (x2).
- Topics: Gaza war, Gazan emigration, Palestinian state, annexation, hostages, judicial overhaul, haredi draft, religion & state, economy, cost of living, Arab citizens, death penalty, Iran, Netanyahu fitness, LGBT, Law of Return.
- Hard/extreme questions allowed ONLY when grounded in real documented statements.

## Scoring
Each question stores per-politician expected answer (-2..+2). User answer mapped to -2..+2. Match = 100 − normalized weighted distance. Results: full ranking, % bars, links to agenda pages.

## Accuracy rules
- Every politician position backed by real quote/vote/source (2024–2026 preferred), collected via web research agents.
- No fabricated positions. If unknown/no stated position → neutral 0 with reduced confidence weight.
- Site disclaimer: educational direction tool, not official recommendation.

## Architecture
Pure static: index.html (landing+quiz+results, one page app), css/style.css, js/quiz.js, data/questions.json, data/politicians.json, agendas/<name>.html × 12. No build step. Deploy: GitHub Pages, repo `israel-vote-quiz`.
