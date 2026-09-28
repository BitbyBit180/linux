import { useEffect, useState } from 'react';
import { DISTROS, POPULAR_DISTROS } from '../data/distros.js';
import { getDistros, getPopularDistros, getCategories } from '../services/distroApi.js';

export const DEFAULT_CATEGORIES = [
  'All',
  'Debian / Ubuntu',
  'Arch',
  'Red Hat / Fedora',
  'Security',
  'Independent',
];

/**
 * Loads the distro catalogue from the API.
 * Falls back to local static data when the backend is unreachable,
 * so pages always render.
 */
export function useDistros() {
  const [distros, setDistros] = useState(DISTROS);
  const [popularDistros, setPopularDistros] = useState(POPULAR_DISTROS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getDistros(), getPopularDistros(), getCategories()]).then(
      ([d, p, c]) => {
        if (cancelled) return;
        if (d.status === 'fulfilled' && d.value?.length) setDistros(d.value);
        if (p.status === 'fulfilled' && p.value?.length) setPopularDistros(p.value);
        if (c.status === 'fulfilled' && c.value?.length) setCategories(c.value);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { distros, popularDistros, categories, loading };
}
