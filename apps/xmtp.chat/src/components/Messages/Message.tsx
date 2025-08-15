import { Box, Button, Group, Stack } from "@mantine/core";
import type { Client, DecodedMessage } from "@xmtp/browser-sdk";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { useNavigate, useOutletContext } from "react-router";
import { useConversationContext } from "../../contexts/ConversationContext";
import classes from "./Message.module.css";
import { MessageContentWithWrapper } from "./MessageContentWithWrapper";
import { ReactionPopover } from "./ReactionPopover";

export type MessageProps = {
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const Message: React.FC<MessageProps> = ({
  message,
  scrollToMessage,
}) => {
  // Hooks
  const navigate = useNavigate();
  const { setReplyTarget } = useConversationContext();
  const { client } = useOutletContext<{ client: Client }>();

  // Client checks
  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";

  // Message checks
  const isText = message.contentType.sameAs(ContentTypeText);
  const isReaction = message.contentType.sameAs(ContentTypeReaction);
  const isReply = message.contentType.sameAs(ContentTypeReply);
  const showMessageAction = isText || isReaction || isReply;

  return (
    <Box p="md" tabIndex={0} className={classes.root}>
      <Box
        tabIndex={0}
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
      {showMessageAction && (
        <Group justify={align === "left" ? "flex-start" : "flex-end"} mt={4}>
          <ReactionPopover message={message} />
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => {
              setReplyTarget(message);
            }}>
            Reply
          </Button>
        </Group>
      )}
    </Box>
  );
};
