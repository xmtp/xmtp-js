import { useEffect, type ReactNode, type RefObject } from "react";
import { useChatVirtualList } from "@/hooks/useChatVirtualList";

export type ChatVirtualListProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  followOutput?: boolean | "auto";
  className?: string;
  scrollToIndexRef?: RefObject<((index: number) => void) | null>;
};

export const ChatVirtualList = <T,>({
  items,
  getItemKey,
  renderItem,
  estimateSize,
  overscan,
  followOutput,
  className,
  scrollToIndexRef,
}: ChatVirtualListProps<T>) => {
  const { virtualizer, scrollContainerRef, scrollToIndex } = useChatVirtualList(
    {
      items,
      getItemKey,
      estimateSize,
      overscan,
      followOutput,
    },
  );

  // Expose scrollToIndex via ref
  useEffect(() => {
    if (scrollToIndexRef) {
      scrollToIndexRef.current = scrollToIndex;
    }
    return () => {
      if (scrollToIndexRef) {
        scrollToIndexRef.current = null;
      }
    };
  }, [scrollToIndex, scrollToIndexRef]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        overflow: "auto",
        flexGrow: 1,
      }}>
      <div
        className={className}
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}>
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
};
