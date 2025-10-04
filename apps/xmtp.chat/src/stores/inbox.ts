import {
  Dm,
  Group,
  type Conversation,
  type DecodedMessage,
  type SafeGroupMember,
} from "@xmtp/browser-sdk";
import {
  ContentTypeGroupUpdated,
  type GroupUpdated,
} from "@xmtp/content-type-group-updated";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import type { ContentTypes } from "@/contexts/XMTPContext";

const getLastCreatedAt = (
  conversation: Conversation<ContentTypes>,
  lastCreatedAt?: bigint,
) => {
  return !lastCreatedAt ||
    (conversation.createdAtNs && conversation.createdAtNs > lastCreatedAt)
    ? conversation.createdAtNs
    : lastCreatedAt;
};

const isLastSentAt = (
  message: DecodedMessage<ContentTypes>,
  lastSentAt?: bigint,
) => {
  return !lastSentAt || message.sentAtNs > lastSentAt;
};

const sortConversations = (
  conversations: Map<string, Conversation<ContentTypes>>,
  lastMessages: Map<string, DecodedMessage<ContentTypes> | undefined>,
) => {
  const sortedConversations = Array.from(conversations.values()).sort(
    (a, b) => {
      const aLastMessage = lastMessages.get(a.id);
      const bLastMessage = lastMessages.get(b.id);
      const aVal = aLastMessage?.sentAtNs ?? a.createdAtNs ?? 0n;
      const bVal = bLastMessage?.sentAtNs ?? b.createdAtNs ?? 0n;
      return Number(bVal - aVal);
    },
  );
  return sortedConversations;
};

const sortMessages = (messages: Map<string, DecodedMessage<ContentTypes>>) => {
  const sortedMessages = Array.from(messages.values()).sort((a, b) => {
    return Number(a.sentAtNs - b.sentAtNs);
  });
  return sortedMessages;
};

export type ConversationMetadata = {
  name?: string;
  description?: string;
  imageUrl?: string;
};

export type InboxState = {
  conversations: Map<string, Conversation<ContentTypes>>;
  lastCreatedAt?: bigint;
  lastMessages: Map<string, DecodedMessage<ContentTypes> | undefined>;
  lastSentAt: Map<string, bigint | undefined>;
  members: Map<string, Map<string, SafeGroupMember>>;
  messages: Map<string, Map<string, DecodedMessage<ContentTypes>>>;
  metadata: Map<string, ConversationMetadata>;
  sortedConversations: Conversation<ContentTypes>[];
  sortedMessages: Map<string, DecodedMessage<ContentTypes>[]>;
};

export type InboxActions = {
  addConversation: (conversation: Conversation<ContentTypes>) => Promise<void>;
  addConversations: (
    conversations: Conversation<ContentTypes>[],
  ) => Promise<void>;
  getConversation: (id: string) => Conversation<ContentTypes> | undefined;
  hasConversation: (id: string) => boolean;
  addMessage: (
    conversationId: string,
    message: DecodedMessage<ContentTypes>,
  ) => Promise<void>;
  addMessages: (
    conversationId: string,
    messages: DecodedMessage<ContentTypes>[],
  ) => Promise<void>;
  getMessage: (
    conversationId: string,
    messageId: string,
  ) => DecodedMessage<ContentTypes> | undefined;
  getMessages: (conversationId: string) => DecodedMessage<ContentTypes>[];
  hasMessage: (conversationId: string, messageId: string) => boolean;
  reset: () => void;
};

