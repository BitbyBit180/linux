import { DISTROS, POPULAR_DISTROS } from '../data/distros.js';

// Backend base URL. In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
// In production set VITE_API_URL=https://your-api-host/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

const normalize = (doc) => {
  // Backend returns { id, init, ... }. Tolerate raw shapes too.
  if (!doc || typeof doc !== 'object') return doc;
  const { distroId, _id, __v, initSystem, ...rest } = doc;
  return {
    ...rest,
    id: doc.id || distroId || _id,
    init: doc.init || initSystem || 'systemd',
  };
};

/**
 * Catalogue (Flavours page) — served from the `flavours` collection,
 * falling back to local static data when the API is unreachable
 * (so the UI never breaks).
 */
export async function getDistros({ search = '', category = 'All' } = {}) {
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'All') params.set('category', category);
    params.set('limit', '100');
    const json = await fetchJSON(`${API_BASE}/flavours?${params.toString()}`);
    return (json.data || []).map(normalize);
  } catch {
    const q = search.toLowerCase().trim();
    return DISTROS.filter((d) => {
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.basedOn.toLowerCase().includes(q) ||
        d.pkgMgr.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || d.category === category;
      return matchesSearch && matchesCategory;
    });
  }
}

export async function getDistroById(id) {
  // Full detail (specs + installGuide) from the `distros` collection
  try {
    const json = await fetchJSON(`${API_BASE}/distros/${encodeURIComponent(id)}`);
    return normalize(json.data);
  } catch {
    return (
      DISTROS.find(
        (d) => d.id.toLowerCase() === String(id).toLowerCase() ||
          d.name.toLowerCase() === String(id).toLowerCase()
      ) || DISTROS[0]
    );
  }
}

/**
 * Side-by-side comparison data (up to 4 distros) from the
 * `distros` collection, falling back to local static data offline.
 * Returned order follows the requested ids; unknown ids are dropped.
 */
export async function getDistrosForCompare(ids = []) {
  const wanted = ids.filter(Boolean);
  if (wanted.length === 0) return [];
  try {
    const params = new URLSearchParams({ ids: wanted.join(',') });
    const json = await fetchJSON(`${API_BASE}/distros/compare?${params.toString()}`);
    return (json.data || []).map(normalize);
  } catch {
    const lower = wanted.map((id) => id.toLowerCase());
    return DISTROS.filter((d) => lower.includes(d.id.toLowerCase()));
  }
}

export async function getPopularDistros() {
  try {
    const json = await fetchJSON(`${API_BASE}/flavours/popular`);
    return (json.data || []).map(normalize);
  } catch {
    return POPULAR_DISTROS;
  }
}

export async function getCategories() {
  try {
    const json = await fetchJSON(`${API_BASE}/flavours/categories`);
    return json.data || ['All'];
  } catch {
    return ['All', 'Debian / Ubuntu', 'Arch', 'Red Hat / Fedora', 'Security', 'Independent'];
  }
}
