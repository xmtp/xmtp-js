import type {
  Intent,
  Reaction,
  RemoteAttachment,
  SendMessageOpts,
} from "@xmtp/browser-sdk";
import type { EncodedContent } from "@xmtp/content-type-primitives";
import { useCallback, useState } from "react";
import {
  useActions,
  useConversation as useConversationState,
  useLastSentAt,
  useMembers,
  useMessages,
  useMetadata,
  usePermissions,
} from "@/stores/inbox/hooks";

export const useConversation = (conversationId: string) => {
  const { addMessages } = useActions();
  const conversation = useConversationState(conversationId);
  const members = useMembers(conversationId);
  const permissions = usePermissions(conversationId);
  const { name, description, imageUrl } = useMetadata(conversationId);
  const messages = useMessages(conversationId);
  const lastSentAt = useLastSentAt(conversationId);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  if (!conversation) {
    throw new Error(
      `useConversation: Conversation ${conversationId} not found`,
    );
  }

  const sync = async (fromNetwork: boolean = false) => {
    if (fromNetwork) {
      setSyncing(true);

      try {
        const isActive = await conversation.isActive();
        // ensure group is active before syncing
        if (isActive) {
          await conversation.sync();
        }
      } finally {
        setSyncing(false);
      }
    }

    setLoading(true);

    try {
      const msgs = await conversation.messages({
        sentAfterNs: lastSentAt,
      });
      await addMessages(conversation.id, msgs);
      return msgs;
    } finally {
      setLoading(false);
    }
  };

  const send = useCallback(
    async (content: EncodedContent, options?: SendMessageOpts) => {
      setSending(true);

      try {
        await conversation.send(content, options);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendText = useCallback(
    async (text: string) => {
      setSending(true);

      try {
        await conversation.sendText(text);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  type Reply = Parameters<typeof conversation.sendReply>[0];

  const sendReply = useCallback(
    async (reply: Reply) => {
      setSending(true);
      try {
        await conversation.sendReply(reply);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendRemoteAttachment = useCallback(
    async (remoteAttachment: RemoteAttachment) => {
      setSending(true);
      try {
        await conversation.sendRemoteAttachment(remoteAttachment);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendIntent = useCallback(
    async (intent: Intent) => {
      setSending(true);
      try {
        await conversation.sendIntent(intent);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const sendReaction = useCallback(
    async (reaction: Reaction) => {
      setSending(true);
      try {
        await conversation.sendReaction(reaction);
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  return {
    conversation,
    description,
    imageUrl,
    loading,
    members,
    messages,
    name,
    permissions,
    send,
    sendText,
    sendReply,
    sendRemoteAttachment,
    sendIntent,
    sendReaction,
    sending,
    sync,
    syncing,
  };
};
