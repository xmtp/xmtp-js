import { Code } from "@mantine/core";
import { ContentTypeMarkdown } from "@xmtp/content-type-markdown";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  type WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { ActionsContent } from "@/components/Messages/ActionsContent";
import { FallbackContent } from "@/components/Messages/FallbackContent";
import { MarkdownContent } from "@/components/Messages/MarkdownContent";
import { type MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { ReadReceiptContent } from "@/components/Messages/ReadReceiptContent";
import { RemoteAttachmentContent } from "@/components/Messages/RemoteAttachmentContent";
import { ReplyContent } from "@/components/Messages/ReplyContent";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";
import { ContentTypeActions, type Actions } from "@/content-types/Actions";

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

  if (contentType.sameAs(ContentTypeRemoteAttachment)) {
    return (
      <RemoteAttachmentContent
        align={align}
        content={content as RemoteAttachment}
      />
    );
  }

  if (contentType.sameAs(ContentTypeActions)) {
    return <ActionsContent content={content as Actions} />;
  }

  if (contentType.sameAs(ContentTypeMarkdown)) {
    return <MarkdownContent content={content as string} />;
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
