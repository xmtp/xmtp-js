import type { Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClient } from "./useClient";

export const useConversations = () => {
  const { client } = useClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (client) {
      void client.conversations.sync().then(() => {
        void client.conversations.list().then(setConversations);
      });
    }
  }, [client]);

  const sync = async () => {
    if (client) {
      await client.conversations.sync();
      const convos = await client.conversations.list();
      setConversations(convos);
    }
  };

  return { conversations, sync };
};
