import { Button, CloseButton, Group, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { AccountCard } from "@/components/App/AccountCard";
import { BlockchainSelect } from "@/components/App/BlockchainSelect";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
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
  const account = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const navigate = useNavigate();
  const fullScreen = useCollapsedMediaQuery();
  const {
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    ephemeralAccountKey,
    setEphemeralAccountKey,
    useSCW,
  } = useSettings();

  const handleEphemeralConnect = useCallback(() => {
    setEphemeralAccountEnabled(true);
  }, []);

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

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (account.address) {
      handleClose();
    }
  }, [account, handleClose]);

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
