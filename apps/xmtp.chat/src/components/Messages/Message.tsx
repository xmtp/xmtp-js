import { Box } from "@mantine/core";
import type { Client, DecodedMessage } from "@xmtp/browser-sdk";
import { useNavigate, useOutletContext } from "react-router";
import classes from "./Message.module.css";
import { MessageContent } from "./MessageContent";

export type MessageProps = {
  message: DecodedMessage;
  scrollToMessage: (id: string) => void;
};

export const Message: React.FC<MessageProps> = ({
  message,
  scrollToMessage,
}) => {
  const { client } = useOutletContext<{ client: Client }>();
  const isSender = client.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const navigate = useNavigate();
  return (
    <Box
      p="md"
      tabIndex={0}
      className={classes.root}
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
      <MessageContent
        message={message}
        align={align}
        senderInboxId={message.senderInboxId}
        scrollToMessage={scrollToMessage}
      />
    </Box>
  );
};
