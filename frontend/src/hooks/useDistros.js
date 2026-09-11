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

  useEffect(() => {
    let cancelled = false;
    getDistros().then((d) => {
      if (!cancelled && d?.length) setDistros(d);
    });
    getPopularDistros().then((d) => {
      if (!cancelled && d?.length) setPopularDistros(d);
    });
    getCategories().then((c) => {
      if (!cancelled && c?.length) setCategories(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { distros, popularDistros, categories };
}
