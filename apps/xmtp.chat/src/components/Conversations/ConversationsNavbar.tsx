import { Badge, Box, Button, Group, Text } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { ConversationsList } from "@/components/Conversations/ConversationList";
import { useConversations } from "@/hooks/useConversations";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const handleSync = async () => {
    const conversations = await list(undefined, true);
    setConversations(conversations);
  };

  useEffect(() => {
    const loadConversations = async () => {
      const conversations = await list(undefined);
      setConversations(conversations);
    };
    void loadConversations();
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
