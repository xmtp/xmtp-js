import { Flex, ScrollArea, Stack, Text } from "@mantine/core";
import "./Conversation.css";
import { useBodyClass } from "../hooks/useBodyClass";
import { Composer } from "./Composer";
import classes from "./Conversation.module.css";
import { Message } from "./Message";

export type ConversationProps = {
  id: string;
};

export const Conversation: React.FC<ConversationProps> = ({ id }) => {
  useBodyClass("conversation-layout");

  return (
    <Stack
      style={{
        overflow: "hidden",
        margin: "calc(var(--mantine-spacing-md) * -1)",
      }}
      gap="lg">
      <Flex align="center" gap="xs" justify="space-between" p="md">
        <Text size="lg" fw={700}>
          Conversation name goes here
        </Text>
        {/* TODO: Add conversation actions: view props, edit metadata, permissions */}
        {/* TODO: Add members action: add/remove members, view admins and super admins */}
      </Flex>
      <ScrollArea type="scroll" className={classes.root}>
        <Stack gap="lg" p="md">
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            align="right"
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            align="right"
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            align="right"
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            align="right"
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
          <Message
            align="right"
            senderAddress="0x6B3Fd2B8481bDB805CeF2a86503229e7c5866Dd3"
            content="Hello"
            sentAt={new Date()}
          />
        </Stack>
      </ScrollArea>
      <Composer />
    </Stack>
  );
};
