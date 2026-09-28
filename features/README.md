# Features — DistroPedia (Linux Distro Hub)

One file per feature. Open the file matching the question asked.

| File | Feature | Route / Endpoint |
|---|---|---|
| `browse-flavours.md` | Browse catalogue, search, categories, Popular | `/flavours` → `GET /api/flavours` |
| `distro-detail.md` | Detail page + install guides (normal/dual/vm) | `/distro/:id` → `GET /api/distros/:id` |
| `compare.md` | Side-by-side compare (max 4) | `/compare?ids=` → `GET /api/distros/compare` |
| `quiz.md` | Find Your Distro quiz + Jev AI verdict | `/quiz` → `POST /api/quiz/recommend` |
| `ai-chat.md` | DistroPedia AI assistant | `/chat` → `POST /api/chat/:id/messages` |
| `community.md` | Reddit-style forum per distro | `/community` → `/api/community/*` |
| `auth.md` | Login, register, OTP password reset | `/login` → `/api/auth/*` |

Common wiring for all: `frontend/vite.config.js` proxies `/api → :5000`; every `frontend/src/services/*` uses `VITE_API_URL || '/api'` with fetch-then-fallback to `frontend/src/data/distros.js`; backend `backend/server.js` mounts all routers; design tokens in `frontend/src/theme/designTokens.js`.
