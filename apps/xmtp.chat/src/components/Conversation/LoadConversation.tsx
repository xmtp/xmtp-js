import type { Dm, Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useConversations } from "@/hooks/useConversations";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [loading, setLoading] = useState(true);
  const { getConversationById } = useConversations();
  const [conversation, setConversation] = useState<Group | Dm | undefined>(
    undefined,
  );

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        const conversation = await getConversationById(conversationId);
        if (conversation) {
          setConversation(conversation);
          setLoading(false);
        } else {
          void navigate("/conversations");
        }
      }
    };
    void loadConversation();
  }, [conversationId]);

  return <Conversation conversation={conversation} loading={loading} />;
};
