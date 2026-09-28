# Linux Distro Hub (DistroPedia) — Complete Project Explanation

> Presentation-ready walkthrough of every folder and file.
> Stack: **MERN — MongoDB + Express + React + Node.js**

## 1. Project Overview — What is this?

**Linux Distro Hub / DistroPedia** is an interactive showcase for Linux distributions:

- Browse **14 Linux distros** (Ubuntu, Debian, Arch, Fedora, Mint, Kali, etc.) as visual cards
- Open a **detail page** per distro: specs, features, install guide (Normal / Dual-boot / VM)
- **Compare up to 4 distros** side-by-side in a spec table
- **Quiz — "Find Your Distro"**: 10 questions → rule-based scoring + AI verdict (TypeSafe Jev)
- **AI Chat — DistroPedia AI**: login-protected assistant using Groq + Reddit + web research
- **Community**: Reddit-style forum with per-distro channels, posts, threaded comments, votes, reports, notifications, admin moderation

No react-router — custom `pushState` router. No SDKs for AI — plain `fetch` to Groq / TypeSafe.

### How the two halves connect

```
Browser (React :5173) -- /api/* --> Express (:5000) --> MongoDB (linux_hub)
        |                                     |
        +-- falls back to local              +-- falls back to static data
            static data if API down               if AI keys missing
```

`frontend/vite.config.js` proxies `/api → http://localhost:5000` in dev.
In production: `VITE_API_URL=https://your-api-host/api` + `CLIENT_URL` in backend `.env`.

### Run it (from repo root)

```bash
npm run install:all   # install frontend + backend
cp backend/.env.example backend/.env   # set MONGO_URI, JWT_SECRET, GROQ_API_KEY, TYPESAFE_API_KEY
npm run seed           # seeds 14 flavours + 14 distro details
npm run server         # backend → http://localhost:5000/api/health
npm run dev            # frontend → http://localhost:5173
```

---

## 2. Root Level Files

| Path | Purpose |
|---|---|
| `package.json` | Orchestration only. No real code. Scripts: `dev`/`client` (frontend), `server` (backend), `build`/`preview`, `seed`, `install:all`. |
| `README.md` | Full setup guide, folder tree, MongoDB backup commands, SMTP password-reset notes, complete API table (flavours, distros, quiz, auth, chat, community). |
| `AGENTS.md` | Developer gotchas: port 5000 `EADDRINUSE` fix, `.env` requirement, `id/init/installGuide ↔ distroId/initSystem/installation` field mapping, custom router warning, fetch-then-fallback pattern, Groq-via-fetch, design tokens. |
| `.gitignore` | Ignores `node_modules`, `.env`, build output. |
| `frontend/` | All client code (React 18 + Vite 6). See §3. |
| `backend/` | All server code (Express + Mongoose). See §4. |

---

## 3. Frontend — `frontend/`

**Stack:** React 18, Vite 6, Tailwind 3, HeroUI, Framer Motion, Three.js, lucide-react, react-markdown, simple-icons.

### 3.1 Root config files

| File | Explanation |
|---|---|
| `index.html` | Vite entry. Mounts `<div id="root">` → `src/main.jsx`. Loads JetBrains Mono font, favicon `/tux.svg`, title "DistroPedia". |
| `package.json` | Name `linux-distro-hub-frontend`. Scripts `dev/build/preview`. Deps listed above; devDeps `vite, @vitejs/plugin-react, tailwind, postcss, autoprefixer`. |
| `vite.config.js` | Vite + React plugin. Dev proxy `/api → http://localhost:5000`. `allowedHosts` for ngrok demos. |
| `tailwind.config.js` | Content: `index.html + src/**/* + @heroui/theme`. `darkMode: class`. Plugin `heroui()`. |
| `postcss.config.js` | `tailwindcss + autoprefixer` processing. |
| `vercel.json` | SPA fallback: all routes rewritten to `/index.html` so custom router works on refresh. |
| `hero_bg.html` | Standalone prototype for the hero background (radial gradient + SVG noise + grain). Ported into `src/index.css`. Not imported at runtime. |
| `test.html` | Discarded Tailwind-CDN mockup. Not imported. |
| `flavours-inspiration .png` | Design reference image for Flavours page grid. Not imported. |

### 3.2 `public/` — served as-is, no bundling

| File | Explanation |
|---|---|
| `tux.svg` | Favicon + fallback Tux penguin logo. |
| `tux/scene.gltf` + `scene.bin` + `license.txt` | 3D Tux model loaded by `Tux3DCanvas.jsx` via `/tux/scene.gltf`. |
| `bg-texture.png` | Legacy hero texture, superseded by CSS `.hero-bg`. |
| `same-bg.png` | Neutral default card background used by `DistroCard.jsx`. |
| `ubuntu-card-bg.png`, `debian-card-bg.png`, `fedora-card-bg.png`, `arch-card-bg.png`, `mint-card-bg.png`, `kali-card-bg.png` | Per-distro hover backgrounds, referenced via `distro.cardBg`. |
| `install-guide/normal_step1_download.png` … `normal_step5_firstboot.png` | 5 visuals for Normal install (download ISO → flash USB → UEFI → partition → first boot). Shown on Detail page. |
| `install-guide/dual_step1_diskmgmt.png` … `dual_step5_grub.png` | 5 visuals for Dual-boot with Windows (disk mgmt → fast startup → Rufus → alongside → GRUB). |
| `install-guide/vm_step1_virtualbox.png` … `vm_step5_additions.png` | 5 visuals for VM install (VirtualBox → profile → storage → running → guest additions). |

