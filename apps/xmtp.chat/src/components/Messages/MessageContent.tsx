import { Box, Code, Flex, Group, Paper, Stack, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeGroupUpdated,
  type GroupUpdated,
} from "@xmtp/content-type-group-updated";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { AddressBadge } from "@/components/AddressBadge";
import { DateLabel } from "@/components/DateLabel";
import { GroupUpdatedContent } from "@/components/Messages/GroupUpdatedContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";
import { nsToDate } from "@/helpers/date";
import classes from "./MessageContent.module.css";

type MessageAlign = "left" | "right";

type MessageContentWrapperProps = React.PropsWithChildren<{
  align: MessageAlign;
  senderInboxId?: string;
  sentAtNs: bigint;
}>;

const MessageContentWrapper: React.FC<MessageContentWrapperProps> = ({
  align,
  senderInboxId,
  children,
  sentAtNs,
}) => {
  return (
    <Group justify={align === "left" ? "flex-start" : "flex-end"}>
      <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
        <Flex
          gap="xs"
          direction={align === "right" ? "row" : "row-reverse"}
          align="center">
          <DateLabel date={nsToDate(sentAtNs)} />
          {senderInboxId && <AddressBadge address={senderInboxId} size="lg" />}
        </Flex>
        <Box maw="80%">{children}</Box>
      </Stack>
    </Group>
  );
};

export type MessageContentProps = {
  align: MessageAlign;
  senderInboxId: string;
  message: DecodedMessage;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  align,
  senderInboxId,
}) => {
  if (message.contentType.sameAs(ContentTypeTransactionReference)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <TransactionReferenceContent
          content={message.content as TransactionReference}
        />
      </MessageContentWrapper>
    );
  }

  if (message.contentType.sameAs(ContentTypeWalletSendCalls)) {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <WalletSendCallsContent
          content={message.content as WalletSendCallsParams}
          conversationId={message.conversationId}
        />
      </MessageContentWrapper>
    );
  }

  if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
    return (
      <GroupUpdatedContent
        content={message.content as GroupUpdated}
        sentAtNs={message.sentAtNs}
      />
    );
  }

  if (typeof message.content === "string") {
    return (
      <MessageContentWrapper
        align={align}
        senderInboxId={senderInboxId}
        sentAtNs={message.sentAtNs}>
        <Paper
          className={classes.text}
          onClick={(event) => {
            event.stopPropagation();
          }}
          bg="var(--mantine-color-blue-filled)"
          c="white"
          py="xs"
          px="sm"
          radius="md">
          <Text style={{ whiteSpace: "pre-wrap" }}>{message.content}</Text>
        </Paper>
      </MessageContentWrapper>
    );
  }

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={message.sentAtNs}>
      <Code
        block
        w="100%"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(message.content ?? message.fallback, null, 2)}
      </Code>
    </MessageContentWrapper>
  );
};
