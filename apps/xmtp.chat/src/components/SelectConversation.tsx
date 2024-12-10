import { Button, Stack, Text, Title, useMatches } from "@mantine/core";
import { useRefManager } from "./RefManager";

export const SelectConversation = () => {
  const { getRef } = useRefManager();
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  return (
    <Stack gap={60} py={40} px={px} align="center">
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
