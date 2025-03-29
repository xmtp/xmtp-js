import type { Conversation } from "@xmtp/browser-sdk";
import { type ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { ConversationCard } from "./ConversationCard";
import classes from "./ConversationList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type ConversationsListProps = {
  conversations: Conversation[];
};

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
}) => {
  return (
    <Virtuoso
      components={{
        List,
      }}
      style={{ flexGrow: 1 }}
      data={conversations}
      itemContent={(_, conversation) => (
        <ConversationCard conversation={conversation} />
      )}
    />
  );
};
