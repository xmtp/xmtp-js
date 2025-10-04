import { Badge, Box, Group, Text } from "@mantine/core";
import { useCallback, useEffect, useRef } from "react";
import { ConversationsList } from "@/components/Conversations/ConversationList";
import { ConversationsMenu } from "@/components/Conversations/ConversationsMenu";
import { useConversations } from "@/hooks/useConversations";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing, conversations, conversationsCount, hasMore, loadingMore, loadMore, resetPagination, stream, syncAll } =
    useConversations();
  const stopStreamRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(async () => {
    stopStreamRef.current = await stream();
  }, [stream]);

  const stopStream = useCallback(() => {
    stopStreamRef.current?.();
    stopStreamRef.current = null;
  }, []);

  const handleSync = useCallback(async () => {
    stopStream();
    resetPagination();
    await list(undefined, true, true);
    await startStream();
  }, [list, startStream, stopStream, resetPagination]);

  const handleSyncAll = useCallback(async () => {
    stopStream();
    resetPagination();
    await syncAll();
    await list(undefined, false, true);
    await startStream();
  }, [syncAll, list, startStream, stopStream, resetPagination]);

  // loading conversations on mount, and start streaming
  useEffect(() => {
    const loadConversations = async () => {
      await list({ limit: BigInt(20) });
      await startStream();
    };
    void loadConversations();
  }, [list, startStream]);

  // stop streaming on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <ContentLayout
      title={
        <Group align="center" gap="xs">
          <Text size="md" fw={700}>
            Conversations
          </Text>
          <Badge color="gray" size="lg">
            {conversationsCount}
          </Badge>
        </Group>
      }
      loading={loading}
      headerActions={
        <ConversationsMenu
          onSync={() => void handleSync()}
          onSyncAll={() => void handleSyncAll()}
          disabled={syncing}
        />
      }
      withScrollArea={false}>
      {conversations.length === 0 ? (
        <Box
          display="flex"
          style={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text>No conversations found</Text>
        </Box>
      ) : (
        <ConversationsList
          conversations={conversations}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => loadMore(20)}
        />
      )}
    </ContentLayout>
  );
};
