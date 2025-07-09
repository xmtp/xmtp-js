import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useConnectXmtp } from "@/hooks/useConnectXmtp";
import { useSettings } from "@/hooks/useSettings";

export const ConnectXMTP = () => {
  const { isConnected } = useConnectWallet();
  const { connect, loading } = useConnectXmtp();
  const { ephemeralAccountEnabled } = useSettings();

  const handleConnectClick = useCallback(() => {
    connect();
  }, [connect]);

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <Group gap="sm" align="center" justify="space-between" flex={1}>
          <LoggingSelect />
          <NetworkSelect />
        </Group>
        <Group justify="flex-end">
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
      </Stack>
    </Paper>
  );
};
