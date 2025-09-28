import { useEffect, useRef, useState } from 'react';

export function usePoll(triggerMs: number): number {
  const [, setTick] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (triggerMs <= 0 || !Number.isFinite(triggerMs)) return;
    setTick(t => t + 1);
    timerRef.current = window.setInterval(() => {
      setTick(t => t + 1);
    }, triggerMs);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [triggerMs]);

  // We return Date.now() to allow using it as a dependency when needed
  return Date.now();
}


