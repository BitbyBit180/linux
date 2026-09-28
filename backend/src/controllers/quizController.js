import Distro from '../models/Distro.js';
import { DISTROS as STATIC_DISTROS } from '../data/distros.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recommendDistro, MIN_TOP_PROBABILITY } from '../services/quizAgent.js';
import { NO_KEY_MESSAGE } from '../services/jevClient.js';

const CATALOGUE_FIELDS = 'distroId name tagline category desktop releaseModel minRam';

// Lean catalogue for the AI prompt: DB first, static seed as fallback.
async function loadCatalogue() {
  try {
    const docs = await Distro.find().select(CATALOGUE_FIELDS).lean();
    if (docs?.length) {
      return docs.map((d) => ({
        id: d.distroId,
        name: d.name,
        tagline: d.tagline || '',
        category: d.category || '',
        desktop: d.desktop || '',
        releaseModel: d.releaseModel || '',
        minRam: d.minRam || '',
      }));
    }
  } catch {
    /* fall through to static data */
  }
  return STATIC_DISTROS.map((d) => ({
    id: d.id,
    name: d.name,
    tagline: d.tagline || '',
    category: d.category || '',
    desktop: d.desktop || '',
    releaseModel: d.releaseModel || '',
    minRam: d.minRam || '',
  }));
}

// Keep only ids the catalogue actually has, preserving order, no dupes.
function sanitizeOrder(ids = [], allowed) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const key = String(id || '').toLowerCase();
    if (!key || seen.has(key) || !allowed.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

// POST /api/quiz/recommend  { answers: [{questionId?, question, answer}] }
// Public (no auth) — the quiz is for every visitor. Always responds 200:
// { success, ai: true|false, winner, runnersUp, probabilities, confidence,
//   explanation, strengths, tip, message? }
// The verdict is FULLY AI (Jev Choice over the whole catalogue) — there is
// no scoring table. ai:false means "Jev unavailable or unsure": the client
// shows an error with a retry, never a hardcoded guess.
export const recommendQuizDistro = asyncHandler(async (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

  if (answers.length === 0) {
    res.status(400);
    throw new Error('Provide quiz answers.');
  }

  const catalogue = await loadCatalogue();
  const allowed = new Set(catalogue.map((d) => String(d.id).toLowerCase()));

  const fallback = (message) =>
    res.json({
      success: true,
      ai: false,
      winner: null,
      runnersUp: [],
      explanation: null,
      strengths: {},
      tip: null,
      message,
    });

  // Graceful degradation before spending a model call.
  if (!process.env.TYPESAFE_API_KEY || !process.env.TYPESAFE_API_KEY.trim()) {
    return fallback(NO_KEY_MESSAGE);
  }

  let verdict;
  try {
    verdict = await recommendDistro({ answers, catalogue });
  } catch (err) {
    return fallback(err.message || 'AI recommendation failed. Please try again.');
  }

  // The model must pick from the catalogue — repair or report unsure.
  const winner = sanitizeOrder([verdict?.winner], allowed)[0];
  const runnersUp = sanitizeOrder(verdict?.runnersUp, allowed).filter((id) => id !== winner);
  // A near-uniform distribution means Jev couldn't separate the options —
  // report unsure instead of presenting a coin flip as a verdict.
  if (!winner || (verdict?.topProbability ?? 1) < MIN_TOP_PROBABILITY) {
    return fallback(
      !winner
        ? 'AI returned an unknown distro. Please try again.'
        : 'AI was unsure — please try again.'
    );
  }

  res.json({
    success: true,
    ai: true,
    winner,
    runnersUp: runnersUp.slice(0, 2),
    probabilities: verdict?.probabilities || {},
    confidence: verdict?.confidence ?? null,
    explanation: typeof verdict?.explanation === 'string' ? verdict.explanation.slice(0, 800) : '',
    strengths:
      verdict?.strengths && typeof verdict.strengths === 'object' ? verdict.strengths : {},
    tip: typeof verdict?.tip === 'string' ? verdict.tip.slice(0, 200) : '',
  });
});
