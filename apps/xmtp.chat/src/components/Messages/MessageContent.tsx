import { Code } from "@mantine/core";
import type {
  Actions,
  EnrichedReply,
  RemoteAttachment,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/browser-sdk";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { ActionsContent } from "@/components/Messages/ActionsContent";
import { FallbackContent } from "@/components/Messages/FallbackContent";
import { MarkdownContent } from "@/components/Messages/MarkdownContent";
import { type MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { RemoteAttachmentContent } from "@/components/Messages/RemoteAttachmentContent";
import { ReplyContent } from "@/components/Messages/ReplyContent";
import { TextContent } from "@/components/Messages/TextContent";
import { TransactionReferenceContent } from "@/components/Messages/TransactionReferenceContent";
import { WalletSendCallsContent } from "@/components/Messages/WalletSendCallsContent";
import { jsonStringify } from "@/helpers/strings";

export type MessageContentProps<T> = {
  align: MessageContentAlign;
  scrollToMessage: (id: string) => void;
  content: T;
  contentType: ContentTypeId;
  fallback?: string;
};

export const MessageContent = <T,>({
  content,
  contentType,
  align,
  scrollToMessage,
  fallback,
}: MessageContentProps<T>) => {
  if (contentType.typeId === "transactionReference") {
    return (
      <TransactionReferenceContent content={content as TransactionReference} />
    );
  }

  if (contentType.typeId === "walletSendCalls") {
    return <WalletSendCallsContent content={content as WalletSendCalls} />;
  }

  if (contentType.typeId === "reply") {
    return (
      <ReplyContent
        align={align}
        reply={content as EnrichedReply}
        scrollToMessage={scrollToMessage}
      />
    );
  }

  if (contentType.typeId === "remoteStaticAttachment") {
    return (
      <RemoteAttachmentContent
        align={align}
        content={content as RemoteAttachment}
      />
    );
  }

  if (contentType.typeId === "actions") {
    return <ActionsContent content={content as Actions} />;
  }

  if (contentType.typeId === "markdown") {
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
      {jsonStringify(content ?? fallback)}
    </Code>
  );
};
