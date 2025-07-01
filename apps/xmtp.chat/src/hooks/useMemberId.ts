import { Utils } from "@xmtp/browser-sdk";
import { useEffect, useRef, useState } from "react";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

export const useMemberId = () => {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState<string>("");
  const [inboxId, setInboxId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const utilsRef = useRef<Utils | null>(null);
  const { environment } = useSettings();

  useEffect(() => {
    const utils = new Utils();
    utilsRef.current = utils;
    return () => {
      utils.close();
    };
  }, []);

  useEffect(() => {
    const checkMemberId = async () => {
      if (!memberId) {
        setError(null);
        return;
      }

      if (!isValidEthereumAddress(memberId) && !isValidInboxId(memberId)) {
        setError("Invalid address or inbox ID");
      } else if (isValidEthereumAddress(memberId) && utilsRef.current) {
        setLoading(true);

        const inboxId = await utilsRef.current.getInboxIdForIdentifier(
          {
            identifier: memberId.toLowerCase(),
            identifierKind: "Ethereum",
          },
          environment,
        );

        setLoading(false);

        if (!inboxId) {
          setError("Address not registered on XMTP");
        } else {
          setInboxId(inboxId);
          setError(null);
        }
      } else {
        setInboxId(memberId);
        setError(null);
      }
    };

    void checkMemberId();
  }, [memberId, environment]);

  return { memberId, setMemberId, error, loading, inboxId };
};
