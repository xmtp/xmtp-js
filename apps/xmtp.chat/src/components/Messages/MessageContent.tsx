import { Code } from "@mantine/core";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
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
import { ReadReceiptContent } from "@/components/Messages/ReadReceiptContent";
import { ReplyContent } from "@/components/Messages/ReplyContent";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";

export type MessageContentProps = {
  align: MessageContentAlign;
  scrollToMessage: (id: string) => void;
  contentType: ContentTypeId;
  content: unknown;
  conversationId: string;
  fallback?: string;
};

export const MessageContent: React.FC<MessageContentProps> = ({
  contentType,
  content,
  conversationId,
  fallback,
  align,
  scrollToMessage,
}) => {
  if (contentType.sameAs(ContentTypeTransactionReference)) {
    return (
      <TransactionReferenceContent content={content as TransactionReference} />
    );
  }

  if (contentType.sameAs(ContentTypeWalletSendCalls)) {
    return (
      <WalletSendCallsContent
        content={content as WalletSendCallsParams}
        conversationId={conversationId}
      />
    );
  }

  if (contentType.sameAs(ContentTypeReply)) {
    return (
      <ReplyContent
        align={align}
        conversationId={conversationId}
        reply={content as Reply}
        fallback={fallback}
        scrollToMessage={scrollToMessage}
      />
    );
  }

  if (contentType.sameAs(ContentTypeReadReceipt)) {
    return <ReadReceiptContent />;
  }

  if (typeof content === "string") {
    return <TextContent text={content} />;
  }

  if (typeof fallback === "string") {
    return <FallbackContent text={fallback} />;
  }

  return (
    <Code
      block
      w="100%"
      style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      {JSON.stringify(content ?? fallback, null, 2)}
    </Code>
  );
};
