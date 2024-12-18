import type { Conversation, SafeListMessagesOptions } from "@xmtp/browser-sdk";
import { useState } from "react";
import { useClient } from "./useClient";

export const useMessages = (conversation?: Conversation) => {
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getMessages = async (
    options?: SafeListMessagesOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (client && conversation) {
      if (syncFromNetwork) {
        await sync();
      }
      setLoading(true);
      const msgs = await conversation.messages(options);
      setLoading(false);
      return msgs;
    }
  };

  const sync = async () => {
    if (client && conversation) {
      setSyncing(true);
      await conversation.sync();
      setSyncing(false);
    }
  };

  return { sync, loading, syncing, getMessages };
};
