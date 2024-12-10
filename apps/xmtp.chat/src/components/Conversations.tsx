import { AppShell, Badge, Flex, ScrollArea, Stack, Text } from "@mantine/core";
import { useConversations } from "../hooks/useConversations";
import { ConversationCard } from "./ConversationCard";

export const Conversations: React.FC = () => {
  const { conversations } = useConversations();
  return (
    <>
      <AppShell.Section>
        <Flex align="center" gap="xs" justify="space-between">
          <Text size="lg" fw={700}>
            Conversations
          </Text>
          <Badge color="gray" size="xl">
            {conversations.length}
          </Badge>
        </Flex>
      </AppShell.Section>
      <AppShell.Section grow my="md" component={ScrollArea}>
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
