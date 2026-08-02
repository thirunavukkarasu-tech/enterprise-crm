import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Single-responsibility async state hook: given a query function, tracks
 * { data, isLoading, error } and exposes refetch(). Every dashboard widget
 * uses this instead of hand-rolling its own useState/useEffect trio, which
 * is what lets each KPI card / chart / list fail or retry independently
 * without one broken endpoint taking down the whole page.
 *
 * `deps` follows the same rules as useEffect's dependency array — pass the
 * values the query function closes over (e.g. a date-range filter) so it
 * re-fetches when they change.
 */
export const useApiQuery = (queryFn, deps = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const execute = useCallback(() => {
    const currentRequest = (requestId.current += 1);
    setIsLoading(true);
    setError(null);

    return queryFn()
      .then((result) => {
        if (currentRequest === requestId.current) {
          setData(result);
        }
      })
      .catch((err) => {
        if (currentRequest === requestId.current) {
          setError(err);
        }
      })
      .finally(() => {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
};
