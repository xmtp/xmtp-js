import { Group, Stack, Text, Tooltip } from "@mantine/core";
import type { DecodedMessage, EnrichedReply } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { MessageContent } from "@/components/Messages/MessageContent";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { useConversations } from "@/hooks/useConversations";
import classes from "./ReplyContent.module.css";

export type ReplyContentProps = {
  align: MessageContentAlign;
  message: DecodedMessage<EnrichedReply>;
  scrollToMessage: (id: string) => void;
};

export const ReplyContent: React.FC<ReplyContentProps> = ({
  align,
  message,
  scrollToMessage,
}) => {
  const { getMessageById } = useConversations();
  const [originalMessage, setOriginalMessage] = useState<
    DecodedMessage | undefined
  >(undefined);

  const reply = message.content as EnrichedReply;

  useEffect(() => {
    void getMessageById(reply.referenceId).then((originalMessage) => {
      setOriginalMessage(originalMessage as DecodedMessage);
    });
  }, [reply.referenceId]);

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
        message={reply.inReplyTo as DecodedMessage}
        align={align}
        scrollToMessage={scrollToMessage}
      />
    </Stack>
  );
};
