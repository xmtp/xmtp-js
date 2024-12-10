import {
  AppShell,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useConversations } from "../hooks/useConversations";
import { ConversationCard } from "./ConversationCard";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const loadConversations = async () => {
      const conversations = await list();
      setConversations(conversations);
    };
    void loadConversations();
  }, []);

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
      <AppShell.Section grow my="md" component={ScrollArea} px="md">
        {conversations.length === 0 ? (
          <Text>No conversations found</Text>
        ) : (
          <Stack gap="sm">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
              />
            ))}
          </Stack>
        )}
      </AppShell.Section>
    </>
  );
};
