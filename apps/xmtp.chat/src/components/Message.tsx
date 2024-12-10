import { Flex, Paper, Stack, Text } from "@mantine/core";
import { intlFormat } from "date-fns";
import { shortAddress } from "../helpers/address";
import classes from "./Message.module.css";
import { MessageContent } from "./MessageContent";

export type MessageProps = {
  align?: "left" | "right";
  content: string;
  senderAddress: string;
  sentAt: Date;
};

export const Message: React.FC<MessageProps> = ({
  align = "left",
  senderAddress,
  content,
  sentAt,
}) => {
  return (
    <Flex justify={align === "left" ? "flex-start" : "flex-end"}>
      <Paper p="md" withBorder shadow="md" maw="90%" className={classes.root}>
        <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
          <Flex
            align="center"
            gap="xs"
            direction={align === "left" ? "row" : "row-reverse"}
            justify={align === "left" ? "flex-start" : "flex-end"}>
            <Text size="sm" fw={700}>
              {shortAddress(senderAddress)}
            </Text>
            <Text size="sm" c="dimmed">
              {intlFormat(sentAt, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Flex>
          <MessageContent content={content} />
        </Stack>
      </Paper>
    </Flex>
  );
};
