import { useEffect, useState } from 'react';

/**
 * Runs an async function whenever deps change.
 * Returns { data, loading, error, refetch }.
 */
export function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => asyncFn())
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  function refetch() {
    setTick((t) => t + 1);
  }

  return { data, loading, error, refetch };
}
