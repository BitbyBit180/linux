import { useEffect, useState } from 'react';
import { getDistrosForCompare, peekDistrosForCompare } from '../services/distroApi.js';

export const MAX_COMPARE = 4;

/**
 * Loads comparison data for the given distro ids (max 4).
 * Initialized from the API via the service layer, which itself
 * falls back to local static data when the backend is unreachable.
 * Revisits read the service cache first — no skeleton flash.
 */
export function useCompare(ids = []) {
  const key = ids.filter(Boolean).join(',');
  const [distros, setDistros] = useState(() => peekDistrosForCompare(ids) || []);
  const [loading, setLoading] = useState(() => !peekDistrosForCompare(ids));

  useEffect(() => {
    if (!key) {
      setDistros([]);
      return;
    }
    let cancelled = false;
    // Revalidate silently when cached — no skeleton flash on revisits.
    if (!peekDistrosForCompare(key.split(','))) setLoading(true);
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
