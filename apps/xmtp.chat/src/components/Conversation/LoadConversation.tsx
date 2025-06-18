import { LoadingOverlay } from "@mantine/core";
import type { Dm, Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useConversations } from "@/hooks/useConversations";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { getConversationById } = useConversations();
  const [conversation, setConversation] = useState<
    Group<ContentTypes> | Dm<ContentTypes> | undefined
  >(undefined);

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        const conversation = await getConversationById(conversationId);
        if (conversation) {
          setConversation(conversation);
        } else {
          void navigate("/conversations");
        }
      }
    };
    void loadConversation();
  }, [conversationId]);

  return conversation ? (
    <Conversation conversation={conversation} />
  ) : (
    <CenteredLayout>
      <LoadingOverlay visible />
    </CenteredLayout>
  );
};
