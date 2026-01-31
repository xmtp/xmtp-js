import { useVirtualizer, type ScrollToOptions } from "@tanstack/react-virtual";
import { useCallback, useRef } from "react";

export type UseVirtualListOptions<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  estimateSize?: number;
  overscan?: number;
  initialScrollIndex?: number;
};

export const useVirtualList = <T>({
  items,
  getItemKey,
  estimateSize = 50,
  overscan = 10,
  initialScrollIndex,
}: UseVirtualListOptions<T>) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => getItemKey(items[index], index),
    initialOffset:
      initialScrollIndex !== undefined
        ? initialScrollIndex * estimateSize
        : undefined,
    useFlushSync: false,
  });

  const scrollToIndex = useCallback(
    (index: number, options?: ScrollToOptions) => {
      virtualizer.scrollToIndex(index, options);
    },
    [virtualizer],
  );

  return {
    virtualizer,
    scrollContainerRef,
    scrollToIndex,
  };
};
