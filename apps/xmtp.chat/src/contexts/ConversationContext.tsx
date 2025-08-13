import {
  Group,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ContentTypes } from "@/contexts/XMTPContext";

type ConversationContextType = {
  conversation?: Conversation<ContentTypes>;
  members: Map<string, string>;
  replyToMessage?: DecodedMessage<ContentTypes | unknown>;
  setReplyToMessage: React.Dispatch<
    React.SetStateAction<DecodedMessage | undefined>
  >;
};

const ConversationContext = createContext<ConversationContextType>({
  members: new Map(),
  replyToMessage: undefined,
  setReplyToMessage: () => {},
});

export type ConversationProviderProps = React.PropsWithChildren<{
  conversation: Conversation<ContentTypes>;
}>;

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  conversation,
}) => {
  const [members, setMembers] = useState<Map<string, string>>(new Map());
  const [replyToMessage, setReplyToMessage] = useState<
    DecodedMessage | undefined
  >(undefined);

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
    () => ({ conversation, members, replyToMessage, setReplyToMessage }),
    [conversation, members, replyToMessage, setReplyToMessage],
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
