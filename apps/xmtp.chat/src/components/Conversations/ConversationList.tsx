import type { Conversation } from "@xmtp/browser-sdk";
import { Button, Box } from "@mantine/core";
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
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  hasMore,
  loadingMore,
  onLoadMore,
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
    <Box style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Virtuoso
        components={{
          List,
        }}
        initialTopMostItemIndex={Math.max(selectedConversationIndex, 0)}
        style={{ flexGrow: 1 }}
        data={conversations}
        itemContent={(_, conversation) => (
          <ConversationCard conversation={conversation} />
        )}
      />
      {hasMore && onLoadMore && (
        <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Button
            fullWidth
            variant="light"
            loading={loadingMore}
            onClick={onLoadMore}
          >
            Load More Conversations
          </Button>
        </Box>
      )}
    </Box>
  );
};
