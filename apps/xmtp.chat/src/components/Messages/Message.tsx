import { Box, Flex, Paper, Stack, Text } from "@mantine/core";
import type { Client, DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeEthSignTypedData,
  type EthSignTypedDataParams,
} from "@xmtp/content-type-eth-sign-typed-data";
import {
  ContentTypeOffChainSignature,
  type OffChainSignature,
} from "@xmtp/content-type-off-chain-signature";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { intlFormat } from "date-fns";
import { useNavigate, useOutletContext } from "react-router";
import { nsToDate } from "@/helpers/date";
import { shortAddress } from "@/helpers/strings";
import { EthSignTypedDataContent } from "./EthSignTypedDataContent";
import classes from "./Message.module.css";
import { MessageContent } from "./MessageContent";
import { OffChainSignatureContent } from "./OffChainSignatureContent";
import { TransactionReferenceContent } from "./TransactionReferenceContent";
import { WalletSendCallsContent } from "./WalletSendCallsContent";

export type MessageProps = {
  message: DecodedMessage;
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { client } = useOutletContext<{ client: Client }>();
  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const navigate = useNavigate();

  return (
    <Box px="md">
      <Flex justify={align === "left" ? "flex-start" : "flex-end"}>
        <Paper
          p="md"
          withBorder
          shadow="md"
          maw="80%"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void navigate(
                `/conversations/${message.conversationId}/message/${message.id}`,
              );
            }
          }}
          className={classes.root}
          onClick={() =>
            void navigate(
              `/conversations/${message.conversationId}/message/${message.id}`,
            )
          }>
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
            {message.contentType.sameAs(ContentTypeTransactionReference) ? (
              <TransactionReferenceContent
                content={message.content as TransactionReference}
              />
            ) : message.contentType.sameAs(ContentTypeWalletSendCalls) ? (
              <WalletSendCallsContent
                content={message.content as WalletSendCallsParams}
                conversationId={message.conversationId}
              />
            ) : message.contentType.sameAs(ContentTypeEthSignTypedData) ? (
              <EthSignTypedDataContent
                content={message.content as EthSignTypedDataParams}
                conversationId={message.conversationId}
              />
            ) : message.contentType.sameAs(ContentTypeOffChainSignature) ? (
              <OffChainSignatureContent
                content={message.content as OffChainSignature}
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
