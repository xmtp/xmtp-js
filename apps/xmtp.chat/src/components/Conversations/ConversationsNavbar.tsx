import {
  AppShell,
  Badge,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Stack,
  Text,
} from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useConversations } from "@/hooks/useConversations";
import { ConversationCard } from "./ConversationCard";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const handleSync = async () => {
    const conversations = await list(undefined, true);
    setConversations(conversations);
  };

  return (
    <>
      {loading && <LoadingOverlay visible={true} />}
      <AppShell.Section p="md">
        <Stack gap="xs">
          <Group align="center" gap="xs" justify="space-between">
            <Group align="center" gap="xs">
              <Text size="lg" fw={700}>
                Conversations
              </Text>
              <Badge color="gray" size="lg">
                {conversations.length}
              </Badge>
            </Group>
            <Button loading={syncing} onClick={() => void handleSync()}>
              Sync
            </Button>
          </Group>
        </Stack>
      </AppShell.Section>
      <AppShell.Section
        grow
        my="md"
        display="flex"
        style={{ flexDirection: "column" }}>
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
          <Virtuoso
            style={{ flexGrow: 1 }}
            data={conversations}
            itemContent={(_, conversation) => (
              <ConversationCard conversation={conversation} />
            )}
          />
        )}
      </AppShell.Section>
    </>
  );
};
