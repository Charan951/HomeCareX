import { useEffect, useRef } from 'react';

/** Returns a stable function that calls `fn` after `delay` ms of quiet. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  return (...args: A) => {
    clearTimeout(timer.current);
    if (delay <= 0) {
      fnRef.current(...args);
      return;
    }
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  };
}