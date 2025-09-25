import { type Conversation, type DecodedMessage } from "@xmtp/browser-sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { resolveAddresses } from "@/helpers/profiles";

type ConversationContextType = {
  conversation?: Conversation<ContentTypes>;
  members: Map<string, string>;
  replyTarget: DecodedMessage | undefined;
  setReplyTarget: React.Dispatch<
    React.SetStateAction<DecodedMessage | undefined>
  >;
};

const ConversationContext = createContext<ConversationContextType>({
  members: new Map(),
  replyTarget: undefined,
  setReplyTarget: () => {},
});

export type ConversationProviderProps = React.PropsWithChildren<{
  conversation: Conversation<ContentTypes>;
}>;

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  conversation,
}) => {
  const [members, setMembers] = useState<Map<string, string>>(new Map());
  const [replyTarget, setReplyTarget] = useState<DecodedMessage | undefined>(
    undefined,
  );

  useEffect(() => {
    const loadMembers = async () => {
      const members = await conversation.members();
      const addresses = members.map((m) => m.accountIdentifiers[0].identifier);
      // fetch and cache profiles for the addresses
      await resolveAddresses(addresses);
      setMembers(
        new Map(
          members.map((m) => [m.inboxId, m.accountIdentifiers[0].identifier]),
        ),
      );
    };

    void loadMembers();
  }, [conversation.id]);

  const value = useMemo(
    () => ({ conversation, members, replyTarget, setReplyTarget }),
    [conversation, members, replyTarget, setReplyTarget],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context.conversation) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider",
    );
  }
  return context as Required<ConversationContextType>;
};
