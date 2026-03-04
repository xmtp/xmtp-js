import type { DecodedMessage, GroupUpdated, Intent } from "@xmtp/browser-sdk";
import { GroupUpdatedContent } from "@/components/Messages/GroupUpdatedContent";
import { IntentContent } from "@/components/Messages/IntentContent";
import { MessageContent } from "@/components/Messages/MessageContent";
import {
  MessageContentWrapper,
  type MessageContentAlign,
} from "@/components/Messages/MessageContentWrapper";
import type { ReadStatus } from "@/hooks/useReadStatus";

export type MessageContentWithWrapperProps = {
  align: MessageContentAlign;
  senderInboxId: string;
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
  readStatus?: ReadStatus;
};

export const MessageContentWithWrapper: React.FC<
  MessageContentWithWrapperProps
> = ({ message, align, senderInboxId, scrollToMessage, readStatus }) => {
  if (message.contentType.typeId === "group_updated") {
    return (
      <GroupUpdatedContent
        content={message.content as GroupUpdated}
        sentAtNs={message.sentAtNs}
      />
    );
  }

  if (message.contentType.typeId === "intent") {
    return (
      <IntentContent
        content={message.content as Intent}
        sentAtNs={message.sentAtNs}
        senderInboxId={senderInboxId}
      />
    );
  }

  return (
    <MessageContentWrapper
      align={align}
      senderInboxId={senderInboxId}
      sentAtNs={message.sentAtNs}
      readStatus={readStatus}>
      <MessageContent
        content={message.content}
        contentType={message.contentType}
        fallback={message.fallback}
        align={align}
        scrollToMessage={scrollToMessage}
      />
    </MessageContentWrapper>
  );
};
