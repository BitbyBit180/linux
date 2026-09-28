# Feature: Find Your Distro Quiz + AI Verdict

**What:** 10-question wizard → rule-based score → Jev (TypeSafe System One) picks winner + runners-up + explanation + first-step tip. Falls back to classic match if AI unreachable.
**Route:** `/quiz`. **API:** `POST /api/quiz/recommend { answers[], shortlist[] }` (public, always 200).

## User flow
1. Answer 10 questions (experience, use, hardware, updates, desktop, effort, terminal, software, support, priority).
2. Screen shows "Jev is weighing your answers…" (`QuizResultSkeleton`) — waits, no flash.
3. Result: winner card (100%) + 2 runners-up (%) + AI explanation + "First step" tip + buttons: View details / Compare top 3 / Join channel / Retake.

## Code chain
```
utils/distroQuiz.js:253  scoreQuiz(answers) → ranked [{distroId,points,percent,reasons}]
  → pages/QuizPage.jsx:47  builds readable Q&A + shortlist top-5 → quizApi
  → services/quizApi.js:10  POST /quiz/recommend (30s abort, throws → fallback)
  → controllers/quizController.js:58  loadCatalogue (DB→static), sanitizeOrder, fallback({ai:false})
  → services/quizAgent.js:59  ONE Jev Choice over catalogue; code derives rest
  → services/jevClient.js:12  plain fetch to api.typesafe.ai, typed judgments only
```

Key snippets:
```js
// distroQuiz.js — scoring source of truth (Kali trap = 25 pts for security)
scores: { kali: 25 }  // security-use option instantly wins

// quizAgent.js — options ARE the catalogue
criteria[d.id] = `${d.name} — ${d.tagline} | category | desktop | release | min RAM`;
// runners-up = 2nd/3rd probability BUT must be in rule-based shortlist
// explanation/tip built in code: buildExplanation() + FIRST_STEP_TIPS[winner]

// quizController.js — guards
if (!TYPESAFE_API_KEY) return fallback(...);          // graceful, no spend
if (topProbability < 0.15) return fallback('AI unsure'); // uniform = noise
```

## Files involved
- Frontend: `src/pages/QuizPage.jsx`, `src/utils/distroQuiz.js`, `src/services/quizApi.js`.
- Backend: `src/routes/quizRoutes.js` (rate-limited `quizLimiter` 20/m), `src/controllers/quizController.js`, `src/services/quizAgent.js`, `src/services/jevClient.js`, `src/data/distros.js` (catalogue fallback).

## How to demo / viva line
"Scoring lives only in frontend; backend trusts the shortlist, validates ids, asks Jev for one Choice. Without a key it returns `ai:false` and the classic order stands." Open `frontend/src/utils/distroQuiz.js:253` and `backend/src/services/quizAgent.js:70`.
