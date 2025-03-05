import {
  Button,
  Flex,
  Group,
  LoadingOverlay,
  NativeSelect,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ConsentState, Dm, Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useEffect, useState, type ChangeEvent } from "react";
import { Link, Outlet } from "react-router";
import { Messages } from "@/components/Messages/Messages";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useConversation } from "@/hooks/useConversation";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversation?: XmtpGroup | Dm;
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
    streamMessages,
  } = useConversation(conversation);
  const [consentState, setConsentState] = useState<ConsentState>(
    ConsentState.Unknown,
  );
  const [consentStateLoading, setConsentStateLoading] = useState(false);

  useEffect(() => {
    if (conversation instanceof Dm) {
      const loadConsentState = async () => {
        const consentState = await conversation.consentState();
        setConsentState(consentState);
      };
      void loadConsentState();
    }
  }, [conversation?.id]);

  const handleConsentStateChange = async (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    if (conversation instanceof Dm) {
      const currentValue = consentState;
      const newValue = parseInt(event.currentTarget.value, 10) as ConsentState;
      setConsentState(newValue);
      setConsentStateLoading(true);
      try {
        await conversation.updateConsentState(newValue);
      } catch {
        setConsentState(currentValue);
      } finally {
        setConsentStateLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadMessages = async () => {
      await getMessages();
    };
    void loadMessages();
  }, [conversation?.id]);

  const handleSync = async () => {
    await getMessages(undefined, true);
  };

  useEffect(() => {
    let stopStream = () => {};
    const startStream = async () => {
      stopStream = await streamMessages();
    };
    void startStream();
    return () => {
      stopStream();
    };
  }, [conversation?.id]);

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
              {conversation instanceof XmtpGroup ? (
                <Title order={3}>{conversation.name}</Title>
              ) : (
                <Text size="lg" fw={700} c="dimmed">
                  Direct message
                </Text>
              )}
              <Group gap="xs">
                {conversation instanceof XmtpGroup && (
                  <Button component={Link} to="manage">
                    Manage
                  </Button>
                )}
                {conversation instanceof Dm && (
                  <Group gap="md" align="center" wrap="nowrap">
                    <Text flex="1 1 40%">Consent state</Text>
                    <NativeSelect
                      size="sm"
                      disabled={consentStateLoading}
                      value={consentState}
                      onChange={(event) => {
                        void handleConsentStateChange(event);
                      }}
                      data={[
                        { value: "0", label: "Unknown" },
                        { value: "1", label: "Allowed" },
                        { value: "2", label: "Denied" },
                      ]}
                    />
                  </Group>
                )}
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
                <Messages messages={messages} />
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
