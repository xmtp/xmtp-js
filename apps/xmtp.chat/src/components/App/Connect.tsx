import { Box, Group, LoadingOverlay, Stack } from "@mantine/core";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { mainnet } from "viem/chains";
import {
  useAccount,
  useConnect,
  useConnectors,
  useSignMessage,
  useWalletClient,
} from "wagmi";
import { AccountCard } from "@/components/App/AccountCard";
import { DisableAnalytics } from "@/components/App/DisableAnalytics";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
import { useXMTP } from "@/contexts/XMTPContext";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { CoinbaseWallet } from "@/icons/CoinbaseWallet";
import { EphemeralWallet } from "@/icons/EphemeralWallet";
import { InjectedWallet } from "@/icons/InjectedWallet";
import { MetamaskWallet } from "@/icons/MetamaskWallet";
import { WalletConnectWallet } from "@/icons/WalletConnectWallet";
import classes from "./Connect.module.css";

type ConnectorString =
  | "Injected"
  | "Coinbase Wallet"
  | "MetaMask"
  | "WalletConnect";

export const Connect = () => {
  const { connect, status } = useConnect();
  const { data } = useWalletClient();
  const account = useAccount();
  const connectors = useConnectors();
  const navigate = useNavigate();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const { initialize, initializing, client } = useXMTP();
  const {
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
  } = useSettings();
  const { signMessageAsync } = useSignMessage();
  const handleEphemeralConnect = useCallback(() => {
    setEphemeralAccountEnabled(true);
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

  const handleWalletConnect = useCallback(
    (connectorString: ConnectorString) => () => {
      if (ephemeralAccountEnabled) {
        setEphemeralAccountEnabled(false);
      }
      const connector = connectors.find((c) => c.name === connectorString);
      if (!connector) {
        throw new Error(`Connector ${connectorString} not found`);
      }
      connect({ connector });
    },
    [connectors, connect, ephemeralAccountEnabled],
  );

  // maybe initialize an XMTP client on mount
  useEffect(() => {
    // are we using an ephemeral account?
    if (ephemeralAccountEnabled && ephemeralAccountKey) {
      handleEphemeralConnect();
    }
  }, []);

  // look for wallet connection
  useEffect(() => {
    const initClient = async () => {
      const connector = account.connector;
      if (data?.account && connector) {
        const provider = (await connector.getProvider()) as
          | undefined
          | {
              connectionType: string;
            };
        if (provider) {
          const isSCW = provider.connectionType === "scw_connection_type";
          void initialize({
            dbEncryptionKey: encryptionKey
              ? hexToUint8Array(encryptionKey)
              : undefined,
            env: environment,
            loggingLevel,
            signer: isSCW
              ? createSCWSigner(
                  data.account.address,
                  signMessageAsync,
                  BigInt(mainnet.id),
                )
              : createEOASigner(data.account.address, data),
          });
        }
      }
    };
    void initClient();
  }, [account.address, data?.account]);

  useEffect(() => {
    if (client) {
      if (redirectUrl) {
        setRedirectUrl("");
        void navigate(redirectUrl);
      } else {
        void navigate("/");
      }
    }
  }, [client]);

  const isBusy = status === "pending" || initializing;

  return (
    <Stack gap="0">
      <Stack gap="0" className={classes.root}>
        {isBusy && <LoadingOverlay visible />}
        <Group
          className={classes.options}
          align="center"
          justify="space-between"
          py="xs"
          px="md"
          wrap="nowrap">
          <NetworkSelect disabled={isBusy} />
          <LoggingSelect disabled={isBusy} />
        </Group>
        <AccountCard
          icon={<EphemeralWallet />}
          label="Ephemeral"
          onClick={handleEphemeralConnect}
        />
        <AccountCard
          icon={<InjectedWallet />}
          label="Browser injected"
          onClick={handleWalletConnect("Injected")}
        />
        <AccountCard
          icon={<CoinbaseWallet />}
          label="Coinbase Smart Wallet"
          onClick={handleWalletConnect("Coinbase Wallet")}
        />
        <AccountCard
          icon={<MetamaskWallet />}
          label="MetaMask"
          onClick={handleWalletConnect("MetaMask")}
        />
        <AccountCard
          icon={<WalletConnectWallet />}
          label="WalletConnect"
          onClick={handleWalletConnect("WalletConnect")}
        />
        <Box className={classes.options}>
          <DisableAnalytics />
        </Box>
      </Stack>
    </Stack>
  );
};