### 3.3 `src/` core

| File | Explanation |
|---|---|
| `src/main.jsx` | ReactDOM entry. Wraps `<App/>` in `HeroUIProvider`, imports `index.css`. |
| `src/App.jsx` | **Custom router (no react-router).** `normalizeRoute()` maps pathname+hash → route, `navigate()` uses `pushState`, lazy-loads 9 pages in `Suspense(PageSkeleton)`. Routes: `/` (Home), `/flavours`, `/distro/:id`, `/compare`, `/quiz`, `/login`, `/chat`, `/community`, `/community/:id`. |
| `src/index.css` | Tailwind directives + global JetBrains Mono + `.hero-bg/.grain-*` backgrounds + `.dp-md` chat markdown + `.dp-skeleton` shimmer + custom scrollbar. |
| `src/theme/designTokens.js` | Single design source of truth. Exports `THEME, LINE, LINE_SOFT, CONNECTOR, MONO, RADIUS, BADGE` — burnt-orange accent, mono font. Imported by almost every component. Don't hardcode hexes. |

### 3.4 `src/data/` — offline fallbacks

| File | Explanation |
|---|---|
| `src/data/distros.js` | Mirror of all 14 distros. Exports `DISTROS, POPULAR_DISTROS`. Used when API is down. Must stay in sync with `backend/src/data/distros.js`. |
| `src/data/installGuide.js` | Exports `getInstallationData(distro)` building `normal/dual/vm` 5-step guides. Fallback when `distro.installGuide` missing from API. |

### 3.5 `src/utils/`

| File | Explanation |
|---|---|
| `src/utils/distroQuiz.js` | **Quiz scoring source of truth.** Exports `QUIZ_QUESTIONS` (10 questions) + `scoreQuiz(answers)` → ranked `[{distroId, points, percent, reasons}]`. Used by `QuizPage`. Backend trusts this shortlist. |
| `src/utils/timeAgo.js` | Exports `timeAgo(date)` → `just now / 5m / 3h / 2d / Jan 5`. Used by community feed/comments/notifications. |

### 3.6 `src/services/` — all use `VITE_API_URL || /api`, all fetch-then-fallback

| File | Explanation |
|---|---|
| `src/services/distroApi.js` | Catalogue API: `getDistros, getDistroById, getDistrosForCompare, getPopularDistros, getCategories`. Falls back to static data + normalizes `distroId→id, initSystem→init`. |
| `src/services/authApi.js` | Auth + `localStorage dp_token/dp_user`. `getToken/getUser/setAuth/clearAuth/register/login/me/forgotPassword/resetPassword/verifyResetToken`. |
| `src/services/chatApi.js` | Protected chat CRUD: `listChats/createChat/getChat/renameChat/deleteChat/sendMessage`. Used by `ChatPage`. |
| `src/services/communityApi.js` | Protected forum: posts CRUD + votes, comments CRUD + votes, `getChannelStats, suggestChannel, createReport, getNotifications/markRead/markAllRead`. |
| `src/services/quizApi.js` | `getAiRecommendation({answers, shortlist})` → `POST /quiz/recommend` (30s abort). Throws on failure → triggers rule-based fallback. |

### 3.7 `src/hooks/`

| File | Explanation |
|---|---|
| `src/hooks/useAuth.js` | Synced auth state via listener set. Returns `{user, token, login, register, logout}`. Wraps `authApi`. |
| `src/hooks/useDistros.js` | Catalogue loader. Returns `{distros, popularDistros, categories, loading}` + `DEFAULT_CATEGORIES`. Used by Flavours/Compare/Community/Quiz. |
| `src/hooks/useDistro.js` | Single-distro detail. Returns `{distro, otherDistros, loading}`. Used by `DistroDetailPage`. |
| `src/hooks/useCompare.js` | Compare loader. Returns `{distros, loading}` + `MAX_COMPARE=4`. Used by `ComparePage`. |
| `src/hooks/useMedia.js` | `useMedia(query)` → bool media-query hook. Used by `Navbar/CommunityShell/ChatPage` for responsive layout. |

### 3.8 `src/components/` — shared UI

