/**
 * Tiny client-side API cache — fixes refetch-on-every-navigation.
 *
 * The custom router in App.jsx unmounts each page on navigation, so every
 * visit re-ran its fetchers with `loading=true` (skeleton flash) even when
 * the data hadn't changed. These helpers give services:
 * - TTL cache (fresh reads resolve in microseconds, no network)
 * - in-flight dedup (two components asking at once share one request)
 * - peek() for instant first paint (init useState from cache, skip skeleton)
 * - peekStale() for stale-while-revalidate (paint even expired data
 *   instantly, revalidate silently — kills reload spinners in production)
 * - localStorage persistence so the cache survives full page reloads
 *   (in-memory alone only helps SPA navigation, not fresh opens)
 * - invalidate(prefix) so mutations (post/vote/new chat) refresh the right keys
 *
 * Rules: only successful network responses are cached. Offline fallbacks
 * (static data) are returned directly and never cached.
 */

const store = new Map(); // key -> { value, expiresAt }
const inflight = new Map(); // key -> Promise (shared while in flight)

// Only these prefixes are persisted — auth tokens, drafts and AI verdicts
// stay memory-only. Recently-expired entries persist too so a reload can
// still paint instantly (stale-while-revalidate) within STALE_WINDOW.
const PERSIST_RE = /^(distros:|community:posts:|community:post:|community:stats:|chat:)/;
const LS_KEY = 'dp_api_cache_v1';
const MAX_PERSIST = 60;
const STALE_WINDOW = 10 * 60 * 1000;

let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return;
    const now = Date.now();
    for (const [k, v] of entries) {
      if (
        typeof k === 'string' &&
        v &&
        typeof v.expiresAt === 'number' &&
        v.expiresAt > now - STALE_WINDOW &&
        !store.has(k)
      ) {
        store.set(k, v);
      }
    }
  } catch {
    /* corrupted cache — start cold */
  }
}

function persist() {
  try {
    const now = Date.now();
    // Prune long-dead entries so memory doesn't grow across the session.
    for (const [k, v] of store) {
      if (!v || v.expiresAt < now - STALE_WINDOW) store.delete(k);
    }
    const out = [];
    for (const [k, v] of store) {
      if (out.length >= MAX_PERSIST) break;
      if (PERSIST_RE.test(k) && v.expiresAt > now - STALE_WINDOW) out.push([k, v]);
    }
    localStorage.setItem(LS_KEY, JSON.stringify(out));
  } catch {
    // Quota or privacy mode — drop persistence, memory cache keeps working.
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function setCache(key, value, ttlMs) {
  hydrate();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  persist();
}

/** Fresh value or undefined (expired entries stay for peekStale). */
export function peek(key) {
  hydrate();
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) return undefined;
  return hit.value;
}

/** Fresh OR recently-expired value — instant paint while revalidating. */
export function peekStale(key) {
  hydrate();
  return store.get(key)?.value;
}

/** Drop every entry whose key starts with `prefix` (e.g. 'community:posts'). */
export function invalidate(prefix) {
  hydrate();
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  persist();
}

/**
 * Return the cached value when fresh; otherwise run `fetcher()` once
 * (concurrent callers share the same promise) and cache its result.
 * Rejections are never cached and clear the in-flight slot.
 */
export async function cached(key, ttlMs, fetcher) {
  const hit = peek(key);
  if (hit !== undefined) return hit;
  if (inflight.has(key)) return inflight.get(key);
  const p = fetcher().then(
    (value) => {
      inflight.delete(key);
      setCache(key, value, ttlMs);
      return value;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    }
  );
  inflight.set(key, p);
  return p;
}
