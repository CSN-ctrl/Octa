import { useEffect, useRef } from 'react';

/**
 * Hook that sets up an interval that only runs when the tab is visible
 * This prevents unnecessary refreshes when the user is on another tab
 */
export function useVisibilityAwareInterval(
  callback: () => void,
  delay: number | null,
  immediate = true
) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      if (document.visibilityState === 'visible' && savedCallback.current) {
        savedCallback.current();
      }
    };

    // Run immediately if requested
    if (immediate && document.visibilityState === 'visible') {
      tick();
    }

    // Set up interval
    const interval = setInterval(tick, delay);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && savedCallback.current) {
        savedCallback.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delay, immediate]);
}

