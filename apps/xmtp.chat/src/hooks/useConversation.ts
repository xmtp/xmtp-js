import type {
  Conversation,
  DecodedMessage,
  SafeListMessagesOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { useXMTP, type ContentTypes } from "@/contexts/XMTPContext";

export const useConversation = (conversation?: Conversation<ContentTypes>) => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DecodedMessage<ContentTypes>[]>([]);

  const getMessages = async (
    options?: SafeListMessagesOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (!client) {
      return;
    }

    setMessages([]);
    setLoading(true);

    if (syncFromNetwork) {
      await sync();
    }

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
      return;
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
      return;
    }

    setSending(true);

    try {
      await conversation?.send(message);
    } finally {
      setSending(false);
    }
  };

  const streamMessages = async () => {
    const noop = () => {};
    if (!client) {
      return noop;
    }

    const onMessage = (
      error: Error | null,
      message: DecodedMessage<ContentTypes> | undefined,
    ) => {
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const stream = await conversation?.stream(onMessage);

    return stream
      ? () => {
          void stream.return(undefined);
        }
      : noop;
  };

  return {
    getMessages,
    loading,
    messages,
    send,
    sending,
    streamMessages,
    sync,
    syncing,
  };
};
