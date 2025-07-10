import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useConnectXmtp } from "@/hooks/useConnectXmtp";
import { useSettings } from "@/hooks/useSettings";
import classes from "./ConnectXMTP.module.css";

export type ConnectXMTPProps = {
  onDisconnectWallet: () => void;
};

export const ConnectXMTP = ({ onDisconnectWallet }: ConnectXMTPProps) => {
  const { isConnected } = useConnectWallet();
  const { connect, loading } = useConnectXmtp();
  const { ephemeralAccountEnabled } = useSettings();

  const handleConnectClick = useCallback(() => {
    connect();
  }, [connect]);

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
          <Button variant="default" onClick={onDisconnectWallet}>
            Disconnect wallet
          </Button>
          <Group gap="xs" align="center">
            {!isConnected && !ephemeralAccountEnabled && (
              <Text size="sm" c="dimmed">
                Wallet connection required
              </Text>
            )}
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
