import { IdentifierKind } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useClient } from "@/contexts/XMTPContext";

export const HELP_ADDRESS = "0x526b023a6de826434061ba757298e47e552eaed5";

export const useHelpDm = () => {
  const client = useClient();
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
  }, [client]);

  return { exists, loading };
};
