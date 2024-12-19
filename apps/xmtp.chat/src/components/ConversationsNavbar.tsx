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
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getConversations } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      const conversations = await getConversations();
      setConversations(conversations ?? []);
      setLoading(false);
    };
    void loadConversations();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const conversations = await getConversations(undefined, true);
    setConversations(conversations ?? []);
    setIsSyncing(false);
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
            <Button loading={isSyncing} onClick={() => void handleSync()}>
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
