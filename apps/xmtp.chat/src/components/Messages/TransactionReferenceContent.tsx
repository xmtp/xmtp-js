import { Anchor, Box, Text } from "@mantine/core";
import type { TransactionReference } from "@xmtp/content-type-transaction-reference";
import { useMemo } from "react";
import * as viemChains from "viem/chains";

export type TransactionReferenceContentProps = {
  content: TransactionReference;
};

export const TransactionReferenceContent: React.FC<
  TransactionReferenceContentProps
> = ({ content }) => {
  const chain = useMemo(() => {
    const chains = Object.values(viemChains);
    const chainId =
      typeof content.networkId === "string"
        ? parseInt(content.networkId, 16)
        : content.networkId;
    return chains.find((chain) => chain.id === chainId);
  }, [content.networkId]);
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
      underline="hover"
      onClick={(event) => {
        event.stopPropagation();
      }}>
      View in explorer
    </Anchor>
  );
};
