import {
  Button,
  Flex,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type {
  DecodedMessage,
  Conversation as XmtpConversation,
} from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { useBodyClass } from "../hooks/useBodyClass";
import { useMessages } from "../hooks/useMessages";
import { Composer } from "./Composer";
import { Messages } from "./Messages";
import classes from "./ScrollFade.module.css";

export type ConversationProps = {
  conversation?: XmtpConversation;
  loading: boolean;
};

export const Conversation: React.FC<ConversationProps> = ({
  conversation,
  loading,
}) => {
  useBodyClass("main-flex-layout");
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const { getMessages, loading: messagesLoading } = useMessages(conversation);

  useEffect(() => {
    const loadMessages = async () => {
      const messages = await getMessages();
      setMessages(messages ?? []);
    };
    void loadMessages();
  }, [conversation?.id]);

  const handleSync = async () => {
    const messages = await getMessages(undefined, true);
    setMessages(messages ?? []);
  };

  return (
    <>
      <Stack
        style={{
          overflow: "hidden",
          margin: "calc(var(--mantine-spacing-md) * -1)",
        }}
        pos="relative"
        gap="lg"
        flex={1}>
        {conversation && (
          <>
            <Flex align="center" gap="xs" justify="space-between" p="md">
              {conversation.name ? (
                <Title order={3}>{conversation.name}</Title>
              ) : (
                <Text size="lg" fw={700} c="dimmed">
                  Untitled
                </Text>
              )}
              <Group gap="xs">
                <Button component={Link} to="manage">
                  Manage
                </Button>
                <Button onClick={() => void handleSync()}>Sync</Button>
              </Group>
            </Flex>
            <Stack flex={1} style={{ overflow: "hidden" }}>
              {loading || messagesLoading || messages.length === 0 ? (
                <Stack
                  style={{
                    margin: "calc(var(--mantine-spacing-md) * -1)",
                  }}
                  flex={1}
                  align="center"
                  justify="center">
                  {messages.length === 0 && <Text>No messages</Text>}
                </Stack>
              ) : (
                <ScrollArea type="scroll" className={classes.root}>
                  <Messages messages={messages} />
                </ScrollArea>
              )}
            </Stack>
            <Composer conversation={conversation} />
            <LoadingOverlay visible={loading || messagesLoading} />
          </>
        )}
      </Stack>
      <Outlet />
    </>
  );
};
