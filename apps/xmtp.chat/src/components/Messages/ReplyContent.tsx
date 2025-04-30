import { Paper, Stack, Text, Tooltip } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { type Reply } from "@xmtp/content-type-reply";
import { useCallback, useEffect, useState } from "react";
import type { MessageContentAlign } from "@/components/Messages/MessageContentWrapper";
import { TextContent } from "@/components/Messages/TextContent";
import { useConversations } from "@/hooks/useConversations";

export type ReplyContentProps = {
  align: MessageContentAlign;
  message: DecodedMessage<Reply>;
  scrollToMessage: (id: string) => void;
};

export const ReplyContent: React.FC<ReplyContentProps> = ({
  align,
  message,
  scrollToMessage,
}) => {
  const { getMessageById } = useConversations();
  const [originalMessage, setOriginalMessage] = useState<
    DecodedMessage<string> | undefined
  >(undefined);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    void getMessageById(message.content!.reference).then((originalMessage) => {
      setOriginalMessage(originalMessage as DecodedMessage<string>);
    });
  }, [message.content?.reference]);

  const handleClick = useCallback(() => {
    if (originalMessage) {
      scrollToMessage(originalMessage.id);
    }
  }, [originalMessage, scrollToMessage]);

  if (
    message.content?.contentType.typeId === "text" &&
    typeof message.content.content === "string"
  ) {
    return (
      <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
        <Stack gap="4" align={align === "left" ? "flex-start" : "flex-end"}>
          <Text size="xs" ml="xs">
            Replied to
          </Text>
          <Tooltip label="Click to scroll to the original message">
            <Paper
              withBorder
              c="white"
              py="xs"
              px="sm"
              radius="md"
              onClick={handleClick}>
              <Text
                component="pre"
                size="sm"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontFamily: "inherit",
                }}>
                {originalMessage?.content}
              </Text>
            </Paper>
          </Tooltip>
        </Stack>
        <TextContent text={message.content.content} />
      </Stack>
    );
  }

  return <Text>{message.fallback}</Text>;
};
