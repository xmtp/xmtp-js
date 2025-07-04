import { Client, type SafeInstallation, type Signer } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useSettings } from "./useSettings";

const useStaticRevokeInstallations = (inboxId?: string) => {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [installations, setInstallations] = useState<Array<SafeInstallation>>(
    [],
  );
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const { environment, ephemeralAccountEnabled, ephemeralAccountKey, useSCW } =
    useSettings();

  const isFetchingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!inboxId || !/^[0-9a-zA-Z]{64}$/.test(inboxId)) return;
    if (isFetchingRef.current) return; // Prevent multiple fetches
    isFetchingRef.current = true;
    void Client.inboxStateFromInboxIds([inboxId], environment)
      .then((state) => {
        setInstallations(state[0].installations.map((item) => item));
      })
      .finally(() => {
        isFetchingRef.current = false;
      });
  }, [inboxId]);

  const handleRevokeInstallations = useCallback(
    async (
      inboxId: string,
      installations: Array<Uint8Array>,
    ): Promise<void> => {
      try {
        if (!inboxId || !/^[0-9a-zA-Z]{64}$/.test(inboxId)) {
          throw new Error("Invalid inbox ID format");
        }
        if (!installations.length) {
          throw new Error("No installations provided to revoke.");
        }
        let signer: Signer;
        if (ephemeralAccountEnabled) {
          if (!ephemeralAccountKey) {
            throw new Error("Ephemeral account key is not set");
          }
          signer = createEphemeralSigner(ephemeralAccountKey);
        } else {
          if (!account.address || (useSCW && !account.chainId)) {
            return void 0;
          }
          signer = useSCW
            ? createSCWSigner(
                account.address,
                (message: string) => signMessageAsync({ message }),
                account.chainId,
              )
            : createEOASigner(account.address, (message: string) =>
                signMessageAsync({ message }),
              );
        }
        setIsRevoking(true);
        await Client.revokeInstallations(
          signer,
          inboxId,
          installations,
          environment,
        );
        setInstallations((prev) =>
          prev.filter(
            (item) =>
              !installations.some((i) => i.valueOf() === item.bytes.valueOf()),
          ),
        );
      } finally {
        setIsRevoking(false);
      }
    },
    [
      account.address,
      account.chainId,
      ephemeralAccountEnabled,
      ephemeralAccountKey,
      useSCW,
      signMessageAsync,
    ],
  );
  return {
    handleRevokeInstallations,
    installations,
    isRevoking,
  };
};

export default useStaticRevokeInstallations;
