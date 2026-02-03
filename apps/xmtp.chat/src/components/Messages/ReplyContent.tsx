import { Group, Stack, Text, Tooltip } from "@mantine/core";
import type { EnrichedReply } from "@xmtp/browser-sdk";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import { useCallback, useEffect, useState } from "react";
import { MessageContent } from "@/components/Messages/MessageContent";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import classes from "./ReplyContent.module.css";

export type ReplyContentProps = {
  align: MessageContentAlign;
  reply: EnrichedReply;
  scrollToMessage: (id: string) => void;
};

export const ReplyContent: React.FC<ReplyContentProps> = ({
  align,
  reply,
  scrollToMessage,
}) => {
  const [contentType, setContentType] = useState<ContentTypeId | undefined>(
    undefined,
  );
  useEffect(() => {
    void reply.contentType().then((contentType) => {
      setContentType(contentType);
    });
  }, [reply.contentType]);

  const handleClick = useCallback(() => {
    scrollToMessage(reply.referenceId);
  }, [scrollToMessage]);

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
      {contentType && (
        <MessageContent
          content={reply.content}
          contentType={contentType}
          align={align}
          scrollToMessage={scrollToMessage}
        />
      )}
    </Stack>
  );
};
