import { useEffect } from "react";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useSettings } from "@/hooks/useSettings";

export const useConnectXmtp = () => {
  const { status } = useConnect();
  const { initializing, client, initialize } = useXMTP();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    loggingLevel,
    useSCW,
  } = useSettings();

  // create client if ephemeral account is enabled
  useEffect(() => {
    if (client || !ephemeralAccountEnabled) {
      return;
    }

    let accountKey = ephemeralAccountKey;
    if (!accountKey) {
      accountKey = generatePrivateKey();
      setEphemeralAccountKey(accountKey);
    }

    const signer = createEphemeralSigner(accountKey);
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: environment,
      loggingLevel,
      signer,
    });
  }, [
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
  ]);

  // create client if wallet is connected
  useEffect(() => {
    if (client || !account.address || (useSCW && !account.chainId)) {
      return;
    }
    void initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: environment,
      loggingLevel,
      signer: useSCW
        ? createSCWSigner(
            account.address,
            (message: string) => signMessageAsync({ message }),
            account.chainId,
          )
        : createEOASigner(account.address, (message: string) =>
            signMessageAsync({ message }),
          ),
    });
  }, [
    account.address,
    account.chainId,
    useSCW,
    signMessageAsync,
    environment,
    loggingLevel,
    encryptionKey,
  ]);

  return {
    client,
    loading: status === "pending" || initializing,
  };
};
