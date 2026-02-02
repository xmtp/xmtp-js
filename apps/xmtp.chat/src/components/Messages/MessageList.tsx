import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef } from "react";
import VirtualList, { type VirtualListHandle } from "@/components/VirtualList";
import { Message } from "./Message";
import classes from "./MessageList.module.css";

export type MessageListProps = {
  messages: DecodedMessage[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const virtualListRef = useRef<VirtualListHandle | null>(null);

  const messageMap = useMemo(() => {
    const map = new Map<string, number>();
    messages.forEach((message, index) => {
      map.set(message.id, index);
    });
    return map;
  }, [messages]);

  const scrollToMessage = useCallback(
    (id: string) => {
      const index = messageMap.get(id);
      if (index !== undefined) {
        virtualListRef.current?.scrollToIndex(index);
      }
    },
    [messageMap],
  );

  return (
    <VirtualList
      items={messages}
      getItemKey={(message) => message.id}
      ref={virtualListRef}
      innerClassName={classes.inner}
      outerClassName={classes.outer}
      followOutput="auto"
      renderItem={(message) => (
        <Message
          key={message.id}
          message={message}
          scrollToMessage={scrollToMessage}
        />
      )}
    />
  );
};
