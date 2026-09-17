import Distro from '../models/Distro.js';
import { DISTROS as STATIC_DISTROS } from '../data/distros.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recommendDistro } from '../services/quizAgent.js';
import { NO_KEY_MESSAGE } from '../services/groqClient.js';

const CATALOGUE_FIELDS = 'distroId name tagline category desktop releaseModel minRam';

// Lean catalogue for the AI prompt: DB first, static seed as fallback
// (the quiz scoring only knows the 14 seeded distros).
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

// POST /api/quiz/recommend  { answers: [{question, answer}], shortlist: [{distroId, points?, reasons?[]}] }
// Public (no auth) — the quiz is for every visitor. Always responds 200:
// { success, ai: true|false, winner, runnersUp, explanation, strengths, tip, message? }
// ai:false means "AI unavailable, use the rule-based shortlist order" —
// the frontend falls back to its local scoring so the UI never breaks.
export const recommendQuizDistro = asyncHandler(async (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const shortlist = Array.isArray(req.body?.shortlist) ? req.body.shortlist : [];

  if (answers.length === 0 || shortlist.length === 0) {
    res.status(400);
    throw new Error('Provide quiz answers and the rule-based shortlist.');
  }

  const catalogue = await loadCatalogue();
  const allowed = new Set(catalogue.map((d) => String(d.id).toLowerCase()));
  const fallbackOrder = sanitizeOrder(
    shortlist.map((s) => s.distroId),
    allowed
  );

  const fallback = (message) =>
    res.json({
      success: true,
      ai: false,
      winner: fallbackOrder[0] || null,
      runnersUp: fallbackOrder.slice(1, 3),
      explanation: null,
      strengths: {},
      tip: null,
      message,
    });

  // Graceful degradation before spending a model call.
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_API_KEY.trim()) {
    return fallback(NO_KEY_MESSAGE);
  }

  let verdict;
  try {
    verdict = await recommendDistro({ answers, shortlist, catalogue });
  } catch (err) {
    return fallback(err.message || 'AI recommendation failed. Please try again.');
  }

  // The model must pick from the catalogue — repair or fall back.
  const winner = sanitizeOrder([verdict?.winner], allowed)[0];
  let runnersUp = sanitizeOrder(verdict?.runnersUp, allowed).filter((id) => id !== winner);
  // Top up missing runners from the rule-based order so we always return 3.
  for (const id of fallbackOrder) {
    if (runnersUp.length >= 2) break;
    if (id !== winner && !runnersUp.includes(id)) runnersUp.push(id);
  }
  if (!winner) return fallback('AI returned an unknown distro. Showing the classic match.');

  res.json({
    success: true,
    ai: true,
    winner,
    runnersUp: runnersUp.slice(0, 2),
    explanation: typeof verdict?.explanation === 'string' ? verdict.explanation.slice(0, 800) : '',
    strengths:
      verdict?.strengths && typeof verdict.strengths === 'object' ? verdict.strengths : {},
    tip: typeof verdict?.tip === 'string' ? verdict.tip.slice(0, 200) : '',
  });
});
