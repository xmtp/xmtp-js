import { Box, Flex, Paper, Stack, Text } from "@mantine/core";
import type { DecodedMessage } from "@xmtp/browser-sdk";
import { intlFormat } from "date-fns";
import { useNavigate } from "react-router";
import { useXMTP } from "@/contexts/XMTPContext";
import { shortAddress } from "@/helpers/address";
import { nsToDate } from "@/helpers/date";
import classes from "./Message.module.css";
import { MessageContent } from "./MessageContent";

export type MessageProps = {
  message: DecodedMessage;
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { client } = useXMTP();
  const isSender = client?.inboxId === message.senderInboxId;
  const align = isSender ? "right" : "left";
  const navigate = useNavigate();

  return (
    <Box pb="sm" px="md">
      <Flex justify={align === "left" ? "flex-start" : "flex-end"}>
        <Paper
          p="md"
          withBorder
          shadow="md"
          maw="80%"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void navigate(
                `/conversations/${message.conversationId}/message/${message.id}`,
              );
            }
          }}
          className={classes.root}
          onClick={() =>
            void navigate(
              `/conversations/${message.conversationId}/message/${message.id}`,
            )
          }>
          <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
            <Flex
              align="center"
              gap="xs"
              direction={align === "left" ? "row" : "row-reverse"}
              justify={align === "left" ? "flex-start" : "flex-end"}>
              <Text size="sm" fw={700} c="text.primary">
                {shortAddress(message.senderInboxId)}
              </Text>
              <Text size="sm" c="dimmed">
                {intlFormat(nsToDate(message.sentAtNs), {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Flex>
            <MessageContent content={message.content as string} />
          </Stack>
        </Paper>
      </Flex>
    </Box>
  );
};
