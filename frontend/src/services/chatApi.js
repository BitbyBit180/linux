// Chat service — talks to the Express backend (/api/chat*).
// All endpoints are protected: every request carries the Bearer token
// from authApi (localStorage 'dp_token').
import { getToken } from './authApi.js';

// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  const json = await request('/chat');
  return json.data || [];
}

/** POST /api/chat -> { id, title, messages: [] } */
export async function createChat() {
  const json = await request('/chat', { method: 'POST' });
  return json.data;
}

/** GET /api/chat/:id -> { id, title, messages: [{ role, content, sources? }] } */
export async function getChat(id) {
  const json = await request(`/chat/${encodeURIComponent(id)}`);
  return json.data;
}

/** PUT /api/chat/:id/rename { title } -> updated chat */
export async function renameChat(id, title) {
  const json = await request(`/chat/${encodeURIComponent(id)}/rename`, {
    method: 'PUT',
    body: { title },
  });
  return json.data;
}

/** DELETE /api/chat/:id -> { success, message } */
export async function deleteChat(id) {
  const json = await request(`/chat/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
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
  return json.data;
}
