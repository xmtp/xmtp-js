import { LoadingOverlay } from "@mantine/core";
import type { Conversation as XmtpConversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { useActions } from "@/stores/inbox/hooks";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { getConversation } = useActions();
  const [conversation, setConversation] = useState<
    XmtpConversation<ContentTypes> | undefined
  >(undefined);

  useEffect(() => {
    if (conversationId) {
      const conversation = getConversation(conversationId);
      if (conversation) {
        setConversation(conversation);
      } else {
        void navigate("/conversations");
      }
    }
  }, [conversationId]);

  return conversation ? (
    <Conversation conversationId={conversation.id} />
  ) : (
    <CenteredLayout>
      <LoadingOverlay visible />
    </CenteredLayout>
  );
};
