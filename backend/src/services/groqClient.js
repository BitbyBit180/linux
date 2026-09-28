// Shared thin REST client for the Groq chat-completions API
// (OpenAI-compatible) — plain fetch, no SDK. All AI calls go through this.

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const NO_KEY_MESSAGE = 'GROQ_API_KEY is not configured. Add it to backend/.env';

// Up to 5 keys: GROQ_API_KEY (comma-separated lists allowed) plus
// GROQ_API_KEY_2 … GROQ_API_KEY_5. When one key hits a rate limit (429)
// or is invalid (401), the request automatically rolls to the next key.
const MAX_KEYS = 5;
const COOLDOWN_MS = 60 * 1000; // a 429'd key rests 60s (or Retry-After)
const BAD_KEY_COOLDOWN_MS = 10 * 60 * 1000; // a 401'd key rests 10 min

// fingerprint -> timestamp; never logs the secret itself, only key#N.
const cooldownUntil = new Map();

function loadKeys() {
  const raw = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
  ]
    .flatMap((v) => (v || '').split(','))
    .map((k) => k.trim())
    .filter(Boolean);
  return [...new Set(raw)].slice(0, MAX_KEYS);
}

// Order keys so cooled-down ones are tried last — concurrent requests then
// spread across healthy keys instead of stampeding the same key.
function orderedKeys() {
  const now = Date.now();
  return loadKeys()
    .map((key, index) => ({ key, index, cool: cooldownUntil.get(key) || 0 }))
    .sort((a, b) => a.cool - b.cool || a.index - b.index)
    .map(({ key, index }) => ({ key, index, cooled: (cooldownUntil.get(key) || 0) > now }));
}

function cooldownMsFrom(res) {
  const header = res.headers?.get?.('retry-after');
  const secs = Number(header);
  if (Number.isFinite(secs) && secs > 0) return Math.min(secs * 1000, 5 * 60 * 1000);
  return COOLDOWN_MS;
}

async function discardBody(res) {
  try {
    await res.text();
  } catch {
    /* socket cleanup only */
  }
}

// POST with automatic key rotation. Returns the first usable Response.
// Rotates past 429 (rate limit) and 401 (bad key in the pool); every other
// failure (network, abort, timeout) throws immediately — retrying those on
// another key could double-spend tokens on work already running server-side.
async function fetchWithRotation(payload, { timeoutMs, signal } = {}) {
  const pool = orderedKeys();
  if (pool.length === 0) throw new Error(NO_KEY_MESSAGE);

  let lastErr = null;
  for (const { key, index } of pool) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error('Groq request timed out')), timeoutMs);
    if (signal) {
      if (signal.aborted) ctrl.abort(signal.reason);
      else signal.addEventListener('abort', () => ctrl.abort(signal.reason), { once: true });
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        const cool = cooldownMsFrom(res);
        cooldownUntil.set(key, Date.now() + cool);
        await discardBody(res);
        console.warn(`[groq] key#${index + 1} rate-limited, cooling ${Math.round(cool / 1000)}s`);
        lastErr = new Error('Groq rate limit reached on all keys. Please try again shortly.');
        continue;
      }
      if (res.status === 401) {
        cooldownUntil.set(key, Date.now() + BAD_KEY_COOLDOWN_MS);
        await discardBody(res);
        console.warn(`[groq] key#${index + 1} rejected (401), skipping for 10 min`);
        lastErr = new Error('Groq API key rejected. Please try again shortly.');
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }
  throw lastErr || new Error('Groq request failed on all keys.');
}

function groqMessages(system, messages) {
  return [...(system ? [{ role: 'system', content: system }] : []), ...messages];
}

async function readErrorMessage(res, fallback) {
  try {
    const errBody = await res.json();
    return errBody?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

// Single chat-completion call → { text, usage }.
// `usage` is the provider's token accounting ({ prompt_tokens,
// completion_tokens, total_tokens }) or null when absent — callers pass it
// through so the pipeline can log per-stage cost. Throws (with the API's
// own error message) on non-OK responses.
export async function chatCompletion(
  { system, messages = [], temperature = 0.7, maxTokens = 2048, jsonMode = false } = {},
  { timeoutMs = 20000 } = {}
) {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const res = await fetchWithRotation(
    {
      model,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: groqMessages(system, messages),
    },
    { timeoutMs }
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Groq API error ${res.status}`));
  }
  const data = await res.json();
  const usage = data?.usage
    ? {
        prompt_tokens: data.usage.prompt_tokens || 0,
        completion_tokens: data.usage.completion_tokens || 0,
        total_tokens: data.usage.total_tokens || 0,
      }
    : null;
  return { text: (data?.choices?.[0]?.message?.content || '').trim(), usage };
}

// Streaming chat-completion call → { text, usage }.
// Forwards each content delta to `onToken` as it arrives so the server can
// relay live tokens over SSE (chatController.sendMessageStream). Same
// plain-fetch convention as chatCompletion — no SDK. `signal` lets the
// caller abort (e.g. client disconnected mid-stream).
export async function chatCompletionStream(
  { system, messages = [], temperature = 0.7, maxTokens = 2048 } = {},
  { timeoutMs = 60000, signal, onToken } = {}
) {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const res = await fetchWithRotation(
    {
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
      messages: groqMessages(system, messages),
    },
    { timeoutMs, signal }
  );
  if (!res.ok || !res.body) {
    throw new Error(await readErrorMessage(res, `Groq API error ${res.status}`));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let usage = null;
  const feed = (chunk) => {
    buffer += chunk;
    const frames = buffer.split('\n\n');
    buffer = frames.pop();
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        const delta = evt?.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onToken?.(delta);
        }
        if (evt?.usage) {
          usage = {
            prompt_tokens: evt.usage.prompt_tokens || 0,
            completion_tokens: evt.usage.completion_tokens || 0,
            total_tokens: evt.usage.total_tokens || 0,
          };
        }
      } catch {
        /* partial JSON at chunk boundary — completed by the next chunk */
      }
    }
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      feed(decoder.decode(value, { stream: true }));
    }
    feed(decoder.decode());
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
  return { text: full.trim(), usage };
}

// Stored chat history → Groq messages.
export const toMessages = (history = []) =>
  history.map((h) => ({
    role: h.role === 'assistant' ? 'assistant' : 'user',
    content: h.text,
  }));

// Ops helper: how many keys are loaded and how many are currently cooled.
// Logs key counts only — never secrets. Useful for `curl /api/health`-style checks.
export function groqPoolStatus() {
  const now = Date.now();
  const keys = loadKeys();
  return {
    keys: keys.length,
    cooled: keys.filter((k) => (cooldownUntil.get(k) || 0) > now).length,
  };
}

// True when at least one key is configured (any of GROQ_API_KEY…_5).
export function hasGroqKeys() {
  return loadKeys().length > 0;
}
