import type {
  Conversation,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { useXMTP } from "@/contexts/XMTPContext";

export const useConversations = () => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  if (!client) {
    throw new Error("XMTP client not initialized");
  }

  const list = async (
    options?: SafeListConversationsOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (syncFromNetwork) {
      await sync();
    }

    setLoading(true);

    try {
      const convos = await client.conversations.list(options);
      setConversations(convos);
      return convos;
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);

    try {
      await client.conversations.sync();
    } finally {
      setSyncing(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);

    try {
      await client.conversations.syncAll();
    } finally {
      setSyncing(false);
    }
  };

  const getConversationById = async (conversationId: string) => {
    setLoading(true);

    try {
      const conversation =
        await client.conversations.getConversationById(conversationId);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const getMessageById = async (messageId: string) => {
    setLoading(true);

    try {
      const message = await client.conversations.getMessageById(messageId);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const newGroup = async (
    members: string[],
    options: SafeCreateGroupOptions,
  ) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(
        members.map((member) => ({
          identifier: member.toLowerCase(),
          identifierKind: "Ethereum",
        })),
        options,
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDm = async (member: string) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.newDmWithIdentifier({
        identifier: member.toLowerCase(),
        identifierKind: "Ethereum",
      });
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const stream = async () => {
    const onConversation = (
      error: Error | null,
      conversation: Conversation | undefined,
    ) => {
      if (conversation) {
        setConversations((prev) => [conversation, ...prev]);
      }
    };

    const stream = await client.conversations.stream(onConversation);

    return () => {
      void stream.return(undefined);
    };
  };

  return {
    conversations,
    getConversationById,
    getMessageById,
    list,
    loading,
    newDm,
    newGroup,
    stream,
    sync,
    syncAll,
    syncing,
  };
};
