// Tiny in-memory sliding-window rate limiter — no dependency.
// Per-process memory only; fine for a single Node instance. If the app ever
// scales horizontally, swap the Map for Redis without changing the interface.

const buckets = new Map(); // key -> number[] (epoch ms of recent hits)

function prune(hits, now, windowMs) {
  let i = 0;
  while (i < hits.length && now - hits[i] >= windowMs) i += 1;
  if (i > 0) hits.splice(0, i);
  return hits;
}

// Periodically drop empty buckets so the map can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    prune(hits, now, 60 * 60 * 1000);
    if (hits.length === 0) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

// Default key: logged-in user id, else IP (covers public routes like quiz).
const defaultKey = (req) =>
  req.user?._id?.toString() || req.ip || req.socket?.remoteAddress || 'unknown';

export const rateLimit = ({ windowMs = 60 * 1000, max = 60, keyFn = defaultKey, message } = {}) =>
  (req, res, next) => {
    const key = `${req.baseUrl}${req.path}:${keyFn(req)}`;
    const now = Date.now();
    const hits = prune(buckets.get(key) || [], now, windowMs);
    if (hits.length >= max) {
      const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
      res.set('Retry-After', String(Math.max(retryAfter, 1)));
      return res.status(429).json({
        success: false,
        message: message || `Too many requests — try again in ${Math.max(retryAfter, 1)}s.`,
      });
    }
    hits.push(now);
    buckets.set(key, hits);
    next();
  };

// Presets used by the routes (generous for humans, hostile to scripts).
export const voteLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
export const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many posts — please wait a few minutes before posting again.',
});
export const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many comments — please slow down a little.',
});
export const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many quiz requests — please wait a moment.',
});
export const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many messages — please wait a moment.',
});
