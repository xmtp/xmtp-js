import { Box, Button, Group, Loader, Paper, Text } from "@mantine/core";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { useCallback, useEffect, useRef, useState } from "react";
import { AttachmentDetails } from "@/components/Messages/AttachmentDetails";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { formatFileSize, getFileType } from "@/helpers/attachment";

const urlCache = new Map<
  string,
  {
    blobUrl: string | null;
    failed: boolean;
  }
>();

export type RemoteAttachmentContentProps = {
  content: RemoteAttachment;
  align: MessageContentAlign;
};

export const RemoteAttachmentContent: React.FC<
  RemoteAttachmentContentProps
> = ({ content, align }) => {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadAttachment = useCallback(
    async (force: boolean = false) => {
      try {
        // do not load the attachment if it is already loading
        if (loadingRef.current) {
          return;
        }

        loadingRef.current = true;

        setError(null);
        setDecryptedUrl(null);

        if (!force) {
          // Check if the blob URL is cached
          const cachedUrl = urlCache.get(content.url);
          if (cachedUrl) {
            if (cachedUrl.failed) {
              setError("Unable to load attachment");
              return;
            }
            if (cachedUrl.blobUrl !== null) {
              setDecryptedUrl(cachedUrl.blobUrl);
              return;
            }
          }
        }

        setIsLoading(true);
        const decryptedAttachment =
          await RemoteAttachmentCodec.load<Attachment>(content, {
            codecFor: () => new AttachmentCodec(),
          });

        const blob = new Blob(
          [decryptedAttachment.data as Uint8Array<ArrayBuffer>],
          {
            type: decryptedAttachment.mimeType,
          },
        );
        const blobUrl = URL.createObjectURL(blob);

        // Cache the blob URL
        urlCache.set(content.url, {
          blobUrl,
          failed: false,
        });

        setDecryptedUrl(blobUrl);
      } catch {
        setError("Unable to load attachment");
        urlCache.set(content.url, {
          blobUrl: null,
          failed: true,
        });
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [content],
  );

  const handleRetry = () => {
    void loadAttachment(true);
  };

  // if content changes, reset content display
  useEffect(() => {
    setDecryptedUrl(null);
    setError(null);
  }, [content]);

  // only load the attachment once on mount
  // if content changes, users will have to reload the attachment manually
  useEffect(() => {
    void loadAttachment();
  }, []);

  const fileSize = formatFileSize(content.contentLength);

  if (isLoading) {
    return (
      <Paper p="sm" radius="md" withBorder>
        <Group gap="xs" align="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading attachment...
          </Text>
        </Group>
        <AttachmentDetails
          filename={content.filename}
          fileSize={fileSize}
          align={align}
        />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="sm" radius="md" withBorder>
        <Box>
          <Group gap="xs" align="center" mb="xs" wrap="nowrap">
            <Text size="sm" c="red" style={{ whiteSpace: "nowrap" }}>
              {error}
            </Text>
            <Button size="xs" variant="light" onClick={handleRetry}>
              Retry
            </Button>
          </Group>
          <AttachmentDetails
            filename={content.filename}
            fileSize={fileSize}
            align={align}
          />
        </Box>
      </Paper>
    );
  }

  if (!decryptedUrl) {
    return (
      <Paper p="sm" radius="md" withBorder>
        <Group gap="xs" align="center" mb="xs" wrap="nowrap">
          <Text size="sm" c="red" style={{ whiteSpace: "nowrap" }}>
            No content available
          </Text>
          <Button size="xs" variant="light" onClick={handleRetry}>
            Retry
          </Button>
        </Group>
        <AttachmentDetails
          filename={content.filename}
          fileSize={fileSize}
          align={align}
        />
      </Paper>
    );
  }

  const fileType = getFileType(content.filename);

  return (
    <Paper p="sm" radius="md" withBorder>
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
              minWidth: "300px",
              display: "block",
            }}
          />
        )}
        <AttachmentDetails
          filename={content.filename}
          fileSize={fileSize}
          align={align}
        />
      </Box>
    </Paper>
  );
};
