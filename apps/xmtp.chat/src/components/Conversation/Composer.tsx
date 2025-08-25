import { ActionIcon, Box, Button, Group, Menu, TextInput } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useCallback, useRef, useState } from "react";
import { useConversationContext } from "@/contexts/ConversationContext";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { uploadAttachment, validateFile } from "@/helpers/attachment";
import { useConversation } from "@/hooks/useConversation";
import { IconPlus } from "@/icons/IconPlus";
import { stringify } from "../../helpers/messages";
import { AttachmentPreview } from "./AttachmentPreview";
import classes from "./Composer.module.css";
import { ReplyPreview } from "./ReplyPreview";

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sending } = useConversation(conversation);
  const { replyTarget, setReplyTarget, members } = useConversationContext();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const validation = validateFile(file);
        if (validation.valid) {
          setAttachment(file);
        } else {
          alert(validation.error);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if ((!message && !attachment) || sending || uploadingAttachment) return;

    try {
      if (attachment) {
        setUploadingAttachment(true);
        const remoteAttachment = await uploadAttachment(attachment);
        setUploadingAttachment(false);

        if (replyTarget) {
          const replyPayload: Reply = {
            reference: replyTarget.id,
            referenceInboxId: replyTarget.senderInboxId,
            contentType: ContentTypeRemoteAttachment,
            content: remoteAttachment,
          };
          await send(replyPayload, ContentTypeReply);
        } else {
          await send(remoteAttachment, ContentTypeRemoteAttachment);
        }
        setAttachment(null);

        if (message) {
          if (replyTarget) {
            const textReplyPayload: Reply = {
              reference: replyTarget.id,
              referenceInboxId: replyTarget.senderInboxId,
              contentType: ContentTypeText,
              content: message,
            };
            await send(textReplyPayload, ContentTypeReply);
          } else {
            await send(message);
          }
        }
      } else if (message) {
        if (replyTarget) {
          const replyPayload: Reply = {
            reference: replyTarget.id,
            referenceInboxId: replyTarget.senderInboxId,
            contentType: ContentTypeText,
            content: message,
          };
          await send(replyPayload, ContentTypeReply);
        } else {
          await send(message);
        }
      }

      setReplyTarget(undefined);
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (error) {
      console.error("Error sending message:", error);
      setUploadingAttachment(false);
    }
  }, [
    message,
    attachment,
    sending,
    uploadingAttachment,
    replyTarget,
    send,
    setReplyTarget,
  ]);

  return (
    <Box p="md" className={classes.root} style={{ width: "100%" }}>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "var(--mantine-spacing-xxs)",
          alignItems: "center",
        }}>
        {replyTarget && (
          <ReplyPreview
            previewText={stringify(replyTarget)}
            fromAddress={
              members.get(replyTarget.senderInboxId) ??
              replyTarget.senderInboxId
            }
            disabled={sending || uploadingAttachment}
            onCancel={() => {
              setReplyTarget(undefined);
            }}
          />
        )}
        {attachment && (
          <AttachmentPreview
            file={attachment}
            disabled={sending || uploadingAttachment}
            onCancel={() => {
              setAttachment(null);
            }}
          />
        )}
        <Group gap="xxs" align="center" w="100%">
          <Menu shadow="md" position="top-start">
            <Menu.Target>
              <ActionIcon
                variant="light"
                size="lg"
                radius="xl"
                disabled={sending || uploadingAttachment}>
                <IconPlus size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => fileInputRef.current?.click()}>
                Attachment
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <TextInput
            ref={inputRef}
            disabled={sending || uploadingAttachment}
            size="md"
            placeholder="Type a message..."
            value={message}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSend();
            }}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            style={{ flex: 1 }}
          />
        </Group>
        <Button
          disabled={(!message && !attachment) || uploadingAttachment}
          loading={sending || uploadingAttachment}
          size="md"
          onClick={() => void handleSend()}>
          Send
        </Button>
      </Box>
    </Box>
  );
};
