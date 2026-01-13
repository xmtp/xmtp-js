import { Badge, Box, Group, Text } from "@mantine/core";
import { useCallback, useEffect, useRef } from "react";
import { ConversationsList } from "@/components/Conversations/ConversationList";
import { ConversationsMenu } from "@/components/Conversations/ConversationsMenu";
import { useClient } from "@/contexts/XMTPContext";
import { useConversations } from "@/hooks/useConversations";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ConversationsNavbar: React.FC = () => {
  const client = useClient();
  const {
    sync,
    loading,
    syncing,
    conversations,
    stream,
    streamAllMessages,
    syncAll,
  } = useConversations();
  const stopConversationStreamRef = useRef<(() => void) | null>(null);
  const stopAllMessagesStreamRef = useRef<(() => void) | null>(null);

  const startStreams = useCallback(async () => {
    stopConversationStreamRef.current = await stream();
    stopAllMessagesStreamRef.current = await streamAllMessages();
  }, [stream, streamAllMessages]);

  const stopStreams = useCallback(() => {
    stopConversationStreamRef.current?.();
    stopConversationStreamRef.current = null;
    stopAllMessagesStreamRef.current?.();
    stopAllMessagesStreamRef.current = null;
  }, []);

  const handleSync = useCallback(async () => {
    stopStreams();
    await sync();
    await startStreams();
  }, [sync, startStreams, stopStreams]);

  const handleSyncAll = useCallback(async () => {
    stopStreams();
    await syncAll();
    await startStreams();
  }, [syncAll, startStreams, stopStreams]);

  const handleSendSyncRequest = useCallback(async () => {
    await client.sendSyncRequest();
  }, [client]);

  // loading conversations on mount, and start streaming
  useEffect(() => {
    const loadConversations = async () => {
      await sync(true);
      await startStreams();
    };
    void loadConversations();
  }, []);

  // stop streaming on unmount
  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  return (
    <ContentLayout
      withBorders={false}
      title={
        <Group align="center" gap="xs">
          <Text size="md" fw={700}>
            Conversations
          </Text>
          <Badge color="gray" size="lg">
            {conversations.length}
          </Badge>
        </Group>
      }
      loading={conversations.length === 0 && loading}
      headerActions={
        <ConversationsMenu
          onSendSyncRequest={() => void handleSendSyncRequest()}
          loading={syncing || loading}
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
        <ConversationsList conversations={conversations} />
      )}
    </ContentLayout>
  );
};