| File | Explanation |
|---|---|
| `src/components/Navbar.jsx` | Fixed glass pill nav. Props `currentRoute/onNavigate/searchQuery/onSearchChange`. Search mode on Flavours page + mobile hamburger. |
| `src/components/HeroSection.jsx` | Landing hero: 8-distro orbital ring around `Tux3DCanvas`, SVG dashed connectors, hover preview, mobile chips + bottom sheet. Rendered by `HomePage`. |
| `src/components/DistroCard.jsx` | Catalogue card with cursor-origin circular wipe to `cardBg`. Props `distro/onExplore`. Used by `FlavoursPage`. |
| `src/components/DistroModal.jsx` | Framer detail modal (banner, specs grid, website CTA, Esc/backdrop close). Legacy — detail is now a page, currently unused. |
| `src/components/DistroIcon.jsx` | Simple-Icons SVG logos. Exports `OFFICIAL_DISTRO_LOGOS` + `DistroIcon({name, accent, size})`. Used everywhere a logo appears. |
| `src/components/Skeleton.jsx` | Shimmer placeholders: `Skeleton, TextLines, PageSkeleton, DistroCardSkeleton, DistroGridSkeleton, DistroDetailSkeleton, CompareTableSkeleton, PostRowSkeleton, CommunityFeedSkeleton, RailListSkeleton, PostDetailSkeleton, ChatListSkeleton, ChatMessagesSkeleton, QuizResultSkeleton`. |
| `src/components/Tux3DCanvas.jsx` | Three.js interactive Tux (OrbitControls, parallax, float, accent light from `activeDistro`). Props `activeDistro/size/isMobile`. Used by `HeroSection`. |

### 3.9 `src/components/community/` — forum UI

| File | Explanation |
|---|---|
| `community/Avatar.jsx` | `UserAvatar({name, size})` (hue-hash letter) + `ChannelAvatar({channel, distro})` (distro logo or globe). |
| `community/PostCard.jsx` | Feed row: meta, title, link, 2-line preview, vote/comments/share/edit/delete. Exports `PostCard + RowAction`. |
| `community/CommentItem.jsx` | Recursive threaded comment with vote/reply/edit/collapse. Used by `PostDetailPage`. |
| `community/CommunityShell.jsx` | 3-column frame `[nav\|feed\|rail]` + hero bg. Exports `CommunityShell + RailCard`. |
| `community/CommunityNav.jsx` | Left nav + `MobileChannelBar`. Props `distros/channel/onNavigate/onChannel/onCreatePost`. |
| `community/CommunitySidebar.jsx` | Right-rail cards: `AboutCommunity/AboutChannel/RecentPosts/CommunityRules`. Fetches stats via `communityApi`. |
| `community/VotePill.jsx` | Horizontal `▲ score ▼` pill with per-post vote lock. |
| `community/NotificationBell.jsx` | Bell with unread badge + dropdown, 30s poll via `getNotifications`. Prop `onOpenPost`. |
| `community/ReportButton.jsx` | Flag → reason dropdown → `createReport`. Used on posts/comments. |

### 3.10 `src/pages/` — routed by `App.jsx`

| File / Route | Explanation |
|---|---|
| `src/pages/HomePage.jsx` → `/` | Thin wrapper rendering `HeroSection`. |
| `src/pages/FlavoursPage.jsx` → `/flavours` | Catalogue with search + category pills, Popular + All grids, quiz CTA. Uses `useDistros/DistroCard/Navbar`. |
| `src/pages/DistroDetailPage.jsx` → `/distro/:id` | Full-bleed banner, spec matrix, tabbed install guide (`normal/dual/vm`) with copyable commands + lightbox, side-dock scrollspy. Uses `useDistro/getInstallationData`. |
| `src/pages/ComparePage.jsx` → `/compare?ids=` | Picker (max 4) + spec table (`COMPARE_ROWS`). Uses `useDistros/useCompare`. |
| `src/pages/QuizPage.jsx` → `/quiz` | 10-step wizard → waits for Jev verdict (`quizApi`) → winner + runners-up + compare/community actions. Falls back to `scoreQuiz`. |
| `src/pages/AuthPage.jsx` → `/login` | Login/register + forgot → 6-box OTP → reset. Exports `AuthPage + OtpInput/ForgotResetView`. Uses `useAuth/authApi`. |
| `src/pages/ChatPage.jsx` → `/chat` | DistroPedia AI: sidebar history (rename/delete/collapse/drawer), markdown + `CodeBlock/TableBlock`, typewriter reveal, copy/download `.md`. Guards to `AuthPage` when no token. |
| `src/pages/CommunityPage.jsx` → `/community` | Feed with channel/sort/debounced search, `Composer` + AI `suggestChannel`, optimistic voting, pagination. |
| `src/pages/PostDetailPage.jsx` → `/community/:id` | Single post (markdown `CodeBlock`), edit/delete dialogs, comment composer + Best/New + search, optimistic nested replies/votes. |

---

## 4. Backend — `backend/`

**Stack:** Express 4, Mongoose 8, jsonwebtoken, bcryptjs, cors, dotenv, nodemailer. ESM (`type: module`). No tests/linter.

### 4.1 Root files

| File | Explanation |
|---|---|
| `server.js` | Entry: `cors + express.json()`, `GET /api/health`, mounts `/api/flavours\|distros\|auth\|chat\|community\|quiz`, then `notFound + errorHandler`, then `connectDB().then(app.listen:5000)`. |
| `package.json` | Name `linux-distro-hub-backend`. Scripts `start / dev (--watch) / seed / seed:destroy`. Deps above. |
| `.env.example` | Template: `PORT, MONGO_URI, CLIENT_URL, JWT_SECRET, GROQ_API_KEY/MODEL, TYPESAFE_API_KEY/MODEL, SMTP_* / RESET_DELIVERY`. Copy to `.env`. |
| `README.md` | Setup + endpoint table (covers flavours/distros/quiz; auth/chat/community only in root README). |

### 4.2 `src/config/`

