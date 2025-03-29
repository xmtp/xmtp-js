import { Button, Stack, Text, Title } from "@mantine/core";
import { useRefManager } from "@/contexts/RefManager";

export const SelectConversation = () => {
  const { getRef } = useRefManager();

  return (
    <Stack gap={60} p="md" align="center">
      <Stack gap="lg">
        <Title order={3}>No conversation selected</Title>
        <Text>
          Select a conversation in the left sidebar to display its messages, or
          create a new conversation by clicking the{" "}
          <Button
            size="xs"
            px={6}
            onClick={() => {
              getRef("new-conversation-button")?.current?.click();
            }}>
            New conversation
          </Button>{" "}
          button.
        </Text>
      </Stack>
    </Stack>
  );
};
