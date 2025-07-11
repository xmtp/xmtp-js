import { useCallback } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";

export type ConnectorString =
  | "Injected"
  | "Coinbase Wallet"
  | "MetaMask"
  | "WalletConnect";

export const useConnectWallet = () => {
  const account = useAccount();
  const { connect, isPending: connectLoading } = useConnect();
  const connectors = useConnectors();
  const { disconnect, isPending: disconnectLoading } = useDisconnect();

  const connectWallet = useCallback(
    (connectorString: ConnectorString) => () => {
      const connector = connectors.find((c) => c.name === connectorString);
      if (!connector) {
        throw new Error(`Connector ${connectorString} not found`);
      }
      connect({ connector });
    },
    [connectors, connect],
  );

  return {
    account,
    connect: connectWallet,
    disconnect,
    isConnected: !!account.address,
    loading: connectLoading || disconnectLoading,
    address: account.address,
    chainId: account.chainId,
  };
};
