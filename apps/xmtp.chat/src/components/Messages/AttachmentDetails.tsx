import { Stack, Text } from "@mantine/core";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";

export type AttachmentDetailsProps = {
  filename: string;
  fileSize: string;
  align: MessageContentAlign;
};

export const AttachmentDetails: React.FC<AttachmentDetailsProps> = ({
  filename,
  fileSize,
  align,
}) => (
  <Stack mt="xs" gap={0} align={align === "left" ? "flex-start" : "flex-end"}>
    <Text size="sm" fw={500}>
      {filename}
    </Text>
    <Text size="xs" c="dimmed">
      {fileSize}
    </Text>
  </Stack>
);
