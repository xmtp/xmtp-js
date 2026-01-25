import { Button, Group, Paper, Stack } from "@mantine/core";
import { useCallback } from "react";
import { ConnectedAddress } from "@/components/App/ConnectedAddress";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
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

  const handleConnectClick = useCallback(() => {
    connect();
  }, [connect]);

  const handleDisconnectClick = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      setEphemeralAccountEnabled(false);
    }
  }, [isConnected, disconnect]);

  return (
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
  );
};
