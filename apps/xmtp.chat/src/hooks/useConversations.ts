import type {
  Conversation,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@xmtp/browser-sdk";
import { useState, useCallback } from "react";
import { useXMTP, type ContentTypes } from "@/contexts/XMTPContext";

export const useConversations = () => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [conversations, setConversations] = useState<
    Conversation<ContentTypes>[]
  >([]);
  const [conversationsCount, setConversationsCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  if (!client) {
    throw new Error("XMTP client not initialized");
  }

  const sync = useCallback(async () => {
    setSyncing(true);

    try {
      await client.conversations.sync();
    } finally {
      setSyncing(false);
    }
  }, [client]);

  const list = useCallback(async (
    options?: SafeListConversationsOptions,
    syncFromNetwork: boolean = false,
    reset: boolean = true,
  ) => {
    if (syncFromNetwork) {
      await sync();
    }

    setLoading(true);

    try {
      const convos = await client.conversations.list(options);
      
      if (reset) {
        setConversations(convos);
        // Получаем общее количество разговоров при первой загрузке
        if (!options?.limit) {
          setConversationsCount(convos.length);
        } else {
          // Если загружаем с лимитом, получаем общее количество отдельно
          // Но только если conversationsCount еще не установлен
          if (conversationsCount === 0) {
            try {
              const allConvos = await client.conversations.list();
              setConversationsCount(allConvos.length);
            } catch (error) {
              console.warn('Failed to get total conversations count:', error);
              // Fallback: используем текущее количество
              setConversationsCount(convos.length);
            }
          }
        }
      } else {
        setConversations((prev: Conversation<ContentTypes>[]) => [...prev, ...convos]);
      }
      
      // Проверяем, есть ли еще данные для загрузки
      if (options?.limit) {
        const limit = Number(options.limit);
        setHasMore(convos.length === limit);
      } else {
        setHasMore(false);
      }
      
      return convos;
    } finally {
      setLoading(false);
    }
  }, [client, conversationsCount, sync]);

  const loadMore = useCallback(async (limit: number = 20) => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const options: SafeListConversationsOptions = {
        limit: BigInt(limit),
        createdBeforeNs: conversations.length > 0 
          ? conversations[conversations.length - 1].createdAtNs 
          : undefined,
      };
      
      const convos = await client.conversations.list(options);
      
      if (convos.length > 0) {
        setConversations((prev: Conversation<ContentTypes>[]) => [...prev, ...convos]);
        setHasMore(convos.length === limit);
      } else {
        setHasMore(false);
      }
      
      return convos;
    } catch (error) {
      console.error('Failed to load more conversations:', error);
      setHasMore(false);
      return [];
    } finally {
      setLoadingMore(false);
    }
  }, [client, conversations, hasMore, loadingMore]);

  const resetPagination = useCallback(() => {
    setConversations([]);
    setConversationsCount(0);
    setHasMore(true);
    setLoadingMore(false);
  }, []);

  const syncAll = useCallback(async () => {
    setSyncing(true);

    try {
      await client.conversations.syncAll();
    } finally {
      setSyncing(false);
    }
  }, [client]);

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
    inboxIds: string[],
    options?: SafeCreateGroupOptions,
  ) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.newGroup(
        inboxIds,
        options,
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newGroupWithIdentifiers = async (
    identifiers: Identifier[],
    options?: SafeCreateGroupOptions,
  ) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(
        identifiers,
        options,
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDm = async (inboxId: string) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.newDm(inboxId);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDmWithIdentifier = async (identifier: Identifier) => {
    setLoading(true);

    try {
      const conversation =
        await client.conversations.newDmWithIdentifier(identifier);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const stream = useCallback(async () => {
    const onValue = (conversation: Conversation<ContentTypes>) => {
      const shouldAdd =
        conversation.metadata?.conversationType === "dm" ||
        conversation.metadata?.conversationType === "group";
      if (shouldAdd) {
        setConversations((prev: Conversation<ContentTypes>[]) => [conversation, ...prev]);
      }
    };

    const stream = await client.conversations.stream({
      onValue,
    });

    return () => {
      void stream.end();
    };
  }, [client]);

  return {
    conversations,
    conversationsCount,
    hasMore,
    loadingMore,
    getConversationById,
    getMessageById,
    list,
    loadMore,
    loading,
    newDm,
    newDmWithIdentifier,
    newGroup,
    newGroupWithIdentifiers,
    resetPagination,
    stream,
    sync,
    syncAll,
    syncing,
  };
};
