import { useEffect, useState } from 'react';
import { DISTROS } from '../data/distros.js';
import { getDistroById, getDistros } from '../services/distroApi.js';

const findLocal = (distroId) =>
  DISTROS.find(
    (d) =>
      d.id.toLowerCase() === (distroId || '').toLowerCase() ||
      d.name.toLowerCase() === (distroId || '').toLowerCase()
  ) || DISTROS[0];

/**
 * Loads one distro's full detail (specs + installGuide) from the API.
 * Falls back to local static data when the backend is unreachable.
 */
export function useDistro(distroId) {
  const [distro, setDistro] = useState(() => findLocal(distroId));
  const [otherDistros, setOtherDistros] = useState(() =>
    DISTROS.filter((d) => d.id !== findLocal(distroId).id).slice(0, 4)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDistro(findLocal(distroId));
    setLoading(true);
    let cancelled = false;
    getDistroById(distroId).then((d) => {
      if (!cancelled && d) {
        setDistro(d);
        getDistros().then((all) => {
          if (!cancelled && all?.length) {
            setOtherDistros(all.filter((x) => x.id !== d.id).slice(0, 4));
          }
        });
      }
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [distroId]);

  return { distro, otherDistros, loading };
}
