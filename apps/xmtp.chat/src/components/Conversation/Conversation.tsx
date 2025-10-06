import { Group } from "@mantine/core";
import { Group as XmtpGroup, type Client } from "@xmtp/browser-sdk";
import { useCallback, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router";
import { ConversationMenu } from "@/components/Conversation/ConversationMenu";
import { Messages } from "@/components/Messages/Messages";
import { ConversationProvider } from "@/contexts/ConversationContext";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversationId: string;
};

export const Conversation: React.FC<ConversationProps> = ({
  conversationId,
}) => {
  const { client } = useOutletContext<{ client: Client<ContentTypes> }>();
  const {
    conversation,
    name,
    sync,
    loading: conversationLoading,
    messages,
    syncing: conversationSyncing,
  } = useConversation(conversationId);

  useEffect(() => {
    const loadMessages = async () => {
      await sync(true);
    };
    void loadMessages();
  }, [conversationId]);

  const handleSync = useCallback(async () => {
    await sync(true);
  }, [sync, conversationId]);

  return (
    <>
      <ConversationProvider
        key={conversationId}
        conversationId={conversationId}>
        <ContentLayout
          title={name || "Untitled"}
          loading={messages.length === 0 && conversationLoading}
          headerActions={
            <Group gap="xs">
              <ConversationMenu
                type={conversation instanceof XmtpGroup ? "group" : "dm"}
                onSync={() => void handleSync()}
                disabled={conversationSyncing}
              />
            </Group>
          }
          footer={<Composer conversationId={conversationId} />}
          withScrollArea={false}>
          <Messages messages={messages} />
        </ContentLayout>
      </ConversationProvider>
      <Outlet context={{ conversation, client }} />
    </>
  );
};
