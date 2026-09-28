# Feature: Browse Flavours Catalogue

**What:** Grid of 14 distro cards with search + category pills + Popular section.
**Route:** `/flavours` → `FlavoursPage.jsx`. **API:** `GET /api/flavours?search=&category=&popular=true&sort=name`.

## User flow
1. Open `/flavours` → sees Popular grid (5) + All grid (14) + quiz CTA banner.
2. Type in Navbar search → filters by name/tagline/basedOn/pkgMgr/category.
3. Click category pill → filters by `Debian / Ubuntu`, `Arch`, `Red Hat / Fedora`, `Security`, `Independent`.
4. Click card → `onNavigate('/distro/<id>')`.

## Code chain
```
FlavoursPage.jsx:82  useDistros()
  → hooks/useDistros.js:19       (starts with static DISTROS, then Promise.allSettled)
  → services/distroApi.js:29     getDistros() → fetchJSON('/api/flavours?...')
  → controllers/flavourController.js:5  builds Mongo filter ($or regex search)
  → models/Flavour.js            lean card docs, toJSON {id,...}
  → Mongo `flavours` collection
  catch → fallback DISTROS.filter()  (UI never breaks offline)
```

Key snippets:
```js
// useDistros.js — never blank, replaces only on success
const [distros, setDistros] = useState(DISTROS);
Promise.allSettled([getDistros(), getPopularDistros(), getCategories()])

// flavourController.js — search across 5 fields
filter.$or = [{name:{$regex:q,$options:'i'}},{tagline:...},{basedOn:...},{pkgMgr:...},{category:...}];

// FlavoursPage.jsx:85 — client-side filter mirrors the API logic
```

## Files involved
- Frontend: `src/pages/FlavoursPage.jsx`, `src/hooks/useDistros.js`, `src/services/distroApi.js`, `src/components/DistroCard.jsx` (cursor-origin circular wipe hover), `src/components/Navbar.jsx` (search box), `src/data/distros.js` (fallback).
- Backend: `src/routes/flavourRoutes.js` (`/popular`, `/categories` before `/:id`), `src/controllers/flavourController.js`, `src/models/Flavour.js`.

## How to demo / viva line
"Search hits the API with `?search=`; if the backend is down the same filter runs on local data. Popular is just `popular:true` docs." Open `frontend/src/services/distroApi.js:29` and `backend/src/controllers/flavourController.js:5`.
