import { useEffect, useState } from "react";
import { getInboxIdForAddress, resolveName } from "@/helpers/resolvers";
import {
  isValidEthereumAddress,
  isValidInboxId,
  isValidName,
} from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

export const useMemberId = () => {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState<string>("");
  const [inboxId, setInboxId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { environment } = useSettings();

  useEffect(() => {
    const checkMemberId = async () => {
      if (!memberId) {
        setError(null);
        return;
      }

      setInboxId("");
      setAddress("");
      setError(null);

      if (
        !isValidEthereumAddress(memberId) &&
        !isValidInboxId(memberId) &&
        !isValidName(memberId)
      ) {
        setError("Invalid address, inbox ID, ENS name, or Base name");
      } else if (isValidEthereumAddress(memberId)) {
        setLoading(true);

        try {
          const inboxId = await getInboxIdForAddress(
            memberId.toLowerCase(),
            environment,
          );

          if (!inboxId) {
            setError("Address not registered on XMTP");
          } else {
            setInboxId(inboxId);
            setAddress(memberId);
          }
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setLoading(false);
        }
      } else if (isValidInboxId(memberId)) {
        setInboxId(memberId);
      } else if (isValidName(memberId)) {
        setLoading(true);
        try {
          const address = await resolveName(memberId);
          if (!address) {
            setError("Invalid ENS or Base name");
          } else {
            try {
              const inboxId = await getInboxIdForAddress(address, environment);
              if (!inboxId) {
                setError("Address not registered on XMTP");
              } else {
                setInboxId(inboxId);
                setAddress(address);
              }
            } catch (error) {
              setError((error as Error).message);
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

  return { memberId, setMemberId, error, loading, inboxId, address };
};
