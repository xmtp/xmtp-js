import { LoadingOverlay } from "@mantine/core";
import type { Conversation as XmtpConversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { useActions, useLastSyncedAt } from "@/stores/inbox/hooks";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  const navigate = useNavigate();
  const { environment } = useSettings();
  const { conversationId } = useParams();
  const lastSyncedAt = useLastSyncedAt();
  const { getConversation } = useActions();
  const [conversation, setConversation] = useState<
    XmtpConversation<ContentTypes> | undefined
  >(undefined);

  useEffect(() => {
    // wait for initial sync to complete
    if (lastSyncedAt && conversationId) {
      const conversation = getConversation(conversationId);
      if (conversation) {
        setConversation(conversation);
      } else {
        void navigate(`/${environment}/conversations`);
      }
    }
  }, [conversationId, lastSyncedAt, environment]);

  return conversation ? (
    <Conversation conversationId={conversation.id} />
  ) : (
    <CenteredLayout>
      <LoadingOverlay visible />
    </CenteredLayout>
  );
};
