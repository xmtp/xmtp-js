// apps/xmtp.chat/src/components/Messages/MessageList.tsx
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef } from "react";
import { ChatVirtualList } from "@/components/VirtualList/ChatVirtualList";
import { Message } from "./Message";
import classes from "./MessageList.module.css";

export type MessageListProps = {
  messages: DecodedMessage[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const scrollToIndexRef = useRef<((index: number) => void) | null>(null);

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
        scrollToIndexRef.current?.(index);
      }
    },
    [messageMap],
  );

  return (
    <ChatVirtualList
      items={messages}
      getItemKey={(message) => message.id}
      scrollToIndexRef={scrollToIndexRef}
      innerClassName={classes.inner}
      outerClassName={classes.outer}
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
