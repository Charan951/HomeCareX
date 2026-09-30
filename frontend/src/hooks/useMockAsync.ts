import { useEffect, useState } from "react";

/**
 * Simulates the delay of a real API call around already-loaded mock data, so
 * pages can show a genuine loading state (skeletons) instead of faking it with
 * a fixed timeout in the component itself. `@tanstack/react-query` is already
 * a dependency — swap this hook for a real `useQuery` once the Dashboard
 * endpoints in the TRD exist, without changing how pages consume `loading`.
 */
export function useMockAsync<T>(value: T, delayMs = 500): { data: T; loading: boolean } {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the delay changes, not on every mock-data identity change
  }, [delayMs]);

  return { data: value, loading };
}
