import { useEffect, useState } from "react";
import {
  getInboxIdForAddressQuery,
  isValidName,
  resolveNameQuery,
} from "@/helpers/names";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

export const useMemberId = () => {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [inboxId, setInboxId] = useState("");
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { environment } = useSettings();

  useEffect(() => {
    const checkMemberId = async () => {
      setError(null);
      setInboxId("");
      setAddress("");
      setDisplayName("");

      if (!memberId) {
        return;
      }

      if (
        !isValidEthereumAddress(memberId) &&
        !isValidInboxId(memberId) &&
        !isValidName(memberId)
      ) {
        setError("Invalid address, inbox ID, ENS name, or Base name");
      } else if (isValidEthereumAddress(memberId)) {
        setLoading(true);

        try {
          const inboxId = await getInboxIdForAddressQuery(
            memberId.toLowerCase(),
            environment,
          );

          if (!inboxId) {
            setError("Address not registered on XMTP");
          } else {
            setInboxId(inboxId);
            setAddress(memberId);
          }
        } catch {
          setError("Unable to get inbox ID for address. Try again.");
        } finally {
          setLoading(false);
        }
      } else if (isValidInboxId(memberId)) {
        setInboxId(memberId);
      } else if (isValidName(memberId)) {
        setLoading(true);
        try {
          const address = await resolveNameQuery(memberId);
          if (!address) {
            setError("Invalid ENS or Base name");
          } else {
            try {
              const inboxId = await getInboxIdForAddressQuery(
                address,
                environment,
              );
              if (!inboxId) {
                setError("Address not registered on XMTP");
              } else {
                setInboxId(inboxId);
                setAddress(address);
                setDisplayName(memberId);
              }
            } catch {
              setError("Unable to get inbox ID for address. Try again.");
            } finally {
              setLoading(false);
            }
          }
        } catch {
          setError("Unable to resolve name");
        } finally {
          setLoading(false);
        }
      }
    };

    void checkMemberId();
  }, [memberId, environment]);

  return {
    memberId,
    setMemberId,
    error,
    loading,
    inboxId,
    address,
    displayName,
    setMemberIdError: setError,
  };
};
