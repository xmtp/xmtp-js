import { Code } from "@mantine/core";
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
import { GroupUpdatedContent } from "@/components/Messages/GroupUpdatedContent";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";

export type MessageContentProps = {
  align: MessageContentAlign;
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
        <TextContent text={message.content} />
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
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(message.content ?? message.fallback, null, 2)}
      </Code>
    </MessageContentWrapper>
  );
};
