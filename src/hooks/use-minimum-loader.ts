import { useEffect, useRef, useState } from "react";

export function useMinimumLoader(isLoading: boolean, minDurationMs = 2000) {
  const [shouldShow, setShouldShow] = useState(isLoading);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = performance.now();
      setShouldShow(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const elapsed = startTimeRef.current !== null
      ? performance.now() - startTimeRef.current
      : minDurationMs;
    const remaining = Math.max(minDurationMs - elapsed, 0);

    timeoutRef.current = window.setTimeout(() => {
      setShouldShow(false);
      timeoutRef.current = null;
    }, remaining);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, minDurationMs]);

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return shouldShow;
}
