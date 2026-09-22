// CITATION agent — drops cited sources that aren't actually relevant to
// the user's question. One Jev request with a batched Noul per source
// (title + URL are the evidence; no page fetch). Queue-style policy in
// code: keep on doubt (score >= 0.3), drop only clear misses. Best-effort:
// any failure keeps every source.

import { systemOne } from './jevClient.js';

const MIN_RELEVANCE = 0.3;

export async function filterSources({ question = '', sources = [] } = {}) {
  const candidates = (sources || []).filter((s) => s?.url && s?.title);
  if (candidates.length === 0 || !question.trim()) return { sources, dropped: 0 };
  if (!process.env.TYPESAFE_API_KEY || !process.env.TYPESAFE_API_KEY.trim()) {
    return { sources, dropped: 0 };
  }

  const questions = {};
  candidates.forEach((s, i) => {
    questions[`src_${i}`] = {
      type: 'noul',
      instructions: `Is the source titled "${s.title}" (${s.url}) topically relevant to the user question in \`question\`?`,
      criteria: {
        true: 'Same topic — a reader could plausibly learn something useful from it',
        false: 'Unrelated topic, wrong product, or obvious mismatch',
      },
    };
  });

  try {
    const data = await systemOne({ state: { question }, questions });
    const kept = candidates.filter((_, i) => {
      const a = data?.answers?.[`src_${i}`];
      return !a || a.type !== 'noul' || Number(a.noul) >= MIN_RELEVANCE;
    });
    // Never strip everything: if all score low, the filter misfired.
    if (kept.length === 0) return { sources, dropped: 0 };
    return { sources: kept, dropped: candidates.length - kept.length };
  } catch {
    return { sources, dropped: 0 };
  }
}
