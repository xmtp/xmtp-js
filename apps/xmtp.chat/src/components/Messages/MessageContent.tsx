import { Code } from "@mantine/core";
import type {
  Actions,
  DecodedMessage,
  EnrichedReply,
  RemoteAttachment,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/browser-sdk";
import { ActionsContent } from "@/components/Messages/ActionsContent";
import { FallbackContent } from "@/components/Messages/FallbackContent";
import { MarkdownContent } from "@/components/Messages/MarkdownContent";
import { type MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { RemoteAttachmentContent } from "@/components/Messages/RemoteAttachmentContent";
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
  if (message.contentType.typeId === "transactionReference") {
    return (
      <TransactionReferenceContent
        content={message.content as TransactionReference}
      />
    );
  }

  if (message.contentType.typeId === "walletSendCalls") {
    return (
      <WalletSendCallsContent
        content={message.content as WalletSendCalls}
        conversationId={message.conversationId}
      />
    );
  }

  if (message.contentType.typeId === "reply") {
    return (
      <ReplyContent
        align={align}
        message={message as DecodedMessage<EnrichedReply>}
        scrollToMessage={scrollToMessage}
      />
    );
  }

  if (message.contentType.typeId === "remoteStaticAttachment") {
    return (
      <RemoteAttachmentContent
        align={align}
        content={message.content as RemoteAttachment}
      />
    );
  }

  if (message.contentType.typeId === "actions") {
    return <ActionsContent content={message.content as Actions} />;
  }

  if (message.contentType.typeId === "markdown") {
    return <MarkdownContent content={message.content as string} />;
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
