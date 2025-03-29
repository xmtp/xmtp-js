import type { Dm, Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useConversations } from "@/hooks/useConversations";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  const { conversationId } = useParams();
  const { getConversationById, loading } = useConversations();
  const [conversation, setConversation] = useState<Group | Dm | undefined>(
    undefined,
  );

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
