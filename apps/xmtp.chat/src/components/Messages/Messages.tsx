import { Box, Text } from "@mantine/core";
import type { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { MessageList } from "./MessageList";

export type ConversationProps = {
  messages: DecodedMessage[];
  sendMessage: Conversation["send"];
};

export const Messages: React.FC<ConversationProps> = ({
  messages,
  sendMessage,
}) => {
  return messages.length === 0 ? (
    <Box
      display="flex"
      style={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Text>No messages</Text>
    </Box>
  ) : (
    <MessageList messages={messages} sendMessage={sendMessage} />
  );
};
