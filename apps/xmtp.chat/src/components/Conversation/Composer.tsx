import { Button, Group, TextInput } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { useRef, useState } from "react";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";
import classes from "./Composer.module.css";

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sending } = useConversation(conversation);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (message.length === 0 || sending) {
      return;
    }

    await send(message);
    setMessage("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <Group
      align="center"
      gap="xs"
      flex={1}
      wrap="nowrap"
      p="md"
      className={classes.root}>
      <TextInput
        ref={inputRef}
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
        disabled={message.length === 0}
        loading={sending}
        size="md"
        onClick={() => void handleSend()}>
        Send
      </Button>
    </Group>
  );
};
