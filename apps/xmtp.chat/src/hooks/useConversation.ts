import type {
  Conversation,
  DecodedMessage,
  SafeListMessagesOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { ClientNotFoundError } from "../helpers/errors";
import { useClient } from "./useClient";

export const useConversation = (conversation?: Conversation) => {
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);

  const getMessages = async (
    options?: SafeListMessagesOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (!client) {
      throw new ClientNotFoundError("fetching messages");
    }

    if (syncFromNetwork) {
      await sync();
    }

    setLoading(true);

    try {
      const msgs = (await conversation?.messages(options)) ?? [];
      setMessages(msgs);
      return msgs;
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!client) {
      throw new ClientNotFoundError("syncing messages");
    }

    setSyncing(true);

    try {
      await conversation?.sync();
    } finally {
      setSyncing(false);
    }
  };

  const send = async (message: string) => {
    if (!client) {
      throw new ClientNotFoundError("sending message");
    }

    setSending(true);

    try {
      await conversation?.send(message);
    } finally {
      setSending(false);
    }
  };

  return { sync, loading, syncing, getMessages, send, sending, messages };
};
