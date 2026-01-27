import { useCallback } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { useSettings } from "@/hooks/useSettings";

export type ConnectorString =
  | "Injected"
  | "Coinbase Wallet"
  | "MetaMask"
  | "WalletConnect";

export const useWallet = () => {
  const account = useAccount();
  const { connect, isPending: connectLoading } = useConnect();
  const connectors = useConnectors();
  const { disconnect, isPending: disconnectLoading } = useDisconnect();
  const {
    setAutoConnect,
    setEphemeralAccountEnabled,
    connector: connectorString,
  } = useSettings();

  const connectWallet = useCallback(() => {
    const connector = connectors.find((c) => c.name === connectorString);
    if (!connector) {
      throw new Error(`Connector ${connectorString} not found`);
    }
    connect({ connector });
  }, [connectors, connect, connectorString]);

  const disconnectWallet = useCallback(
    (onSuccess?: () => void) => {
      setAutoConnect(false);
      setEphemeralAccountEnabled(false);
      disconnect(undefined, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    },
    [disconnect, setAutoConnect, setEphemeralAccountEnabled],
  );

  return {
    account,
    connect: connectWallet,
    disconnect: disconnectWallet,
    isConnected: !!account.address,
    loading: connectLoading || disconnectLoading,
    address: account.address,
    chainId: account.chainId,
  };
};
