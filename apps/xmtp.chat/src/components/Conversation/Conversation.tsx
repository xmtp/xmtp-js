import { Group, NativeSelect, Text } from "@mantine/core";
import { ConsentState, Dm, Group as XmtpGroup } from "@xmtp/browser-sdk";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { Outlet } from "react-router";
import { ConversationMenu } from "@/components/Conversation/ConversationMenu";
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

  const handleConsentStateChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      if (conversation instanceof Dm) {
        const currentValue = consentState;
        const newValue = parseInt(
          event.currentTarget.value,
          10,
        ) as ConsentState;
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
    },
    [conversation?.id],
  );

  useEffect(() => {
    const loadMessages = async () => {
      await getMessages(undefined, true);
    };
    void loadMessages();
  }, [conversation?.id]);

  const handleSync = useCallback(async () => {
    await getMessages(undefined, true);
  }, [getMessages]);

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
            <ConversationMenu
              type={conversation instanceof XmtpGroup ? "group" : "dm"}
              onSync={() => void handleSync()}
              disabled={conversationSyncing}
            />
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
