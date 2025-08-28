import { ActionIcon, Box, Group, Paper, Text } from "@mantine/core";
import { useMemo } from "react";
import { IconX } from "@/icons/IconX";

export type AttachmentPreviewProps = {
  file: File;
  onCancel: () => void;
  disabled?: boolean;
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  file,
  onCancel,
  disabled,
}) => {
  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const fileType = file.type.split("/")[0];
  const fileSize = useMemo(() => {
    const kb = file.size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }, [file.size]);

  return (
    <>
      <Box miw="0">
        <Paper p="xs" radius="sm" withBorder>
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <Box style={{ flex: 1, minWidth: 0 }}>
              {fileType === "image" && (
                <img
                  src={fileUrl}
                  alt={file.name}
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    borderRadius: "var(--mantine-radius-sm)",
                    objectFit: "contain",
                  }}
                />
              )}
              {fileType === "video" && (
                <video
                  src={fileUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                />
              )}
              {fileType === "audio" && (
                <audio
                  src={fileUrl}
                  controls
                  style={{
                    width: "100%",
                  }}
                />
              )}
              <Group gap="xxs" mt="xs" align="center">
                <Text size="sm" fw={500} truncate>
                  {file.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {fileSize}
                </Text>
              </Group>
            </Box>
          </Group>
        </Paper>
      </Box>
      <Box style={{ alignSelf: "start" }}>
        <ActionIcon
          aria-label="Cancel attachment"
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
