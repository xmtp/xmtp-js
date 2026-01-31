import type { ReactNode } from "react";
import { useVirtualList } from "@/hooks/useVirtualList";

export type VirtualListProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  initialScrollIndex?: number;
  outerClassName?: string;
  innerClassName?: string;
};

export const VirtualList = <T,>({
  items,
  getItemKey,
  renderItem,
  estimateSize,
  overscan,
  initialScrollIndex,
  outerClassName,
  innerClassName,
}: VirtualListProps<T>) => {
  const { virtualizer, scrollContainerRef } = useVirtualList({
    items,
    getItemKey,
    estimateSize,
    overscan,
    initialScrollIndex,
  });

  return (
    <div
      style={{
        position: "relative",
        minHeight: 0,
      }}
      className={outerClassName}>
      <div
        ref={scrollContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
        }}>
        <div
          className={innerClassName}
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
    </div>
  );
};
