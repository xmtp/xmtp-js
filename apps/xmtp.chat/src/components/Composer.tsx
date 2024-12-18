import { Button, Flex, TextInput } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { useState } from "react";

export type ComposerProps = {
  conversation: Conversation;
};

export const Composer = ({ conversation }: ComposerProps) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setSending(true);
    await conversation.send(message);
    setSending(false);
    setMessage("");
  };

  return (
    <Flex align="center" gap="xs" p="md">
      <TextInput
        disabled={sending}
        size="md"
        placeholder="Type a message..."
        flex={1}
        value={message}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            void handleSend();
          }
        }}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <Button
        disabled={message.length === 0 || sending}
        size="md"
        onClick={() => void handleSend()}>
        Send
      </Button>
    </Flex>
  );
};