export const inboxStore = createStore<InboxState & InboxActions>()(
  (set, get, store) => ({
    conversations: new Map(),
    lastMessages: new Map(),
    lastSentAt: new Map(),
    members: new Map(),
    messages: new Map(),
    metadata: new Map(),
    sortedConversations: [],
    sortedMessages: new Map(),
    addConversation: async (conversation: Conversation<ContentTypes>) => {
      const state = get();
      const members = await conversation.members();
      let peerInboxId: string | undefined;
      if (conversation instanceof Dm) {
        peerInboxId = await conversation.peerInboxId();
      }
      const lastMessage = await conversation.lastMessage();
      const newConversations = new Map(state.conversations);
      newConversations.set(conversation.id, conversation);
      const newMembers = new Map(state.members);
      newMembers.set(
        conversation.id,
        new Map(members.map((m) => [m.inboxId, m])),
      );
      const newMetadata = new Map(state.metadata);
      if (conversation instanceof Group) {
        newMetadata.set(conversation.id, {
          name: conversation.name,
          description: conversation.description,
          imageUrl: conversation.imageUrl,
        });
      } else if (conversation instanceof Dm) {
        newMetadata.set(conversation.id, {
          name: peerInboxId,
        });
      }
      const newLastMessages = new Map(state.lastMessages);
      newLastMessages.set(conversation.id, lastMessage);
      set({
        conversations: newConversations,
        lastCreatedAt: getLastCreatedAt(conversation, state.lastCreatedAt),
        lastMessages: newLastMessages,
        members: newMembers,
        metadata: newMetadata,
        sortedConversations: sortConversations(
          newConversations,
          newLastMessages,
        ),
      });
    },
    addConversations: async (conversations: Conversation<ContentTypes>[]) => {
      if (conversations.length === 0) {
        return;
      }
      const state = get();
      const allMembers = new Map<string, SafeGroupMember[]>(
        await Promise.all(
          conversations.map(
            async (conversation): Promise<[string, SafeGroupMember[]]> => [
              conversation.id,
              await conversation.members(),
            ],
          ),
        ),
      );
      const allPeerInboxIds = new Map<string, string>(
        (
          await Promise.all(
            conversations.map(
              async (conversation): Promise<[string, string | undefined]> => [
                conversation.id,
                conversation instanceof Dm
                  ? await conversation.peerInboxId()
                  : undefined,
              ],
            ),
          )
        ).filter((entry): entry is [string, string] => entry[1] !== undefined),
      );
      const allLastMessages = new Map<
        string,
        DecodedMessage<ContentTypes> | undefined
      >(
        await Promise.all(
          conversations.map(
            async (
              conversation,
            ): Promise<[string, DecodedMessage<ContentTypes> | undefined]> => [
              conversation.id,
              await conversation.lastMessage(),
            ],
          ),
        ),
      );
      const newConversations = new Map(state.conversations);
      const newMembers = new Map(state.members);
      const newMetadata = new Map(state.metadata);
      const newLastMessages = new Map(state.lastMessages);
      let lastCreatedAt = state.lastCreatedAt;

      for (const conversation of conversations) {
        newConversations.set(conversation.id, conversation);
        lastCreatedAt = getLastCreatedAt(conversation, lastCreatedAt);
        const members = allMembers.get(conversation.id) ?? [];
        newMembers.set(
          conversation.id,
          new Map(members.map((m) => [m.inboxId, m])),
        );
        if (conversation instanceof Group) {
          newMetadata.set(conversation.id, {
            name: conversation.name,
            description: conversation.description,
            imageUrl: conversation.imageUrl,
          });
        } else if (conversation instanceof Dm) {
          const peerInboxId = allPeerInboxIds.get(conversation.id);
          newMetadata.set(conversation.id, {
            name: peerInboxId,
          });
        }
        const lastMessage = allLastMessages.get(conversation.id);
        newLastMessages.set(conversation.id, lastMessage);
      }

      set({
        conversations: newConversations,
        lastCreatedAt,
        lastMessages: newLastMessages,
        members: newMembers,
        metadata: newMetadata,
        sortedConversations: sortConversations(
          newConversations,
          newLastMessages,
        ),
      });
    },
    getConversation: (id: string) => {
      return get().conversations.get(id);
    },
    hasConversation: (id: string) => {
      return get().conversations.has(id);
    },
    addMessage: async (
      conversationId: string,
      message: DecodedMessage<ContentTypes>,
    ) => {
      console.log("addMessage", conversationId, message);
      const state = get();
      const newMessagesState = new Map(state.messages);
      const conversationMessages =
        newMessagesState.get(conversationId) ||
        new Map<string, DecodedMessage<ContentTypes>>();
      const newMessages = new Map(conversationMessages);

      newMessages.set(message.id, message);
      newMessagesState.set(conversationId, newMessages);

      const newLastSentAt = new Map(state.lastSentAt);
      const newLastMessages = new Map(state.lastMessages);
      if (isLastSentAt(message, state.lastSentAt.get(conversationId))) {
        newLastSentAt.set(conversationId, message.sentAtNs);
        newLastMessages.set(conversationId, message);
      }

      const newSortedMessages = new Map(state.sortedMessages);
      newSortedMessages.set(conversationId, sortMessages(newMessages));

      const newMetadata = new Map(state.metadata);
      const newMembers = new Map(state.members);

      // check for updated members and metadata
      if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
        const groupUpdated = message.content as GroupUpdated;

        // member updates
        if (
          groupUpdated.addedInboxes.length > 0 ||
          groupUpdated.removedInboxes.length > 0
        ) {
          const conversation = state.conversations.get(message.conversationId);
          if (!conversation) {
            return;
          }
          const isActive = await conversation.isActive();
          // ensure group is active before syncing
          if (isActive) {
            await conversation.sync();
          }
          const members = await conversation.members();
          const updatedMembers = new Map(members.map((m) => [m.inboxId, m]));
          newMembers.set(message.conversationId, updatedMembers);
        }

        // metadata updates
        const metadataUpdates: ConversationMetadata = {};
        groupUpdated.metadataFieldChanges.forEach((change) => {
          switch (change.fieldName) {
            case "group_name":
              metadataUpdates.name = change.newValue;
              break;
            case "description":
              metadataUpdates.description = change.newValue;
              break;
            case "group_image_url_square":
              metadataUpdates.imageUrl = change.newValue;
              break;
          }
        });
        if (Object.keys(metadataUpdates).length > 0) {
          const existingMetadata = newMetadata.get(message.conversationId);
          newMetadata.set(message.conversationId, {
            ...existingMetadata,
            ...metadataUpdates,
          });
        }
      }

      set({
        lastMessages: newLastMessages,
        lastSentAt: newLastSentAt,
        members: newMembers,
        messages: newMessagesState,
        metadata: newMetadata,
        sortedConversations: sortConversations(
          state.conversations,
          newLastMessages,
        ),
        sortedMessages: newSortedMessages,
      });
    },
    addMessages: async (
      conversationId: string,
      messages: DecodedMessage<ContentTypes>[],
    ) => {
      const state = get();
      const newMessagesByConversation = new Map(state.messages);
      const conversationMessages =
        newMessagesByConversation.get(conversationId) ||
        new Map<string, DecodedMessage<ContentTypes>>();
      const newMessages = new Map(conversationMessages);
      let lastSentAt = state.lastSentAt.get(conversationId);
      let lastMessage = state.lastMessages.get(conversationId);

      const newMetadata = new Map(state.metadata);
      const newMembers = new Map(state.members);

      for (const message of messages) {
        newMessages.set(message.id, message);
        if (isLastSentAt(message, lastSentAt)) {
          lastSentAt = message.sentAtNs;
          lastMessage = message;
        }

        // check for updated members and metadata
        if (message.contentType.sameAs(ContentTypeGroupUpdated)) {
          const groupUpdated = message.content as GroupUpdated;

          // member updates
          if (
            groupUpdated.addedInboxes.length > 0 ||
            groupUpdated.removedInboxes.length > 0
          ) {
            const conversation = state.conversations.get(
              message.conversationId,
            );
            if (!conversation) {
              return;
            }
            await conversation.sync();
            const members = await conversation.members();
            const updatedMembers = new Map(members.map((m) => [m.inboxId, m]));
            newMembers.set(message.conversationId, updatedMembers);
          }

          // metadata updates
          const metadataUpdates: ConversationMetadata = {};
          groupUpdated.metadataFieldChanges.forEach((change) => {
            switch (change.fieldName) {
              case "group_name":
                metadataUpdates.name = change.newValue;
                break;
              case "description":
                metadataUpdates.description = change.newValue;
                break;
              case "group_image_url_square":
                metadataUpdates.imageUrl = change.newValue;
                break;
            }
          });
          if (Object.keys(metadataUpdates).length > 0) {
            const existingMetadata = newMetadata.get(message.conversationId);
            newMetadata.set(message.conversationId, {
              ...existingMetadata,
              ...metadataUpdates,
            });
          }
        }
      }

      newMessagesByConversation.set(conversationId, newMessages);
      const newLastSentAt = new Map(state.lastSentAt);
      newLastSentAt.set(conversationId, lastSentAt);
      const newLastMessages = new Map(state.lastMessages);
      newLastMessages.set(conversationId, lastMessage);

      const newSortedMessages = new Map(state.sortedMessages);
      newSortedMessages.set(conversationId, sortMessages(newMessages));

      set({
        lastMessages: newLastMessages,
        lastSentAt: newLastSentAt,
        members: newMembers,
        messages: newMessagesByConversation,
        metadata: newMetadata,
        sortedConversations: sortConversations(
          state.conversations,
          newLastMessages,
        ),
        sortedMessages: newSortedMessages,
      });
    },
    getMessage: (conversationId: string, messageId: string) => {
      const messages = get().messages.get(conversationId);
      return messages?.get(messageId);
    },
    getMessages: (conversationId: string) => {
      const messages = get().messages.get(conversationId);
      return messages ? Array.from(messages.values()) : [];
    },
    hasMessage: (conversationId: string, messageId: string) => {
      const conversationMessages = get().messages.get(conversationId);
      return conversationMessages?.has(messageId) ?? false;
    },
    reset: () => {
      set(store.getInitialState());
    },
  }),
);

export const useConversation = (
  conversationId: string,
): Conversation<ContentTypes> | undefined => {
  return useStore(inboxStore, (state) => state.getConversation(conversationId));
};

const EMPTY_METADATA: ConversationMetadata = {};
const EMPTY_MEMBERS = new Map<string, SafeGroupMember>();
const EMPTY_MESSAGES: DecodedMessage<ContentTypes>[] = [];

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
    reset,
  };
};
