import { type DecodedMessage } from "@xmtp/browser-sdk";
import { createContext, useContext, useMemo, useState } from "react";

type ConversationContextType = {
  conversationId: string;
  replyTarget: DecodedMessage | undefined;
  setReplyTarget: React.Dispatch<
    React.SetStateAction<DecodedMessage | undefined>
  >;
};

const ConversationContext = createContext<ConversationContextType>({
  conversationId: "",
  replyTarget: undefined,
  setReplyTarget: () => {},
});

export type ConversationProviderProps = React.PropsWithChildren<{
  conversationId: string;
}>;

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  conversationId,
}) => {
  const [replyTarget, setReplyTarget] = useState<DecodedMessage | undefined>(
    undefined,
  );

  const value = useMemo(
    () => ({ conversationId, replyTarget, setReplyTarget }),
    [conversationId, replyTarget, setReplyTarget],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context.conversationId) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider",
    );
  }
  return context;
};
