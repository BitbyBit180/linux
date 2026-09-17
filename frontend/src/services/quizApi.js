// AI recommendation for the "Find Your Distro" quiz.
// POSTs the user's readable Q&A + the rule-based shortlist; the backend
// asks Gemini for a personalized winner + explanation. Throws on any
// failure so the caller can fall back to local scoring (UI never breaks).

// Backend base URL. In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getAiRecommendation({ answers, shortlist }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE}/quiz/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, shortlist }),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `Quiz AI failed (${res.status})`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}
