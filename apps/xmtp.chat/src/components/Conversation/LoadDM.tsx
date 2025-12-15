import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LoadingMessage } from "@/components/LoadingMessage";
import { useClient } from "@/contexts/XMTPContext";
import { isValidName, resolveNameQuery } from "@/helpers/names";
import { isValidEthereumAddress } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";
import { useActions } from "@/stores/inbox/hooks";

const REDIRECT_TIMEOUT = 2000;

export const LoadDM: React.FC = () => {
  const [message, setMessage] = useState("");
  const { address } = useParams();
  const { environment } = useSettings();
  const { addConversation } = useActions();
  const navigate = useNavigate();
  const client = useClient();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const navigateToHome = (message: string) => {
      setMessage(message);
      timeout = setTimeout(() => {
        void navigate(`/${environment}`);
      }, REDIRECT_TIMEOUT);
    };

    const resolveAddress = async (addressOrENS: string) => {
      if (isValidEthereumAddress(addressOrENS)) {
        return addressOrENS;
      } else if (isValidName(addressOrENS)) {
        setMessage("Resolving ENS name...");

        const profiles = await resolveNameQuery(addressOrENS);
        if (!profiles || profiles.length === 0) {
          return null;
        }

        return profiles[0].address;
      } else {
        return null;
      }
    };

    const loadDm = async () => {
      // no address, redirect to root
      if (!address || !isValidEthereumAddress(address)) {
        setMessage("Invalid address, redirecting...");
        timeout = setTimeout(() => {
          void navigate(`/${environment}`);
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
            void navigate(`/${environment}`);
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

        void navigate(`/${environment}/conversations/${dmId}`);
      } catch (e) {
        console.error(e);
        setMessage("Error loading DM, redirecting...");
        // if any errors occur during this process, redirect to root
        timeout = setTimeout(() => {
          void navigate(`/${environment}`);
        }, REDIRECT_TIMEOUT);

        // rethrow error for error modal
        throw e;
      }
    };

    void loadDm();

    return () => {
      clearTimeout(timeout);
    };
  }, [client, address, environment]);

  return <LoadingMessage message={message} />;
};
