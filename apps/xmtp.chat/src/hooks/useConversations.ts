import {
  ConversationType,
  type Conversation,
  type CreateGroupOptions,
  type DecodedMessage,
  type Identifier,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { useClient, type ContentTypes } from "@/contexts/XMTPContext";
import { dateToNs } from "@/helpers/date";
import {
  useActions,
  useConversations as useConversationsState,
  useLastCreatedAt,
} from "@/stores/inbox/hooks";

export const useConversations = () => {
  const client = useClient();
  const { addConversations, addConversation, addMessage, setLastSyncedAt } =
    useActions();
  const conversations = useConversationsState();
  const lastCreatedAt = useLastCreatedAt();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refreshConversationsList = async () => {
    setLoading(true);
    try {
      const convos = await client.conversations.list({
        createdAfterNs: lastCreatedAt,
      });
      await addConversations(convos);
      setLastSyncedAt(dateToNs(new Date()));
      return convos;
    } finally {
      setLoading(false);
    }
  };

  const sync = async (fromNetwork: boolean = false) => {
    if (fromNetwork) {
      setSyncing(true);

      try {
        await client.conversations.sync();
      } finally {
        setSyncing(false);
      }
    }

    await refreshConversationsList();
  };

  const syncAll = async () => {
    setSyncing(true);

    try {
      await client.conversations.syncAll();
    } finally {
      setSyncing(false);
    }

    await refreshConversationsList();
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

  const getDmByInboxId = async (inboxId: string) => {
    setLoading(true);

    try {
      const dm = await client.conversations.getDmByInboxId(inboxId);
      return dm;
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

  const createGroup = async (
    inboxIds: string[],
    options?: CreateGroupOptions,
  ) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.createGroup(
        inboxIds,
        options,
      );
      void addConversation(conversation);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const createGroupWithIdentifiers = async (
    identifiers: Identifier[],
    options?: CreateGroupOptions,
  ) => {
    setLoading(true);

    try {
      const conversation =
        await client.conversations.createGroupWithIdentifiers(
          identifiers,
          options,
        );
      void addConversation(conversation);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const createDm = async (inboxId: string) => {
    setLoading(true);

    try {
      const conversation = await client.conversations.createDm(inboxId);
      void addConversation(conversation);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const createDmWithIdentifier = async (identifier: Identifier) => {
    setLoading(true);

    try {
      const conversation =
        await client.conversations.createDmWithIdentifier(identifier);
      void addConversation(conversation);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const stream = async () => {
    const onValue = (conversation: Conversation<ContentTypes>) => {
      const shouldAdd =
        conversation.metadata?.conversationType === ConversationType.Dm ||
        conversation.metadata?.conversationType === ConversationType.Group;
      if (shouldAdd) {
        void addConversation(conversation);
      }
    };

    const stream = await client.conversations.stream({
      onValue,
    });

    return () => {
      void stream.end();
    };
  };

  const streamAllMessages = async () => {
    const onValue = (message: DecodedMessage<ContentTypes>) => {
      void addMessage(message.conversationId, message);
    };

    const stream = await client.conversations.streamAllMessages({
      onValue,
    });

    return () => {
      void stream.end();
    };
  };

  return {
    conversations,
    getConversationById,
    getDmByInboxId,
    getMessageById,
    loading,
    createDm,
    createDmWithIdentifier,
    createGroup,
    createGroupWithIdentifiers,
    stream,
    streamAllMessages,
    sync,
    syncAll,
    syncing,
  };
};
