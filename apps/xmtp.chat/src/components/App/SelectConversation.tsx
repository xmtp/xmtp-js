import { Button, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";

export const SelectConversation = () => {
  const navigate = useNavigate();
  return (
    <Stack gap={60} p="md" align="center">
      <Stack gap="lg" align="center">
        <Title order={3}>No conversation selected</Title>
        <Text>
          Select a conversation in the left sidebar to display its messages,
          or...
        </Text>
        <Button
          size="xs"
          px={6}
          onClick={() => {
            void navigate("/conversations/new");
          }}>
          Create a new conversation
        </Button>
      </Stack>
    </Stack>
  );
};
