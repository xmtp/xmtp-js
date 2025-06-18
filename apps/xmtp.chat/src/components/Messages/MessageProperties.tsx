import { Stack, Text } from "@mantine/core";
import { type DecodedMessage } from "@xmtp/browser-sdk";
import { intlFormat } from "date-fns";
import { useMemo } from "react";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { nsToDate } from "@/helpers/date";

export type MessagePropertiesProps = {
  message: DecodedMessage;
};

export const MessageProperties: React.FC<MessagePropertiesProps> = ({
  message,
}) => {
  const deliveryStatus = useMemo(() => {
    switch (message.deliveryStatus) {
      case "published":
        return "Published";
      case "failed":
        return "Failed";
      case "unpublished":
        return "Unpublished";
    }
  }, [message]);

  const messageKind = useMemo(() => {
    switch (message.kind) {
      case "application":
        return "Application";
      case "membership_change":
        return "Membership Change";
    }
  }, [message]);

  return (
    <Stack gap="xs" mih="30vh">
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Message ID
        </Text>
        <BadgeWithCopy value={message.id} />
      </Stack>
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Conversation ID
        </Text>
        <BadgeWithCopy value={message.conversationId} />
      </Stack>
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Message kind
        </Text>
        <BadgeWithCopy value={messageKind} />
      </Stack>
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Sender inbox ID
        </Text>
        <BadgeWithCopy value={message.senderInboxId} />
      </Stack>
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Delivery status
        </Text>
        <BadgeWithCopy value={deliveryStatus} />
      </Stack>
      <Stack gap="calc(var(--mantine-spacing-xs) / 2)">
        <Text size="sm" ml="xs">
          Sent at
        </Text>
        <BadgeWithCopy
          value={intlFormat(nsToDate(message.sentAtNs), {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        />
      </Stack>
    </Stack>
  );
};
