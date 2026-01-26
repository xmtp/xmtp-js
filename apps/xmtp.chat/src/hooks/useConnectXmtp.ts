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
  const { initializing, client, initialize, lockState } = useXMTP();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    blockchain,
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    loggingLevel,
    useSCW,
    autoConnect,
    setAutoConnect,
    gatewayHost,
  } = useSettings();

  const connect = useCallback(() => {
    // if client is already connected or lock is not available, return
    if (client || lockState !== "available") {
      return;
    }

    // connect ephemeral account if enabled
    if (ephemeralAccountEnabled) {
      initialize({
        dbEncryptionKey: encryptionKey
          ? hexToUint8Array(encryptionKey)
          : undefined,
        env: environment,
        loggingLevel,
        signer: ephemeralSigner,
        gatewayHost,
      })
        .then(() => {
          setAutoConnect(true);
        })
        .catch((error: unknown) => {
          // disable auto connect on error to prevent retry loop
          setAutoConnect(false);
          throw error;
        });
      return;
    }

    // if wallet is not connected or SCW is enabled but chain is not set, return
    if (!account.address || (useSCW && blockchain <= 0)) {
      return;
    }

    initialize({
      dbEncryptionKey: encryptionKey
        ? hexToUint8Array(encryptionKey)
        : undefined,
      env: environment,
      loggingLevel,
      gatewayHost,
      signer: useSCW
        ? createSCWSigner(
            account.address,
            (message: string) => signMessageAsync({ message }),
            blockchain,
          )
        : createEOASigner(account.address, (message: string) =>
            signMessageAsync({ message }),
          ),
    })
      .then(() => {
        setAutoConnect(true);
      })
      .catch((error: unknown) => {
        // disable auto connect on error to prevent retry loop
        setAutoConnect(false);
        throw error;
      });
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
      void navigate(`/${environment}`);
    } else if (autoConnect) {
      connect();
    }
  }, [client, navigate, autoConnect, connect, environment]);

  return {
    client,
    loading: initializing,
    connect,
  };
};
