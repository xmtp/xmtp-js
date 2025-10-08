import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Text,
  TextInput,
} from "@mantine/core";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useCallback, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { useConversationContext } from "@/contexts/ConversationContext";
import { uploadAttachment, validateFile } from "@/helpers/attachment";
import { useConversation } from "@/hooks/useConversation";
import { IconPlus } from "@/icons/IconPlus";
import { AttachmentPreview } from "./AttachmentPreview";
import { ReplyPreview } from "./ReplyPreview";

export type ComposerProps = {
  conversationId: string;
};

export const Composer: React.FC<ComposerProps> = ({ conversationId }) => {
  const { send, sending } = useConversation(conversationId);
  const { replyTarget, setReplyTarget } = useConversationContext();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remoteAttachmentRef = useRef<RemoteAttachment | null>(null);
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

    if (attachment) {
      try {
        if (!remoteAttachmentRef.current) {
          setUploadingAttachment(true);
          remoteAttachmentRef.current = await uploadAttachment(attachment);
        }
      } catch {
        setError("Failed to upload attachment");
        return;
      } finally {
        setUploadingAttachment(false);
      }

      try {
        if (replyTarget) {
          await send(
            {
              reference: replyTarget.id,
              referenceInboxId: replyTarget.senderInboxId,
              contentType: ContentTypeRemoteAttachment,
              content: remoteAttachmentRef.current,
            },
            ContentTypeReply,
          );
        } else {
          await send(remoteAttachmentRef.current, ContentTypeRemoteAttachment);
        }
        setAttachment(null);
        remoteAttachmentRef.current = null;
      } catch {
        setError("Failed to send attachment");
        return;
      }
    }

    if (message) {
      try {
        if (replyTarget) {
          await send(
            {
              reference: replyTarget.id,
              referenceInboxId: replyTarget.senderInboxId,
              contentType: ContentTypeText,
              content: message,
            },
            ContentTypeReply,
          );
        } else {
          await send(message, ContentTypeText);
        }
        setMessage("");
      } catch {
        setError("Failed to send message");
        return;
      }
    }

    setReplyTarget(undefined);
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
      <Box p="md" style={{ width: "100%" }}>
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
