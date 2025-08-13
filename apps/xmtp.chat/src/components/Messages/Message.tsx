import { Box, Button, Group } from "@mantine/core";
import type { Client, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useNavigate, useOutletContext } from "react-router";
import { useConversationContext } from "../../contexts/ConversationContext";
import classes from "./Message.module.css";
import { MessageContentWithWrapper } from "./MessageContentWithWrapper";

export type MessageProps = {
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const Message: React.FC<MessageProps> = ({
  message,
  scrollToMessage,
}) => {
  const { setReplyToMessage } = useConversationContext();
  const { client } = useOutletContext<{ client: Client }>();
  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const navigate = useNavigate();
  const isText = message.contentType.sameAs(ContentTypeText);
  const showReply = isText;

  return (
    <Box p="md" tabIndex={0} className={classes.root}>
      <Box
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void navigate(
              `/conversations/${message.conversationId}/message/${message.id}`,
            );
          }
        }}
        onClick={() =>
          void navigate(
            `/conversations/${message.conversationId}/message/${message.id}`,
          )
        }>
        <MessageContentWithWrapper
          message={message}
          align={align}
          senderInboxId={message.senderInboxId}
          scrollToMessage={scrollToMessage}
        />
      </Box>
      {showReply && (
        <Group justify={align === "left" ? "flex-start" : "flex-end"} mt={4}>
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => setReplyToMessage(message)}>
            Reply
          </Button>
        </Group>
      )}
    </Box>
  );
};
