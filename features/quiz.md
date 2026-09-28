# Feature: Find Your Distro Quiz (fully AI)

**What:** 10-question wizard → Jev (TypeSafe System One) picks winner + runners-up + explanation + first-step tip from the **whole catalogue**. No scoring table anywhere — a failed verdict is an error with retry, never a hardcoded guess.
**Route:** `/quiz`. **API:** `POST /api/quiz/recommend { answers[] }` (public, always 200).

## User flow
1. Answer 10 questions (experience, use, hardware, updates, desktop, effort, terminal, software, support, priority).
2. Screen shows "Jev is weighing your answers…" (`QuizResultSkeleton`) — waits, renders exactly one decision.
3. Result: winner card (100%) + 2 runners-up (%) + AI explanation + "First step" tip + buttons: View details / Compare top 3 / Join channel / Retake.
4. If Jev is unreachable/unsure: error panel ("Jev couldn't decide right now") with **Try again** (keeps answers) and **Retake quiz**. Identical answers hit a 10-min client cache, so retry/back-nav skips the round-trip.

## Code chain
```
utils/distroQuiz.js: QUIZ_QUESTIONS (questions + labels ONLY, no scores)
  → pages/QuizPage.jsx: builds readable [{questionId, question, answer}]
  → services/quizApi.js: POST /quiz/recommend (30s abort, throws → error panel)
  → controllers/quizController.js: loadCatalogue (DB→static), ai:false when
      no key / Jev error / top-probability < 0.15 (near-uniform = noise)
  → services/quizAgent.js: ONE Jev Choice over all 14 catalogue options;
      runners = 2nd/3rd probability; strengths = catalogue taglines;
      explanation = user profile + winner tagline; tip = FIRST_STEP_TIPS
  → services/jevClient.js: plain fetch to api.typesafe.ai, typed judgments only
```

Key snippets:
```js
// quizAgent.js — options ARE the catalogue, no shortlist hint
criteria[d.id] = `${d.name} — ${d.tagline} | category | desktop | release | min RAM`;
// runners-up = full distribution order (not restricted to any shortlist)
```

## Files involved
- Frontend: `src/pages/QuizPage.jsx`, `src/utils/distroQuiz.js`, `src/services/quizApi.js`.
- Backend: `src/routes/quizRoutes.js` (rate-limited `quizLimiter` 20/m), `src/controllers/quizController.js`, `src/services/quizAgent.js`, `src/services/jevClient.js`, `src/data/distros.js` (catalogue fallback).

## How to demo / viva line
"There is no scoring — Jev reads the answers and chooses from all 14 distros in one Choice judgment; percents are its probabilities, strengths are catalogue taglines." Open `frontend/src/utils/distroQuiz.js` (no scores) and `backend/src/services/quizAgent.js:59`.
