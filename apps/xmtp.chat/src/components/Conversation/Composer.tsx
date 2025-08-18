import { Box, Button, TextInput } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useCallback, useRef, useState } from "react";
import { useConversationContext } from "@/contexts/ConversationContext";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";
import { stringify } from "../../helpers/messages";
import classes from "./Composer.module.css";
import { ReplyPreview } from "./ReplyPreview";

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sending } = useConversation(conversation);
  const { replyTarget, setReplyTarget, members } = useConversationContext();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    if (!message || sending) return;
    if (replyTarget) {
      const replyPayload: Reply = {
        reference: replyTarget.id,
        referenceInboxId: replyTarget.senderInboxId,
        contentType: ContentTypeText,
        content: message,
      };
      await send(replyPayload, ContentTypeReply);
      setReplyTarget(undefined);
    } else {
      await send(message);
    }
    setMessage("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [message, sending, replyTarget, send, setReplyTarget]);

  return (
    <Box p="md" className={classes.root} style={{ width: "100%" }}>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          alignItems: "center",
        }}>
        {replyTarget && (
          <ReplyPreview
            previewText={stringify(replyTarget)}
            fromAddress={
              members.get(replyTarget.senderInboxId) ??
              replyTarget.senderInboxId
            }
            disabled={sending}
            onCancel={() => {
              setReplyTarget(undefined);
            }}
          />
        )}
        <TextInput
          ref={inputRef}
          disabled={sending}
          size="md"
          placeholder="Type a message..."
          value={message}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <Button
          disabled={!message}
          loading={sending}
          size="md"
          onClick={() => void handleSend()}>
          Send
        </Button>
      </Box>
    </Box>
  );
};
