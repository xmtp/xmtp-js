import { Box, Text } from "@mantine/core";
import type { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { Virtuoso } from "react-virtuoso";
import { Message } from "./Message";

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
    <Virtuoso
      alignToBottom
      followOutput="auto"
      style={{ flexGrow: 1 }}
      data={messages}
      itemContent={(_, message) => (
        <Message key={message.id} message={message} sendMessage={sendMessage} />
      )}
    />
  );
};
