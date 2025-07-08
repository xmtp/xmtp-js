import { useCallback } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";

export type ConnectorString =
  | "Injected"
  | "Coinbase Wallet"
  | "MetaMask"
  | "WalletConnect";

export const useConnectWallet = () => {
  const account = useAccount();
  const { connect, status } = useConnect();
  const connectors = useConnectors();

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
    connect: connectWallet,
    isConnected: !!account.address,
    loading: status === "pending",
  };
};
