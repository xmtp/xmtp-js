import { Anchor, Group, Paper, Stack, Text } from "@mantine/core";
import { BlockchainSelect } from "@/components/App/BlockchainSelect";
import { ConnectorSelect } from "@/components/App/ConnectorSelect";
import { ConnectWallet } from "@/components/App/ConnectWallet";
import { UseEphemeral } from "@/components/App/UseEphemeral";
import { UseSCW } from "@/components/App/UseSCW";

export const WalletConnect = () => {
  return (
    <Paper withBorder radius="md" miw={520}>
      <Stack gap={0}>
        <Group gap="sm" align="center" justify="center" flex={1} p="md">
          <UseSCW />
          <BlockchainSelect />
        </Group>
        <Text size="sm" c="dimmed" ta="center" px="md" pb="md">
          New chains can be requested.{" "}
          <Anchor
            href="https://docs.xmtp.org/chat-apps/core-messaging/create-a-signer#create-a-smart-contract-wallet-signer"
            target="_blank">
            Learn how
          </Anchor>
          .
        </Text>
        <ConnectorSelect />
        <Group align="center" justify="space-between" flex={1} p="md">
          <UseEphemeral />
          <ConnectWallet />
        </Group>
      </Stack>
    </Paper>
  );
};
