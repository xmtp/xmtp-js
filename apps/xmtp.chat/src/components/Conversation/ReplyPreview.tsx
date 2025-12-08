import { ActionIcon, Box, Group, Paper, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { IdentityBadge } from "@/components/IdentityBadge";
import { AttachmentDetails } from "@/components/Messages/AttachmentDetails";
import { BreakableText } from "@/components/Messages/BreakableText";
import { useConversationContext } from "@/contexts/ConversationContext";
import { formatFileSize } from "@/helpers/attachment";
import { isRemoteAttachment, stringify } from "@/helpers/messages";
import { MEMBER_NO_LONGER_IN_GROUP } from "@/helpers/strings";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import { IconArrowBackUp } from "@/icons/IconArrowBackUp";
import { IconX } from "@/icons/IconX";

export type ReplyPreviewProps = {
  message: DecodedMessage;
  onCancel: () => void;
  disabled?: boolean;
};

const ReplyPreviewContent: React.FC<Pick<ReplyPreviewProps, "message">> = ({
  message,
}) => {
  if (isRemoteAttachment(message)) {
    return (
      <AttachmentDetails
        filename={message.content.filename}
        fileSize={formatFileSize(message.content.contentLength)}
        align="left"
      />
    );
  }
  return (
    <BreakableText mt={6} fw={700} size="sm" lineClamp={2}>
      {stringify(message)}
    </BreakableText>
  );
};

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  message,
  onCancel,
  disabled,
}) => {
  const { conversationId } = useConversationContext();
  const { members } = useConversation(conversationId);
  const fromMember = members.get(message.senderInboxId);
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
              <IdentityBadge
                address={fromMember ? getMemberAddress(fromMember) : ""}
                displayName={message.senderInboxId}
                tooltip={fromMember ? undefined : MEMBER_NO_LONGER_IN_GROUP}
              />
            </Box>
          </Group>
          <ReplyPreviewContent message={message} />
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
