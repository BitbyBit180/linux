// Auth service — talks to the Express backend (POST /api/auth/*).
// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'dp_token';
const USER_KEY = 'dp_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — auth just won't persist */
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Shared request helper. All backend responses are shaped
 * { success, data?/token?, message? }; throws Error(message) on failure.
 */
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

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

/** POST /api/auth/register {name, email, password} -> { token, data: user } */
export async function register(name, email, password) {
  const json = await request('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return { token: json.token, user: json.data };
}

/** POST /api/auth/login {email, password} -> { token, data: user } */
export async function login(email, password) {
  const json = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { token: json.token, user: json.data };
}

/** GET /api/auth/me (Bearer) -> user | null (never throws) */
export async function me() {
  try {
    const json = await request('/auth/me', { auth: true });
    return json.data || null;
  } catch {
    return null;
  }
}

/** POST /api/auth/forgot-password { email } -> { message } (never throws for unknown emails) */
export async function forgotPassword(email) {
  const json = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
  return json;
}

/** POST /api/auth/reset-password { token, password } -> { message } */
export async function resetPassword(token, password) {
  const json = await request('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
  return json;
}

/** POST /api/auth/verify-reset-token { token } -> { message } (does not consume the code) */
export async function verifyResetToken(token) {
  const json = await request('/auth/verify-reset-token', {
    method: 'POST',
    body: { token },
  });
  return json;
}
