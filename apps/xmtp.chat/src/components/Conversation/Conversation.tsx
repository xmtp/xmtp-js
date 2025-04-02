import { Group } from "@mantine/core";
import {
  Group as XmtpGroup,
  type Client,
  type Conversation as XmtpConversation,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useOutletContext } from "react-router";
import { ConversationMenu } from "@/components/Conversation/ConversationMenu";
import { Messages } from "@/components/Messages/Messages";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import { Composer } from "./Composer";

export type ConversationProps = {
  conversation: XmtpConversation;
};

export const Conversation: React.FC<ConversationProps> = ({ conversation }) => {
  const { client } = useOutletContext<{ client: Client }>();
  const [title, setTitle] = useState("");
  const {
    messages,
    getMessages,
    loading: conversationLoading,
    syncing: conversationSyncing,
    streamMessages,
  } = useConversation(conversation);
  const stopStreamRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(async () => {
    stopStreamRef.current = await streamMessages();
  }, [streamMessages]);

  const stopStream = useCallback(() => {
    stopStreamRef.current?.();
    stopStreamRef.current = null;
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      stopStream();
      await getMessages(undefined, true);
      await startStream();
    };
    void loadMessages();
  }, [conversation.id]);

  const handleSync = useCallback(async () => {
    stopStream();
    await getMessages(undefined, true);
    await startStream();
    if (conversation instanceof XmtpGroup) {
      setTitle(conversation.name || "Untitled");
    }
  }, [getMessages, conversation.id, startStream, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (conversation instanceof XmtpGroup) {
      setTitle(conversation.name || "Untitled");
    } else {
      setTitle("Direct message");
    }
  }, [conversation.id]);

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const sendMessage = conversation.send;

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
        <Messages messages={messages} sendMessage={sendMessage} />
      </ContentLayout>
      <Outlet context={{ conversation, client }} />
    </>
  );
};
