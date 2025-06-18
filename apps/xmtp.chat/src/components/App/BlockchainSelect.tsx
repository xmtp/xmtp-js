import {
  Group,
  LoadingOverlay,
  NativeSelect,
  Stack,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useSwitchChain } from "wagmi";
import {
  arbitrum,
  base,
  linea,
  mainnet,
  optimism,
  polygon,
  worldchain,
  zksync,
} from "wagmi/chains";
import { useSettings } from "@/hooks/useSettings";

const ALLOWED_CHAINS: number[] = [
  arbitrum.id,
  base.id,
  linea.id,
  mainnet.id,
  optimism.id,
  polygon.id,
  worldchain.id,
  zksync.id,
];

export const BlockchainSelect: React.FC = () => {
  const { blockchain, setBlockchain } = useSettings();
  const { chains, switchChain } = useSwitchChain();
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    switchChain(
      {
        chainId: parseInt(event.currentTarget.value),
      },
      {
        onSuccess(data) {
          setBlockchain(data.id);
        },
        onError(error) {
          console.error("An error occurred while switching chain", error);
        },
        onSettled() {
          setLoading(false);
        },
      },
    );
  };

  const options = useMemo(
    () =>
      chains
        .filter((chain) => ALLOWED_CHAINS.includes(chain.id))
        .map((chain) => ({
          value: chain.id.toString(),
          label: chain.name,
        })),
    [chains],
  );

  return (
    <>
      {loading && <LoadingOverlay visible />}
      <Stack p="md">
        <Group gap="xs" justify="space-between">
          <Text fw="bold">Blockchain</Text>
          <NativeSelect
            data={options}
            value={blockchain.toString()}
            onChange={handleChange}
          />
        </Group>
        <Text size="sm">
          Select the blockchain to use for signing messages.
        </Text>
      </Stack>
    </>
  );
};
