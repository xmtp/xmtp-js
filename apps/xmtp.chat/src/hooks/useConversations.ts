import type { SafeListConversationsOptions } from "@xmtp/browser-sdk";
import { useState } from "react";
import { useClient } from "./useClient";

export const useConversations = () => {
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getConversations = async (
    options?: SafeListConversationsOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (client) {
      if (syncFromNetwork) {
        await sync();
      }
      setLoading(true);
      const convos = await client.conversations.list(options);
      setLoading(false);
      return convos;
    }
  };

  const sync = async () => {
    if (client) {
      setSyncing(true);
      await client.conversations.sync();
      setSyncing(false);
    }
  };

  return { sync, loading, syncing, getConversations };
};
