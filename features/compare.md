# Feature: Compare Distros (max 4)

**What:** Picker + side-by-side spec table (`COMPARE_ROWS`).
**Route:** `/compare?ids=ubuntu,arch,fedora`. **API:** `GET /api/distros/compare?ids=a,b,c,d`.

## User flow
1. Open `/compare` → picker lists all distros (from `useDistros`).
2. Tick up to 4 → URL updates `?ids=...` → `useCompare(ids)` fetches.
3. Table rows: accent, basedOn, init, pkgMgr, desktop, releaseModel, version, RAM/disk, license, arch, installCmd, website.
4. Quiz result links here: `/compare?ids=winner,runner1,runner2`.

## Code chain
```
ComparePage.jsx → hooks/useCompare.js (MAX_COMPARE=4)
  → services/distroApi.js:73  getDistrosForCompare(ids)
  → fetchJSON('/api/distros/compare?ids=...')
  → controllers/distroController.js:46  validates 1-4 ids, .select(COMPARE_FIELDS)
  → keeps requested order, drops unknown ids
  catch → local DISTROS.filter() in requested order
```

Key snippets:
```js
// distroController.js
if (ids.length === 0) throw new Error('Provide up to 4 distro ids');
if (ids.length > 4) throw new Error('Cannot compare more than 4');
const docs = await Distro.find({ distroId: { $in: ids } }).select(COMPARE_FIELDS);
const data = ids.map(id => byId.get(id)).filter(Boolean); // order preserved
```

## Files involved
- Frontend: `src/pages/ComparePage.jsx`, `src/hooks/useCompare.js`, `src/hooks/useDistros.js`, `src/services/distroApi.js`.
- Backend: `src/routes/distroRoutes.js` (`GET /compare` before `/:id` — order matters), `src/controllers/distroController.js`.

## How to demo / viva line
"Compare is a lean projection — only spec fields, max 4, order = requested order." Open `backend/src/controllers/distroController.js:46` and `frontend/src/hooks/useCompare.js`.
