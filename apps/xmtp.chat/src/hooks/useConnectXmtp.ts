import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { useAccount, useSignMessage } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import { createEOASigner, createSCWSigner } from "@/helpers/createSigner";
import { useEphemeralSigner } from "@/hooks/useEphemeralSigner";
import { useSettings } from "@/hooks/useSettings";

export const useConnectXmtp = () => {
  const navigate = useNavigate();
  const { signer: ephemeralSigner } = useEphemeralSigner();
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

  const connect = useCallback(() => {
    // if client is already connected, return
    if (client) {
      return;
    }

    // connect ephemeral account if enabled
    if (ephemeralAccountEnabled) {
      void initialize({
        dbEncryptionKey: encryptionKey
          ? hexToUint8Array(encryptionKey)
          : undefined,
        env: environment,
        loggingLevel,
        signer: ephemeralSigner,
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
    client,
    initialize,
    setEphemeralAccountKey,
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
    loading: initializing,
    connect,
  };
};
