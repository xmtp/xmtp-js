import { Center, Stack, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { Message } from "./Message";

export type ConversationProps = {
  messages: DecodedMessage[];
};

export const Messages: React.FC<ConversationProps> = ({ messages }) => {
  return (
    <Stack gap="lg" p="md">
      {messages.length > 0 ? (
        messages.map((message) => (
          <Message key={message.id} message={message} />
        ))
      ) : (
        <Center>
          <Text>No messages</Text>
        </Center>
      )}
    </Stack>
  );
};
