import { ActionIcon, Box, Button, Group, Text, TextInput } from "@mantine/core";
import { IconArrowBackUp, IconX } from "@tabler/icons-react";
import type { Conversation } from "@xmtp/browser-sdk";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useRef, useState } from "react";
import { useConversationContext } from "@/contexts/ConversationContext";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";
import classes from "./Composer.module.css";

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sending } = useConversation(conversation);
  const { replyToMessage, setReplyToMessage, members } =
    useConversationContext();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // FIXME
  const displayNameRaw = replyToMessage
    ? (members.get(replyToMessage.senderInboxId) ??
      replyToMessage.senderInboxId)
    : "";
  const displayName = String(displayNameRaw);
  const previewText = replyToMessage
    ? typeof replyToMessage.content === "string"
      ? replyToMessage.content
      : typeof replyToMessage.fallback === "string"
        ? replyToMessage.fallback
        : "message"
    : "";

  const handleSend = async () => {
    if (message.length === 0 || sending) return;

    if (replyToMessage) {
      const replyPayload: Reply = {
        reference: replyToMessage.id,
        referenceInboxId: replyToMessage.senderInboxId,
        contentType: ContentTypeText,
        content: message,
      };
      await send(replyPayload, ContentTypeReply);
      setReplyToMessage(undefined);
    } else {
      await send(message);
    }
    setMessage("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <Box p="md" className={classes.root} style={{ width: "100%" }}>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          columnGap: 8,
          rowGap: 8,
          alignItems: "center",
          width: "100%",
        }}>
        {replyToMessage && (
          <>
            <Box>
              <Group gap={6} align="center" style={{ minWidth: 0 }}>
                <IconArrowBackUp
                  size={14}
                  stroke={2}
                  color="var(--mantine-color-dimmed)"
                />
                <Text size="xs" c="dimmed">
                  Replying to
                </Text>
                <Text
                  size="xs"
                  c="dimmed"
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={displayName}>
                  {displayName}
                </Text>
              </Group>
              <Text mt={6} fw={700} size="sm" lineClamp={2} title={previewText}>
                {previewText}
              </Text>
            </Box>
            <Box style={{ display: "grid", placeItems: "center" }}>
              <ActionIcon
                aria-label="Cancel reply"
                variant="filled"
                color="dark"
                radius="xl"
                onClick={() => {
                  setReplyToMessage(undefined);
                }}
                disabled={sending}>
                <IconX size={18} stroke={2} color="#fff" />
              </ActionIcon>
            </Box>
          </>
        )}

        <TextInput
          ref={inputRef}
          disabled={sending}
          size="md"
          placeholder="Type a message..."
          value={message}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSend();
            }
          }}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          disabled={message.length === 0}
          loading={sending}
          size="md"
          onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};
