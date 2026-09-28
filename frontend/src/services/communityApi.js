// Community service — talks to the Express backend (/api/community*).
// All endpoints are protected: every request carries the Bearer token
// from authApi (localStorage 'dp_token').
import { getToken } from './authApi.js';
import { cached, peek, peekStale, invalidate } from '../utils/apiCache.js';

// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Feed content is live (votes, new posts), so the TTL is short: revisits
// within 30s paint instantly, older visits revalidate in the background.
const FEED_TTL = 30 * 1000;

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

const postsKey = ({ channel = 'all', sort = 'hot', search = '', page = 1, limit = 10 } = {}) =>
  `community:posts:${channel}|${sort}|${search}|${page}|${limit}`;

/**
 * GET /api/community/posts?channel=&sort=&search=&page=&limit=
 * -> { data: { posts, page, totalPages, hasMore } }
 */
export async function listPosts({ channel = 'all', sort = 'hot', search = '', page = 1, limit = 10 } = {}) {
  const params = { channel, sort, search, page, limit };
  return cached(postsKey(params), FEED_TTL, async () => {
    const qs = new URLSearchParams({
      channel,
      sort,
      search,
      page: String(page),
      limit: String(limit),
    });
    const json = await request(`/community/posts?${qs.toString()}`);
    return json.data;
  });
}

/** Synchronous cache read — CommunityPage inits its feed from this so
 *  switching back paints instantly with no skeleton flash. */
export const peekPosts = (params) => peek(postsKey(params));

/** Stale variant — paints even expired data instantly while revalidating
 *  (kills reload spinners in production). */
export const peekStalePosts = (params) => peekStale(postsKey(params));

/** Synchronous cache read — PostDetailPage inits from this (same TTL). */
export const peekPost = (id) => peek(`community:post:${encodeURIComponent(id)}`);

/** Stale variant — instant paint on reloads while revalidating. */
export const peekStalePost = (id) => peekStale(`community:post:${encodeURIComponent(id)}`);

/** Synchronous cache read — sidebar stat cards init from this. */
export const peekChannelStats = (channel = 'all') =>
  peek(`community:stats:${encodeURIComponent(channel)}`);

/** Stale variant — instant paint on reloads while revalidating. */
export const peekStaleChannelStats = (channel = 'all') =>
  peekStale(`community:stats:${encodeURIComponent(channel)}`);

/** POST /api/community/posts { channel, title, body?, linkUrl? } -> post */
export async function createPost({ channel, title, body, linkUrl }) {
  const json = await request('/community/posts', {
    method: 'POST',
    body: { channel, title, body, linkUrl },
  });
  invalidate('community:posts');
  invalidate('community:stats');
  return json.data;
}

/** GET /api/community/posts/:id -> { data: { post, comments } } */
export async function getPost(id) {
  const key = `community:post:${encodeURIComponent(id)}`;
  return cached(key, FEED_TTL, async () => {
    const json = await request(`/community/posts/${encodeURIComponent(id)}`);
    return json.data;
  });
}

/** PUT /api/community/posts/:id { title?, body?, linkUrl? } -> post */
export async function updatePost(id, { title, body, linkUrl } = {}) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { title, body, linkUrl },
  });
  invalidate('community:post');
  invalidate('community:posts');
  return json.data;
}

/** DELETE /api/community/posts/:id -> { success } */
export async function deletePost(id) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  invalidate('community:post');
  invalidate('community:posts');
  invalidate('community:stats');
  return json;
}

/** POST /api/community/posts/:id/vote { value: 1 | -1 | 0 } -> { score, userVote } */
export async function votePost(id, value) {
  const json = await request(`/community/posts/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    body: { value },
  });
  // Votes are optimistic in the UI; bust the detail cache so a revisit
  // shows the server's authoritative score.
  invalidate('community:post');
  return json.data;
}

/** POST /api/community/posts/:id/comments { body, parentId? } -> comment */
export async function addComment(postId, { body, parentId } = {}) {
  const json = await request(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    { method: 'POST', body: { body, parentId } }
  );
  invalidate('community:post');
  invalidate('community:posts');
  invalidate('community:stats');
  return json.data;
}

/** PUT /api/community/comments/:id { body } -> comment */
export async function updateComment(id, body) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { body },
  });
  invalidate('community:post');
  return json.data;
}

/** DELETE /api/community/comments/:id -> { success } */
export async function deleteComment(id) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  invalidate('community:post');
  invalidate('community:posts');
  invalidate('community:stats');
  return json;
}

/** POST /api/community/comments/:id/vote { value } -> { score, userVote } */
export async function voteComment(id, value) {
  const json = await request(`/community/comments/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    body: { value },
  });
  invalidate('community:post');
  return json.data;
}

/** GET /api/community/stats?channel= -> { posts, comments } */
export async function getChannelStats(channel = 'all') {
  // Counts move slowly — 60s TTL keeps every sidebar/stat card instant.
  return cached(`community:stats:${encodeURIComponent(channel)}`, 60 * 1000, async () => {
    const json = await request(
      `/community/stats?channel=${encodeURIComponent(channel)}`
    );
    return json.data;
  });
}

/** POST /api/community/suggest-channel { title, body? } -> { channel, confidence } */
export async function suggestChannel({ title, body }) {
  const json = await request('/community/suggest-channel', {
    method: 'POST',
    body: { title, body },
  });
  return json.data;
}
/** POST /api/community/reports { targetType, targetId, reason, detail? } */
export async function createReport({ targetType, targetId, reason, detail }) {
  const json = await request('/community/reports', {
    method: 'POST',
    body: { targetType, targetId, reason, detail },
  });
  return json.data;
}

/** GET /api/community/notifications -> { notifications, unreadCount, ... } */
export async function getNotifications({ page = 1, limit = 10 } = {}) {
  const json = await request(
    `/community/notifications?page=${page}&limit=${limit}`
  );
  return json.data;
}

/** PATCH /api/community/notifications/:id/read */
export async function markNotificationRead(id) {
  const json = await request(`/community/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
  return json.data;
}

/** PATCH /api/community/notifications/read-all */
export async function markAllNotificationsRead() {
  const json = await request('/community/notifications/read-all', {
    method: 'PATCH',
  });
  return json;
}
