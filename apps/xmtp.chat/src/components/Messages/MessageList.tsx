import type { DecodedMessage } from "@xmtp/browser-sdk";
import type { ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { Message } from "./Message";
import classes from "./MessageList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type MessageListProps = {
  messages: DecodedMessage[];
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Virtuoso
      alignToBottom
      followOutput="auto"
      style={{ flexGrow: 1 }}
      components={{
        List,
      }}
      data={messages}
      itemContent={(_, message) => (
        <Message key={message.id} message={message} />
      )}
    />
  );
};