| File | Explanation |
|---|---|
| `src/config/db.js` | `connectDB()` via `mongoose.connect(MONGO_URI \|\| localhost/linux_hub)`. `process.exit(1)` on fail. Called by `server.js` and `seed.js`. |

### 4.3 `src/models/` — all shape JSON as `{id, ...}`, hide `_id/__v`

| File / Collection | Explanation |
|---|---|
| `src/models/Flavour.js` → `flavours` | Lean cards: `distroId unique, name, accent, tagline, basedOn, pkgMgr, category, popular, angle, website, downloadUrl, cardBg, preview`. Text index + virtual `id=distroId`. |
| `src/models/Distro.js` → `distros` | Full detail: above + `initSystem, desktop, releaseModel, latestVersion, minRam/minDisk, license, architectures, installCmd, description, keyFeatures[], installation`. Maps to frontend `{id, init, installGuide}` in `toJSON`. |
| `src/models/User.js` → `users` | `email unique, passwordHash (bcrypt), name, isAdmin, resetTokenHash/Expiry`. Hides secrets. Used by auth middleware. |
| `src/models/Chat.js` → `chats` | `user ref, title, messages[{role: user\|assistant, content, sources[{title, url}]}]`. |
| `src/models/Post.js` → `posts` | `author, channel (general\|distroId), title≤150, body≤10k, linkUrl, score, commentCount`. Text index on title. |
| `src/models/Comment.js` → `comments` | `post, author, parent\|null (one-level threading), body≤5k, score`. |
| `src/models/Vote.js` → `votes` | `user, targetType: post\|comment, targetId, value: 1\|-1`, unique compound. `applyVote()` atomically `$inc` target score. |
| `src/models/Notification.js` → `notifications` | `user, type: reply\|comment, actor, post, comment, read`. Pull-only feed. Written on new comments. |
| `src/models/Report.js` → `reports` | `reporter\|null (AI), source: user\|ai, targetType/Id, reason: spam\|harassment\|off-topic\|wrong-channel\|other, detail, status: open\|resolved\|dismissed`. One per reporter/target. |
| `src/models/AuditLog.js` → `auditlogs` | Append-only: `actor, action, targetType/Id, detail`. No update/delete API. |

Two collections, one key: `flavours` (cards) vs `distros` (detail+guides), linked by `distroId`. Seed keeps them in sync.

### 4.4 `src/controllers/`

| File | Explanation |
|---|---|
| `src/controllers/flavourController.js` | `getFlavours(?search,category,popular,page,limit,sort), getPopularFlavours, getFlavourCategories, getFlavourById, create\|update\|deleteFlavour`. Translates `id→distroId`. |
| `src/controllers/distroController.js` | `getDistroById` (by `distroId\|name`, builds `installGuide` on-the-fly if missing), `getDistrosForCompare(?ids= max 4), create\|update\|deleteDistro` via `toDB(id→distroId, init→initSystem, installGuide→installation)`. |
| `src/controllers/authController.js` | `register\|login (bcrypt+jwt 7d), getMe, forgotPassword\|verifyResetToken\|resetPassword` (6-digit OTP, sha256 + 15m expiry, `deliverResetToken`). |
| `src/controllers/chatController.js` | `getChats, create\|get\|rename\|deleteChat (ownership→404), sendMessage` pipeline: save user msg → parallel `searchReddit + runWebResearch` → `synthesizeAnswer` → `filterSources` → save assistant msg. |
| `src/controllers/communityController.js` | Full Reddit-clone: `listPosts(?channel,sort:hot\|new\|top,search,page)` (hotScore aggregation), post CRUD (delete cascades), comment CRUD (recursive delete), votes, `getChannelStats, suggestChannelForDraft, create\|list\|updateReportStatus, notifications, getAuditLog`. Calls `Vote, moderationAgent, channelSuggestAgent, auditLog`. |
| `src/controllers/quizController.js` | `POST {answers[], shortlist[]}` public, always 200: `loadCatalogue (DB→static fallback), sanitizeOrder, fallback({ai:false})` if no key/error/low confidence, else `recommendDistro()` → `{ai:true, winner, runnersUp, probabilities, confidence, explanation, strengths, tip}`. |

### 4.5 `src/routes/` — mounted in `server.js`

| File | Mount | Explanation |
|---|すすめ---|---|---|
| `src/routes/flavourRoutes.js` | `/api/flavours` | `GET /popular\|/categories` (before `/:id`), `GET\|POST /`, `GET\|PUT\|DELETE /:id`. |
| `src/routes/distroRoutes.js` | `/api/distros` | `POST /`, `GET /compare` (before `/:id`), `GET\|PUT\|DELETE /:id`. |
| `src/routes/authRoutes.js` | `/api/auth` | `POST /register\|login\|forgot-password\|verify-reset-token\|reset-password` (all rate-limited) + `GET /me (protect)`. |
| `src/routes/chatRoutes.js` | `/api/chat` (all `protect`) | `GET\|POST /`, `GET\|DELETE /:id`, `PUT /:id/rename`, `POST /:id/messages` (rate-limited). |
| `src/routes/communityRoutes.js` | `/api/community` (all `protect`) | Posts, stats, notifications, admin audit/reports, votes, comments — all rate-limited (see §4.6). |
| `src/routes/quizRoutes.js` | `/api/quiz` | `POST /recommend` (rate-limited, public). |

