import {
  type Conversation,
  type DecodedMessage,
  type SafeGroupMember,
} from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { useStore } from "zustand";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { inboxStore, type ConversationMetadata } from "@/stores/inbox/store";

const EMPTY_METADATA: ConversationMetadata = {};
const EMPTY_MEMBERS = new Map<string, SafeGroupMember>();
const EMPTY_MESSAGES: DecodedMessage<ContentTypes>[] = [];

export const useConversation = (
  conversationId: string,
): Conversation<ContentTypes> | undefined => {
  return useStore(inboxStore, (state) => state.getConversation(conversationId));
};

export const useMetadata = (conversationId: string) => {
  return useStore(
    inboxStore,
    (state) => state.metadata.get(conversationId) ?? EMPTY_METADATA,
  );
};

export const useMembers = (conversationId: string) => {
  return useStore(
    inboxStore,
    (state) => state.members.get(conversationId) ?? EMPTY_MEMBERS,
  );
};

export const useConversations = () => {
  return useStore(inboxStore, (state) => state.sortedConversations);
};

export const useLastCreatedAt = () => {
  return useStore(inboxStore, (state) => state.lastCreatedAt);
};

export const useMessage = (conversationId: string, messageId: string) => {
  return useStore(inboxStore, (state) =>
    state.getMessage(conversationId, messageId),
  );
};

export const useMessageCount = () => {
  const messages = useStore(inboxStore, (state) => state.sortedMessages);
  return useMemo(() => {
    const count = Array.from(messages.keys()).reduce((acc, conversationId) => {
      const count = messages.get(conversationId)?.length ?? 0;
      return acc + count;
    }, 0);
    return count;
  }, [messages]);
};

export const useMessages = (conversationId: string) => {
  return useStore(
    inboxStore,
    (state) => state.sortedMessages.get(conversationId) ?? EMPTY_MESSAGES,
  );
};

export const useLastSentAt = (conversationId: string) => {
  return useStore(inboxStore, (state) => state.lastSentAt.get(conversationId));
};

export const useLastSyncedAt = () => {
  return useStore(inboxStore, (state) => state.lastSyncedAt);
};

export const usePermissions = (conversationId: string) => {
  return useStore(inboxStore, (state) => state.permissions.get(conversationId));
};

export const useActions = () => {
  const addConversation = useStore(
    inboxStore,
    (state) => state.addConversation,
  );
  const addConversations = useStore(
    inboxStore,
    (state) => state.addConversations,
  );
  const getConversation = useStore(
    inboxStore,
    (state) => state.getConversation,
  );
  const hasConversation = useStore(
    inboxStore,
    (state) => state.hasConversation,
  );
  const addMessage = useStore(inboxStore, (state) => state.addMessage);
  const addMessages = useStore(inboxStore, (state) => state.addMessages);
  const getMessage = useStore(inboxStore, (state) => state.getMessage);
  const getMessages = useStore(inboxStore, (state) => state.getMessages);
  const hasMessage = useStore(inboxStore, (state) => state.hasMessage);
  const setLastSyncedAt = useStore(
    inboxStore,
    (state) => state.setLastSyncedAt,
  );
  const syncPermissions = useStore(
    inboxStore,
    (state) => state.syncPermissions,
  );
  const syncMembers = useStore(inboxStore, (state) => state.syncMembers);
  const reset = useStore(inboxStore, (state) => state.reset);

  return {
    addConversation,
    addConversations,
    getConversation,
    hasConversation,
    addMessage,
    addMessages,
    getMessage,
    getMessages,
    hasMessage,
    setLastSyncedAt,
    syncPermissions,
    syncMembers,
    reset,
  };
};
