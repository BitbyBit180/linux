// Shared thin REST client for the Groq chat-completions API
// (OpenAI-compatible) — plain fetch, no SDK. All AI calls go through this.

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const NO_KEY_MESSAGE = 'GROQ_API_KEY is not configured. Add it to backend/.env';

// Single chat-completion call → trimmed assistant text.
// Throws (with the API's own error message) on non-OK responses.
export async function chatCompletion(
  { system, messages = [], temperature = 0.7, maxTokens = 2048, jsonMode = false } = {},
  { timeoutMs = 20000 } = {}
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(NO_KEY_MESSAGE);
  }
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    let message = `Groq API error ${res.status}`;
    try {
      const errBody = await res.json();
      message = errBody?.error?.message || message;
    } catch {
      /* keep the status-code message */
    }
    throw new Error(message);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content || '').trim();
}

// Stored chat history → Groq messages.
export const toMessages = (history = []) =>
  history.map((h) => ({
    role: h.role === 'assistant' ? 'assistant' : 'user',
    content: h.text,
  }));
