import { Box, Flex, Paper, Stack, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import { intlFormat } from "date-fns";
import { shortAddress } from "@/helpers/address";
import { nsToDate } from "@/helpers/date";
import { useClient } from "@/hooks/useClient";
import { MessageContent } from "./MessageContent";
import { TransactionReferenceUI } from "./TransactionReference";

export type MessageProps = {
  message: DecodedMessage;
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { client } = useClient();
  const isSender = client?.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";

  return (
    <Box pb="sm" px="md">
      <Flex justify={align === "left" ? "flex-start" : "flex-end"}>
        <Paper p="md" withBorder shadow="md" maw="80%" tabIndex={0}>
          <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
            <Flex
              align="center"
              gap="xs"
              direction={align === "left" ? "row" : "row-reverse"}
              justify={align === "left" ? "flex-start" : "flex-end"}>
              <Text size="sm" fw={700} c="text.primary">
                {shortAddress(message.senderInboxId)}
              </Text>
              <Text size="sm" c="dimmed">
                {intlFormat(nsToDate(message.sentAtNs), {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Flex>
            <span>
              Message Content Type: {JSON.stringify(message.contentType)}
            </span>
            <span>
              Transaction Reference Content Type:{" "}
              {JSON.stringify(ContentTypeTransactionReference)}
            </span>
            {message.contentType.sameAs(ContentTypeTransactionReference) ? (
              <TransactionReferenceUI
                content={message.content as TransactionReference}
              />
            ) : (
              <MessageContent content={message.content as string} />
            )}
          </Stack>
        </Paper>
      </Flex>
    </Box>
  );
};
