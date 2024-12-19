import { Conversation as XmtpConversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useBodyClass } from "../hooks/useBodyClass";
import { useClient } from "../hooks/useClient";
import { Conversation } from "./Conversation";

export const LoadConversation: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { conversationId } = useParams();
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    XmtpConversation | undefined
  >(undefined);

  useEffect(() => {
    const loadConversation = async () => {
      if (client && conversationId) {
        setLoading(true);
        const data =
          await client.conversations.getConversationById(conversationId);
        if (data) {
          setConversation(new XmtpConversation(client, conversationId, data));
        }
        setLoading(false);
      }
    };
    void loadConversation();
  }, [client, conversationId]);

  return <Conversation conversation={conversation} loading={loading} />;
};
