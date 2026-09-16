// Shared thin REST client for the Gemini generateContent API — plain fetch,
// no SDK. Both AI sub-agents (web research + synthesizer) go through this.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const NO_KEY_MESSAGE = 'GEMINI_API_KEY is not configured. Add it to backend/.env';

// Single generateContent call → parsed JSON.
// Throws (with the API's own error message) on non-OK responses.
export async function generateContent(body, { timeoutMs = 20000 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(NO_KEY_MESSAGE);
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    let message = `Gemini API error ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody?.error?.message || message;
    } catch {
      /* keep the status-code message */
    }
    throw new Error(message);
  }
  return res.json();
}

// Extract deduped web sources from groundingMetadata.groundingChunks
// → [{ title (hostname fallback), url }], capped at 8.
export function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  const seen = new Set();
  const sources = [];
  for (const chunk of chunks) {
    const web = chunk?.web;
    if (!web?.uri) continue;
    if (seen.has(web.uri)) continue;
    seen.add(web.uri);
    let title = web.title || '';
    if (!title) {
      try {
        title = new URL(web.uri).hostname;
      } catch {
        title = web.uri;
      }
    }
    sources.push({ title, url: web.uri });
    if (sources.length >= 8) break;
  }
  return sources;
}

// Stored chat history → Gemini contents (assistant → 'model').
export const toContents = (history = []) =>
  history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));
