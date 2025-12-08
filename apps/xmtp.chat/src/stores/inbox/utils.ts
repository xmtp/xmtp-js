import { type Conversation, type DecodedMessage } from "@xmtp/browser-sdk";
import type { ContentTypes } from "@/contexts/XMTPContext";

/**
 * Returns the most recent conversation creation timestamp.
 * Used to track the latest conversation when syncing from the network and
 * sorting conversations.
 */
export const getLastCreatedAt = (
  conversation: Conversation<ContentTypes>,
  lastCreatedAt?: bigint,
) => {
  return !lastCreatedAt ||
    (conversation.createdAtNs && conversation.createdAtNs > lastCreatedAt)
    ? conversation.createdAtNs
    : lastCreatedAt;
};

/**
 * Checks if a message was sent after the last sent timestamp.
 * Used to track the latest message when syncing from the network and
 * determining sort order of conversations and messages.
 */
export const isLastSentAt = (
  message: DecodedMessage<ContentTypes>,
  lastSentAt?: bigint,
) => {
  return !lastSentAt || message.sentAtNs > lastSentAt;
};

/**
 * Sorts conversations by most recent activity (last message or creation time).
 * Conversations with more recent messages appear first.
 */
export const sortConversations = (
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

/**
 * Sorts messages by sent time in ascending order (oldest first).
 * Used to display messages in chronological order within a conversation.
 */
export const sortMessages = (
  messages: Map<string, DecodedMessage<ContentTypes>>,
) => {
  const sortedMessages = Array.from(messages.values()).sort((a, b) => {
    return Number(a.sentAtNs - b.sentAtNs);
  });
  return sortedMessages;
};
