import { Box, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { MessageList } from "./MessageList";

export type ConversationProps = {
  messages: DecodedMessage[];
  onReply?: (message: DecodedMessage) => void;
};

export const Messages: React.FC<ConversationProps> = ({
  messages,
  onReply,
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
    <MessageList messages={messages} onReply={onReply} />
  );
};
