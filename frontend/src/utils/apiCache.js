/**
 * Tiny client-side API cache — fixes refetch-on-every-navigation.
 *
 * The custom router in App.jsx unmounts each page on navigation, so every
 * visit re-ran its fetchers with `loading=true` (skeleton flash) even when
 * the data hadn't changed. These helpers give services:
 * - TTL cache (fresh reads resolve in microseconds, no network)
 * - in-flight dedup (two components asking at once share one request)
 * - peek() for instant first paint (init useState from cache, skip skeleton)
 * - invalidate(prefix) so mutations (post/vote/new chat) refresh the right keys
 *
 * Rules: only successful network responses are cached. Offline fallbacks
 * (static data) are returned directly and never cached.
 */

const store = new Map(); // key -> { value, expiresAt }
const inflight = new Map(); // key -> Promise (shared while in flight)

export function setCache(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Fresh value or undefined (expired entries are dropped). */
export function peek(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

/** Drop every entry whose key starts with `prefix` (e.g. 'community:posts'). */
export function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
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
