import { Code } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { FallbackContent } from "@/components/Messages/FallbackContent";
import { type MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { ReplyContent } from "@/components/Messages/ReplyContent";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";

export type MessageContentProps = {
  align: MessageContentAlign;
  scrollToMessage: (id: string) => void;
  message: DecodedMessage;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  align,
  scrollToMessage,
}) => {
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

  if (message.contentType.sameAs(ContentTypeReply)) {
    return (
      <ReplyContent
        align={align}
        message={message as DecodedMessage<Reply>}
        scrollToMessage={scrollToMessage}
      />
    );
  }

  if (typeof message.content === "string") {
    return <TextContent text={message.content} />;
  }

  if (typeof message.fallback === "string") {
    return <FallbackContent text={message.fallback} />;
  }

  return (
    <Code
      block
      w="100%"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      {JSON.stringify(message.content ?? message.fallback, null, 2)}
    </Code>
  );
};
