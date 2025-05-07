import { Group, type Conversation } from "@xmtp/browser-sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ConversationContextType = {
  conversation?: Conversation;
  members: Map<string, string>;
};

const ConversationContext = createContext<ConversationContextType>({
  members: new Map(),
});

export type ConversationProviderProps = React.PropsWithChildren<{
  conversation: Conversation;
}>;

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  conversation,
}) => {
  const [members, setMembers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!(conversation instanceof Group)) {
      return;
    }

    const loadMembers = async () => {
      const members = await conversation.members();
      setMembers(
        new Map(
          members.map((m) => [m.inboxId, m.accountIdentifiers[0].identifier]),
        ),
      );
    };

    void loadMembers();
  }, [conversation.id]);

  const value = useMemo(
    () => ({ conversation, members }),
    [conversation, members],
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
