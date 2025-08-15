import type { Conversation, DecodedMessage } from "@xmtp/browser-sdk";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useXMTP, type ContentTypes } from "@/contexts/XMTPContext";

// Simplified context: only exposes a toggle function, no aggregation.
export type ReactionsContextValue = {
  toggleReaction: (
    message: DecodedMessage,
    content: string,
    schema: Reaction["schema"],
  ) => Promise<void>;
};

const ReactionsContext = createContext<ReactionsContextValue | undefined>(
  undefined,
);

export const ReactionsProvider: React.FC<{
  children: React.ReactNode;
  conversation: Conversation<ContentTypes>;
}> = ({ children, conversation }) => {
  const { client } = useXMTP();

  const toggleReaction = useCallback(
    async (
      message: DecodedMessage,
      content: string,
      schema: Reaction["schema"],
    ) => {
      if (!client) return;
      // Determine if we previously reacted with the same emoji by scanning decoded reaction messages for this user
      // (Skipping aggregation for simplicity; always send added for now)
      const reaction: Reaction = {
        action: "added",
        reference: message.id,
        referenceInboxId: message.senderInboxId,
        schema,
        content,
      };
      await conversation.send(reaction, ContentTypeReaction);
    },
    [client, conversation],
  );

  const value = useMemo(() => ({ toggleReaction }), [toggleReaction]);

  return (
    <ReactionsContext.Provider value={value}>
      {children}
    </ReactionsContext.Provider>
  );
};

export const useReactions = () => {
  const ctx = useContext(ReactionsContext);
  if (!ctx)
    throw new Error("useReactions must be used within ReactionsProvider");
  return ctx;
};
