import { Badge, Box, Button, Group, Text } from "@mantine/core";
import { useCallback, useEffect } from "react";
import { ConversationsList } from "@/components/Conversations/ConversationList";
import { useConversations } from "@/hooks/useConversations";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing, conversations, stream } = useConversations();

  const handleSync = useCallback(async () => {
    await list(undefined, true);
  }, [list]);

  // loading conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      await list(undefined);
    };
    void loadConversations();
  }, []);

  // start streaming new conversations on mount
  useEffect(() => {
    let stopStream = () => {};
    const startStream = async () => {
      stopStream = await stream();
    };
    void startStream();
    return () => {
      stopStream();
    };
  }, []);

  return (
    <ContentLayout
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
      loading={loading}
      headerActions={
        <Button loading={syncing} onClick={() => void handleSync()}>
          Sync
        </Button>
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
