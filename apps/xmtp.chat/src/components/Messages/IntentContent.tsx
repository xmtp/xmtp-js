import { Badge, Group, Text } from "@mantine/core";
import { DateLabel } from "@/components/DateLabel";
import { IdentityBadge } from "@/components/IdentityBadge";
import type { Intent } from "@/content-types/Intent";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { MEMBER_NO_LONGER_IN_GROUP } from "@/helpers/strings";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";

export type IntentContentProps = {
  content: Intent;
  sentAtNs: bigint;
  senderInboxId: string;
};

export const IntentContent: React.FC<IntentContentProps> = ({
  senderInboxId,
  content,
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
        <Text size="sm">selected the</Text>
        <Badge
          radius="md"
          variant="default"
          size="lg"
          styles={{
            label: {
              textTransform: "none",
            },
          }}>
          {content.actionId}
        </Badge>
        <Text size="sm">action</Text>
      </Group>
    </>
  );
};
