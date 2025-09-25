import { Badge, Group, Text } from "@mantine/core";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import type { Intent } from "@/content-types/Intent";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";

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
  const { members } = useConversationContext();
  return (
    <>
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Group gap="4" wrap="wrap" justify="center">
        <Identity
          address={members.get(senderInboxId) ?? ""}
          inboxId={senderInboxId}
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
