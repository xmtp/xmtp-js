import { Group } from "@mantine/core";
import {
  Group as XmtpGroup,
  type Conversation as XmtpConversation,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo } from "react";
import { Outlet } from "react-router";
import { ConversationMenu } from "@/components/Conversation/ConversationMenu";
import { Messages } from "@/components/Messages/Messages";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversation: XmtpConversation;
};

export const Conversation: React.FC<ConversationProps> = ({ conversation }) => {
  const {
    messages,
    getMessages,
    loading: conversationLoading,
    syncing: conversationSyncing,
    streamMessages,
  } = useConversation(conversation);

  useEffect(() => {
    const loadMessages = async () => {
      await getMessages(undefined, true);
    };
    void loadMessages();
  }, [conversation.id]);

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
  }, [conversation.id]);

  const title = useMemo(() => {
    if (conversation instanceof XmtpGroup) {
      return conversation.name || "Untitled";
    }
    return "Direct message";
  }, [conversation]);

  return (
    <>
      <ContentLayout
        title={title}
        loading={conversationLoading}
        headerActions={
          <Group gap="xs">
            <ConversationMenu
              type={conversation instanceof XmtpGroup ? "group" : "dm"}
              onSync={() => void handleSync()}
              disabled={conversationSyncing}
            />
          </Group>
        }
        footer={<Composer conversation={conversation} />}
        withScrollArea={false}>
        <Messages messages={messages} />
      </ContentLayout>
      <Outlet context={conversation} />
    </>
  );
};
