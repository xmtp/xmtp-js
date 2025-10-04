import type { Conversation } from "@xmtp/browser-sdk";
import { useMemo, type ComponentProps } from "react";
import { useParams } from "react-router";
import { Virtuoso } from "react-virtuoso";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { ConversationCard } from "./ConversationCard";
import classes from "./ConversationList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type ConversationsListProps = {
  conversations: Conversation<ContentTypes>[];
};

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
}) => {
  const { conversationId } = useParams();
  const selectedConversationIndex = useMemo(
    () =>
      conversations.findIndex(
        (conversation) => conversation.id === conversationId,
      ),
    [conversations, conversationId],
  );
  return (
    <Virtuoso
      components={{
        List,
      }}
      initialTopMostItemIndex={Math.max(selectedConversationIndex, 0)}
      style={{ flexGrow: 1 }}
      data={conversations}
      itemContent={(_, conversation) => (
        <ConversationCard
          key={conversation.id}
          conversationId={conversation.id}
        />
      )}
    />
  );
};
