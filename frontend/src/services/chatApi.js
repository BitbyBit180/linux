// Chat service — talks to the Express backend (/api/chat*).
// All endpoints are protected: every request carries the Bearer token
// from authApi (localStorage 'dp_token').
import { getToken } from './authApi.js';
import { cached, peek, peekStale, invalidate } from '../utils/apiCache.js';

// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Chat history changes on every message, so the TTL is short: switching
// back to /chat within 30s paints instantly, older visits revalidate.
const CHAT_TTL = 30 * 1000;

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok || !json || json.success === false) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** GET /api/chat -> [{ id, title, updatedAt, messageCount }] */
export async function listChats() {
  return cached('chat:list', CHAT_TTL, async () => {
    const json = await request('/chat');
    return json.data || [];
  });
}

/** Synchronous cache read — ChatPage inits its sidebar from this so
 *  switching back paints instantly with no skeleton flash. */
export const peekChatList = () => peek('chat:list');
export const peekChat = (id) => peek(`chat:${encodeURIComponent(id)}`);

/** Stale variants — instant paint on reloads while revalidating. */
export const peekStaleChatList = () => peekStale('chat:list');
export const peekStaleChat = (id) => peekStale(`chat:${encodeURIComponent(id)}`);

/** POST /api/chat -> { id, title, messages: [] } */
export async function createChat() {
  const json = await request('/chat', { method: 'POST' });
  invalidate('chat:list');
  return json.data;
}

/** GET /api/chat/:id -> { id, title, messages: [{ role, content, sources? }] } */
export async function getChat(id) {
  const key = `chat:${encodeURIComponent(id)}`;
  return cached(key, CHAT_TTL, async () => {
    const json = await request(`/chat/${encodeURIComponent(id)}`);
    return json.data;
  });
}

/** PUT /api/chat/:id/rename { title } -> updated chat */
export async function renameChat(id, title) {
  const json = await request(`/chat/${encodeURIComponent(id)}/rename`, {
    method: 'PUT',
    body: { title },
  });
  invalidate('chat:list');
  invalidate(`chat:${encodeURIComponent(id)}`);
  return json.data;
}

/** DELETE /api/chat/:id -> { success, message } */
export async function deleteChat(id) {
  const json = await request(`/chat/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  invalidate('chat:list');
  invalidate(`chat:${encodeURIComponent(id)}`);
  return json;
}

/**
 * POST /api/chat/:id/messages { content }
 * -> { userMessage: { role, content }, assistantMessage: { role, content, sources? } }
 * Can take 20-60s (LLM + web search).
 */
export async function sendMessage(chatId, content) {
  const json = await request(`/chat/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: { content },
  });
  // A new message changes both the thread and the sidebar preview/counts.
  invalidate('chat:list');
  invalidate(`chat:${encodeURIComponent(chatId)}`);
  return json.data;
}

/**
 * POST /api/chat/:id/messages/stream { content } — SSE twin of sendMessage.
 * Forwards live `token` deltas to onToken and resolves with the same
 * { userMessage, assistantMessage } payload on the `done` event.
 * Throws (with .status when the server answered non-2xx) so the caller can
 * fall back to sendMessage when streaming is unavailable.
 */
export async function sendMessageStream(chatId, content, { onToken, onStage, signal } = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE}/chat/${encodeURIComponent(chatId)}/messages/stream`,
    { method: 'POST', headers, body: JSON.stringify({ content }), signal }
  );

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      message = json?.message || message;
    } catch {
      /* non-JSON body */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let doneData = null;
  const dispatch = (event, data) => {
    if (event === 'token') onToken?.(data?.text || '');
    else if (event === 'stage') onStage?.(data?.stage);
    else if (event === 'done') doneData = data;
    else if (event === 'error') throw new Error(data?.message || 'Stream failed');
  };
  const feed = (chunk) => {
    buffer += chunk;
    const frames = buffer.split('\n\n');
    buffer = frames.pop();
    for (const frame of frames) {
      let event = 'message';
      const dataLines = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        /* ':' heartbeat lines ignored */
      }
      if (dataLines.length === 0) continue;
      try {
        dispatch(event, JSON.parse(dataLines.join('\n')));
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
  if (!doneData) throw new Error('Stream ended unexpectedly. Please try again.');
  return doneData;
}
