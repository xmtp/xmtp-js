import { Anchor, Box, Text } from "@mantine/core";
import type { TransactionReference } from "@xmtp/content-type-transaction-reference";
import * as viemChains from "viem/chains";

export type TransactionReferenceProps = {
  content: TransactionReference;
};

export const TransactionReferenceUI: React.FC<TransactionReferenceProps> = ({
  content,
}) => {
  const chains = Object.values(viemChains);
  const chainId =
    typeof content.networkId === "string"
      ? parseInt(content.networkId, 16)
      : content.networkId;
  const chain = chains.find((chain) => chain.id === chainId);
  if (!chain) {
    return (
      <Box>
        <Text>Chain Id: {content.networkId}</Text>
        <Text>Transaction Hash: {content.reference}</Text>
      </Box>
    );
  }
  return (
    <Anchor
      href={`${chain.blockExplorers?.default.url}/tx/${content.reference}`}
      target="_blank"
      underline="hover">
      View in explorer
    </Anchor>
  );
};
