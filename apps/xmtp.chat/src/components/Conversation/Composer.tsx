import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Text,
  TextInput,
} from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useCallback, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { useConversationContext } from "@/contexts/ConversationContext";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { uploadAttachment, validateFile } from "@/helpers/attachment";
import { useConversation } from "@/hooks/useConversation";
import { IconPlus } from "@/icons/IconPlus";
import { AttachmentPreview } from "./AttachmentPreview";
import classes from "./Composer.module.css";
import { ReplyPreview } from "./ReplyPreview";

export type ComposerProps = {
  conversation: Conversation<ContentTypes>;
};

export const Composer: React.FC<ComposerProps> = ({ conversation }) => {
  const { send, sending } = useConversation(conversation);
  const { replyTarget, setReplyTarget } = useConversationContext();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSending = sending || uploadingAttachment;
  const hasContent = message || attachment;

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const validation = validateFile(file);
        if (validation.valid) {
          setAttachment(file);
        } else {
          setError(validation.error);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (!hasContent || isSending) return;

    let content: string | RemoteAttachment | Reply | undefined;
    let contentType: ContentTypeId | undefined;
    if (attachment) {
      contentType = ContentTypeRemoteAttachment;
      setUploadingAttachment(true);
      try {
        content = await uploadAttachment(attachment);
      } catch {
        setError("Failed to upload attachment");
        return;
      } finally {
        setUploadingAttachment(false);
      }
    }

    if (message) {
      content = message;
      contentType = ContentTypeText;
    }

    // for the type-checker
    if (!content || !contentType) {
      return;
    }

    if (replyTarget) {
      content = {
        reference: replyTarget.id,
        referenceInboxId: replyTarget.senderInboxId,
        contentType,
        content,
      };
      contentType = ContentTypeReply;
    }

    try {
      await send(content, contentType);
    } catch {
      setError("Failed to send message");
    }

    setAttachment(null);
    setReplyTarget(undefined);
    setMessage("");
    setTimeout(() => inputRef.current?.focus(), 50);
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
    <>
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
              message={replyTarget}
              disabled={isSending}
              onCancel={() => {
                setReplyTarget(undefined);
              }}
            />
          )}
          {attachment && (
            <AttachmentPreview
              file={attachment}
              disabled={isSending}
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
                  disabled={isSending}>
                  <IconPlus size={20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => fileInputRef.current?.click()}>
                  <Text fw={500}>Attachment</Text>
                  <Group align="center" justify="space-between" gap="xs">
                    <Text size="sm" c="dimmed">
                      Image / Video / Audio
                    </Text>
                    <Text size="xs" fw={500}>
                      ≤ 1MB
                    </Text>
                  </Group>
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
              disabled={isSending}
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
            disabled={!hasContent}
            loading={isSending}
            size="md"
            onClick={() => void handleSend()}>
            Send
          </Button>
        </Box>
      </Box>
      {error && (
        <Modal
          opened
          centered
          withCloseButton={false}
          closeOnEscape={false}
          closeOnClickOutside={false}
          size="auto"
          title="Error"
          onClose={() => {
            setError(null);
          }}>
          <Text ta="center" size="sm">
            {error}
          </Text>
          <Group mt="md" justify="flex-end">
            <Button
              onClick={() => {
                setError(null);
              }}>
              OK
            </Button>
          </Group>
        </Modal>
      )}
    </>
  );
};
