# Optimization Log — DistroPedia

Every performance / reliability optimization shipped so far: the problem
(measured), the fix, the files, and how to verify. Newest last.

---

## 1. Card images: PNG → WebP + resize (~98% smaller)

**Problem:** 7 card backgrounds at 1145×1374, ~1.3MB each (~9MB total). The
Flavours page mounts ~19 cards; every hover image sat in the DOM from first
paint via CSS `background-image` (which can't lazy-load), so the browser
fetched all ~9MB immediately.

**Fix:**
- Converted to WebP, resized to 480×576 (cards display at ~200–250px, so
  480px still covers 2x DPR), quality 80 → **~18–29KB each, ~163KB total**.
- PNG originals kept in `frontend/assets-raw/card-backgrounds/` — outside
  `public/`, so Vite never copies them to `dist/` (kept, not served).
- Deleted dead `public/bg-texture.png` (977KB, superseded by CSS `.hero-bg`
  but still shipping in every build).

**Files:** `frontend/public/*.webp`, `frontend/assets-raw/*`,
`frontend/src/data/distros.js` + `backend/src/data/distros.js` (`cardBg`
paths), re-seeded Mongo so the API serves `.webp` URLs.

**Verify:** `ls -lh frontend/public/` (~192KB total); `vite build` output
`dist/` contains only `.webp`.

---

## 2. Lazy hover backgrounds (`DistroCard.jsx`)

**Problem:** even after WebP, 19 cards × hover layer = 19 requests competing
with first paint.

**Fix:** hover layer renders only when the card is within 200px of the
viewport (`IntersectionObserver`) or on first hover; then warms the browser
cache with `new Image()`. The default `same-bg.webp` stays eager — one small
file shared by all cards via HTTP cache. First hover has no wipe animation
(image still loading); every later hover animates.

**Files:** `frontend/src/components/DistroCard.jsx`.

---

## 3. Client API cache (`utils/apiCache.js`)

**Problem:** the custom router unmounts each page on navigation, and every
mount refetched with `loading=true` — skeleton flash on every visit even
though the data hadn't changed. Worse in production (Atlas latency).

**Fix:** shared TTL cache with three behaviors:
- `cached(key, ttl, fetcher)` — fresh reads resolve in microseconds;
  concurrent mounters share one in-flight promise (no duplicate requests).
- `peek()` / `peekStale()` — hooks/pages init `useState` from cache, so
  revisits **and reloads** paint instantly with zero skeleton; the async
  getter revalidates silently in the background.
- `invalidate(prefix)` — mutations bust exactly the right keys
  (new post → feed + stats; vote → detail; new message → thread + list).
- Only successful responses cached; offline static fallbacks never cached.
- Persisted to `localStorage` (60-entry cap, quota-safe, `dp_api_cache_v1`)
  so the cache survives full reloads — in-memory alone only helps SPA
  navigation. Recently-expired entries persist up to 10 min for
  stale-while-revalidate paints.

**TTLs:** catalogue/detail/compare/popular/categories **5 min** (changes only
on re-seed) · community feed/post **30s** · channel stats **60s** · chat
list/thread **30s** · quiz verdict **10 min** (identical answers only, AI
verdicts only — failures stay retryable).

**Files:** `frontend/src/utils/apiCache.js`,
`services/distroApi.js`, `services/communityApi.js`, `services/chatApi.js`,
`services/quizApi.js`, `hooks/useDistros.js|useDistro.js|useCompare.js`,
`pages/CommunityPage.jsx|PostDetailPage.jsx|ChatPage.jsx`,
`components/community/CommunitySidebar.jsx`.

**Deliberately NOT cached:** notification polling (live), channel-suggest
(per-draft), votes (optimistic UI + targeted invalidation instead),
`auth/me()` (unused), AI verdict *failures*.

---

## 4. Backend `Cache-Control` on public GETs

**Fix:** `public, max-age=60, stale-while-revalidate=300` on
`GET /api/flavours*` and `GET /api/distros/:id|compare` (categories: 5 min).
Browsers/CDNs cache the catalogue; authenticated routes untouched.
Worst-case staleness 60s, and catalogue only changes on re-seed.

**Files:** `backend/src/controllers/flavourController.js`,
`backend/src/controllers/distroController.js`.

---

## 5. Community at scale: infinite scroll + DB indexes

**Problem:** feed loads 10/page behind a "Load more" button; at hundreds of
posts the hot-sort aggregation + channel filter slow down without indexes.

**Fix:**
- Infinite scroll: sentinel div + `IntersectionObserver` (600px margin)
  auto-appends the next page; the button stays as fallback (no IO support,
  or a failed auto-load). `requestIdRef` guards stale responses.
- Compound indexes `{channel: 1, createdAt: -1}` and
  `{channel: 1, score: -1}` on `posts` — every feed query scopes by channel
  first, then sorts. Mongoose auto-builds them on boot.
- API already capped `limit ≤ 50`; feed never loads all at once by design.
- Future (not done): list virtualization past thousands of rows; `$text`
  search instead of regex (regex can't use indexes).

**Files:** `frontend/src/pages/CommunityPage.jsx`,
`backend/src/models/Post.js`, `backend/src/controllers/communityController.js`
(unchanged — pagination already existed).

---

## 6. 3D hero: parsed-model cache (`Tux3DCanvas.jsx`)

**Problem:** every Home visit re-fetched **and re-parsed** `scene.gltf`
(Three.js parse + shader compile = the real cost, not just bytes).

**Fix:** module-level cache holds the pristine parsed scene across remounts;
each mount `clone()`s it (shared geometries/materials — near-free) and only
then applies scale/position, so transforms never stack. Failed loads reset
the promise slot so a later visit retries; unmounting mid-load can't touch
torn-down state (cancelled guard).

---

## 7. Chat streaming (SSE) — perceived latency

**Problem:** the multi-agent pipeline budgets up to ~65s worst case
(Reddit ≤8s + research ≤20s parallel, then synthesis ≤25s, then citations
≤20s). The UI waited for *everything* before showing a word.

**Fix:** `POST /api/chat/:id/messages/stream` relays synthesis tokens live
(`token` events) with `stage` events (research → synthesizing → citations),
a 15s heartbeat against proxy timeouts, and abort-on-disconnect. The UI
appends tokens into the bubble in real time, shows the real stage instead of
generic "thinking", and aborts the stream on chat switch. Legacy
`POST /messages` is untouched — the client silently falls back to it
(typewriter path) if the stream dies before its first token. First token
still waits on research (≤20s); streaming removed the *second* wait.

**Files:** `backend/src/services/groqClient.js` (`chatCompletionStream`),
`synthesizerAgent.js` (shared prompt builder + stream variant),
`chatController.js` (`sendMessageStream`), `chatRoutes.js`,
`frontend/src/services/chatApi.js`, `pages/ChatPage.jsx`.

---

## 8. Reddit stage parallelized

**Problem:** top-comment enrichment fetched 3 posts **sequentially**
(3 × 2.5s serial inside the 8s budget).

**Fix:** `Promise.all` — same output shape and budget cap, typically ~2–4s
instead of up to 8s.

**File:** `backend/src/services/redditService.js`.

---

## 9. Groq 5-key rotation (reliability)

**Problem:** one key = one rate limit away from a dead assistant.

**Fix:** pool of up to 5 (`GROQ_API_KEY` + `_2…_5`, comma lists allowed, read
per request). 429 cools a key 60s (`Retry-After`-aware); 401 skips it 10 min;
cooled keys sort last so concurrent requests spread across healthy keys.
Other failures throw immediately (no double-spend). Secrets never logged
(`key#N` only). Both chat endpoints' 503 pre-checks respect the pool.

**Files:** `backend/src/services/groqClient.js`,
`backend/src/controllers/chatController.js`, `backend/.env.example`.

---

## 10. Blank-page recovery (reliability)

**Problem:** route chunks load lazily with no error boundary — a failed chunk
(stale deploy, flaky network) left a **blank page** fixable only by refresh.

**Fix:** `lazyWithRetry` auto-reloads once on chunk failure;
per-route `RouteErrorBoundary` shows a reload card for anything left, and
navigating away gives the next page a clean try.

**File:** `frontend/src/App.jsx`.

---

## How to verify all of it (demo script)

1. **Images:** DevTools Network → filter `webp` → Flavours load ≈ 163KB
   images; hover a card → no new request (pre-warmed) or one lazy fetch.
2. **Cache:** Flavours → Detail → back → no skeleton, no `/api` calls
   (Network tab idle). Reload → content paints instantly, API revalidates.
3. **Offline:** stop backend → pages still render from static data.
4. **Community:** scroll feed → auto-appends (sentinel); check
   `db.posts.getIndexes()` for the compound indexes.
5. **Chat:** send message → stage text → live tokens; switch chats mid-send
   → stream aborts; kill SSE (devtools offline mid-stream) → legacy
   fallback answers.
6. **Keys:** exhaust key#1 (or set a bogus `GROQ_API_KEY` + valid `_2`) →
   server log shows rotation, answer still arrives.
7. **Blank page:** deploy, then open with an old tab → auto-reload once,
   never blank.
