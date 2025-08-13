import { ActionIcon, Box, Text } from "@mantine/core";
import { IconArrowBackUp, IconX } from "@tabler/icons-react";
import type { DecodedMessage } from "@xmtp/browser-sdk";

export type ReplyPreviewProps = {
  message: DecodedMessage;
  members: Map<string, string>;
  onCancel: () => void;
  disabled?: boolean;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  message,
  members,
  onCancel,
  disabled,
}) => {
  const displayName =
    members.get(message.senderInboxId) ?? message.senderInboxId;
  const previewText = String(message.content);

  return (
    <>
      <Box style={{ minWidth: 0 }}>
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            width: "100%",
          }}>
          <IconArrowBackUp
            size={14}
            stroke={2}
            color="var(--mantine-color-dimmed)"
            style={{ flex: "none" }}
          />
          <Text size="xs" c="dimmed" style={{ flex: "none" }}>
            Replying to
          </Text>
          <Text
            size="xs"
            c="dimmed"
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={displayName}>
            {displayName}
          </Text>
        </Box>
        <Text
          mt={6}
          fw={700}
          size="sm"
          lineClamp={2}
          style={{ wordBreak: "break-word", overflow: "hidden" }}>
          {previewText}
        </Text>
      </Box>
      <Box style={{ display: "grid", placeItems: "center" }}>
        <ActionIcon
          aria-label="Cancel reply"
          variant="filled"
          color="dark"
          radius="xl"
          onClick={onCancel}
          disabled={disabled}>
          <IconX size={18} stroke={2} color="white" />
        </ActionIcon>
      </Box>
    </>
  );
};
