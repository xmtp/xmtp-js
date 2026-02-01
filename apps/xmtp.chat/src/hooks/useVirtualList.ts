import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef } from "react";

export type UseVirtualListOptions<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  estimateSize?: number;
  overscan?: number;
  initialScrollIndex?: number;
  followOutput?: "auto" | "always" | "never";
  bottomThreshold?: number;
};

export const useVirtualList = <T>({
  items,
  getItemKey,
  estimateSize = 50,
  overscan = 10,
  followOutput = "never",
  bottomThreshold = 50,
  initialScrollIndex,
}: UseVirtualListOptions<T>) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrolledToBottomRef = useRef(true);
  const itemCountRef = useRef(items.length);
  const totalSizeRef = useRef(-1);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: (index) => getItemKey(items[index], index),
    useFlushSync: false,
  });

  // check if currently scrolled to bottom
  const isScrolledToBottom = useCallback(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= bottomThreshold;
  }, [bottomThreshold]);

  const scrollToBottom = useCallback(() => {
    if (items.length > 0) {
      virtualizer.scrollToIndex(items.length - 1, { align: "end" });
      scrolledToBottomRef.current = true;
    }
  }, [items.length, virtualizer]);

  // track user scroll to update scrolledToBottomRef
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      scrolledToBottomRef.current = isScrolledToBottom();
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [isScrolledToBottom]);

  // handle initial scroll and follow output when content changes
  const totalSize = virtualizer.getTotalSize();
  useEffect(() => {
    // wait for items before doing anything
    if (items.length === 0) {
      return;
    }

    const isInitialMount = totalSizeRef.current === -1;

    // on initial mount, scroll to initial index or bottom
    if (isInitialMount) {
      if (initialScrollIndex !== undefined) {
        virtualizer.scrollToIndex(initialScrollIndex);
        scrolledToBottomRef.current = isScrolledToBottom();
      } else {
        scrollToBottom();
      }
      itemCountRef.current = items.length;
      totalSizeRef.current = totalSize;
      return;
    }

    const shouldFollow =
      followOutput === "always" ||
      (followOutput === "auto" && scrolledToBottomRef.current);

    if (!shouldFollow) {
      return;
    }

    const itemCountIncreased = items.length > itemCountRef.current;
    const sizeIncreased = totalSize > totalSizeRef.current;

    itemCountRef.current = items.length;
    totalSizeRef.current = totalSize;

    if (itemCountIncreased || sizeIncreased) {
      scrollToBottom();
    }
  }, [
    items.length,
    totalSize,
    followOutput,
    scrollToBottom,
    initialScrollIndex,
    virtualizer,
    isScrolledToBottom,
  ]);

  return {
    virtualizer,
    scrollContainerRef,
  };
};
