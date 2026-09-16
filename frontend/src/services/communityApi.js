// Community service — talks to the Express backend (/api/community*).
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

/**
 * GET /api/community/posts?channel=&sort=&search=&page=&limit=
 * -> { data: { posts, page, totalPages, hasMore } }
 */
export async function listPosts({ channel = 'all', sort = 'hot', search = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    channel,
    sort,
    search,
    page: String(page),
    limit: String(limit),
  });
  const json = await request(`/community/posts?${params.toString()}`);
  return json.data;
}

/** POST /api/community/posts { channel, title, body?, linkUrl? } -> post */
export async function createPost({ channel, title, body, linkUrl }) {
  const json = await request('/community/posts', {
    method: 'POST',
    body: { channel, title, body, linkUrl },
  });
  return json.data;
}

/** GET /api/community/posts/:id -> { data: { post, comments } } */
export async function getPost(id) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`);
  return json.data;
}

/** PUT /api/community/posts/:id { title?, body?, linkUrl? } -> post */
export async function updatePost(id, { title, body, linkUrl } = {}) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { title, body, linkUrl },
  });
  return json.data;
}

/** DELETE /api/community/posts/:id -> { success } */
export async function deletePost(id) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return json;
}

/** POST /api/community/posts/:id/vote { value: 1 | -1 | 0 } -> { score, userVote } */
export async function votePost(id, value) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    body: { value },
  });
  return json.data;
}

/** POST /api/community/posts/:id/comments { body, parentId? } -> comment */
export async function addComment(postId, { body, parentId } = {}) {
  const json = await request(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    { method: 'POST', body: { body, parentId } }
  );
  return json.data;
}

/** PUT /api/community/comments/:id { body } -> comment */
export async function updateComment(id, body) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { body },
  });
  return json.data;
}

/** DELETE /api/community/comments/:id -> { success } */
export async function deleteComment(id) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return json;
}

/** POST /api/community/comments/:id/vote { value } -> { score, userVote } */
export async function voteComment(id, value) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    body: { value },
  });
  return json.data;
}
