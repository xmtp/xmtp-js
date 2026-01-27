import { Button, Group, Paper, Stack } from "@mantine/core";
import { useCallback, useState } from "react";
import { AppLockDisconnectModal } from "@/components/App/AppLockDisconnectModal";
import { AppLockModal } from "@/components/App/AppLockModal";
import { ConnectedAddress } from "@/components/App/ConnectedAddress";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
import { useXMTP } from "@/contexts/XMTPContext";
import { useConnectXmtp } from "@/hooks/useConnectXmtp";
import { useEphemeralSigner } from "@/hooks/useEphemeralSigner";
import { useSettings } from "@/hooks/useSettings";
import { useWallet } from "@/hooks/useWallet";
import classes from "./ConnectXMTP.module.css";

export const ConnectXMTP: React.FC = () => {
  const { isConnected, address, disconnect } = useWallet();
  const { address: ephemeralAddress } = useEphemeralSigner();
  const { connect, loading } = useConnectXmtp();
  const { ephemeralAccountEnabled, setEphemeralAccountEnabled } = useSettings();
  const { lockState } = useXMTP();
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleConnectClick = useCallback(() => {
    if (lockState !== "available") {
      setShowLockModal(true);
      return;
    }
    connect();
  }, [connect, lockState]);

  const handleLockModalClose = useCallback(() => {
    setShowLockModal(false);
  }, []);

  const handleLockModalDisconnect = useCallback(() => {
    setShowDisconnectModal(true);
  }, []);

  const handleDisconnectModalClose = useCallback(() => {
    setShowDisconnectModal(false);
  }, []);

  const handleDisconnectClick = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      setEphemeralAccountEnabled(false);
    }
  }, [isConnected, disconnect]);

  return (
    <>
      <Paper withBorder radius="md">
        <Stack gap="xs">
          <Stack gap="md" p="md">
            <NetworkSelect />
            <LoggingSelect />
          </Stack>
          <Group
            justify="space-between"
            align="center"
            p="md"
            className={classes.actions}>
            <ConnectedAddress
              size="sm"
              address={address ?? ephemeralAddress}
              onClick={handleDisconnectClick}
            />
            <Group gap="xs" align="center">
              <Button
                disabled={!isConnected && !ephemeralAccountEnabled}
                onClick={handleConnectClick}
                loading={loading}>
                Connect
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>
      <AppLockModal
        opened={showLockModal}
        onClose={handleLockModalClose}
        onDisconnect={handleLockModalDisconnect}
      />
      <AppLockDisconnectModal
        opened={showDisconnectModal}
        onClose={handleDisconnectModalClose}
      />
    </>
  );
};