### 4.6 `src/middleware/`

| File | Explanation |
|---|---|
| `src/middleware/authMiddleware.js` | `protect` (Bearer JWT → `req.user` via `User.findById`) + `requireAdmin (403 if !isAdmin)`. |
| `src/middleware/errorMiddleware.js` | `notFound (404 JSON)` + `errorHandler` (`ValidationError→400, 11000→409, CastError→400`, hides stack in prod). Works with `asyncHandler`. |
| `src/middleware/rateLimit.js` | In-memory sliding window. Presets: `vote (60/m), post (5/10m), comment (20/10m), quiz (20/m), chatMessage (30/m)`. |

### 4.7 `src/services/` — AI + external, all plain `fetch`, best-effort

| File | Explanation |
|---|---|
| `src/services/groqClient.js` | Shared Groq `chatCompletion({system, messages, temperature, maxTokens, jsonMode})`. Base for web research + synthesizer. Exports `NO_KEY_MESSAGE`. Model from `GROQ_MODEL`. |
| `src/services/jevClient.js` | Shared TypeSafe `systemOne({state, questions, model})`. Typed judgments only. Base for quiz/citation/moderation/channel-suggest. Model from `TYPESAFE_MODEL` (default `jev-latest`). |
| `src/services/redditService.js` | `searchReddit(query)` — `search.json?q=+linux`, up to 4 posts + top-3 comments, 8s cap, never throws. |
| `src/services/webResearchAgent.js` | `runWebResearch({question, history})` — Groq recall (temp 0.3), empty on fail. Runs parallel with Reddit. |
| `src/services/synthesizerAgent.js` | `synthesizeAnswer({question, history, redditResults, webFindings, webSources})` — final Markdown + Sources section. |
| `src/services/citationAgent.js` | `filterSources({question, sources})` — Jev Noul per source, keep ≥0.3, never strip all. |
| `src/services/quizAgent.js` | `recommendDistro({answers, shortlist, catalogue})` — one Jev Choice + code-derived `runnersUp, explanation, strengths, tip`. `MIN_TOP_PROBABILITY=0.15`. |
| `src/services/moderationAgent.js` | `screenContent({targetType, targetId, title, body})` — fire-and-forget Jev 3×Noul (spam/abusive/offtopic, threshold 0.7) → `Report(source:ai)`. |
| `src/services/channelSuggestAgent.js` | `suggestChannel({title, body})` — Jev Choice over `general + distroIds`. |

### 4.8 `src/data/`

| File | Explanation |
|---|---|
| `src/data/distros.js` | `DISTROS[14]` seed mirror (frontend-shaped `{id, init, ...}`). Consumed by `seed.js` + quiz fallback. Keep in sync with `frontend/src/data/distros.js`. |
| `src/data/installGuide.js` | `buildInstallGuide(distro)` → `{normal, dual, vm}` steps (pkgMgr-aware `updateCmd`). Stored as `installation`, served as `installGuide`. Source of truth for guide content. |

### 4.9 `src/utils/`

| File | Explanation |
|---|---|
| `src/utils/seed.js` | `npm run seed \| --destroy`. Maps `id→distroId, init→initSystem + buildInstallGuide` → `distros`, projects `FLAVOUR_FIELDS` → `flavours` (14+14). |
| `src/utils/asyncHandler.js` | `asyncHandler(fn)` forwards async errors to `errorMiddleware`. Used by all controllers. |
| `src/utils/auditLog.js` | `logAdminAction(...)` (fire-and-forget `AuditLog.create`) + `isAdminOnOthersContent()`. |
| `src/utils/mailer.js` | `deliverResetToken({email, token})` via nodemailer SMTP if configured, else console log (refuses in prod without SMTP). |

---

## 5. Key API Endpoints (for demo)

```
GET  /api/health
GET  /api/flavours?search=&category=&popular=true&sort=name
GET  /api/flavours/popular
GET  /api/flavours/categories
GET  /api/distros/:id              (by distroId or name, includes installGuide)
GET  /api/distros/compare?ids=a,b,c,d
POST /api/quiz/recommend           { answers[], shortlist[] }
POST /api/auth/register|login      → { token, user }
GET  /api/auth/me                  (Bearer)
GET|POST /api/chat                 (Bearer)
POST /api/chat/:id/messages        { content } → Reddit + web agents → reply
GET  /api/community/posts?channel=&sort=hot|new|top&search=&page=
POST /api/community/posts          { channel, title, body?, linkUrl? }
```

Graceful degradation: quiz returns `{ai:false}` without `TYPESAFE_API_KEY`; chat returns 503 without `GROQ_API_KEY`; frontend falls back to static data if API down.

---

## 6. Suggested 5-Minute Presentation Flow

