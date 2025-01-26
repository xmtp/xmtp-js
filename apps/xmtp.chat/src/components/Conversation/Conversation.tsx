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
import type { Conversation as XmtpConversation } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { Link, Outlet } from "react-router";
import { Messages } from "@/components/Messages/Messages";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useConversation } from "@/hooks/useConversation";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversation?: XmtpConversation;
  loading: boolean;
};

export const Conversation: React.FC<ConversationProps> = ({
  conversation,
  loading,
}) => {
  useBodyClass("main-flex-layout");
  const {
    messages,
    getMessages,
    loading: conversationLoading,
    syncing: conversationSyncing,
  } = useConversation(conversation);

  useEffect(() => {
    const loadMessages = async () => {
      await getMessages();
    };
    void loadMessages();
  }, [conversation?.id]);

  const handleSync = async () => {
    await getMessages(undefined, true);
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
                <Button
                  loading={conversationSyncing}
                  onClick={() => void handleSync()}>
                  Sync
                </Button>
              </Group>
            </Flex>
            <Stack flex={1} style={{ overflow: "hidden" }}>
              {loading || conversationLoading || messages.length === 0 ? (
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
                <ScrollArea type="scroll" className="scrollfade">
                  <Messages messages={messages} />
                </ScrollArea>
              )}
            </Stack>
            <Composer conversation={conversation} />
            <LoadingOverlay visible={loading || conversationLoading} />
          </>
        )}
      </Stack>
      <Outlet />
    </>
  );
};
