import { LoadingOverlay } from "@mantine/core";
import { Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ManageGroup } from "@/components/Conversation/ManageGroup";
import { useConversations } from "@/hooks/useConversations";

export const LoadGroupToManage: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { getConversationById, loading } = useConversations();
  const [group, setGroup] = useState<Group | undefined>(undefined);

  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        const conversation = await getConversationById(conversationId);
        if (conversation instanceof Group) {
          setGroup(conversation);
        } else {
          void navigate(`/conversations/${conversationId}`);
        }
      }
    };
    void loadConversation();
  }, [conversationId]);

  return !group ? (
    <LoadingOverlay visible={loading} />
  ) : (
    <ManageGroup group={group} />
  );
};
