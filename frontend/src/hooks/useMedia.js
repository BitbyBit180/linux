import { useEffect, useState } from 'react';

/**
 * Shared media-query hook — single place for responsive breakpoints.
 * Returns whether the query currently matches (SSR-safe default false).
 */
export default function useMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
