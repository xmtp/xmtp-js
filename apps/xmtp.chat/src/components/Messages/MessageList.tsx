import type { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import type { ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { Message } from "./Message";
import classes from "./MessageList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type MessageListProps = {
  messages: DecodedMessage[];
  sendMessage: Conversation["send"];
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  sendMessage,
}) => {
  return (
    <Virtuoso
      alignToBottom
      followOutput="auto"
      style={{ flexGrow: 1 }}
      components={{
        List,
      }}
      initialTopMostItemIndex={messages.length - 1}
      data={messages}
      itemContent={(_, message) => (
        <Message key={message.id} message={message} sendMessage={sendMessage} />
      )}
    />
  );
};
