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
import { createStore } from "zustand";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { getMemberAddress } from "@/helpers/xmtp";
import {
  getLastCreatedAt,
  isLastSentAt,
  sortConversations,
  sortMessages,
} from "@/stores/inbox/utils";
import { profilesStore } from "@/stores/profiles";

export type ConversationMetadata = {
  name?: string;
  description?: string;
  imageUrl?: string;
};

export type InboxState = {
  // all conversations
  conversations: Map<string, Conversation<ContentTypes>>;
  // the most recent conversation creation timestamp
  lastCreatedAt?: bigint;
  // the last message for each conversation
  lastMessages: Map<string, DecodedMessage<ContentTypes> | undefined>;
  // the last message sent timestamp for each conversation
  lastSentAt: Map<string, bigint | undefined>;
  // the members of each conversation
  members: Map<string, Map<string, SafeGroupMember>>;
  // all conversation messages
  messages: Map<string, Map<string, DecodedMessage<ContentTypes>>>;
  // the metadata for each conversation
  metadata: Map<string, ConversationMetadata>;
  // sorted conversations by most recent activity
  sortedConversations: Conversation<ContentTypes>[];
  // sorted messages by last sent timestamp
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
      // update conversations state
      const newConversations = new Map(state.conversations);
      newConversations.set(conversation.id, conversation);
      // update members state
      const members = await conversation.members();
      const newMembers = new Map(state.members);
      newMembers.set(
        conversation.id,
        new Map(members.map((m) => [m.inboxId, m])),
      );
      // update metadata state
      const newMetadata = new Map(state.metadata);
      if (conversation instanceof Group) {
        newMetadata.set(conversation.id, {
          name: conversation.name,
          description: conversation.description,
          imageUrl: conversation.imageUrl,
        });
      } else if (conversation instanceof Dm) {
        const member = members.find(
          (m) => m.inboxId !== conversation.addedByInboxId,
        );
        if (member) {
          const profiles = profilesStore
            .getState()
            .getProfiles(getMemberAddress(member));
          let displayName = member.inboxId;
          if (profiles.length > 0) {
            displayName = profiles[0].displayName ?? displayName;
          }
          newMetadata.set(conversation.id, {
            name: displayName,
          });
        }
      }
      // update last message state
      const lastMessage = await conversation.lastMessage();
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
      // get conversation members in parallel
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
      // get conversation last messages in parallel
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

      // update conversations, members, metadata, and last message states
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
          const member = members.find(
            (m) => m.inboxId !== conversation.addedByInboxId,
          );
          if (member) {
            const profiles = profilesStore
              .getState()
              .getProfiles(getMemberAddress(member));
            let displayName = member.inboxId;
            if (profiles.length > 0) {
              displayName = profiles[0].displayName ?? displayName;
            }
            newMetadata.set(conversation.id, {
              name: displayName,
            });
          }
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
      const state = get();
      // update messages state
      const newMessagesState = new Map(state.messages);
      const conversationMessages =
        newMessagesState.get(conversationId) ||
        new Map<string, DecodedMessage<ContentTypes>>();
      const newMessages = new Map(conversationMessages);
      newMessages.set(message.id, message);
      newMessagesState.set(conversationId, newMessages);

      // update last sent at and last message states
      const newLastSentAt = new Map(state.lastSentAt);
      const newLastMessages = new Map(state.lastMessages);
      if (isLastSentAt(message, state.lastSentAt.get(conversationId))) {
        newLastSentAt.set(conversationId, message.sentAtNs);
        newLastMessages.set(conversationId, message);
      }

      // update sorted messages state
      const newSortedMessages = new Map(state.sortedMessages);
      newSortedMessages.set(conversationId, sortMessages(newMessages));

      const newMembers = new Map(state.members);
      const newMetadata = new Map(state.metadata);

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

        // update metadata state
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
      }

      // update messages state
      newMessagesByConversation.set(conversationId, newMessages);

      // update last sent at state
      const newLastSentAt = new Map(state.lastSentAt);
      newLastSentAt.set(conversationId, lastSentAt);

      // update last message state
      const newLastMessages = new Map(state.lastMessages);
      newLastMessages.set(conversationId, lastMessage);

      // update sorted messages state
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
