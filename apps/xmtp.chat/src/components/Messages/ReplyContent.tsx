import { Group, Stack, Text, Tooltip } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { type Reply } from "@xmtp/content-type-reply";
import { useCallback, useEffect, useState } from "react";
import { MessageContent } from "@/components/Messages/MessageContent";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { useConversations } from "@/hooks/useConversations";
import classes from "./ReplyContent.module.css";

export type ReplyContentProps = {
  align: MessageContentAlign;
  conversationId: string;
  fallback?: string;
  reply: Reply;
  scrollToMessage: (id: string) => void;
};

export const ReplyContent: React.FC<ReplyContentProps> = ({
  align,
  conversationId,
  fallback,
  reply,
  scrollToMessage,
}) => {
  const { getMessageById } = useConversations();
  const [originalMessage, setOriginalMessage] = useState<
    DecodedMessage | undefined
  >(undefined);

  useEffect(() => {
    void getMessageById(reply.reference).then((originalMessage) => {
      setOriginalMessage(originalMessage as DecodedMessage);
    });
  }, [reply.reference]);

  const handleClick = useCallback(() => {
    if (originalMessage) {
      scrollToMessage(originalMessage.id);
    }
  }, [originalMessage, scrollToMessage]);

  return (
    <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
      <Group gap={4}>
        <Text size="xs">Replied to a</Text>
        <Tooltip label="Click to scroll to the original message">
          <Text size="xs" className={classes.text} onClick={handleClick}>
            message
          </Text>
        </Tooltip>
      </Group>
      <MessageContent
        contentType={reply.contentType}
        content={reply.content}
        conversationId={conversationId}
        fallback={fallback}
        align={align}
        scrollToMessage={scrollToMessage}
      />
    </Stack>
  );
};
