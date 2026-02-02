import type { Conversation } from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { useParams } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import VirtualList from "@/components/VirtualList";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { ConversationCard } from "./ConversationCard";
import classes from "./ConversationList.module.css";

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
    <VirtualList
      items={conversations}
      getItemKey={(conversation) => conversation.id}
      initialScrollIndex={Math.max(selectedConversationIndex, 0)}
      outerClassName={classes.outer}
      innerClassName={classes.inner}
      renderItem={(conversation) => (
        <ErrorBoundary>
          <ConversationCard conversationId={conversation.id} />
        </ErrorBoundary>
      )}
    />
  );
};
