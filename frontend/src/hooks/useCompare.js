import { useEffect, useState } from 'react';
import { getDistrosForCompare } from '../services/distroApi.js';

export const MAX_COMPARE = 4;

/**
 * Loads comparison data for the given distro ids (max 4).
 * Initialized from the API via the service layer, which itself
 * falls back to local static data when the backend is unreachable.
 */
export function useCompare(ids = []) {
  const key = ids.filter(Boolean).join(',');
  const [distros, setDistros] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setDistros([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDistrosForCompare(key.split(',')).then((d) => {
      if (!cancelled) {
        setDistros(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { distros, loading };
}
