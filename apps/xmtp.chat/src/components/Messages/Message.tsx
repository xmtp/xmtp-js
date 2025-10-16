import { Box, Button, Group } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { useNavigate } from "react-router";
import { useConversationContext } from "@/contexts/ConversationContext";
import { useClient } from "@/contexts/XMTPContext";
import { isActionable } from "@/helpers/messages";
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
  const navigate = useNavigate();
  const { setReplyTarget } = useConversationContext();
  const client = useClient();

  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const hasActions = isActionable(message);

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
      {hasActions && (
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
