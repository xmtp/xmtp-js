import { Stack, Text } from "@mantine/core";
import {
  DeliveryStatus,
  GroupMessageKind,
  type SafeMessage,
} from "@xmtp/browser-sdk";
import { intlFormat } from "date-fns";
import { useMemo } from "react";
import { nsToDate } from "../helpers/date";
import { BadgeWithCopy } from "./BadgeWithCopy";

export type MessagePropertiesProps = {
  message: SafeMessage;
};

export const MessageProperties: React.FC<MessagePropertiesProps> = ({
  message,
}) => {
  const deliveryStatus = useMemo(() => {
    return message.deliveryStatus === DeliveryStatus.Published
      ? "Published"
      : message.deliveryStatus === DeliveryStatus.Failed
        ? "Failed"
        : "Unpublished";
  }, [message]);

  const messageKind = useMemo(() => {
    return message.kind === GroupMessageKind.Application
      ? "Application"
      : "Membership Change";
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
        <BadgeWithCopy value={message.convoId} />
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
          })}
        />
      </Stack>
    </Stack>
  );
};
