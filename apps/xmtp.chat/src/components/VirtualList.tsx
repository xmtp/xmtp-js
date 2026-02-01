import type { ScrollToOptions } from "@tanstack/virtual-core";
import {
  forwardRef,
  useImperativeHandle,
  type ReactNode,
  type Ref,
} from "react";
import {
  useVirtualList,
  type UseVirtualListOptions,
} from "@/hooks/useVirtualList";

export type VirtualListProps<T> = UseVirtualListOptions<T> & {
  innerClassName?: string;
  outerClassName?: string;
  renderItem: (item: T, index: number) => ReactNode;
};

export type VirtualListHandle = {
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
};

const VirtualList = <T,>(
  {
    bottomThreshold,
    estimateSize,
    followOutput,
    getItemKey,
    initialScrollIndex,
    innerClassName,
    items,
    outerClassName,
    overscan,
    renderItem,
  }: VirtualListProps<T>,
  ref: React.Ref<VirtualListHandle>,
) => {
  const { virtualizer, scrollContainerRef } = useVirtualList({
    bottomThreshold,
    estimateSize,
    followOutput,
    getItemKey,
    initialScrollIndex,
    items,
    overscan,
  });

  useImperativeHandle(ref, () => ({
    scrollToIndex: virtualizer.scrollToIndex,
  }));

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

export default forwardRef(VirtualList) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => React.ReactNode;
