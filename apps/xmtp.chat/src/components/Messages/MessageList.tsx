import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef, type ComponentProps } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { Message } from "./Message";
import classes from "./MessageList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type MessageListProps = {
  messages: DecodedMessage[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const virtuoso = useRef<VirtuosoHandle>(null);
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
        virtuoso.current?.scrollToIndex(index);
      }
    },
    [messageMap],
  );
  return (
    <Virtuoso
      ref={virtuoso}
      alignToBottom
      followOutput="auto"
      style={{ flexGrow: 1 }}
      components={{
        List,
      }}
      initialTopMostItemIndex={messages.length - 1}
      data={messages}
      itemContent={(_, message) => (
        <Message
          key={message.id}
          message={message}
          scrollToMessage={scrollToMessage}
        />
      )}
    />
  );
};
