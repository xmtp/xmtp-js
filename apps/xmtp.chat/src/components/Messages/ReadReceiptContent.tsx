import { Text } from "@mantine/core";
import { DateLabel } from "@/components/DateLabel";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { useConversation } from "@/hooks/useConversation";

export type ReadReceiptContentProps = {
  sentAtNs: bigint;
  senderInboxId: string;
};

export const ReadReceiptContent: React.FC<ReadReceiptContentProps> = ({
  sentAtNs,
}) => {
  const { conversationId } = useConversationContext();
  const { members } = useConversation(conversationId);
  return (
    <>
      <DateLabel date={nsToDate(sentAtNs)} align="center" padding="sm" />
      <Text size="sm">received read receipt</Text>
    </>
  );
};
