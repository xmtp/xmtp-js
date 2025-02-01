import { useEffect, useRef } from "react";

export const useDelayedEffect = (
  effect: () => void,
  delay: number,
  deps: React.DependencyList,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      effect();
    }, delay);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [effect, delay, ...deps]);
};
