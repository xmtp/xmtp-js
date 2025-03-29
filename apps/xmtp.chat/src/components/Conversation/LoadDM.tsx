import type { Client } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useSettings } from "@/hooks/useSettings";

export const LoadDM: React.FC = () => {
  const [message, setMessage] = useState("");
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const { setEnvironment } = useSettings();
  const navigate = useNavigate();
  const client = useOutletContext<Client>();

  useEffect(() => {
    const env = searchParams.get("env");
    if (env === "production" || env === "dev" || env === "local") {
      setEnvironment(env);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadDm = async () => {
      // no address, redirect to root
      if (!address) {
        void navigate("/");
        return;
      }

      try {
        setMessage("Verifying address...");
        const inboxId = await client.findInboxIdByIdentifier({
          identifier: address.toLowerCase(),
          identifierKind: "Ethereum",
        });
        // no inbox ID, redirect to root

        if (!inboxId) {
          setMessage("Invalid address, redirecting...");
          setTimeout(() => {
            void navigate("/");
          }, 2000);
          return;
        }

        // look for existing DM group
        setMessage("Looking for existing DM...");
        const dm = await client.conversations.getDmByInboxId(inboxId);
        let dmId = dm?.id;
        if (dmId === undefined) {
          // no DM group, create it
          setMessage("Creating new DM...");
          const dmGroup = await client.conversations.newDmWithIdentifier({
            identifier: address.toLowerCase(),
            identifierKind: "Ethereum",
          });
          dmId = dmGroup.id;
          // go to new DM group
        }
        void navigate(`/conversations/${dmId}`);
      } catch (e) {
        console.error(e);
        setMessage("Error loading DM, redirecting...");
        // if any errors occur during this process, redirect to root
        setTimeout(() => {
          void navigate("/");
          // rethrow error for error modal
          throw e;
        }, 2000);
      }
    };
    void loadDm();
  }, [client, address]);

  return <LoadingMessage message={message} />;
};
