import { IdentifierKind } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClient } from "@/contexts/XMTPContext";
import { useConversations } from "@/stores/inbox/hooks";

export const HELP_ADDRESS = "0x212906fdbdb70771461e6cb3376a740132e56b14";

export const useHelpDm = () => {
  const client = useClient();
  const conversations = useConversations();
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHelpDm = async () => {
      try {
        const inboxId = await client.fetchInboxIdByIdentifier({
          identifier: HELP_ADDRESS,
          identifierKind: IdentifierKind.Ethereum,
        });

        if (inboxId) {
          const dm = await client.conversations.getDmByInboxId(inboxId);
          setExists(dm !== undefined);
        }
      } catch {
        setExists(false);
      } finally {
        setLoading(false);
      }
    };

    void checkHelpDm();
  }, [client, conversations]);

  return { exists, loading };
};
