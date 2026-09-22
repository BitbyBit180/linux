// Shared thin REST client for the TypeSafe System One API — plain fetch,
// no SDK (same convention as groqClient.js). Jev returns typed judgments
// (Choice/Score/Noul), never prose: code owns the workflow, the model
// supplies the decision. Docs: https://docs.typesafe.ai/api.md

const API_URL = 'https://api.typesafe.ai/v1/systemone';

export const NO_KEY_MESSAGE = 'TYPESAFE_API_KEY is not configured. Add it to backend/.env';

// Single System One evaluation → the `answers` map, keyed by question id.
// Throws (with the API's own error message) on non-OK responses.
export async function systemOne({ state, questions, model } = {}, { timeoutMs = 20000 } = {}) {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(NO_KEY_MESSAGE);
  }
  if (!state || typeof questions !== 'object' || !questions) {
    throw new Error('systemOne requires state and questions.');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      state,
      model: model || process.env.TYPESAFE_MODEL || 'jev-latest',
      questions,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    let message = `TypeSafe API error ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody?.message || errBody?.error?.message || message;
    } catch {
      /* keep the status-code message */
    }
    const err = new Error(message);
    err.statusCode = res.status;
    throw err;
  }
  const data = await res.json();
  if (!data?.answers || typeof data.answers !== 'object') {
    throw new Error('TypeSafe returned an unreadable evaluation. Please try again.');
  }
  return data;
}
