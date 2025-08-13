import { ActionIcon, Box, Text } from "@mantine/core";
import { IconArrowBackUp, IconX } from "@tabler/icons-react";
import { AddressBadge } from "@/components/AddressBadge";

export type ReplyPreviewProps = {
  previewText: string;
  fromAddress: string;
  onCancel: () => void;
  disabled?: boolean;
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  previewText,
  fromAddress,
  onCancel,
  disabled,
}) => {
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
            size={16}
            stroke={2}
            color="var(--mantine-color-dimmed)"
          />
          <Text size="sm" c="dimmed">
            Replying to
          </Text>
          <Box>
            <AddressBadge address={fromAddress} />
          </Box>
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
