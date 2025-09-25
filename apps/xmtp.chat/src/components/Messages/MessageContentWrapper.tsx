import { Flex, Group, Stack } from "@mantine/core";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";

export type MessageContentAlign = "left" | "right";

export type MessageContentWrapperProps = React.PropsWithChildren<{
  align: MessageContentAlign;
  senderInboxId: string;
  sentAtNs: bigint;
  stopClickPropagation?: boolean;
}>;

export const MessageContentWrapper: React.FC<MessageContentWrapperProps> = ({
  align,
  senderInboxId,
  children,
  sentAtNs,
  stopClickPropagation = true,
}) => {
  const { members } = useConversationContext();
  return (
    <Group justify={align === "left" ? "flex-start" : "flex-end"}>
      <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
        <Flex
          gap="xs"
          direction={align === "right" ? "row" : "row-reverse"}
          align="center">
          <DateLabel date={nsToDate(sentAtNs)} />
          <Identity
            address={members.get(senderInboxId) ?? ""}
            inboxId={senderInboxId}
          />
        </Flex>
        <Group
          justify={align === "left" ? "flex-start" : "flex-end"}
          maw="80%"
          onClick={(event) => {
            if (stopClickPropagation) {
              event.stopPropagation();
            }
          }}>
          {children}
        </Group>
      </Stack>
    </Group>
  );
};
