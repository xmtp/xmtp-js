import { Group, Paper, Stack } from "@mantine/core";
import { BlockchainSelect } from "@/components/App/BlockchainSelect";
import { ConnectorSelect } from "@/components/App/ConnectorSelect";
import { ConnectWallet } from "@/components/App/ConnectWallet";
import { UseEphemeral } from "@/components/App/UseEphemeral";
import { UseSCW } from "@/components/App/UseSCW";

export const WalletConnect = () => {
  return (
    <Paper withBorder radius="md">
      <Stack gap={0}>
        <Group gap="sm" align="center" justify="center" flex={1} p="md">
          <UseSCW />
          <BlockchainSelect />
        </Group>
        <ConnectorSelect />
        <Group align="center" justify="space-between" flex={1} p="md">
          <UseEphemeral />
          <ConnectWallet />
        </Group>
      </Stack>
    </Paper>
  );
};
