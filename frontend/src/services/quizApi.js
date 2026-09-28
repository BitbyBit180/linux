// AI recommendation for the "Find Your Distro" quiz.
// POSTs the user's readable Q&A; the backend asks Jev (TypeSafe System One)
// to pick the winner from the whole distro catalogue — no scoring table
// anywhere, the verdict is fully AI. Throws on any failure so the caller
// can show an error with a retry.

// Backend base URL. In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Verdicts are deterministic for identical answers — cache 10 min so
// retakes (or back-navigation to the result) skip the Jev round-trip.
const VERDICT_TTL = 10 * 60 * 1000;
const verdictCache = new Map(); // hash -> { value, expiresAt }

const hashRequest = ({ answers }) => JSON.stringify(answers);

export async function getAiRecommendation({ answers }) {
  const key = hashRequest({ answers });
  const hit = verdictCache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.value;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE}/quiz/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `Quiz AI failed (${res.status})`);
    }
    // Only cache real AI verdicts — failures stay retryable.
    if (json?.ai) verdictCache.set(key, { value: json, expiresAt: Date.now() + VERDICT_TTL });
    return json;
  } finally {
    clearTimeout(timer);
  }
}
