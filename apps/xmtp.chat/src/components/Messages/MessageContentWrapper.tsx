import { Flex, Group, Stack } from "@mantine/core";
import { Dm } from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { DateLabel } from "@/components/DateLabel";
import { Identity } from "@/components/Identity";
import { useConversationContext } from "@/contexts/ConversationContext";
import { nsToDate } from "@/helpers/date";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import { combineProfiles, useAllProfiles } from "@/stores/profiles";

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
  const { conversationId } = useConversationContext();
  const { members, conversation } = useConversation(conversationId);
  const profiles = useAllProfiles();
  const senderMember = members.get(senderInboxId);
  const senderProfile = useMemo(() => {
    const address = senderMember ? getMemberAddress(senderMember) : "";
    return combineProfiles(address, profiles.get(address) ?? []);
  }, [profiles, senderMember]);
  return (
    <Group justify={align === "left" ? "flex-start" : "flex-end"}>
      <Stack gap="xs" align={align === "left" ? "flex-start" : "flex-end"}>
        <Flex
          gap="xs"
          direction={align === "right" ? "row" : "row-reverse"}
          align="center">
          <DateLabel date={nsToDate(sentAtNs)} />
          {senderMember && (
            <Identity
              address={senderProfile.address}
              avatar={senderProfile.avatar}
              permissionLevel={senderMember.permissionLevel}
              conversationId={conversationId}
              description={senderProfile.description}
              displayName={senderProfile.displayName}
              inboxId={senderMember.inboxId}
              showDm={!(conversation instanceof Dm)}
              position="top"
            />
          )}
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
