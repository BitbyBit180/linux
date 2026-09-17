# Linux Hub — Backend (MERN API)

Express + MongoDB REST API that powers the Linux Distro Hub frontend.

## Folder structure

```
backend/
├── server.js                 # App entry: express setup, /api/health, route mount, DB connect
├── package.json              # Backend deps & scripts (port 5000)
├── .env.example              # Copy to .env and fill in
└── src/
    ├── config/db.js          # Mongoose connection
    ├── models/
    │   ├── Flavour.js        # `flavours` collection: lean cards catalogue
    │   └── Distro.js         # `distros` collection: full detail + guides
    ├── controllers/
    │   ├── flavourController.js  # catalogue list/search/filter logic
    │   └── distroController.js   # detail CRUD + guide logic
    ├── routes/
    │   ├── flavourRoutes.js      # /api/flavours routes
    │   └── distroRoutes.js       # /api/distros routes
    ├── middleware/errorMiddleware.js    # 404 + central error handler
    ├── data/
    │   ├── distros.js        # Seed data (mirrors frontend src/data/distros.js)
    │   └── installGuide.js   # Install-guide builder → stored per-distro,
    │                         # served as `installGuide` on GET /:id
    └── utils/
        ├── asyncHandler.js   # Async wrapper
        └── seed.js           # `npm run seed` script
```

## Setup

```bash
cd backend
cp .env.example .env   # edit MONGO_URI if needed
npm install
npm run seed           # load 14 distros into MongoDB
npm run dev            # http://localhost:5000
```

MongoDB: local `mongodb://127.0.0.1:27017/linux_hub` by default,
or paste an Atlas URI into `backend/.env`.

## Endpoints

Two collections, linked by `distroId`:

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/flavours?search=&category=&popular=true&page=1&limit=50&sort=name` | Catalogue list + search/filter (lean cards) |
| GET | `/api/flavours/popular` | Popular flavours only |
| GET | `/api/flavours/categories` | `["All", ...]` |
| GET | `/api/flavours/:id` | One catalogue card by `distroId` or name |
| GET | `/api/distros/:id` | Full detail by `distroId` or name — includes `installGuide` (`normal`/`dual`/`vm`) |
| POST | `/api/quiz/recommend` | AI "Find Your Distro" pick (public; `{ answers[], shortlist[] }` → `{ ai, winner, runnersUp, explanation, strengths, tip }`, rule-based fallback) |
| POST | `/api/flavours` | Create catalogue card |
| PUT/DELETE | `/api/flavours/:id` | Update / delete catalogue card |
| POST | `/api/distros` | Create detail (accepts frontend-shaped `id`/`init`/`installGuide`) |
| PUT/DELETE | `/api/distros/:id` | Update / delete detail (guides editable per-distro) |

> `flavours` holds card fields only (name, tagline, category, …).
> `distros` holds the full detail (specs, description, keyFeatures, guides).
> Seed keeps both in sync; direct PUTs apply to one collection at a time.

Examples:

```bash
curl http://localhost:5000/api/health
curl "http://localhost:5000/api/flavours?search=arch&category=Arch"
curl http://localhost:5000/api/distros/ubuntu
```