1. **Hook (30s):** "Choosing a Linux distro is overwhelming — DistroPedia is an interactive guide: browse, compare, quiz, ask AI, discuss."
2. **Browse (1m):** Home orbital hero (Three.js Tux) → Flavours grid + search/filter → Detail page specs + install-guide tabs with images + copyable commands.
3. **Decide (1m):** Compare 4 distros side-by-side → Quiz wizard → show rule-based score + Jev AI verdict with probabilities.
4. **Ask + Discuss (1m):** Login → AI chat (Reddit + Groq synthesis with sources) → Community post/vote/comment per distro channel.
5. **Under the hood (1m):** MERN diagram, two-collections-one-key (`flavours` vs `distros` via `distroId`), custom router, fetch-then-fallback, plain-fetch AI clients, JWT + rate limits + moderation pipeline. Close with `npm run seed / server / dev`.

---

# PART B — Detailed Code Walkthrough (Viva: "Show code for X")

> How to use this: if they ask "show code for ___", open the file listed, show the snippet, explain the 3-line connection chain underneath it.

## B1. App startup + custom router — code for routing

**Files:** `frontend/src/main.jsx` → `frontend/src/App.jsx:16-53,60-118`

```jsx
// main.jsx — entry
ReactDOM.createRoot(document.getElementById('root')).render(
  <HeroUIProvider><App /></HeroUIProvider>
);

// App.jsx — NO react-router, custom pushState router
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const FlavoursPage = lazy(() => import('./pages/FlavoursPage.jsx'));
// ... 9 pages lazy-loaded → one chunk per page

function normalizeRoute(pathname, hash) {
  if (path === '/flavours') return '/flavours';
  if (path.startsWith('/distro/')) return pathname; // /distro/:id
  if (path === '/quiz') return '/quiz';
  // ... compare, community, chat, login
  return '/'; // unknown → home (silent fallback!)
}

const navigate = (path) => {
  window.history.pushState({}, '', path);
  setCurrentRoute(path);
};
```

**Explain:** `index.html #root → main.jsx → App.jsx`. `normalizeRoute` maps URL → route string, `navigate` pushes history + sets state, render ternary picks the page. Lazy + `Suspense(PageSkeleton)` keeps initial bundle small. Gotcha: forgetting `normalizeRoute` makes a route silently fall back to `/`.

## B2. Frontend → Backend connection — code for API wiring

**Files:** `frontend/vite.config.js:7-15`, `frontend/src/services/distroApi.js:5-11`

```js
// vite.config.js — dev only
server: { proxy: { '/api': { target: 'http://localhost:5000' } } }

// every services/*.js — same pattern
const API_BASE = import.meta.env.VITE_API_URL || '/api';
async function fetchJSON(url) {
  const res = await fetch(url);           // → /api/flavours?... → :5000
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
```

**Explain:** Browser calls `/api/...`. In dev Vite proxies to Express `:5000`; in prod `VITE_API_URL` points to hosted API. Backend `server.js:28-37` mounts `/api/flavours|distros|auth|chat|community|quiz`. `cors({ origin: CLIENT_URL })` allows the frontend origin.

## B3. Browse catalogue — code for Flavours list (full vertical slice)

**Chain:** `FlavoursPage.jsx:82` → `hooks/useDistros.js:19-42` → `services/distroApi.js:29-51` → `controllers/flavourController.js:5-42` → `models/Flavour.js` → Mongo `flavours`

```jsx
// FlavoursPage.jsx
const { distros, popularDistros, categories, loading } = useDistros();
// filters locally, renders <DistroCard onExplore={(d)=>onNavigate(`/distro/${d.id}`)} />

// useDistros.js — starts with static data so page never blanks
const [distros, setDistros] = useState(DISTROS);
useEffect(() => {
  Promise.allSettled([getDistros(), getPopularDistros(), getCategories()])
    .then(([d,p,c]) => { /* replace only on fulfilled */ });
}, []);

// distroApi.js — try API, catch → static filter
const json = await fetchJSON(`${API_BASE}/flavours?search=..&limit=100`);
return (json.data || []).map(normalize);
// catch { return DISTROS.filter(...) }  ← offline fallback

// flavourController.js — real DB query
const filter = {};
if (category !== 'All') filter.category = category;
if (search) filter.$or = [{name:{$regex:q,$options:'i'}}, ...];
const [total, flavours] = await Promise.all([
  Flavour.countDocuments(filter),
  Flavour.find(filter).skip(...).limit(limitNum)
]);
res.json({ success:true, count, total, page, pages, data: flavours });
```

**Explain:** Hook owns loading state, service owns fetch-then-fallback, controller owns Mongo filter/pagination, model shapes JSON as `{id,...}`. Same pattern repeats for popular + categories.

## B4. Detail page + install guide — code for specs/guides

**Chain:** `DistroDetailPage.jsx:86-87` → `hooks/useDistro.js:16-43` → `distroApi.getDistroById` → `controllers/distroController.js:22-36` → `data/installGuide.js:13-35` + `models/Distro.js:76-85`

