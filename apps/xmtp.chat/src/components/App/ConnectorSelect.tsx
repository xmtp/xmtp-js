import { Grid } from "@mantine/core";
import { AccountCard } from "@/components/App/AccountCard";
import {
  useConnectWallet,
  type ConnectorString,
} from "@/hooks/useConnectWallet";
import { useSettings } from "@/hooks/useSettings";
import { CoinbaseWallet } from "@/icons/CoinbaseWallet";
import { InjectedWallet } from "@/icons/InjectedWallet";
import { MetamaskWallet } from "@/icons/MetamaskWallet";
import { WalletConnectWallet } from "@/icons/WalletConnectWallet";
import classes from "./ConnectorSelect.module.css";

export const ConnectorSelect: React.FC = () => {
  const { isConnected, loading } = useConnectWallet();
  const { connector, setConnector, ephemeralAccountEnabled, useSCW } =
    useSettings();

  const handleWalletConnect = (connector: ConnectorString) => () => {
    setConnector(connector);
  };

  const isDisabled = isConnected || loading || ephemeralAccountEnabled;

  return (
    <Grid gutter={1} className={classes.root}>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <AccountCard
          selected={connector === "Injected"}
          disabled={isDisabled}
          icon={<InjectedWallet />}
          label="Browser injected"
          onClick={handleWalletConnect("Injected")}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <AccountCard
          selected={connector === "Coinbase Wallet"}
          disabled={isDisabled}
          icon={<CoinbaseWallet />}
          label="Coinbase Wallet"
          onClick={handleWalletConnect("Coinbase Wallet")}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <AccountCard
          selected={connector === "MetaMask"}
          disabled={isDisabled || useSCW}
          icon={<MetamaskWallet />}
          label="MetaMask"
          onClick={handleWalletConnect("MetaMask")}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <AccountCard
          selected={connector === "WalletConnect"}
          disabled={isDisabled}
          icon={<WalletConnectWallet />}
          label="WalletConnect"
          onClick={handleWalletConnect("WalletConnect")}
        />
      </Grid.Col>
    </Grid>
  );
};
