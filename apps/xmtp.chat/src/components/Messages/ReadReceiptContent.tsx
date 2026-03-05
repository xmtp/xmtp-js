import { Group, Text } from "@mantine/core";
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
  const { conversationId } = useConversationContext();
  const { members } = useConversation(conversationId);
  const senderMember = members.get(senderInboxId);
  return (
    <>
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Group gap="4" wrap="wrap" justify="center">
        <IdentityBadge
          address={senderMember ? getMemberAddress(senderMember) : ""}
          displayName={senderInboxId}
          tooltip={senderMember ? undefined : MEMBER_NO_LONGER_IN_GROUP}
        />
        <Text size="sm">sent a read receipt</Text>
      </Group>
    </>
  );
};