```js
// useDistro.js
const [distro, setDistro] = useState(() => findLocal(distroId)); // instant
useEffect(() => { getDistroById(distroId).then(setDistro); }, [distroId]);

// distroController.js
const distro = await Distro.findOne({ distroId: key }) ||
                     await Distro.findOne({ name: regex });
if (!distro.installation)
  distro.installation = buildInstallGuide(distro.toObject()); // on-the-fly
res.json({ success: true, data: distro }); // toJSON → {id, init, installGuide}

// installGuide.js — source of truth, pkgMgr-aware
const updateCmd = distro.pkgMgr==='apt' ? 'sudo apt update && sudo apt upgrade -y'
  : distro.pkgMgr==='pacman' ? 'sudo pacman -Syu'
  : distro.pkgMgr==='dnf' ? 'sudo dnf upgrade --refresh -y' : ...;
return { normal:{steps:[...5]}, dual:{steps:[...5]}, vm:{steps:[...5]} };

// Distro.js shapeJSON — the field-mapping gotcha
ret.id = ret.distroId; ret.init = ret.initSystem; ret.installGuide = ret.installation;
delete ret._id; delete ret.__v; delete ret.installation; delete ret.initSystem;
```

**Explain:** Detail content lives in DB (`installation`), not hardcoded in client. `init` is a reserved Mongoose method so DB uses `initSystem`. Frontend `DistroDetailPage` tabs `normal/dual/vm` render steps + copyable `cmd` + images from `public/install-guide/`.

## B5. Seed — code for how DB gets the 14 distros

**File:** `backend/src/utils/seed.js:27-52`

```js
const toDetailDoc = ({ id, init, ...rest }) => ({
  distroId: id, initSystem: init || 'systemd', ...rest,
  installation: buildInstallGuide({ id, ...rest }), // guides baked in
});
const detailDocs = DISTROS.map(toDetailDoc);
await Distro.insertMany(detailDocs);
await Flavour.insertMany(detailDocs.map(toFlavourDoc)); // lean subset only
```

**Explain:** `npm run seed` wipes both collections, inserts 14 full docs into `distros`, projects lean fields into `flavours`. One key links them: `distroId`. `frontend/src/data/distros.js` and `backend/src/data/distros.js` must stay in sync.

## B6. Quiz end-to-end — code for scoring + AI verdict

**Chain:** `utils/distroQuiz.js:253-279` → `pages/QuizPage.jsx:47-77` → `services/quizApi.js:10-28` → `controllers/quizController.js:58-128` → `services/quizAgent.js:59-90` → `services/jevClient.js:12-50`

```js
// 1. Rule-based scoring (frontend source of truth, Kali trap = 25 pts)
export function scoreQuiz(answers) {
  const tally = new Map();
  for (const q of QUIZ_QUESTIONS) {
    const option = q.options[answers[q.id]];
    for (const [distroId, pts] of Object.entries(option.scores)) {
      const e = tally.get(distroId) || { points:0, reasons:new Set() };
      e.points += pts; e.reasons.add(option.reason); tally.set(distroId, e);
    }
  }
  return [...tally.entries()].map(...).sort((a,b)=>b.points-a.points);
}

// 2. QuizPage waits for AI — no flash, one decision
const shortlist = scoreQuiz(answers).slice(0,5)
  .map(r => ({ distroId:r.distroId, points:r.points, reasons:r.reasons }));
getAiRecommendation({ answers: readable, shortlist })
  .then(json => json?.ai ? setAiState({status:'ready',verdict:json})
                         : setAiState({status:'fallback'}));

// 3. quizApi — throws so caller falls back
await fetch(`${API_BASE}/quiz/recommend`, { method:'POST', body:JSON.stringify({answers,shortlist}) });

// 4. quizController — always 200, ai:false on degradation
if (!process.env.TYPESAFE_API_KEY) return fallback(NO_KEY_MESSAGE); // graceful
verdict = await recommendDistro({ answers, shortlist, catalogue });
if (topProbability < 0.15) return fallback('AI was unsure'); // near-uniform = noise

// 5. quizAgent — ONE Jev Choice, rest is code
const data = await systemOne({ state:{ answers, shortlist_hint: shortlist },
  questions:{ best_distro:{ type:'choice', instructions:{...rubric}, criteria } } });
// criteria = { ubuntu:"Ubuntu — ... | category | desktop | release | min RAM", ... }
// runners-up = 2nd/3rd probability, explanation/tip built in code (FIRST_STEP_TIPS)
```

**Explain:** Scoring never duplicated server-side — backend trusts client's shortlist, validates ids via `sanitizeOrder`, asks Jev for one winner choice. If key missing / error / low confidence → `{ai:false}` → frontend shows classic match.

## B7. Auth — code for login/JWT/protect

**Chain:** `pages/AuthPage.jsx` → `hooks/useAuth.js` → `services/authApi.js:48-91` → `controllers/authController.js:19-69` → `middleware/authMiddleware.js:6-30`

```js
// authApi.js — token in localStorage
headers.Authorization = `Bearer ${getToken()}`; // dp_token

// authController.js — register/login
const passwordHash = await bcrypt.hash(password, 10);
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn:'7d' });
res.json({ success:true, token, data: user });
// login: same message for wrong email vs wrong password (no enumeration)
// forgot-password: 6-digit OTP, sha256 hash + 15min expiry, mailer or console

// authMiddleware.js — protect
const token = header.split(' ')[1];
decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id); next();
// community/chat routes do router.use(protect); admin adds requireAdmin
```

**Explain:** `useAuth` syncs `dp_token/dp_user` across components. Every chat/community request carries Bearer. Mismatch on private chats returns 404 (not 403) to avoid leaking existence.

## B8. AI Chat — code for multi-agent pipeline

