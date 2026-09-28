# AGENTS.md — Linux Distro Hub (DistroPedia)

MERN showcase app. Root `package.json` only orchestrates; real code lives in `frontend/` and `backend/`.

## Commands (run from repo root)

- `npm run install:all` — install both packages
- `npm run seed` — seed MongoDB (14 flavours + 14 distro details)
- `npm run server` — backend on `:5000` (`node --watch server.js`)
- `npm run dev` — frontend on `:5173`
- `npm --prefix frontend run build` — only verification available

No tests, linter, typecheck, or CI exist. Verify with `vite build` (frontend) and `node --check <file>` + `curl localhost:5000/api/health` (backend).

## Gotchas

- **Port 5000 busy (`EADDRINUSE`)**: `node --watch` keeps old servers alive. `fuser -k 5000/tcp` or kill the stale `node server.js` before restarting.
- **Backend needs MongoDB + `.env`**: copy `backend/.env.example` → `backend/.env`. `MONGO_URI` defaults to local; `GROQ_API_KEY` (+ optional `_2…_5`, comma lists allowed — 429/401 auto-rotates to the next key) enables AI chat and `TYPESAFE_API_KEY` (Jev) enables the quiz verdict (both degrade gracefully without it — quiz returns `ai:false`, chat returns 503).
- **Field-name mapping**: frontend `id` / `init` / `installGuide` ↔ DB `distroId` / `initSystem` (`init` is a reserved Mongoose method) / `installation`. Controllers already translate both directions — keep using their helpers.

## Architecture

- **No react-router.** Custom pushState router in `frontend/src/App.jsx`: adding a page means extending `normalizeRoute` (pathname + hash) AND the `isX` checks AND the render ternary. A route missing from `normalizeRoute` silently falls back to `/`.
- **API access**: `import.meta.env.VITE_API_URL || '/api'`; dev proxies `/api` → `:5000` (`frontend/vite.config.js`). Every `frontend/src/services/*` module follows fetch-then-fallback-to-static-data — preserve that pattern so the UI never breaks offline.
- **Two collections, one key**: `flavours` (lean cards) vs `distros` (full detail + guides), linked by `distroId`. Seed keeps them in sync.
- **Quiz is fully AI**: `frontend/src/utils/distroQuiz.js` holds questions only (no scores). `POST /api/quiz/recommend` sends readable answers; Jev picks from the whole catalogue. No shortlist, no fallback ranking — AI failure is an error + retry.
- **Groq via plain `fetch`** (`backend/src/services/groqClient.js`) — OpenAI-compatible, no SDK dependency. Model from `GROQ_MODEL`.
- **Styling**: shared tokens in `frontend/src/theme/designTokens.js` (`THEME`, `MONO`, `LINE`); one burnt-orange accent, JetBrains Mono, inline-style components. Don't hardcode hexes.
- **Data mirrors**: `frontend/src/data/distros.js` and `backend/src/data/distros.js` both hold the 14 seeded distros — keep them in sync when adding one.
