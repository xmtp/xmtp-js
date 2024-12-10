import type { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClient } from "./useClient";

export const useMessages = (conversation: Conversation) => {
  const { client } = useClient();
  const [messages, setMessages] = useState<DecodedMessage[]>([]);

  useEffect(() => {
    if (client) {
      void conversation.sync().then(() => {
        void conversation.messages().then(setMessages);
      });
    }
  }, [client]);

  const sync = async () => {
    if (client) {
      await conversation.sync();
      const msgs = await conversation.messages();
      setMessages(msgs);
    }
  };

  return { messages, sync };
};
