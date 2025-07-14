import type { DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeGroupUpdated,
  type GroupUpdated,
} from "@xmtp/content-type-group-updated";
import { GroupUpdatedContent } from "@/components/Messages/GroupUpdatedContent";
import { MessageContent } from "@/components/Messages/MessageContent";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";

export type MessageContentWithWrapperProps = {
  align: MessageContentAlign;
  senderInboxId: string;
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const MessageContentWithWrapper: React.FC<
  MessageContentWithWrapperProps
> = ({ message, align, senderInboxId, scrollToMessage }) => {
  if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
    return (
      <GroupUpdatedContent
        content={message.content as GroupUpdated}
        sentAtNs={message.sentAtNs}
      />
    );
  }

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={message.sentAtNs}>
      <MessageContent
        contentType={message.contentType}
        content={message.content}
        conversationId={message.conversationId}
        fallback={message.fallback}
        align={align}
        scrollToMessage={scrollToMessage}
      />
    </MessageContentWrapper>
  );
};
