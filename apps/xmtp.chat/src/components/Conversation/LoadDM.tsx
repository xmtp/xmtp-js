import type { XmtpEnv } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useClient, useXMTP } from "@/contexts/XMTPContext";
import { isValidEthereumAddress } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";
import { useActions } from "@/stores/inbox/hooks";

const isValidEnvironment = (env: string): env is XmtpEnv =>
  ["production", "dev", "local"].includes(env);

const REDIRECT_TIMEOUT = 2000;

export const LoadDM: React.FC = () => {
  const [message, setMessage] = useState("");
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const { setEnvironment, environment } = useSettings();
  const { addConversation } = useActions();
  const navigate = useNavigate();
  const { disconnect } = useXMTP();
  const client = useClient();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const loadDm = async () => {
      setMessage("Checking environment...");

      const env = searchParams.get("env");
      if (env) {
        // check for invalid environment
        if (!isValidEnvironment(env)) {
          setMessage("Invalid environment, redirecting...");
          timeout = setTimeout(() => {
            void navigate("/");
          }, REDIRECT_TIMEOUT);
          return;
        }

        if (env !== environment) {
          setMessage("Environment mismatch, switching and redirecting...");
          setEnvironment(env);
          timeout = setTimeout(() => {
            disconnect();
            void navigate("/");
          }, REDIRECT_TIMEOUT);
          return;
        }
      }

      // no address, redirect to root
      if (!address || !isValidEthereumAddress(address)) {
        setMessage("Invalid address, redirecting...");
        timeout = setTimeout(() => {
          void navigate("/");
        }, REDIRECT_TIMEOUT);
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
          setMessage(
            "Address not registered on the XMTP network, redirecting...",
          );
          timeout = setTimeout(() => {
            void navigate("/");
          }, REDIRECT_TIMEOUT);
          return;
        }

        // look for existing DM group
        setMessage("Looking for existing DM...");
        const dm = await client.conversations.getDmByInboxId(inboxId);
        let dmId = dm?.id;
        if (!dmId) {
          // no DM group, create it
          setMessage("Creating new DM...");
          const newDm = await client.conversations.newDmWithIdentifier({
            identifier: address.toLowerCase(),
            identifierKind: "Ethereum",
          });
          dmId = newDm.id;
          // add new DM to store
          await addConversation(newDm);
        }
        await navigate(`/conversations/${dmId}`);
      } catch (e) {
        console.error(e);
        setMessage("Error loading DM, redirecting...");
        // if any errors occur during this process, redirect to root
        timeout = setTimeout(() => {
          void navigate("/");
        }, REDIRECT_TIMEOUT);

        // rethrow error for error modal
        throw e;
      }
    };
    void loadDm();

    return () => {
      clearTimeout(timeout);
    };
  }, [client, address]);

  return <LoadingMessage message={message} />;
};
