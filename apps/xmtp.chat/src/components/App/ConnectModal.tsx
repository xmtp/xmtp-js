import { Button, CloseButton, Group, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { hexToUint8Array } from "uint8array-extras";
import { generatePrivateKey } from "viem/accounts";
import { useAccount, useConnect, useConnectors, useSignMessage } from "wagmi";
import { AccountCard } from "@/components/App/AccountCard";
import { BlockchainSelect } from "@/components/App/BlockchainSelect";
import { Modal } from "@/components/Modal";
import { useXMTP } from "@/contexts/XMTPContext";
import {
  createEOASigner,
  createEphemeralSigner,
  createSCWSigner,
} from "@/helpers/createSigner";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { CoinbaseWallet } from "@/icons/CoinbaseWallet";
import { EphemeralWallet } from "@/icons/EphemeralWallet";
import { InjectedWallet } from "@/icons/InjectedWallet";
import { MetamaskWallet } from "@/icons/MetamaskWallet";
import { WalletConnectWallet } from "@/icons/WalletConnectWallet";
import { ContentLayout } from "@/layouts/ContentLayout";
import classes from "./ConnectModal.module.css";

type ConnectorString =
  | "Injected"
  | "Coinbase Wallet"
  | "MetaMask"
  | "WalletConnect";

export const ConnectModal = () => {
  const { connect } = useConnect();
  const account = useAccount();
  const connectors = useConnectors();
  const navigate = useNavigate();
  const fullScreen = useCollapsedMediaQuery();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const { initialize, client } = useXMTP();
  const {
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    encryptionKey,
    environment,
    loggingLevel,
    useSCW,
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

  const handleResetEphemeralAccount = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setEphemeralAccountEnabled(false);
      setEphemeralAccountKey(null);
    },
    [],
  );

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

  // maybe initialize an XMTP client on mount
  useEffect(() => {
    // are we using an ephemeral account?
    if (ephemeralAccountEnabled && ephemeralAccountKey) {
      handleEphemeralConnect();
    }
  }, []);

  // look for wallet connection
  useEffect(() => {
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
  }, [account.address, account.chainId, useSCW, signMessageAsync]);

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  const contentHeight = fullScreen ? "auto" : "70dvh";
  const title = useMemo(() => {
    if (useSCW) {
      return "Connect a smart contract wallet";
    }
    return "Connect a wallet";
  }, [useSCW]);

  return (
    <Modal
      opened
      centered
      withCloseButton={false}
      fullScreen={fullScreen}
      onClose={handleClose}
      size="md"
      padding={0}>
      <ContentLayout
        title={
          <Group justify="space-between" align="center" flex={1}>
            <Text size="lg" fw={700} c="text.primary">
              {title}
            </Text>
            <CloseButton
              size="md"
              onClick={handleClose}
              mr="calc(var(--mantine-spacing-md) * -1)"
            />
          </Group>
        }
        maxHeight={contentHeight}
        withScrollArea={false}
        withScrollAreaPadding={false}
        withScrollFade={false}>
        <Stack gap="0" className={classes.root}>
          {!useSCW && (
            <>
              <AccountCard
                icon={<EphemeralWallet />}
                label="Ephemeral wallet"
                onClick={handleEphemeralConnect}
                right={
                  ephemeralAccountKey !== null ? (
                    <Button size="xs" onClick={handleResetEphemeralAccount}>
                      Reset
                    </Button>
                  ) : undefined
                }
              />
              <AccountCard
                icon={<MetamaskWallet />}
                label="MetaMask"
                onClick={handleWalletConnect("MetaMask")}
              />
            </>
          )}
          {useSCW && <BlockchainSelect />}
          <AccountCard
            icon={<InjectedWallet />}
            label="Browser injected"
            onClick={handleWalletConnect("Injected")}
          />
          <AccountCard
            icon={<CoinbaseWallet />}
            label="Coinbase Wallet"
            onClick={handleWalletConnect("Coinbase Wallet")}
          />
          <AccountCard
            icon={<WalletConnectWallet />}
            label="WalletConnect"
            onClick={handleWalletConnect("WalletConnect")}
          />
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
