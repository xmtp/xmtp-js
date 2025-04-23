import { Box, Flex, Group, Stack } from "@mantine/core";
import { AddressBadge } from "@/components/AddressBadge";
import { DateLabel } from "@/components/DateLabel";
import { nsToDate } from "@/helpers/date";

export type MessageContentAlign = "left" | "right";

export type MessageContentWrapperProps = React.PropsWithChildren<{
  align: MessageContentAlign;
  senderInboxId?: string;
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
  return (
    <Group justify={align === "left" ? "flex-start" : "flex-end"}>
      <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
        <Flex
          gap="xs"
          direction={align === "right" ? "row" : "row-reverse"}
          align="center">
          <DateLabel date={nsToDate(sentAtNs)} />
          {senderInboxId && <AddressBadge address={senderInboxId} size="lg" />}
        </Flex>
        <Box
          onClick={(event) => {
            if (stopClickPropagation) {
              event.stopPropagation();
            }
          }}>
          {children}
        </Box>
      </Stack>
    </Group>
  );
};
