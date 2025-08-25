import { Box, Group, Loader, Paper, Text } from "@mantine/core";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { useEffect, useMemo, useState } from "react";

export type RemoteAttachmentContentProps = {
  content: RemoteAttachment;
};

export const RemoteAttachmentContent: React.FC<
  RemoteAttachmentContentProps
> = ({ content }) => {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const fileType = useMemo(() => {
    if (!content.filename) return "file";
    const extension = content.filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
      return "image";
    if (["mp4", "webm", "mov"].includes(extension || "")) return "video";
    if (["mp3", "wav", "ogg", "webm"].includes(extension || "")) return "audio";
    return "file";
  }, [content.filename]);

  const fileSize = useMemo(() => {
    if (!content.contentLength) return "";
    const kb = content.contentLength / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }, [content.contentLength]);

  useEffect(() => {
    const decryptAttachment = async () => {
      try {
        setIsDecrypting(true);
        setDecryptError(null);

        // Check if attachment has encryption data (non-empty digest and keys)
        const hasEncryption =
          content.contentDigest &&
          content.contentDigest.length > 0 &&
          content.salt.length > 0 &&
          content.nonce.length > 0 &&
          content.secret.length > 0;

        if (!hasEncryption) {
          // If no encryption data, use the URL directly (fallback for unencrypted attachments)
          setDecryptedUrl(content.url);
          setIsDecrypting(false);
          return;
        }

        // Decrypt the attachment using the RemoteAttachmentCodec
        const codecRegistry = {
          codecFor: () => new AttachmentCodec(),
        };

        const decryptedAttachment =
          await RemoteAttachmentCodec.load<Attachment>(content, codecRegistry);

        // Create a blob URL for the decrypted data
        const blob = new Blob([decryptedAttachment.data], {
          type: decryptedAttachment.mimeType,
        });
        const blobUrl = URL.createObjectURL(blob);
        setDecryptedUrl(blobUrl);
      } catch (error) {
        console.error("Error decrypting attachment:", error);
        setDecryptError("Failed to decrypt attachment");
      } finally {
        setIsDecrypting(false);
      }
    };

    void decryptAttachment();

    // Cleanup blob URL on unmount
    return () => {
      if (decryptedUrl) {
        URL.revokeObjectURL(decryptedUrl);
      }
    };
  }, [content]);

  if (isDecrypting) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Group gap="xs" align="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Decrypting attachment...
          </Text>
        </Group>
      </Paper>
    );
  }

  if (decryptError || !decryptedUrl) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Text size="sm" c="red">
          {decryptError || "Failed to load attachment"}
        </Text>
        {content.filename && (
          <Text size="sm" fw={500} mt="xs">
            {content.filename}
          </Text>
        )}
      </Paper>
    );
  }

  return (
    <Paper p="xs" radius="md" withBorder>
      <Box>
        {fileType === "image" && (
          <img
            src={decryptedUrl}
            alt={content.filename || "Attachment"}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--mantine-radius-sm)",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
        {fileType === "video" && (
          <video
            src={decryptedUrl}
            controls
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--mantine-radius-sm)",
              display: "block",
            }}
          />
        )}
        {fileType === "audio" && (
          <audio
            src={decryptedUrl}
            controls
            style={{
              width: "100%",
              display: "block",
            }}
          />
        )}
        {content.filename && (
          <Box mt="xs">
            <Text size="sm" fw={500}>
              {content.filename}
            </Text>
            {fileSize && (
              <Text size="xs" c="dimmed">
                {fileSize}
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};
