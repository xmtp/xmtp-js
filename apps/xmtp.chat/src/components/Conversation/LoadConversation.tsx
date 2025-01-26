import type { Conversation as XmtpConversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useConversations } from "@/hooks/useConversations";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { conversationId } = useParams();
  const { getConversationById, loading } = useConversations();
  const [conversation, setConversation] = useState<
    XmtpConversation | undefined
  >(undefined);

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        const conversation = await getConversationById(conversationId);
        if (conversation) {
          setConversation(conversation);
        }
      }
    };
    void loadConversation();
  }, [conversationId]);

  return <Conversation conversation={conversation} loading={loading} />;
};
