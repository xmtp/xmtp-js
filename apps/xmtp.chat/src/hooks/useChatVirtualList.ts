import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  useVirtualList,
  type UseVirtualListOptions,
} from "@/hooks/useVirtualList";

export type UseChatVirtualListOptions<T> = UseVirtualListOptions<T> & {
  followOutput?: "auto" | "always" | "never";
  atBottomThreshold?: number;
};

export const useChatVirtualList = <T>({
  items,
  getItemKey,
  estimateSize = 50,
  overscan = 5,
  followOutput = "auto",
  atBottomThreshold = 50,
  initialScrollIndex,
}: UseChatVirtualListOptions<T>) => {
  const { scrollContainerRef, virtualizer, scrollToIndex } = useVirtualList({
    items,
    getItemKey,
    estimateSize,
    overscan,
    initialScrollIndex,
  });
  const stickToBottomRef = useRef(true);
  const prevItemCountRef = useRef(items.length);
  const prevTotalSizeRef = useRef(0);
  const isInitialMountRef = useRef(true);

  // Check if currently at bottom (fresh calculation)
  const checkIsAtBottom = useCallback(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= atBottomThreshold;
  }, [atBottomThreshold]);

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollContainerRef.current;
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      stickToBottomRef.current = true;
    }
  }, []);

  // Track user scroll to update stick-to-bottom intent
  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | null = null;

    const handleScroll = () => {
      // Update stick-to-bottom based on current position
      stickToBottomRef.current = checkIsAtBottom();
    };

    const attachListener = () => {
      if (cancelled) return;
      const scrollElement = scrollContainerRef.current;
      if (!scrollElement) {
        requestAnimationFrame(attachListener);
        return;
      }
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      removeListener = () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    };

    attachListener();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [checkIsAtBottom]);

  // Scroll to bottom on initial mount
  useLayoutEffect(() => {
    if (isInitialMountRef.current && items.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom();
        isInitialMountRef.current = false;
      });
    }
  }, [items.length, scrollToBottom]);

  // Follow output when new items are added
  useEffect(() => {
    if (isInitialMountRef.current) return;

    const itemCountIncreased = items.length > prevItemCountRef.current;
    prevItemCountRef.current = items.length;

    if (!itemCountIncreased) return;

    const shouldFollow =
      followOutput === "always" ||
      (followOutput === "auto" && stickToBottomRef.current);

    if (shouldFollow) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  }, [items.length, followOutput, scrollToBottom]);

  // Follow output when content size changes (e.g., images loading)
  const totalSize = virtualizer.getTotalSize();
  useEffect(() => {
    if (isInitialMountRef.current) return;

    const sizeIncreased = totalSize > prevTotalSizeRef.current;
    prevTotalSizeRef.current = totalSize;

    if (!sizeIncreased) return;

    const shouldFollow =
      followOutput === "always" ||
      (followOutput === "auto" && stickToBottomRef.current);

    if (shouldFollow) {
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  }, [totalSize, followOutput, scrollToBottom]);

  return {
    virtualizer,
    scrollContainerRef,
    scrollToIndex,
  };
};
