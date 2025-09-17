import { Badge, Group, Text } from "@mantine/core";
import { AddressBadge } from "@/components/AddressBadge";
import { DateLabel } from "@/components/DateLabel";
import type { Intent } from "@/content-types/Intent";
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
  return (
    <>
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Group gap="4" wrap="wrap" justify="center">
        <AddressBadge address={senderInboxId} size="lg" />
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
