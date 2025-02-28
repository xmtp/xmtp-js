import { Anchor } from "@mantine/core";
import type { TransactionReference } from "@xmtp/content-type-transaction-reference";

export type TransactionReferenceProps = {
  content: TransactionReference;
};

export const TransactionReferenceUI: React.FC<TransactionReferenceProps> = ({
  content,
}) => {
  return (
    <Anchor
      href={"https://routescan.io/tx/" + content.reference}
      target="_blank"
      underline="hover">
      View in explorer
    </Anchor>
  );
};
