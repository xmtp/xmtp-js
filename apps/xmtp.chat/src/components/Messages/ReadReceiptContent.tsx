import { Text } from "@mantine/core";
import { DateLabel } from "@/components/DateLabel";
import { nsToDate } from "@/helpers/date";

export type ReadReceiptContentProps = {
  sentAtNs: bigint;
  senderInboxId: string;
};

export const ReadReceiptContent: React.FC<ReadReceiptContentProps> = ({
  sentAtNs,
}) => {
  return (
    <>
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Text size="sm" ta="center">
        received read receipt
      </Text>
    </>
  );
};
