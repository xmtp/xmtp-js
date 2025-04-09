import { Box, Text } from "@mantine/core";
import type { OffChainSignature } from "@xmtp/content-type-off-chain-signature";
import { BadgeWithCopy } from "../BadgeWithCopy";

export type OffChainSignatureContentProps = {
  content: OffChainSignature;
};

export const OffChainSignatureContent: React.FC<
  OffChainSignatureContentProps
> = ({ content }) => {
  return (
    <Box>
      <Text>Off-chain signature done:</Text>
      <BadgeWithCopy value={content.signature}></BadgeWithCopy>
    </Box>
  );
};
