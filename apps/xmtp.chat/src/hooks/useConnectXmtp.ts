import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
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
    autoConnect,
    setAutoConnect,
  } = useSettings();

  // create client if ephemeral account is enabled
  const connect = useCallback(() => {
    // if client is already connected, return
    if (client) {
      return;
    }

    // connect ephemeral account if enabled
    if (ephemeralAccountEnabled) {
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
      setAutoConnect(true);
      return;
    }

    // if wallet is not connected or SCW is enabled but chain is not set, return
    if (!account.address || (useSCW && !account.chainId)) {
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
    setAutoConnect(true);
  }, [
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
    useSCW,
    account.address,
    account.chainId,
    signMessageAsync,
    setAutoConnect,
  ]);

  useEffect(() => {
    if (client) {
      void navigate("/");
    } else if (autoConnect) {
      connect();
    }
  }, [client, navigate, autoConnect, connect]);

  return {
    client,
    loading: status === "pending" || initializing,
    connect,
  };
};
