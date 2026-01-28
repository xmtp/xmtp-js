import { Group, NativeSelect, Text, Tooltip } from "@mantine/core";
import { useMemo, useState } from "react";
import { useSwitchChain } from "wagmi";
import {
  abstract,
  arbitrum,
  base,
  gnosis,
  linea,
  mainnet,
  optimism,
  polygon,
  worldchain,
  zksync,
} from "wagmi/chains";
import { useSettings } from "@/hooks/useSettings";

const ALLOWED_CHAINS: number[] = [
  abstract.id,
  arbitrum.id,
  base.id,
  gnosis.id,
  linea.id,
  mainnet.id,
  optimism.id,
  polygon.id,
  worldchain.id,
  zksync.id,
];

export const BlockchainSelect: React.FC = () => {
  const { blockchain, setBlockchain, useSCW, ephemeralAccountEnabled } =
    useSettings();
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
        .sort((a, b) => a.id - b.id)
        .map((chain) => ({
          value: chain.id.toString(),
          label: `${chain.name} (${chain.id})`,
        })),
    [chains],
  );

  return (
    <Group gap="sm" align="center" wrap="nowrap">
      <Text fw="bold" size="sm">
        Blockchain
      </Text>
      <Tooltip label="Select the blockchain to use for signing smart contract wallet messages">
        <NativeSelect
          disabled={loading || !useSCW || ephemeralAccountEnabled}
          data={options}
          value={blockchain.toString()}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
};