**Chain:** `pages/ChatPage.jsx` → `services/chatApi.js:77-83` → `controllers/chatController.js:69-166` → `services/{redditService,webResearchAgent,synthesizerAgent,citationAgent}.js` → `services/groqClient.js:14-59`

```js
// chatController.sendMessage — the pipeline
chat.messages.push({ role:'user', content }); await chat.save(); // save first → retry-safe
const [redditStage, webStage] = await Promise.all([   // PARALLEL
  timed('reddit', () => searchReddit(content)),        // ~8s cap, never throws
  timed('web', () => runWebResearch({ question, history })), // Groq recall
]);
answer = await synthesizeAnswer({ question, history, redditResults, webFindings, webSources });
sources = dedupe([...answer.sources, ...redditThreads.slice(0,3)]);
screened = await filterSources({ question, sources }); // Jev Noul ≥0.3 keeps
chat.messages.push({ role:'assistant', content: answer.content, sources: screened.sources });

// groqClient — plain fetch, no SDK
await fetch('https://api.groq.com/openai/v1/chat/completions',
  { headers:{ Authorization:`Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: process.env.GROQ_MODEL||'openai/gpt-oss-120b', messages }) });
```

**Explain:** Two researchers run in parallel (Reddit real threads + Groq web-recall), synthesizer writes Markdown + Sources, citation agent drops off-topic sources. No key → 503 fast-fail before saving. Frontend renders markdown + `CodeBlock` + typewriter + `.md` download.

## B9. Community — code for posts/votes/moderation

**Chain:** `pages/CommunityPage.jsx` → `services/communityApi.js` → `routes/communityRoutes.js:36-54` → `controllers/communityController.js` → `models/{Post,Comment,Vote,Report,Notification,AuditLog}.js` + `services/{moderationAgent,channelSuggestAgent}.js`

```js
// routes — all protect, granular rate limits
router.use(protect);
router.route('/posts').get(listPosts).post(postLimiter, createPost); // 5/10m
router.post('/posts/:id/vote', voteLimiter, votePost);               // 60/m
router.post('/posts/:id/comments', commentLimiter, addComment);      // 20/10m

// Vote.applyVote — atomic, one vote per user/target
// $inc post.score, unique compound (user,targetType,targetId)

// addComment writes Notification for post author; moderationAgent.screenContent
// fire-and-forget Jev 3×Noul (spam/abusive/offtopic ≥0.7) → Report(source:'ai')
// suggestChannelForDraft: Jev Choice over general+distroIds
```

**Explain:** Channels are `general` or a `distroId` (validated against flavours). Sort `hot|new|top`, threaded comments (one nesting level via `parent`), optimistic UI voting, reports queue + admin audit log.

## B10. Styling + cards — code for theme

**Files:** `frontend/src/theme/designTokens.js:6-24`, `frontend/src/components/DistroCard.jsx:9-49`

```js
export const THEME = { bg:'#161B22', bgCard:'#1C2229', accent:'#E05A38',
  textMain:'#F0F4F8', textMuted:'#8B949E' };
// one burnt-orange accent, JetBrains Mono — never hardcode hexes

// DistroCard hover: circular wipe from cursor point
coloredLayerRef.current.animate(
  [{ clipPath:`circle(0px at ${x}px ${y}px)` },
   { clipPath:`circle(600px at ${x}px ${y}px)` }], { duration:1500, fill:'forwards' });
```

## Viva cheat-sheet — 1-line answers + file to open

| If they ask... | Answer | Open |
|---|---|---|
| Where does routing happen? | Custom `normalizeRoute` + `pushState`, no react-router | `frontend/src/App.jsx:16` |
| How does frontend talk to backend? | `VITE_API_URL \|\| /api`, Vite proxy in dev | `frontend/vite.config.js:10`, `services/distroApi.js:5` |
| What if API is down? | Every service try/catch → static `data/distros.js` | `services/distroApi.js:37` |
| Why two collections? | `flavours` lean cards vs `distros` full detail, linked by `distroId` | `backend/src/utils/seed.js:42` |
| Why `initSystem` not `init`? | `init` is a reserved Mongoose method; mapped in `toJSON`/`toDB` | `models/Distro.js:26`, `controllers/distroController.js:8` |
| Where is quiz scoring? | Only frontend `scoreQuiz`; backend trusts shortlist, only validates ids | `utils/distroQuiz.js:253`, `controllers/quizController.js:40` |
| How does quiz AI work? | One Jev Choice over catalogue; code derives runners/explanation/tip | `services/quizAgent.js:70` |
| How does chat AI work? | Parallel Reddit + Groq research → Groq synthesis → Jev citation filter | `controllers/chatController.js:101` |
| How is auth done? | bcrypt + JWT 7d, Bearer in `protect`, `dp_token` in localStorage | `controllers/authController.js:10`, `middleware/authMiddleware.js:6` |
| How is spam handled? | Rate limits + Jev moderation → `reports` + admin audit log | `middleware/rateLimit.js`, `services/moderationAgent.js` |
| How are AI calls made? | Plain `fetch`, no SDKs; keys degrade gracefully | `services/groqClient.js:22`, `services/jevClient.js:20` |
| How to verify? | `npm --prefix frontend run build`, `node --check`, `curl /api/health` | `AGENTS.md:13` |

