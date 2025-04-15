import { Code, Paper, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";

export type MessageContentProps = {
  message: DecodedMessage;
};

export const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  if (message.contentType.sameAs(ContentTypeTransactionReference)) {
    return (
      <TransactionReferenceContent
        content={message.content as TransactionReference}
      />
    );
  }

  if (message.contentType.sameAs(ContentTypeWalletSendCalls)) {
    return (
      <WalletSendCallsContent
        content={message.content as WalletSendCallsParams}
        conversationId={message.conversationId}
      />
    );
  }

  if (typeof message.content === "string") {
    return (
      <Paper
        bg="var(--mantine-color-blue-filled)"
        c="white"
        py="xs"
        px="sm"
        radius="md">
        <Text style={{ whiteSpace: "pre-wrap" }}>{message.content}</Text>
      </Paper>
    );
  }

  return (
    <Code
      block
      maw={420}
      w="100%"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {JSON.stringify(message.content ?? message.fallback, null, 2)}
    </Code>
  );
};
