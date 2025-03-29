import { Button, Group, NativeSelect, Text } from "@mantine/core";
import { ConsentState, Dm, Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, Outlet } from "react-router";
import { Messages } from "@/components/Messages/Messages";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversation?: XmtpGroup | Dm;
  loading: boolean;
};

export const Conversation: React.FC<ConversationProps> = ({
  conversation,
  loading,
}) => {
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
      await getMessages(undefined, true);
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

  const title = useMemo(() => {
    if (!conversation) {
      return "";
    }
    if (conversation instanceof XmtpGroup) {
      return conversation.name || "Untitled";
    }
    return "Direct message";
  }, [conversation]);

  return (
    <>
      <ContentLayout
        title={title}
        loading={loading || conversationLoading}
        headerActions={
          <Group gap="xs">
            {conversation instanceof XmtpGroup ? (
              <Button component={Link} to="manage">
                Manage
              </Button>
            ) : (
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
        }
        footer={conversation && <Composer conversation={conversation} />}
        withScrollArea={false}>
        <Messages messages={messages} />
      </ContentLayout>
      <Outlet />
    </>
  );
};
