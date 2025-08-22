import { ActionIcon, Box, Group, Paper, Text } from "@mantine/core";
import { AddressBadge } from "@/components/AddressBadge";
import { BreakableText } from "@/components/Messages/BreakableText";
import { IconArrowBackUp } from "@/icons/IconArrowBackUp";
import { IconX } from "@/icons/IconX";

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
      <Box miw="0">
        <Paper p="xs" radius="sm" withBorder>
          <Group gap={6} align="center" w="100%" miw={0}>
            <IconArrowBackUp color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed">
              Replying to
            </Text>
            <Box>
              <AddressBadge address={fromAddress} />
            </Box>
          </Group>
          <BreakableText mt={6} fw={700} size="sm" lineClamp={2}>
            {previewText}
          </BreakableText>
        </Paper>
      </Box>
      <Box style={{ alignSelf: "start" }}>
        <ActionIcon
          aria-label="Cancel reply"
          variant="light"
          radius="xl"
          onClick={onCancel}
          disabled={disabled}>
          <IconX size={18} />
        </ActionIcon>
      </Box>
    </>
  );
};
