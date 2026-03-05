import { Popover, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DateLabel } from "@/components/DateLabel";
import { IdentityBadge } from "@/components/IdentityBadge";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { MEMBER_NO_LONGER_IN_GROUP } from "@/helpers/strings";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";

export type ReadReceiptContentProps = {
  sentAtNs: bigint;
  senderInboxId: string;
};

export const ReadReceiptContent: React.FC<ReadReceiptContentProps> = ({
  senderInboxId,
  sentAtNs,
}) => {
  const [opened, { toggle }] = useDisclosure(false);
  const { conversationId } = useConversationContext();
  const { members } = useConversation(conversationId);
  const senderMember = members.get(senderInboxId);
  return (
    <Popover opened={opened} position="bottom" withArrow>
      <Popover.Target>
        <UnstyledButton onClick={toggle}>
          <Text size="sm" c="dimmed" ta="center">
            received read receipt
          </Text>
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs" align="center">
          <IdentityBadge
            address={senderMember ? getMemberAddress(senderMember) : ""}
            displayName={senderInboxId}
            tooltip={senderMember ? undefined : MEMBER_NO_LONGER_IN_GROUP}
          />
          <DateLabel date={nsToDate(sentAtNs)} align="center" />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
